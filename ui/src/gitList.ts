/**
 * The changed-files list of the Git tab: labels, which diffs an entry has,
 * and keyboard handling. Pure (no React, no DOM).
 */
import type { DiffMode, StatusEntry } from './gitApi'
import { nextIndex } from './listNav'

const LETTERS: Record<string, string> = {
  M: 'modified',
  A: 'added',
  D: 'deleted',
  R: 'renamed',
  C: 'copied',
  T: 'type changed',
  U: 'unmerged',
}

/** One badge letter for the list, and a spoken description for its title/aria-label. */
export function entryBadge(e: StatusEntry): { letter: string; title: string } {
  if (e.kind === 'untracked') return { letter: '?', title: 'untracked' }
  if (e.kind === 'ignored') return { letter: '!', title: 'ignored' }
  if (e.kind === 'unmerged') return { letter: 'U', title: `conflict (${e.index}${e.worktree})` }
  const parts: string[] = []
  if (e.staged) parts.push(`${LETTERS[e.index] ?? e.index} in index`)
  if (e.unstaged) parts.push(`${LETTERS[e.worktree] ?? e.worktree} in work tree`)
  if (e.submodule) parts.push(e.submoduleCommitChanged ? 'submodule commit changed' : 'submodule')
  const letter = e.staged && e.index !== '.' ? e.index : e.worktree
  return { letter, title: parts.join(', ') || 'changed' }
}

/** The diffs an entry has: unstaged (work tree vs index) and/or staged (index vs HEAD). */
export function diffModes(e: StatusEntry): DiffMode[] {
  if (!e.diffable) return []
  if (e.kind === 'untracked') return ['worktree']
  const modes: DiffMode[] = []
  if (e.unstaged) modes.push('worktree')
  if (e.staged) modes.push('staged')
  return modes
}

/** Keep the mode the user picked when the new entry has it, else its first one. */
export function pickMode(e: StatusEntry, preferred: DiffMode): DiffMode | null {
  const modes = diffModes(e)
  if (modes.includes(preferred)) return preferred
  return modes[0] ?? null
}

export const MODE_LABELS: Record<DiffMode, string> = { worktree: 'Unstaged', staged: 'Staged' }

/** Stable key for an entry across reloads (a rename keys by both paths). */
export function entryKey(e: Pick<StatusEntry, 'path' | 'origPath'>): string {
  return e.origPath ? `${e.origPath}\u0000${e.path}` : e.path
}

export type ListAction =
  | { type: 'select'; index: number }
  | { type: 'open'; index: number }
  | { type: 'mode' }

/**
 * Key handling for the changed-files listbox. Moving selects (and the tab
 * shows that file's diff), Enter / Space move focus to the diff, `s` toggles
 * Unstaged / Staged. Returns null for keys the list does not handle.
 */
export function listKey(active: number, key: string, length: number): ListAction | null {
  if (key === 'Enter' || key === ' ') return active >= 0 && active < length ? { type: 'open', index: active } : null
  if (key === 's' || key === 'S') return length > 0 ? { type: 'mode' } : null
  const next = nextIndex(active, key, length)
  return next === null ? null : { type: 'select', index: next }
}

/** Where the selection goes after a reload: the same entry if it is still there, else the same row. */
export function reselect(entries: StatusEntry[], key: string | null, previousIndex: number): number {
  if (!entries.length) return -1
  if (key !== null) {
    const i = entries.findIndex(e => entryKey(e) === key)
    if (i >= 0) return i
  }
  return Math.min(Math.max(previousIndex, 0), entries.length - 1)
}
