import { describe, expect, it, vi } from 'vitest'
import type { AppApi } from '@kirocrew/app-sdk'
import {
  addWorkspace, ago, companionStatus, describeIndex, filterTodos, groupLanes, indexWarning, LANES, listWorkspaces, loadBoard,
  loadTodos, query, removeWorkspace, REQUEST_TIMEOUT_MS, requestRefresh, setCompanion, type Ticket, type TodoGroup, todoLabel,
  toFailure, withTimeout, createTicket, moveTicket, mutationProblem, planMove, promoteNote, readSource,
  toggleTodo, previewMigration, migrateTasks, exportLegacyTasks,
} from '../src/companionApi'
import { noteName } from '../src/noteNav'

const B = '/apps/quartizo/api'

function mockApi() {
  const ok = () => Promise.resolve({})
  const m = { get: vi.fn(ok), post: vi.fn(ok), put: vi.fn(ok), patch: vi.fn(ok), del: vi.fn(ok) }
  const api = { raw: vi.fn(ok), request: vi.fn(ok), ...m } as unknown as AppApi
  return { api, ...m }
}

function ticket(path: string, lane: Ticket['lane']): Ticket {
  return {
    path, title: path, hash: null, mtimeMs: null, diagnostics: [], retained: false,
    id: null, status: lane === 'repair' ? null : lane, order: null, todos: { total: 0, done: 0 }, lane,
  }
}

describe('companion API client', () => {
  it('reads through the companion and board routes', async () => {
    const { api, get } = mockApi()
    await companionStatus(api)
    await loadBoard(api, 3)
    await loadTodos(api, 'open')
    await loadTodos(api, 'all', 3)
    expect(get.mock.calls.map(c => (c as unknown[])[0])).toEqual([
      `${B}/companion`,
      `${B}/workspaces/3/board`,
      `${B}/companion/todos?state=open`,
      `${B}/companion/todos?workspace=3&state=all`,
    ])
  })

  it('changes application state only: the switch and a rescan request', async () => {
    const { api, post, put, patch, del } = mockApi()
    await setCompanion(api, 3, true)
    await requestRefresh(api)
    await requestRefresh(api, { workspaceId: 3, manual: true })
    await requestRefresh(api, { workspaceId: 3, rebuild: true })
    expect(put).toHaveBeenCalledWith(`${B}/workspaces/3/companion`, { enabled: true })
    expect(post.mock.calls).toEqual([
      [`${B}/companion/refresh`, {}],
      [`${B}/companion/refresh`, { workspaceId: 3, manual: true }],
      [`${B}/companion/refresh`, { workspaceId: 3, rebuild: true }],
    ])
    // Nothing that could write a note, ticket or checkbox.
    expect(patch).not.toHaveBeenCalled()
    expect(del).not.toHaveBeenCalled()
    for (const call of post.mock.calls) expect((call as unknown[])[0]).toBe(`${B}/companion/refresh`)
  })
})

describe('workspace API client', () => {
  it('lists, adds (already shared) and removes folders', async () => {
    const { api, get, post, del } = mockApi()
    get.mockResolvedValueOnce({ workspaces: [] })
    post.mockResolvedValue({ workspace: {} })
    await listWorkspaces(api)
    await addWorkspace(api, '/home/u/notes')
    await addWorkspace(api, '/home/u/notes', 'Vault')
    await removeWorkspace(api, 3)
    await removeWorkspace(api, 4, true)
    expect(get).toHaveBeenCalledWith(`${B}/workspaces`)
    expect(post.mock.calls).toEqual([
      [`${B}/workspaces`, { path: '/home/u/notes', companion: true }],
      [`${B}/workspaces`, { path: '/home/u/notes', name: 'Vault', companion: true }],
    ])
    expect(del.mock.calls).toEqual([[`${B}/workspaces/3`], [`${B}/workspaces/4?deleteOldTasks=1`]])
  })

  it('percent-encodes query values (a raw + would read as a space)', () => {
    expect(query({ q: 'a b+c/ü&x=1' })).toBe('?q=a%20b%2Bc%2F%C3%BC%26x%3D1')
    expect(query({ a: undefined, b: '' })).toBe('')
  })

  it('classifies backend failures', () => {
    const apiError = (status: number, body: unknown) => {
      const text = typeof body === 'string' ? body : JSON.stringify(body)
      return Object.assign(new Error(`API ${status}: ${text}`), { name: 'AppApiError', status, body: text })
    }
    expect(toFailure(apiError(403, { error: 'no', code: 'symlink_refused' })))
      .toEqual({ status: 403, code: 'symlink_refused', message: 'no' })
    expect(toFailure(apiError(502, '<html>'))).toMatchObject({ status: 502, code: undefined })
    expect(toFailure(new TypeError('Failed to fetch')).message).toBe('Failed to fetch')
    expect(toFailure(Object.assign(new Error('x'), { name: 'AppApiPermissionError' })).code).toBe('permission_denied')
  })
})

