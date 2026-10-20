import { describe, expect, it, vi } from 'vitest'
import type { AppApi } from '@kirocrew/app-sdk'
import {
  CREATED_SLOTS_PATH,
  SEND_PATH,
  SLOTS_PATH,
  STORAGE_KEY,
  SLOT_NAME_RE,
  classifyError,
  createSender,
  isSlotName,
  listCreatedSlots,
  loadSlot,
  loadWorkspaceSlot,
  newSlotName,
  newWorkspaceSlotName,
  openSlot,
  recordSlot,
  saveSlot,
  saveWorkspaceSlot,
  slotDetailPath,
  slotStatus,
  slotWorkspaceUid,
  isWorkspaceUid,
  openStoredSlot,
  transcriptPath,
  workspaceStorageKey,
} from '../src/slots'

/** Same shape the SDK's scoped client throws for a non-2xx. */
function apiError(status: number, body: unknown): Error {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return Object.assign(new Error(`API ${status}: ${text}`), { name: 'AppApiError', status, body: text })
}

function mockApi(overrides: Partial<Record<keyof AppApi, unknown>> = {}): AppApi & Record<string, ReturnType<typeof vi.fn>> {
  const fail = () => Promise.reject(new Error('unexpected call'))
  return {
    raw: vi.fn(fail), request: vi.fn(fail), get: vi.fn(fail), post: vi.fn(fail),
    put: vi.fn(fail), patch: vi.fn(fail), del: vi.fn(fail),
    ...overrides,
  } as never
}

const NAME = 'quartizo-lx2k9a-0a1b2c'
const SLOT_NOT_FOUND = { error: 'not found', code: 'slot_not_found' }
const NO_GRANT = { error: 'app cannot manage session approvals', code: 'session_approval_not_granted' }

describe('openSlot', () => {
  it('posts the name and returns the slot key', async () => {
    const api = mockApi({ post: vi.fn().mockResolvedValue({ key: NAME, title: '' }) })
    await expect(openSlot(api, NAME)).resolves.toBe(NAME)
    expect(api.post).toHaveBeenCalledWith(SLOTS_PATH, { name: NAME })
  })

  it('records the key with the backend after the gateway created it', async () => {
    const api = mockApi({ post: vi.fn().mockResolvedValue({ key: NAME }) })
    await openSlot(api, NAME)
    expect(api.post).toHaveBeenNthCalledWith(2, CREATED_SLOTS_PATH, { key: NAME })
    expect(CREATED_SLOTS_PATH).toBe('/apps/quartizo/api/slots')
  })

  it('records nothing when the gateway refused or answered with a foreign key', async () => {
    const refused = mockApi({ post: vi.fn().mockRejectedValue(apiError(404, SLOT_NOT_FOUND)) })
    await expect(openSlot(refused, NAME)).rejects.toBeTruthy()
    const foreign = mockApi({ post: vi.fn().mockResolvedValue({ key: 'dashboard:chat-1' }) })
    await expect(openSlot(foreign, NAME)).rejects.toThrow(/not named by Quartizo/)
    expect(refused.post).toHaveBeenCalledTimes(1)
    expect(foreign.post).toHaveBeenCalledTimes(1)
  })

  it('fails (and the stored name stays reopenable) when recording fails', async () => {
    const post = vi.fn().mockResolvedValueOnce({ key: NAME }).mockRejectedValueOnce(apiError(503, 'busy'))
    await expect(openSlot(mockApi({ post }), NAME)).rejects.toMatchObject({ status: 503 })
  })

  it('passes the agent only when given', async () => {
    const api = mockApi({ post: vi.fn().mockResolvedValue({ key: NAME }) })
    await openSlot(api, NAME, 'reviewer')
    expect(api.post).toHaveBeenCalledWith(SLOTS_PATH, { name: NAME, agent: 'reviewer' })
  })

  it('rejects a returned key that Quartizo did not name', async () => {
    for (const key of ['dashboard:chat-1', 'chat-2-1787502679', `${NAME} `]) {
      const api = mockApi({ post: vi.fn().mockResolvedValue({ key }) })
      await expect(openSlot(api, NAME)).rejects.toThrow(/not named by Quartizo/)
    }
  })

  it('rejects a response without a key', async () => {
    for (const row of [undefined, {}, { key: '' }, { key: 7 }]) {
      const api = mockApi({ post: vi.fn().mockResolvedValue(row) })
      await expect(openSlot(api, NAME)).rejects.toThrow(/no slot key/)
    }
  })

  it('refuses names Quartizo did not generate, without calling the gateway', async () => {
    const api = mockApi()
    for (const bad of ['dashboard:chat-1', 'someone-elses', 'quartizo-abc', 'QUARTIZO-a-000000', 'quartizo-a-000000 ', '']) {
      await expect(openSlot(api, bad)).rejects.toThrow(/not named by Quartizo/)
    }
    expect(api.post).not.toHaveBeenCalled()
  })

  it('surfaces slot_not_found for a transcript the app does not own', async () => {
    const api = mockApi({ post: vi.fn().mockRejectedValue(apiError(404, SLOT_NOT_FOUND)) })
    const err = await openSlot(api, NAME).catch(e => e)
    expect(classifyError(err).kind).toBe('slot_not_found')
  })
})

