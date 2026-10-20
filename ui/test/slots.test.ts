import { describe, expect, it, vi } from 'vitest'
import type { AppApi } from '@kirocrew/app-sdk'
import {
  SEND_PATH,
  SLOTS_PATH,
  STORAGE_KEY,
  SLOT_NAME_RE,
  classifyError,
  createSender,
  loadSlot,
  newSlotName,
  openSlot,
  saveSlot,
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

  it('passes the agent only when given', async () => {
    const api = mockApi({ post: vi.fn().mockResolvedValue({ key: 'k' }) })
    await openSlot(api, NAME, 'reviewer')
    expect(api.post).toHaveBeenCalledWith(SLOTS_PATH, { name: NAME, agent: 'reviewer' })
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

  it('tolerates unavailable storage', () => {
    const throwing = { getItem: () => { throw new Error('denied') }, setItem: () => { throw new Error('denied') }, removeItem: () => {} }
    expect(loadSlot(throwing)).toBeNull()
    expect(() => saveSlot(throwing, 'k')).not.toThrow()
    expect(loadSlot(undefined)).toBeNull()
  })

  it('makes fresh, app-prefixed names', () => {
    expect(newSlotName(0, () => 0)).toBe('quartizo-0-000000')
    expect(newSlotName()).toMatch(SLOT_NAME_RE)
  })
})
