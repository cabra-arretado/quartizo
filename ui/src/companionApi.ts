/**
 * Client for the Kiro Notes companion routes (backend/companion.py) and the
 * pure rules the read-only Board and TODOs views apply to their answers.
 *
 * Everything here reads. The only calls that change anything change
 * application state: the companion switch of a workspace and a request to
 * rescan its folder. No route writes a note, ticket property or checkbox.
 */
import type { AppApi } from '@kirocrew/app-sdk'
import { query, type Workspace } from './notesApi'
import { BACKEND_BASE } from './slots'
import { STATUS_LABELS, STATUSES, type TaskStatus } from './tasksApi'

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
  writes: false
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
  /** Ordinary notes with diagnostics. */
  notes: NoteItem[]
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
  counts: { open: number; done: number }
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