describe('recorded keys', () => {
  it('recordSlot posts the key; listCreatedSlots keeps only Quartizo-shaped keys', async () => {
    const api = mockApi({
      post: vi.fn().mockResolvedValue({}),
      get: vi.fn().mockResolvedValue({ slots: [{ key: NAME }, { key: 'main' }, { key: 7 }, null] }),
    })
    await recordSlot(api, NAME)
    expect(api.post).toHaveBeenCalledWith(CREATED_SLOTS_PATH, { key: NAME })
    expect([...(await listCreatedSlots(api))]).toEqual([NAME])
  })

  it('listCreatedSlots refuses a body that is not a list', async () => {
    for (const body of [undefined, {}, { slots: 'x' }]) {
      await expect(listCreatedSlots(mockApi({ get: vi.fn().mockResolvedValue(body) }))).rejects.toThrow(/did not return a list/)
    }
  })
})

describe('classifyError', () => {
  it('recognises the gateway refusal codes', () => {
    expect(classifyError(apiError(404, SLOT_NOT_FOUND))).toMatchObject({ kind: 'slot_not_found', status: 404 })
    expect(classifyError(apiError(403, NO_GRANT))).toMatchObject({ kind: 'session_approval_not_granted', status: 403 })
  })

  it('treats a bare 404 as slot_not_found only when asked', () => {
    const bare = apiError(404, { error: 'not found' })
    expect(classifyError(bare).kind).toBe('unknown')
    expect(classifyError(bare, { missingIsSlotNotFound: true }).kind).toBe('slot_not_found')
  })

  it('recognises an expired or missing dashboard login', () => {
    expect(classifyError(apiError(401, { error: 'unauthorized' }))).toMatchObject({ kind: 'unauthorized', status: 401 })
    expect(classifyError(apiError(401, '')).kind).toBe('unauthorized')
    expect(classifyError(apiError(403, { code: 'unauthorized' })).kind).toBe('unauthorized')
    expect(classifyError(apiError(401, '')).message).toMatch(/sign in/)
  })

  it('maps the client-side permission fence', () => {
    const e = Object.assign(new Error('[app-sdk] not permitted'), { name: 'AppApiPermissionError' })
    expect(classifyError(e).kind).toBe('permission_denied')
  })

  it('falls back to unknown for other failures', () => {
    expect(classifyError(apiError(500, '<html>')).kind).toBe('unknown')
    expect(classifyError(new TypeError('Failed to fetch')).message).toMatch(/Failed to fetch/)
    expect(classifyError('weird').kind).toBe('unknown')
  })
})

describe('createSender', () => {
  it('checks the slot still exists, then sends through /api/chat with the slot key', async () => {
    const api = mockApi({ get: vi.fn().mockResolvedValue({}), post: vi.fn().mockResolvedValue({ ok: true }) })
    await createSender(api, 'quartizo-a b')('hello')
    expect(api.get).toHaveBeenCalledWith(`${SLOTS_PATH}/quartizo-a%20b?limit=1`)
    expect(api.post).toHaveBeenCalledWith(SEND_PATH, { message: 'hello', slot: 'quartizo-a b', agent: '' })
  })

  it('forwards attachment meta', async () => {
    const api = mockApi({ get: vi.fn().mockResolvedValue({}), post: vi.fn().mockResolvedValue({ ok: true }) })
    await createSender(api, 'k', { agent: 'a' })('m', { files: ['/x.txt'] })
    expect(api.post).toHaveBeenCalledWith(SEND_PATH, { message: 'm', slot: 'k', agent: 'a', meta: { files: ['/x.txt'] } })
  })

  it('refuses a stale send without posting (no unowned re-creation)', async () => {
    const onError = vi.fn()
    const api = mockApi({ get: vi.fn().mockRejectedValue(apiError(404, SLOT_NOT_FOUND)) })
    await expect(createSender(api, 'gone', { onError })('hi')).rejects.toMatchObject({ status: 404 })
    expect(api.post).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ kind: 'slot_not_found' }))
  })

  it('reports a refused send and rethrows so ChatEmbed keeps the draft', async () => {
    const onError = vi.fn()
    const api = mockApi({ get: vi.fn().mockResolvedValue({}), post: vi.fn().mockRejectedValue(apiError(403, NO_GRANT)) })
    await expect(createSender(api, 'k', { onError })('hi')).rejects.toBeInstanceOf(Error)
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ kind: 'session_approval_not_granted' }))
  })
})

