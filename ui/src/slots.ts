/**
 * Logic for the Quartizo-created chat session, kept free of React and of runtime SDK imports so
 * it can be tested with a mocked AppApi.
 *
 * Wire shapes (kirodotdev/KiroCrew@f62ab4fd; rechecked against kirocrew 0.10.0rc4):
 *   POST /api/chat/slots {name, agent?} -> serialized slot row with `key`
 *     (dashboard/chat_api/slot_create.py; builtin design-critique reads `.key`)
 *   GET  /api/chat/slots/{key}?limit=N  -> 404 when missing (or, for app tokens, not owned)
 *   POST /api/chat?ws=1 {message, slot, agent, meta?}
 *     (website/src/app-sdk/appSendWire.ts, the SDK's own send body)
 *   Refusals: 404 {"code":"slot_not_found"} (dashboard/slot_ownership.py),
 *             403 {"code":"session_approval_not_granted"} (chat_api/slot_approval.py)
 */
import type { AppApi, ChatEmbedSendMeta } from '@kirocrew/app-sdk'

export const BACKEND_BASE = '/apps/quartizo/api'
export const SLOTS_PATH = '/api/chat/slots'
export const SEND_PATH = '/api/chat?ws=1'
export const STORAGE_KEY = 'quartizo:slot'

export type FailureKind =
  | 'slot_not_found'
  | 'session_approval_not_granted'
  | 'permission_denied'
  | 'unknown'

export interface Failure {
  kind: FailureKind
  status?: number
  message: string
}

const MESSAGES: Record<FailureKind, string> = {
  slot_not_found:
    'This chat no longer exists or cannot be reached by Quartizo. Start a new chat to continue.',
  session_approval_not_granted:
    'Quartizo is not allowed to approve or reject tool requests (permissions.sessionApproval is not granted). Decide pending tools from the main chat instead.',
  permission_denied: 'Quartizo has not declared access to this API in app.json.',
  unknown: 'Request failed.',
}

function codeFromBody(body: unknown): string | undefined {
  if (typeof body !== 'string' || !body) return undefined
  try {
    const parsed: unknown = JSON.parse(body)
    if (parsed && typeof parsed === 'object' && 'code' in parsed) {
      const code = (parsed as { code: unknown }).code
      return typeof code === 'string' ? code : undefined
    }
  } catch {
    /* not JSON */
  }
  return undefined
}

/** Map anything AppApi throws to a user-facing failure. */
export function classifyError(err: unknown, opts: { missingIsSlotNotFound?: boolean } = {}): Failure {
  const e = err as { name?: string; status?: unknown; body?: unknown; message?: unknown } | null
  const message = typeof e?.message === 'string' ? e.message : String(err)
  if (e?.name === 'AppApiPermissionError') {
    return { kind: 'permission_denied', message: MESSAGES.permission_denied }
  }
  const status = typeof e?.status === 'number' ? e.status : undefined
  const code = codeFromBody(e?.body)
  if (code === 'slot_not_found' || (opts.missingIsSlotNotFound && status === 404)) {
    return { kind: 'slot_not_found', status, message: MESSAGES.slot_not_found }
  }
  if (code === 'session_approval_not_granted') {
    return { kind: 'session_approval_not_granted', status, message: MESSAGES.session_approval_not_granted }
  }
  return { kind: 'unknown', status, message: `${MESSAGES.unknown} ${message}` }
}

/** Every slot name Quartizo generates; anything else is never opened. */
export const SLOT_NAME_RE = /^quartizo-[0-9a-z]+-[0-9a-z]{6}$/

export function isSlotName(value: unknown): value is string {
  return typeof value === 'string' && SLOT_NAME_RE.test(value)
}

export function newSlotName(now: number = Date.now(), rand: () => number = Math.random): string {
  return `quartizo-${now.toString(36)}-${Math.floor(rand() * 36 ** 6).toString(36).padStart(6, '0')}`
}

/** Create (fresh name) or reopen (owned key) a slot; resolves to its key. */
export async function openSlot(api: AppApi, name: string, agent?: string): Promise<string> {
  // Refuse anything Quartizo did not generate, so a tampered or foreign stored
  // value can never open (or adopt) some other session by name.
  if (!isSlotName(name)) throw new Error(`refusing to open a slot not named by Quartizo: ${JSON.stringify(name)}`)
  const row = await api.post<{ key?: unknown } | undefined>(SLOTS_PATH, agent ? { name, agent } : { name })
  if (!row || typeof row.key !== 'string' || !row.key) {
    throw new Error('POST /api/chat/slots returned no slot key')
  }
  return row.key
}

/**
 * ChatEmbed `onSend`: refuse a stale send instead of letting the generic
 * POST /api/chat path silently re-create a missing slot (with no project and,
 * for app tokens, no app ownership). Page calls run as the dashboard owner, so
 * the session is a Quartizo-created owner session either way.
 * Residual race: a slot deleted between the check and the send is still
 * re-created by /api/chat (no conditional-send API is documented).
 */
export function createSender(
  api: AppApi,
  slotKey: string,
  opts: { agent?: string; onError?: (f: Failure) => void } = {},
): (message: string, meta?: ChatEmbedSendMeta) => Promise<unknown> {
  const slotPath = `${SLOTS_PATH}/${encodeURIComponent(slotKey)}?limit=1`
  return async (message, meta) => {
    try {
      await api.get(slotPath)
    } catch (err) {
      const failure = classifyError(err, { missingIsSlotNotFound: true })
      opts.onError?.(failure)
      throw err
    }
    try {
      return await api.post(SEND_PATH, {
        message,
        slot: slotKey,
        agent: opts.agent ?? '',
        ...(meta ? { meta } : {}),
      })
    } catch (err) {
      opts.onError?.(classifyError(err))
      throw err
    }
  }
}

type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function loadSlot(storage: KV | undefined): string | null {
  try {
    const value = storage?.getItem(STORAGE_KEY) ?? null
    if (value === null || isSlotName(value)) return value
    storage?.removeItem(STORAGE_KEY)
    return null
  } catch {
    return null
  }
}

export function saveSlot(storage: KV | undefined, key: string | null): void {
  try {
    if (key) storage?.setItem(STORAGE_KEY, key)
    else storage?.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable: the slot just will not be remembered */
  }
}
