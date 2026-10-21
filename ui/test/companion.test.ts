import { describe, expect, it, vi } from 'vitest'
import type { AppApi } from '@kirocrew/app-sdk'
import {
  ago, companionStatus, describeIndex, filterTodos, groupLanes, indexWarning, LANES, loadBoard, loadTodos,
  requestRefresh, setCompanion, type Ticket, type TodoGroup, todoLabel,
} from '../src/companionApi'
import { describeSource, KIRO_NOTES, KIRO_NOTES_ROUTE, openInKiroNotes } from '../src/noteNav'

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
    expect(describeIndex({ state: 'scanning', progress: { notes: 12, startedAt: 0, rebuild: true } })).toBe('Scanning… 12 note(s) read (rebuild)')
    expect(describeIndex({ state: 'scanning', queued: true, progress: null })).toBe('Scan queued…')
    expect(describeIndex({ state: 'ready', indexedAt: 1000, files: 7 }, 3000)).toBe('7 note(s) indexed just now')
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

describe('note navigation adapter', () => {
  it('only opens the Kiro Notes app, and says so', () => {
    const navigate = vi.fn()
    const result = openInKiroNotes(navigate, { workspaceId: 1, workspaceName: 'W', path: 'x/y.md' })
    expect(navigate).toHaveBeenCalledWith(KIRO_NOTES_ROUTE)
    expect(KIRO_NOTES).toEqual({ app: true, note: false, line: false })
    expect(result.exact).toBe(false)
    expect(result.message).toMatch(/Select x\/y\.md there/)
  })

  it('reports exact targeting only when the editor supports it', () => {
    const result = openInKiroNotes(vi.fn(), { workspaceId: 1, workspaceName: 'W', path: 'y.md' }, { app: true, note: true, line: false })
    expect(result).toEqual({ message: 'Opened y.md in Kiro Notes.', exact: true })
  })

  it('describes the source location', () => {
    expect(describeSource({ workspaceId: 1, workspaceName: 'Vault', path: 'a/b.md', line: 12, column: 3, heading: 'Plan' }))
      .toBe('Vault › a/b.md · line 12, column 3 · under “Plan”')
    expect(describeSource({ workspaceId: 1, workspaceName: 'Vault', path: 'b.md' })).toBe('Vault › b.md')
  })
})