describe('slot persistence', () => {
  it('round-trips and clears', () => {
    const map = new Map<string, string>()
    const s = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
    }
    expect(loadSlot(s)).toBeNull()
    saveSlot(s, NAME)
    expect(map.get(STORAGE_KEY)).toBe(NAME)
    expect(loadSlot(s)).toBe(NAME)
    saveSlot(s, null)
    expect(loadSlot(s)).toBeNull()
  })

  it('drops a stored key that does not match the generated pattern', () => {
    const map = new Map<string, string>([[STORAGE_KEY, 'dashboard:someone-else']])
    const s = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
    }
    expect(loadSlot(s)).toBeNull()
    expect(map.has(STORAGE_KEY)).toBe(false)
  })

  it('does not let the Chat tab adopt a workspace slot or store a foreign key', () => {
    const s = memStorage([[STORAGE_KEY, newWorkspaceSlotName(UID_A)]])
    expect(loadSlot(s)).toBeNull()
    for (const bad of ['dashboard:chat-1', newWorkspaceSlotName(UID_A), '']) {
      expect(() => saveSlot(s, bad)).toThrow(/refusing to store/)
    }
    expect(s.map.size).toBe(0)
  })

  it('tolerates unavailable storage', () => {
    const throwing = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') }, removeItem: () => {} }
    expect(loadSlot(throwing)).toBeNull()
    expect(() => saveSlot(throwing, NAME)).not.toThrow()
    expect(loadSlot(undefined)).toBeNull()
  })

  it('makes fresh, app-prefixed names', () => {
    expect(newSlotName(0, () => 0)).toBe('quartizo-0-000000')
    expect(newSlotName()).toMatch(SLOT_NAME_RE)
  })
})

function memStorage(entries: [string, string][] = []) {
  const map = new Map<string, string>(entries)
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  }
}

const UID_A = '0123456789abcdef0123456789abcdef'
const UID_B = 'fedcba9876543210fedcba9876543210'

describe('per-workspace slots', () => {
  it('names a workspace slot after its uid, inside the validated pattern', () => {
    expect(newWorkspaceSlotName(UID_A, 0, () => 0)).toBe(`quartizo-w${UID_A}-0-000000`)
    const name = newWorkspaceSlotName(UID_B)
    expect(name).toMatch(SLOT_NAME_RE)
    expect(isSlotName(name)).toBe(true)
    expect(slotWorkspaceUid(name)).toBe(UID_B)
  })

  it('refuses invalid uids', () => {
    for (const bad of ['', '1', UID_A.toUpperCase(), `${UID_A}0`, UID_A.slice(1), 3 as unknown as string, `${UID_A.slice(0, 31)}g`]) {
      expect(isWorkspaceUid(bad)).toBe(false)
      expect(() => newWorkspaceSlotName(bad)).toThrow(/invalid workspace uid/)
      expect(() => workspaceStorageKey(bad)).toThrow(/invalid workspace uid/)
    }
  })

  it('tells workspace names from Chat-tab names and foreign ones', () => {
    expect(slotWorkspaceUid('quartizo-lx2k9a-0a1b2c')).toBeNull()
    for (const bad of ['quartizo-w12-a-000000', `quartizo-w${UID_A}0-a-000000`, `quartizo-w${UID_A}-a-00000`,
      `other-w${UID_A}-a-000000`, `quartizo-w${UID_A}-a-000000\n`, `quartizo-w${UID_A}-w${UID_B}-a-000000`]) {
      expect(slotWorkspaceUid(bad)).toBeNull()
    }
  })

  it('keeps one slot per workspace uid, so a re-used id cannot inherit a chat', () => {
    const s = memStorage()
    const a = newWorkspaceSlotName(UID_A, 1, () => 0.1)
    saveWorkspaceSlot(s, UID_A, a)
    expect(s.map.get(`quartizo:slot:ws:${UID_A}`)).toBe(a)
    expect(loadWorkspaceSlot(s, UID_A)).toBe(a)
    // Another registration (even one that got the same numeric id) has another uid.
    expect(loadWorkspaceSlot(s, UID_B)).toBeNull()
    // The Chat tab's own slot is separate.
    expect(loadSlot(s)).toBeNull()
    saveWorkspaceSlot(s, UID_A, null)
    expect(loadWorkspaceSlot(s, UID_A)).toBeNull()
  })

  it('drops a stored value that names another workspace or is not Quartizo\'s', () => {
    for (const stored of [newWorkspaceSlotName(UID_B), 'quartizo-lx2k9a-0a1b2c', 'dashboard:chat-1']) {
      const s = memStorage([[`quartizo:slot:ws:${UID_A}`, stored]])
      expect(loadWorkspaceSlot(s, UID_A)).toBeNull()
      expect(s.map.size).toBe(0)
    }
  })

  it('refuses to store another workspace\'s slot', () => {
    const s = memStorage()
    expect(() => saveWorkspaceSlot(s, UID_A, newWorkspaceSlotName(UID_B))).toThrow(/another workspace/)
    expect(() => saveWorkspaceSlot(s, UID_A, 'quartizo-lx2k9a-0a1b2c')).toThrow(/another workspace/)
    expect(s.map.size).toBe(0)
  })

  it('tolerates unavailable storage', () => {
    const throwing = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') }, removeItem: () => {} }
    expect(loadWorkspaceSlot(throwing, UID_A)).toBeNull()
    expect(() => saveWorkspaceSlot(throwing, UID_A, newWorkspaceSlotName(UID_A))).not.toThrow()
  })
})