describe('withTimeout', () => {
  it('passes a result through and clears its timer', async () => {
    vi.useFakeTimers()
    try {
      await expect(withTimeout(Promise.resolve(7), 1000)).resolves.toBe(7)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects a request that never settles', async () => {
    vi.useFakeTimers()
    try {
      const outcome = withTimeout(new Promise<never>(() => {})).then(() => 'ok', (e: Error) => e.message)
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS)
      await expect(outcome).resolves.toMatch(/timed out after 15 s/)
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects with the original error when the request fails first', async () => {
    await expect(withTimeout(Promise.reject(new Error('API 502')), 1000)).rejects.toThrow('API 502')
  })
})

describe('board lanes', () => {
  it('keeps the backend order inside each lane and has a repair lane last', () => {
    const lanes = groupLanes([ticket('b', 'ready'), ticket('x', 'repair'), ticket('a', 'ready'), ticket('d', 'done')])
    expect(LANES[LANES.length - 1]).toBe('repair')
    expect(lanes.ready.map(t => t.path)).toEqual(['b', 'a'])
    expect(lanes.repair.map(t => t.path)).toEqual(['x'])
    expect(lanes.backlog).toEqual([])
  })

  it('puts an unknown lane in repair rather than dropping it', () => {
    const odd = { ...ticket('odd', 'ready'), lane: 'weird' as never }
    expect(groupLanes([odd]).repair.map(t => t.path)).toEqual(['odd'])
  })
})

describe('index status', () => {
  it('says nothing when the index is fresh and complete', () => {
    expect(indexWarning({ state: 'ready', complete: true, retained: 0 })).toBeNull()
  })

  it('surfaces incomplete, retained, failed and unavailable states', () => {
    expect(indexWarning({ state: 'ready', complete: false, retained: 4 })).toMatch(/incomplete.*none were treated as deleted/)
    expect(indexWarning({ state: 'ready', complete: true, retained: 2 })).toMatch(/2 note\(s\) could not be read/)
    expect(indexWarning({ state: 'stale', error: { code: 'root_missing', message: 'the workspace root no longer exists', at: 1 } }))
      .toMatch(/showing the previous scan/)
    expect(indexWarning({ state: 'error', error: { code: 'x', message: 'boom', at: 1 } })).toMatch(/Indexing failed: boom/)
    expect(indexWarning({ state: 'unavailable', error: 'no parsers' })).toMatch(/unavailable: no parsers/)
    expect(indexWarning({ state: 'unindexed' })).toMatch(/Not indexed yet/)
    expect(indexWarning(undefined)).toBeNull()
  })

  it('describes progress and age', () => {
    expect(describeIndex({ state: 'scanning', progress: { notes: 12, startedAt: 0, rebuild: true } })).toBe('Scanning… 12 notes read (rebuild)')
    expect(describeIndex({ state: 'scanning', queued: true, progress: null })).toBe('Scan queued…')
    expect(describeIndex({ state: 'ready', indexedAt: 1000, files: 7 }, 3000)).toBe('7 notes indexed just now')
    expect(ago(0, 30_000)).toBe('30 s ago')
    expect(ago(0, 5 * 60_000)).toBe('5 min ago')
  })
})

describe('TODO filtering', () => {
  const groups: TodoGroup[] = [
    {
      workspaceId: 1, workspace: 'W', path: 'a.md', title: 'Alpha', ticket: false, ticketId: null, status: null, hash: null,
      retained: false,
      items: [
        { ordinal: 0, line: 1, column: 1, checked: false, text: 'Buy milk', depth: 0, heading: 'Errands' },
        { ordinal: 1, line: 2, column: 1, checked: false, text: 'Call Ana', depth: 0, heading: null },
      ],
    },
  ]

  it('matches labels and headings, or every item of a matching note', () => {
    expect(filterTodos(groups, 'milk')[0].items.map(i => i.ordinal)).toEqual([0])
    expect(filterTodos(groups, 'errands')[0].items.map(i => i.ordinal)).toEqual([0])
    expect(filterTodos(groups, 'ALPHA')[0].items).toHaveLength(2)
    expect(filterTodos(groups, 'nothing')).toEqual([])
    expect(filterTodos(groups, '  ')).toEqual(groups)
  })

  it('labels an empty checkbox', () => {
    expect(todoLabel('  ')).toBe('(empty)')
    expect(todoLabel('**bold**')).toBe('**bold**')
  })
})

describe('note name', () => {
  it('is the file name without .md, as Kiro Notes lists it', () => {
    expect(noteName('tickets/ticket copy.md')).toBe('ticket copy')
    expect(noteName('Plan.MD')).toBe('Plan')
    expect(noteName('a/b/readme.markdown')).toBe('readme.markdown')
  })
})

describe('writable file views', () => {
  const hash = 'a'.repeat(64)
  const fresh = { state: 'ready' as const, complete: true, retained: 0, maintenance: [] }
  const note = (path: string): Ticket => ({ ...ticket(path, 'ready'), id: path, status: 'ready', hash, order: '7'.repeat(32) })

  it('disables unsafe mutations while leaving other maintained columns usable', () => {
    expect(mutationProblem(fresh, note('a'))).toBeNull()
    for (const index of [undefined, { ...fresh, state: 'scanning' as const }, { ...fresh, complete: false }, { ...fresh, retained: 1 }, { ...fresh, outdated: true }]) {
      expect(mutationProblem(index, note('a'))).toMatch(/index/)
    }
    expect(mutationProblem(fresh, { ...note('a'), retained: true })).toMatch(/Repair or refresh/)
    expect(mutationProblem(fresh, { ...note('a'), diagnostics: [{ code: 'duplicate_id', message: 'duplicate' }] })).toMatch(/Repair or refresh/)
    expect(mutationProblem({ ...fresh, maintenance: ['ready'] }, note('a'))).toMatch(/maintenance/)
    expect(mutationProblem({ ...fresh, maintenance: ['done'] }, note('a'))).toBeNull()
    expect(mutationProblem({ ...fresh, migrationPending: true }, note('a'))).toMatch(/migration/)
    expect(mutationProblem({ ...fresh, writeBlocked: { code: 'host_upgrade_required', message: 'Upgrade KiroCrew.' } }, note('a'))).toBe('Upgrade KiroCrew.')
    expect(indexWarning({ ...fresh, writeBlocked: { code: 'host_upgrade_required', message: 'Upgrade KiroCrew.' } })).toBe('Upgrade KiroCrew.')
  })

  it('moves down within a column after removing the moving card from its neighbors', () => {
    const cards = ['a', 'b', 'c'].map(note)
    expect(planMove(cards, cards[0], 'ready', 1)).toEqual({
      path: 'a', expectedHash: hash, status: 'ready', before: { path: 'b', hash }, after: { path: 'c', hash },
    })
    expect(planMove(cards, cards[2], 'ready', 0)).toEqual({
      path: 'c', expectedHash: hash, status: 'ready', after: { path: 'a', hash },
    })
    expect(planMove(cards, cards[0], 'done', 0)).toEqual({ path: 'a', expectedHash: hash, status: 'done' })
    expect(planMove(cards, cards[0], 'ready')).toEqual({ path: 'a', expectedHash: hash, status: 'ready', before: { path: 'c', hash } })
  })

  it('rejects stale drop positions instead of treating them as a move to the beginning', () => {
    const cards = ['a', 'b', 'c'].map(note)
    for (const position of [-1, 3, 0.5, Number.NaN]) {
      expect(() => planMove(cards, cards[0], 'ready', position)).toThrow(/destination card changed/)
    }
  })

  it('refuses a move with missing or unsafe destination snapshots', () => {
    const a = note('a'), b = { ...note('b'), hash: null }
    expect(() => planMove([a, b], a, 'ready')).toThrow(/Refresh or repair/)
    expect(() => planMove([a], { ...a, hash: null }, 'done')).toThrow(/Refresh this ticket/)
  })

  it('uses the exact source hash and byte position when toggling a checkbox', async () => {
    const { api, post } = mockApi()
    const group: TodoGroup = { workspaceId: 4, workspace: 'W', path: 'Ü + test.md', title: 'T', ticket: false, ticketId: null, status: null, hash, retained: false, items: [] }
    const item = { ordinal: 2, markerStart: 81, line: 7, column: 3, checked: false, text: 'repeated', depth: 0, heading: null }
    await toggleTodo(api, group, item, true)
    expect(post).toHaveBeenCalledWith(`${B}/workspaces/4/todos/toggle`, {
      path: group.path, expectedHash: hash, markerStart: 81, line: 7, column: 3, checked: true,
    })
  })

  it('promotes the preview snapshot and uses a separate confirmed migration plan', async () => {
    const { api, get, post } = mockApi()
    const source = { path: 'existing + note.md', hash, content: '# Existing' }
    await readSource(api, 4, source.path)
    await promoteNote(api, 4, source)
    await createTicket(api, 4, { path: 'new.md', title: 'New', body: '- [ ] Work', status: 'ready' })
    await moveTicket(api, 4, planMove([note('a')], note('a'), 'done'))
    await previewMigration(api, 4)
    await migrateTasks(api, 4, 'reviewed-plan')
    await exportLegacyTasks(api, 4)
    expect(get.mock.calls).toEqual([
      [`${B}/workspaces/4/source?path=existing%20%2B%20note.md`],
      [`${B}/workspaces/4/migration`], [`${B}/workspaces/4/legacy-tasks`],
    ])
    expect(post.mock.calls).toEqual([
      [`${B}/workspaces/4/tickets/promote`, { path: source.path, expectedHash: hash }],
      [`${B}/workspaces/4/tickets`, { path: 'new.md', title: 'New', body: '- [ ] Work', status: 'ready' }],
      [`${B}/workspaces/4/tickets/move`, { path: 'a', expectedHash: hash, status: 'done' }],
      [`${B}/workspaces/4/migration`, { planHash: 'reviewed-plan', confirm: true }],
    ])
  })
})
