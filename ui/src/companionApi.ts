/**
 * Client for Quartizo's backend (reached through the gateway proxy at
 * /apps/quartizo/api/...; wire shapes in backend/server.py and
 * backend/companion.py) and the pure rules the views apply to its answers.
 *
 * Nothing here writes a note: the calls that change anything change
 * application state only (the registered folders, their companion switch and
 * a request to rescan).
 */
import type { AppApi } from '@kirocrew/app-sdk'

export const BACKEND_BASE = '/apps/quartizo/api'

/** Each request gives up after this long; a timeout counts as a failure. */
export const REQUEST_TIMEOUT_MS = 15000

export const STATUSES = ['backlog', 'ready', 'in_progress', 'review', 'done'] as const
export type TaskStatus = (typeof STATUSES)[number]

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  ready: 'Ready',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

export interface Workspace {
  id: number
  /** 32 random hex chars, unique per registration (ids are never reused either). */
  uid: string
  name: string
  path: string
  /** Shared with Kiro Notes: indexed for the board and the TODO list. */
  companion?: boolean
  /** Tasks left from the removed database board; removing the folder deletes them. */
  oldTasks?: number
}

export interface ApiFailure {
  status?: number
  code?: string
  message: string
}

/** Map anything AppApi throws to a displayable failure, keeping the backend's code. */
export function toFailure(err: unknown): ApiFailure {
  const e = err as { name?: string; status?: unknown; body?: unknown; message?: unknown } | null
  if (e?.name === 'AppApiPermissionError') {
    return { code: 'permission_denied', message: 'Quartizo has not declared access to this API in app.json.' }
  }
  const status = typeof e?.status === 'number' ? e.status : undefined
  let parsed: Record<string, unknown> | undefined
  if (typeof e?.body === 'string' && e.body) {
    try {
      const v: unknown = JSON.parse(e.body)
      if (v && typeof v === 'object' && !Array.isArray(v)) parsed = v as Record<string, unknown>
    } catch {
      /* not JSON */
    }
  }
  const code = typeof parsed?.code === 'string' ? parsed.code : undefined
  const message =
    typeof parsed?.error === 'string' ? parsed.error : typeof e?.message === 'string' ? e.message : String(err)
  return { status, code, message }
}

/** Reject if `p` has not settled within `ms`; the late result is ignored. */
export function withTimeout<T>(p: Promise<T>, ms: number = REQUEST_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`request timed out after ${Math.round(ms / 1000)} s`)), ms)
  })
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer))
}

