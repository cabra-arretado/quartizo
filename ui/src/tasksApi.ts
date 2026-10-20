/**
 * Client for the task routes of Quartizo's backend (QTZ-008), reached through
 * the gateway proxy at /apps/quartizo/api/workspaces/{id}/tasks. Wire shapes
 * are the ones in backend/tasks.py; see README "Tasks (projects)".
 *
 * One project is one workspace (`project_id` is the workspace uid).
 */
import type { AppApi } from '@kirocrew/app-sdk'
import { type ApiFailure, normalizeNotePath, toFailure } from './notesApi'
import { BACKEND_BASE, isSlotName, slotWorkspaceUid } from './slots'

export const STATUSES = ['backlog', 'ready', 'in_progress', 'review', 'done'] as const
export type TaskStatus = (typeof STATUSES)[number]

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  ready: 'Ready',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

export const TITLE_MAX_CHARS = 200
export const DESCRIPTION_MAX_BYTES = 64 * 1024
export const IMPORT_MAX_BYTES = 4 * 1024 * 1024

export interface Task {
  id: number
  uid: string
  project_id: string
  title: string
  description_markdown: string
  /** Human-assigned column. Never derived from the agent session's runtime state. */
  status: TaskStatus
  order: number
  version: number
  note_ref: string | null
  slot_id: string | null
  created_at: number
  updated_at: number
}

export interface Board {
  project: { id: string; workspaceId: number; name: string }
  statuses: string[]
  tasks: Task[]
}

export interface TaskFailure extends ApiFailure {
  /** On 409 `stale`: the task as it is now. */
  current?: Task
  /** On 409 `project_not_empty` / `project_has_tasks`. */
  taskCount?: number
}

export type TaskEdit = Partial<Pick<Task, 'title' | 'description_markdown' | 'note_ref' | 'slot_id'>>

function tasksPath(wsId: number, rest = ''): string {
  return `${BACKEND_BASE}/workspaces/${wsId}/tasks${rest}`
}

export function listTasks(api: AppApi, wsId: number): Promise<Board> {
  return api.get<Board>(tasksPath(wsId))
}

export async function createTask(
  api: AppApi,
  wsId: number,
  fields: { title: string; status?: TaskStatus } & TaskEdit,
): Promise<Task> {
  return (await api.post<{ task: Task }>(tasksPath(wsId), fields)).task
}

export async function updateTask(api: AppApi, wsId: number, task: Pick<Task, 'id' | 'version'>, edit: TaskEdit): Promise<Task> {
  return (await api.patch<{ task: Task }>(tasksPath(wsId, `/${task.id}`), { ...edit, expectedVersion: task.version })).task
}

/** The ONLY call a card move makes. It changes status/order and nothing else (no chat, no agent). */
export function moveTask(
  api: AppApi,
  wsId: number,
  task: Pick<Task, 'id' | 'version'>,
  status: TaskStatus,
  index: number,
): Promise<{ task: Task; moved: boolean; tasks: Task[] }> {
  return api.post(tasksPath(wsId, `/${task.id}/move`), { expectedVersion: task.version, status, index })
}

/** Call only after the user confirmed in the UI. */
export function deleteTask(api: AppApi, wsId: number, task: Pick<Task, 'id' | 'version'>): Promise<{ ok: true }> {
  return api.post(tasksPath(wsId, `/${task.id}/delete`), { expectedVersion: task.version, confirm: true })
}

export function exportTasks(api: AppApi, wsId: number): Promise<unknown> {
  return api.get(tasksPath(wsId, '/export'))
}

/** `replace` sends `confirm: true` with it: call with replace only after the user confirmed. */
export function importTasks(
  api: AppApi,
  wsId: number,
  data: unknown,
  opts: { replace?: boolean; newUids?: boolean } = {},
): Promise<{ imported: number; replaced: number; tasks: Task[] }> {
  const body: Record<string, unknown> = { data }
  if (opts.replace) Object.assign(body, { replace: true, confirm: true })
  if (opts.newUids) body.newUids = true
  return api.post(tasksPath(wsId, '/import'), body)
}

/** Remove a workspace; `deleteTasks` only after the user confirmed losing its tasks. */
export async function removeWorkspace(api: AppApi, wsId: number, deleteTasks = false): Promise<void> {
  await api.del(`${BACKEND_BASE}/workspaces/${wsId}${deleteTasks ? '?deleteTasks=1' : ''}`)
}

export function toTaskFailure(err: unknown): TaskFailure {
  const failure: TaskFailure = toFailure(err)
  const body = (err as { body?: unknown } | null)?.body
  if (typeof body !== 'string') return failure
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>
    if (failure.code === 'stale' && parsed.task && typeof parsed.task === 'object') failure.current = parsed.task as Task
    if (typeof parsed.taskCount === 'number') failure.taskCount = parsed.taskCount
  } catch {
    /* not JSON */
  }
  return failure
}

/** Client-side mirror of backend validate_title (the backend still decides). */
export function checkTitle(input: string): { title: string } | { error: string } {
  const title = input.trim()
  if (!title) return { error: 'Enter a title.' }
  if (Array.from(title).length > TITLE_MAX_CHARS) return { error: `Titles are limited to ${TITLE_MAX_CHARS} characters.` }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/.test(title)) return { error: 'Titles are one line without control characters.' }
  if (/[\u202a-\u202e\u2066-\u2069]/.test(title)) return { error: 'Titles cannot contain bidirectional control characters.' }
  return { title }
}

export function descriptionTooLarge(text: string): boolean {
  return new TextEncoder().encode(text).length > DESCRIPTION_MAX_BYTES
}

/** A note path usable as `note_ref`: exactly what the notes API accepts, without adding `.md`. */
export function isNoteRef(value: unknown): value is string {
  if (typeof value !== 'string' || !value.endsWith('.md')) return false
  const parsed = normalizeNotePath(value)
  return 'path' in parsed && parsed.path === value
}

/** A `slot_id` this project may link: a Quartizo name, and if a workspace session, this one's. */
export function isLinkableSlot(value: unknown, projectUid: string): value is string {
  if (!isSlotName(value)) return false
  const owner = slotWorkspaceUid(value)
  return owner === null || owner === projectUid
}
