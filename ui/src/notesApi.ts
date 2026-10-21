/**
 * Client for the workspace and notes routes of Quartizo's backend (reached
 * through the gateway proxy at /apps/quartizo/api/...). Wire shapes are the
 * ones in backend/server.py and backend/notes.py; see README "Backend contract".
 */
import type { AppApi } from '@kirocrew/app-sdk'
import { BACKEND_BASE } from './slots'

export interface Workspace {
  id: number
  /** 32 random hex chars, unique per registration (ids are never reused either). */
  uid: string
  name: string
  path: string
  /** Kiro Notes companion mode: Quartizo only reads this folder (every note write is refused). */
  companion?: boolean
}

export interface NoteEntry {
  path: string
  size: number
  mtimeMs: number
  match?: 'name' | 'content'
  snippet?: string
}

export interface NoteList {
  files: NoteEntry[]
  truncated: boolean
}

export interface NoteMeta {
  path: string
  hash: string
  size: number
  mtimeMs: number
}

export interface Note extends NoteMeta {
  content: string
}

export interface ApiFailure {
  status?: number
  code?: string
  message: string
  /** On a 409 `conflict`: the hash now on disk, or null when the note was deleted. */
  currentHash?: string | null
}

function wsPath(wsId: number, action?: string): string {
  return `${BACKEND_BASE}/workspaces/${wsId}${action ? `/${action}` : ''}`
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

export async function registerWorkspace(api: AppApi, path: string, name?: string, companion = false): Promise<Workspace> {
  const body: Record<string, unknown> = name ? { path, name } : { path }
  if (companion) body.companion = true
  const res = await api.post<{ workspace: Workspace }>(`${BACKEND_BASE}/workspaces`, body)
  return res.workspace
}

export async function unregisterWorkspace(api: AppApi, wsId: number): Promise<void> {
  await api.del(wsPath(wsId))
}

export function listNotes(api: AppApi, wsId: number, q = '', content = false): Promise<NoteList> {
  return api.get<NoteList>(wsPath(wsId, 'notes') + query({ q: q.trim(), content: content && q.trim() ? '1' : undefined }))
}

export function readNote(api: AppApi, wsId: number, path: string): Promise<Note> {
  return api.get<Note>(wsPath(wsId, 'note') + query({ path }))
}

export function createNote(api: AppApi, wsId: number, path: string, content: string): Promise<NoteMeta> {
  return api.post<NoteMeta>(wsPath(wsId, 'note'), { path, content })
}

export function saveNote(api: AppApi, wsId: number, path: string, content: string, expectedHash: string): Promise<NoteMeta> {
  return api.put<NoteMeta>(wsPath(wsId, 'note'), { path, content, expectedHash })
}

export function renameNote(
  api: AppApi,
  wsId: number,
  from: string,
  to: string,
  opts: { expectedHash?: string; overwrite?: boolean } = {},
): Promise<{ path: string; trashed: string | null }> {
  // `confirm` is sent only together with `overwrite`, and only after the user
  // confirmed replacing the existing note in the UI.
  const body: Record<string, unknown> = { from, to }
  if (opts.expectedHash) body.expectedHash = opts.expectedHash
  if (opts.overwrite) Object.assign(body, { overwrite: true, confirm: true })
  return api.post(wsPath(wsId, 'rename'), body)
}

/** Call only after the user confirmed in the UI: the backend moves the note to `.trash`. */
export function deleteNote(api: AppApi, wsId: number, path: string, expectedHash?: string): Promise<{ trashed: string }> {
  return api.post(wsPath(wsId, 'delete'), expectedHash ? { path, confirm: true, expectedHash } : { path, confirm: true })
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
  const failure: ApiFailure = { status, code, message }
  if (code === 'conflict') {
    const h = parsed?.currentHash
    failure.currentHash = typeof h === 'string' ? h : null
  }
  return failure
}

/** Folder part of a note path ('' at the root). */
export function dirname(path: string): string {
  const i = path.lastIndexOf('/')
  return i < 0 ? '' : path.slice(0, i)
}

/**
 * Turn what the user typed into a note path, or explain why not. Mirrors the
 * backend's rules (backend/workspace.py validate_relpath + .md) so most
 * mistakes are caught before a round trip; the backend still decides.
 */
export function normalizeNotePath(input: string): { path: string } | { error: string } {
  let p = input.trim()
  if (!p) return { error: 'Enter a name.' }
  if (!p.endsWith('.md')) p += '.md'
  if (p.startsWith('/')) return { error: 'Use a path relative to the workspace.' }
  if (p.includes('\\')) return { error: 'Use "/" to separate folders.' }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(p)) return { error: 'Names cannot contain control characters.' }
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.' || seg === '..') return { error: 'Empty, "." and ".." folder names are not allowed.' }
    if (seg.startsWith('.')) return { error: 'Names cannot start with "." (hidden).' }
  }
  if (p === '.md' || p.endsWith('/.md')) return { error: 'Enter a name.' }
  return { path: p }
}