/** Query string with encodeURIComponent (the backend's parse_qs reads a raw `+` as a space). */
export function query(params: Record<string, string | undefined>): string {
  const parts = Object.entries(params)
    .filter((kv): kv is [string, string] => kv[1] !== undefined && kv[1] !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  return parts.length ? `?${parts.join('&')}` : ''
}

export async function listWorkspaces(api: AppApi): Promise<Workspace[]> {
  const res = await api.get<{ workspaces: Workspace[] }>(`${BACKEND_BASE}/workspaces`)
  return res.workspaces
}

/** Register a folder, already shared with Kiro Notes (one request, so it is never left half-added). */
export async function addWorkspace(api: AppApi, path: string, name?: string): Promise<Workspace> {
  const res = await api.post<{ workspace: Workspace }>(`${BACKEND_BASE}/workspaces`, name ? { path, name, companion: true } : { path, companion: true })
  return res.workspace
}

/**
 * Call only after the user confirmed in the UI. The folder and its files are not touched. A folder
 * with old database tasks is refused (409 `has_old_tasks`) unless `deleteOldTasks`, which deletes them.
 */
export async function removeWorkspace(api: AppApi, wsId: number, deleteOldTasks = false): Promise<void> {
  await api.del(`${BACKEND_BASE}/workspaces/${wsId}${deleteOldTasks ? '?deleteOldTasks=1' : ''}`)
}

export interface Diagnostic {
  code: string
  message: string
  /** `duplicate_id` only: the other notes using the same ticket ID. */
  others?: { workspaceId: number; workspace: string; path: string }[]
}

export type IndexState = 'off' | 'unavailable' | 'unindexed' | 'scanning' | 'ready' | 'stale' | 'error'

export interface IndexStatus {
  state: IndexState
  queued?: boolean
  progress?: { notes: number; startedAt: number; rebuild: boolean } | null
  /** When the generation being shown finished (epoch ms). */
  indexedAt?: number | null
  /** False when a limit or an unreadable folder stopped the scan early. */
  complete?: boolean
  files?: number
  /** Notes shown from an earlier scan because this one could not read or reach them. */
  retained?: number
  error?: { code: string; message: string; at: number | null } | string | null
  outdated?: boolean
}

export interface CompanionWorkspace {
  workspace: Workspace
  index: IndexStatus
}

export interface CompanionStatus {
  available: boolean
  error: string | null
  workspaces: CompanionWorkspace[]
}

export interface NoteItem {
  path: string
  title: string
  hash: string | null
  mtimeMs: number | null
  diagnostics: Diagnostic[]
  retained: boolean
}

export type Lane = TaskStatus | 'repair'

export interface Ticket extends NoteItem {
  id: string | null
  status: TaskStatus | null
  order: string | null
  todos: { total: number; done: number }
  lane: Lane
}

export interface BoardData {
  workspace: Workspace
  index: IndexStatus
  /** Sorted by the backend: rank (ASCII), then ticket ID, then path. */
  tickets: Ticket[]
}

export interface TodoItem {
  ordinal: number
  line: number
  column: number
  checked: boolean
  text: string
  depth: number
  heading: string | null
}

export interface TodoGroup {
  workspaceId: number
  workspace: string
  path: string
  title: string
  ticket: boolean
  ticketId: string | null
  status: TaskStatus | null
  hash: string | null
  retained: boolean
  items: TodoItem[]
}

export type TodoState = 'open' | 'done' | 'all'

export interface TodoData {
  groups: TodoGroup[]
  truncated: boolean
  index: Record<string, IndexStatus>
}

const COMPANION = `${BACKEND_BASE}/companion`

export function companionStatus(api: AppApi): Promise<CompanionStatus> {
  return api.get<CompanionStatus>(COMPANION)
}

/** Call only after the user confirmed in the UI. Changes application state only. */
export function setCompanion(api: AppApi, wsId: number, enabled: boolean): Promise<{ workspace: Workspace; index: IndexStatus }> {
  return api.put(`${BACKEND_BASE}/workspaces/${wsId}/companion`, { enabled })
}

/** Ask for a rescan. `manual` bypasses the backend's throttle; `rebuild` re-parses every note. */
export function requestRefresh(
  api: AppApi,
  opts: { workspaceId?: number; rebuild?: boolean; manual?: boolean } = {},
): Promise<{ requested: number[]; skipped: number[] }> {
  const body: Record<string, unknown> = {}
  if (opts.workspaceId !== undefined) body.workspaceId = opts.workspaceId
  if (opts.rebuild) body.rebuild = true
  if (opts.manual) body.manual = true
  return api.post(`${COMPANION}/refresh`, body)
}

export function loadBoard(api: AppApi, wsId: number): Promise<BoardData> {
  return api.get<BoardData>(`${BACKEND_BASE}/workspaces/${wsId}/board`)
}

export function loadTodos(api: AppApi, state: TodoState, wsId?: number): Promise<TodoData> {
  return api.get<TodoData>(`${COMPANION}/todos${query({ workspace: wsId === undefined ? undefined : String(wsId), state })}`)
}

export const LANES: readonly Lane[] = [...STATUSES, 'repair']
export const LANE_LABELS: Record<Lane, string> = { ...STATUS_LABELS, repair: 'Needs repair' }

/** Tickets per lane, keeping the backend's order inside each. */
export function groupLanes(tickets: readonly Ticket[]): Record<Lane, Ticket[]> {
  const lanes = Object.fromEntries(LANES.map(l => [l, [] as Ticket[]])) as Record<Lane, Ticket[]>
  for (const t of tickets) (lanes[t.lane] ?? lanes.repair).push(t)
  return lanes
}

/** Whether the status should be called out next to the data (not "ready"). */
export function indexWarning(index: IndexStatus | undefined): string | null {
  if (!index) return null
  switch (index.state) {
    case 'off':
      return 'This workspace is not in Kiro Notes companion mode.'
    case 'unavailable':
      return `The Markdown index is unavailable: ${typeof index.error === 'string' ? index.error : 'parsers failed to load'}.`
    case 'unindexed':
      return 'Not indexed yet.'
    case 'error':
    case 'stale': {
      const message = index.error && typeof index.error === 'object' ? index.error.message : 'the last scan failed'
      return index.state === 'stale'
        ? `The last scan failed (${message}); showing the previous scan.`
        : `Indexing failed: ${message}.`
    }
    default:
      break
  }
  const parts: string[] = []
  if (index.complete === false) parts.push('The last scan was incomplete (a limit was reached or a folder could not be read): notes it did not reach are shown as last indexed, and none were treated as deleted.')
  else if (index.retained) parts.push(`${index.retained} note(s) could not be read and are shown as last indexed.`)
  if (index.outdated) parts.push('This index was built by an older version; refresh to update it.')
  return parts.length ? parts.join(' ') : null
}

export function describeIndex(index: IndexStatus | undefined, now: number = Date.now()): string {
  if (!index) return ''
  if (index.state === 'scanning') {
    const n = index.progress?.notes
    return index.progress ? `Scanning… ${n} note(s) read${index.progress.rebuild ? ' (rebuild)' : ''}` : 'Scan queued…'
  }
  if (!index.indexedAt) return ''
  return `${index.files ?? 0} note(s) indexed ${ago(index.indexedAt, now)}`
}

export function ago(at: number, now: number): string {
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 5) return 'just now'
  if (s < 60) return `${s} s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  return new Date(at).toLocaleString()
}

/** Matches TODOs by label, note title, path or heading (case-insensitive). */
export function filterTodos(groups: readonly TodoGroup[], needle: string): TodoGroup[] {
  const q = needle.trim().toLocaleLowerCase()
  if (!q) return [...groups]
  const out: TodoGroup[] = []
  for (const g of groups) {
    const whole = `${g.title}\n${g.path}`.toLocaleLowerCase().includes(q)
    const items = whole ? g.items : g.items.filter(i => `${i.text}\n${i.heading ?? ''}`.toLocaleLowerCase().includes(q))
    if (items.length) out.push({ ...g, items })
  }
  return out
}

/** A readable label for a checkbox's raw inline Markdown (shown as text, never rendered). */
export function todoLabel(text: string): string {
  return text.trim() || '(empty)'
}
