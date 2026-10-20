/**
 * Client for the read-only Git routes of Quartizo's backend (QTZ-010), reached
 * through the gateway proxy at /apps/quartizo/api/repos/... Wire shapes are
 * the ones in backend/gitrepo.py; see README "Git (read only)".
 *
 * The page never sends git arguments: only a repo id, a path and a mode.
 */
import type { AppApi } from '@kirocrew/app-sdk'
import { query } from './notesApi'
import { BACKEND_BASE } from './slots'

export interface Repo {
  id: number
  /** 32 random hex chars, unique per registration. */
  uid: string
  name: string
  path: string
}

export interface Head {
  oid: string | null
  /** null when detached. */
  branch: string | null
  detached: boolean
  /** No commit yet. */
  unborn: boolean
  upstream: string | null
  ahead: number | null
  behind: number | null
}

export type EntryKind = 'changed' | 'renamed' | 'copied' | 'unmerged' | 'untracked' | 'ignored'

export interface StatusEntry {
  path: string
  /** The source of a rename or copy. */
  origPath: string | null
  kind: EntryKind
  /** Porcelain v2 X (index) and Y (work tree) letters: '.', 'M', 'A', 'D', 'R', 'C', 'T', 'U', '?'. */
  index: string
  worktree: string
  staged: boolean
  unstaged: boolean
  submodule: boolean
  submoduleCommitChanged: boolean
  score: number | null
  /** False for names that are not UTF-8, untracked folders (`dir/`), or paths the API refuses. */
  diffable: boolean
}

export interface Counts {
  staged: number
  unstaged: number
  untracked: number
  conflicted: number
}

export interface RepoStatus {
  repo: Repo
  head: Head
  counts: Counts
  clean: boolean
  entries: StatusEntry[]
  truncated: boolean
}

export interface RepoInfo {
  repo: Repo
  head: Head
  counts: Counts
  clean: boolean
  gitDir: 'directory' | 'linked-worktree' | 'gitfile'
  shallow: boolean
}

export const DIFF_MODES = ['worktree', 'staged'] as const
export type DiffMode = (typeof DIFF_MODES)[number]

export interface FileDiff {
  path: string
  mode: DiffMode
  origPath: string | null
  diff: string
  binary: boolean
  truncated: boolean
  untracked: boolean
}

/** Same as backend gitrepo.MAX_DIFF_BYTES. */
export const MAX_DIFF_BYTES = 512 * 1024

function repoPath(id?: number, rest = ''): string {
  return `${BACKEND_BASE}/repos${id === undefined ? '' : `/${id}`}${rest}`
}

export async function listRepos(api: AppApi): Promise<Repo[]> {
  return (await api.get<{ repos: Repo[] }>(repoPath())).repos
}

export async function registerRepo(api: AppApi, path: string, name?: string): Promise<Repo> {
  return (await api.post<{ repo: Repo }>(repoPath(), name ? { path, name } : { path })).repo
}

/** Forgets the repo in Quartizo. Nothing on disk is touched. */
export async function removeRepo(api: AppApi, id: number): Promise<void> {
  await api.del(repoPath(id))
}

export function repoInfo(api: AppApi, id: number): Promise<RepoInfo> {
  return api.get<RepoInfo>(repoPath(id, '/info'))
}

export function repoStatus(api: AppApi, id: number): Promise<RepoStatus> {
  return api.get<RepoStatus>(repoPath(id, '/status'))
}

/** `orig` is sent only for a staged rename or copy (so git can pair the two paths). */
export function fileDiff(api: AppApi, id: number, path: string, mode: DiffMode, orig?: string | null): Promise<FileDiff> {
  return api.get<FileDiff>(
    repoPath(id, '/diff') + query({ path, mode, orig: mode === 'staged' && orig ? orig : undefined }),
  )
}

/** Client-side mirror of backend git_path (the backend still decides). */
export function isRepoPath(value: unknown): value is string {
  if (typeof value !== 'string' || !value || value.length > 1024) return false
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(value) || value.startsWith('/')) return false
  return value.split('/').every(seg => seg !== '' && seg !== '.' && seg !== '..' && seg.toLowerCase() !== '.git')
}

/** "main ↑2 ↓1", "detached at 1a2b3c4", "main (no commits yet)". */
export function describeHead(head: Head): string {
  let out: string
  if (head.detached) out = `detached at ${head.oid ? head.oid.slice(0, 7) : '?'}`
  else out = head.branch ?? '?'
  if (head.unborn) out += ' (no commits yet)'
  if (head.upstream) {
    const ab = [head.ahead ? `↑${head.ahead}` : '', head.behind ? `↓${head.behind}` : ''].filter(Boolean).join(' ')
    out += ` → ${head.upstream}${ab ? ` ${ab}` : ' (up to date)'}`
  }
  return out
}