function memStore(initial: string | null = null) {
  let value = initial
  let n = 0
  const saves: (string | null)[] = []
  return {
    saves,
    get value() { return value },
    load: () => value,
    save: (k: string | null) => { saves.push(k); value = k },
    fresh: () => `quartizo-${(++n).toString(36)}-00000${n}`,
  }
}

describe('openStoredSlot', () => {
  it('saves a fresh name before asking the gateway (no orphan on unmount)', async () => {
    const store = memStore()
    let release!: (v: unknown) => void
    const api = mockApi({
      post: vi.fn((path: string) => (path === CREATED_SLOTS_PATH ? Promise.resolve({}) : new Promise(r => (release = r)))),
    })
    const pending = openStoredSlot(api, store)
    // The request is in flight; the name is already remembered.
    expect(store.value).toBe('quartizo-1-000001')
    // A second run (remount) reuses it instead of minting another.
    const api2 = mockApi({ post: vi.fn().mockResolvedValue({ key: 'quartizo-1-000001' }) })
    await expect(openStoredSlot(api2, store)).resolves.toBe('quartizo-1-000001')
    expect(api2.post).toHaveBeenCalledWith(SLOTS_PATH, { name: 'quartizo-1-000001' })
    release({ key: 'quartizo-1-000001' })
    await expect(pending).resolves.toBe('quartizo-1-000001')
  })

  it('replaces a remembered name the gateway answers slot_not_found for, once', async () => {
    const store = memStore('quartizo-old-000000')
    const post = vi.fn()
      .mockRejectedValueOnce(apiError(404, SLOT_NOT_FOUND))
      .mockResolvedValue({ key: 'quartizo-1-000001' })
    await expect(openStoredSlot(mockApi({ post }), store)).resolves.toBe('quartizo-1-000001')
    expect(post.mock.calls.map(c => c[1])).toEqual([
      { name: 'quartizo-old-000000' },
      { name: 'quartizo-1-000001' },
      { key: 'quartizo-1-000001' },
    ])
    expect(store.value).toBe('quartizo-1-000001')
  })

  it('does not retry other failures, or a fresh name', async () => {
    const other = memStore('quartizo-old-000000')
    const post = vi.fn().mockRejectedValue(apiError(500, 'x'))
    await expect(openStoredSlot(mockApi({ post }), other)).rejects.toMatchObject({ status: 500 })
    expect(post).toHaveBeenCalledTimes(1)
    expect(other.value).toBe('quartizo-old-000000')

    const fresh = memStore()
    const post2 = vi.fn().mockRejectedValue(apiError(404, SLOT_NOT_FOUND))
    await expect(openStoredSlot(mockApi({ post: post2 }), fresh)).rejects.toMatchObject({ status: 404 })
    expect(post2).toHaveBeenCalledTimes(1)
  })
})

describe('slot status and transcript link', () => {
  it('derives the status from what the slot detail exposes', () => {
    expect(slotStatus({ running: false, messages: [{ role: 'user' }, { role: 'assistant' }] }).status).toBe('idle')
    expect(slotStatus({ running: true, messages: [] }).status).toBe('running')
    expect(slotStatus({ running: true, stopping: true }).status).toBe('stopping')
    expect(slotStatus({ running: false, messages: [{ role: 'user' }, { role: 'error' }] }).status).toBe('error')
    expect(slotStatus({ title: 'T' })).toEqual({ status: 'idle', title: 'T' })
    expect(slotStatus(undefined).status).toBe('idle')
    expect(slotStatus({ running: 'yes' }).status).toBe('idle')
  })

  it('builds encoded paths', () => {
    expect(slotDetailPath('a b')).toBe('/api/chat/slots/a%20b?limit=1')
    expect(transcriptPath('quartizo-w1-a-000000')).toBe('/chat?sid=quartizo-w1-a-000000')
    expect(transcriptPath('a&b=c')).toBe('/chat?sid=a%26b%3Dc')
  })
})
