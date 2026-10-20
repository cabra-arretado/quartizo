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
 *             403 {"code":"session_approval_not_granted"} (chat_api/slot_approval.py),
 *             401 when the dashboard login is missing or expired (dashboard/token_auth.py)
 *   Slot detail (chat_api/slot_detail.py, 0.10.0rc4): {key, title, running, stopping,
 *     turn?, turn_gen?, messages[{role,...}], queue, total, has_more, ...}
 *   Full chat page: route `/chat/:slug?`, opens `?sid=<key>` (bundled App-*.js; the same
 *     path useChatLauncher().openChat navigates to).
 */
import type { AppApi, ChatEmbedSendMeta } from '@kirocrew/app-sdk'

export const BACKEND_BASE = '/apps/quartizo/api'
export const SLOTS_PATH = '/api/chat/slots'
export const SEND_PATH = '/api/chat?ws=1'
export const STORAGE_KEY = 'quartizo:slot'

export type FailureKind =
  | 'slot_not_found'
  | 'session_approval_not_granted'
  | 'unauthorized'
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
  unauthorized:
    'The KiroCrew dashboard login is missing or expired (401 unauthorized). Reload the page and sign in again.',
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
  if (code === 'unauthorized' || status === 401) {
    return { kind: 'unauthorized', status, message: MESSAGES.unauthorized }
  }
  return { kind: 'unknown', status, message: `${MESSAGES.unknown} ${message}` }
}

/**
 * Every slot name Quartizo generates; anything else is never opened.
 * `quartizo-<time>-<rand>` is the Chat tab's session; `quartizo-w<uid>-<time>-<rand>`
 * belongs to the workspace with that `uid` (the chat beside its notes). The uid
 * (32 random hex chars from the backend, never reused) rather than the numeric
 * id, so a later workspace can never inherit an earlier one's chat.
 */
export const SLOT_NAME_RE = /^quartizo-(?:w[0-9a-f]{32}-)?[0-9a-z]+-[0-9a-z]{6}$/

export function isSlotName(value: unknown): value is string {
  return typeof value === 'string' && SLOT_NAME_RE.test(value)
}

function nameSuffix(now: number, rand: () => number): string {
  return `${now.toString(36)}-${Math.floor(rand() * 36 ** 6).toString(36).padStart(6, '0')}`
}

export function newSlotName(now: number = Date.now(), rand: () => number = Math.random): string {
  return `quartizo-${nameSuffix(now, rand)}`
}

export const WORKSPACE_UID_RE = /^[0-9a-f]{32}$/

export function isWorkspaceUid(uid: unknown): uid is string {
  return typeof uid === 'string' && WORKSPACE_UID_RE.test(uid)
}

function requireUid(uid: unknown): string {
  if (!isWorkspaceUid(uid)) throw new Error(`invalid workspace uid: ${JSON.stringify(uid)}`)
  return uid
}

export function newWorkspaceSlotName(uid: string, now: number = Date.now(), rand: () => number = Math.random): string {
  return `quartizo-w${requireUid(uid)}-${nameSuffix(now, rand)}`
}

/** The workspace uid a Quartizo slot name belongs to; null for the Chat tab's names and anything foreign. */
export function slotWorkspaceUid(name: unknown): string | null {
  if (!isSlotName(name)) return null
  const m = /^quartizo-w([0-9a-f]{32})-/.exec(name)
  return m ? m[1] : null
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
  // The key is stored and reopened later, so it must pass the same check.
  if (!isSlotName(row.key)) {
    throw new Error(`POST /api/chat/slots returned a key not named by Quartizo: ${JSON.stringify(row.key)}`)
  }
  return row.key
}

/** Where one Quartizo session's key is remembered, and how a fresh name is made. */
export interface SlotStore {
  load(): string | null
  save(key: string | null): void
  fresh(): string
}

/**
 * Open the store's remembered session, or a fresh one. The fresh name is saved
 * BEFORE the gateway is asked, so a caller torn down mid-request (unmount,
 * StrictMode) reopens the same name next time instead of minting a second,
 * orphaned session. A remembered name the gateway refuses with slot_not_found
 * is forgotten and replaced once by a fresh one.
 */
export async function openStoredSlot(api: AppApi, store: SlotStore, agent?: string): Promise<string> {
  const stored = store.load()
  const name = stored ?? store.fresh()
  if (stored === null) store.save(name)
  try {
    return await openSlot(api, name, agent)
  } catch (err) {
    if (stored === null || classifyError(err).kind !== 'slot_not_found') throw err
    const fresh = store.fresh()
    store.save(fresh)
    return await openSlot(api, fresh, agent)
  }
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
    if (value === null || isTabSlotName(value)) return value
    storage?.removeItem(STORAGE_KEY)
    return null
  } catch {
    return null
  }
}

/** The Chat tab's own names: Quartizo's, and not a workspace's. */
function isTabSlotName(value: unknown): value is string {
  return isSlotName(value) && slotWorkspaceUid(value) === null
}

export function saveSlot(storage: KV | undefined, key: string | null): void {
  if (key !== null && !isTabSlotName(key)) {
    throw new Error(`refusing to store a slot not named by Quartizo for the Chat tab: ${JSON.stringify(key)}`)
  }
  try {
    if (key) storage?.setItem(STORAGE_KEY, key)
    else storage?.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable: the slot just will not be remembered */
  }
}

/** localStorage key holding the slot of the workspace with this uid. */
export function workspaceStorageKey(uid: string): string {
  return `${STORAGE_KEY}:ws:${requireUid(uid)}`
}

/** The workspace's remembered slot; a value naming any other workspace (or none) is dropped. */
export function loadWorkspaceSlot(storage: KV | undefined, uid: string): string | null {
  const k = workspaceStorageKey(uid)
  try {
    const value = storage?.getItem(k) ?? null
    if (value === null || slotWorkspaceUid(value) === uid) return value
    storage?.removeItem(k)
    return null
  } catch {
    return null
  }
}

export function saveWorkspaceSlot(storage: KV | undefined, uid: string, key: string | null): void {
  const k = workspaceStorageKey(uid)
  if (key !== null && slotWorkspaceUid(key) !== uid) {
    throw new Error(`refusing to store a slot of another workspace: ${JSON.stringify(key)}`)
  }
  try {
    if (key) storage?.setItem(k, key)
    else storage?.removeItem(k)
  } catch {
    /* storage unavailable: the slot just will not be remembered */
  }
}

export type SlotStatus = 'idle' | 'running' | 'stopping' | 'error'

/**
 * What GET /api/chat/slots/{key} exposes: `running` and `stopping` flags, and
 * the transcript rows (an `error` row is a failed turn). There is no other
 * status field.
 */
export function slotStatus(row: unknown): { status: SlotStatus; title: string } {
  const r = (row && typeof row === 'object' ? row : {}) as {
    running?: unknown
    stopping?: unknown
    title?: unknown
    messages?: unknown
  }
  const title = typeof r.title === 'string' ? r.title : ''
  if (r.stopping === true) return { status: 'stopping', title }
  if (r.running === true) return { status: 'running', title }
  const msgs = Array.isArray(r.messages) ? r.messages : []
  const last = msgs[msgs.length - 1] as { role?: unknown } | undefined
  return { status: last?.role === 'error' ? 'error' : 'idle', title }
}

export function slotDetailPath(slotKey: string, limit = 1): string {
  return `${SLOTS_PATH}/${encodeURIComponent(slotKey)}?limit=${limit}`
}

/** Host route of the full chat page for one session. */
export function transcriptPath(slotKey: string): string {
  return `/chat?sid=${encodeURIComponent(slotKey)}`
}
