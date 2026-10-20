import { describe, expect, it } from 'vitest'
import type { StatusEntry } from '../src/gitApi'
import { diffModes, entryBadge, entryKey, listKey, pickMode, reselect } from '../src/gitList'

function entry(over: Partial<StatusEntry>): StatusEntry {
  return {
    path: 'a.txt', origPath: null, kind: 'changed', index: '.', worktree: 'M', staged: false, unstaged: true,
    submodule: false, submoduleCommitChanged: false, score: null, diffable: true, ...over,
  }
}

describe('entries', () => {
  it('badges', () => {
    expect(entryBadge(entry({}))).toEqual({ letter: 'M', title: 'modified in work tree' })
    expect(entryBadge(entry({ index: 'A', staged: true, worktree: 'M' }))).toEqual({ letter: 'A', title: 'added in index, modified in work tree' })
    expect(entryBadge(entry({ kind: 'renamed', index: 'R', staged: true, worktree: '.', unstaged: false })).letter).toBe('R')
    expect(entryBadge(entry({ kind: 'untracked', index: '?', worktree: '?' }))).toEqual({ letter: '?', title: 'untracked' })
    expect(entryBadge(entry({ kind: 'unmerged', index: 'U', worktree: 'U', staged: true })).letter).toBe('U')
    expect(entryBadge(entry({ submodule: true, submoduleCommitChanged: true })).title).toContain('submodule commit changed')
  })

  it('diff modes per entry', () => {
    expect(diffModes(entry({}))).toEqual(['worktree'])
    expect(diffModes(entry({ staged: true, index: 'M' }))).toEqual(['worktree', 'staged'])
    expect(diffModes(entry({ staged: true, index: 'M', unstaged: false, worktree: '.' }))).toEqual(['staged'])
    expect(diffModes(entry({ kind: 'untracked', index: '?', worktree: '?' }))).toEqual(['worktree'])
    expect(diffModes(entry({ diffable: false }))).toEqual([])
    expect(pickMode(entry({ staged: true, index: 'M' }), 'staged')).toBe('staged')
    expect(pickMode(entry({}), 'staged')).toBe('worktree')
    expect(pickMode(entry({ diffable: false }), 'worktree')).toBeNull()
  })

  it('keys and reselection after a reload', () => {
    const list = [entry({ path: 'a' }), entry({ path: 'b2', origPath: 'b' }), entry({ path: 'c' })]
    expect(entryKey(list[1])).not.toBe(entryKey(entry({ path: 'b2' })))
    expect(reselect(list, entryKey(list[2]), 0)).toBe(2)
    expect(reselect(list, 'gone', 1)).toBe(1)
    expect(reselect(list, 'gone', 9)).toBe(2)
    expect(reselect(list, null, -1)).toBe(0)
    expect(reselect([], 'a', 3)).toBe(-1)
  })
})

describe('listKey (changed-files keyboard navigation)', () => {
  it('moves the selection', () => {
    expect(listKey(-1, 'ArrowDown', 3)).toEqual({ type: 'select', index: 0 })
    expect(listKey(0, 'ArrowDown', 3)).toEqual({ type: 'select', index: 1 })
    expect(listKey(2, 'ArrowDown', 3)).toEqual({ type: 'select', index: 2 })
    expect(listKey(1, 'ArrowUp', 3)).toEqual({ type: 'select', index: 0 })
    expect(listKey(1, 'Home', 3)).toEqual({ type: 'select', index: 0 })
    expect(listKey(0, 'End', 3)).toEqual({ type: 'select', index: 2 })
    expect(listKey(0, 'PageDown', 50)).toEqual({ type: 'select', index: 10 })
  })

  it('Enter/Space open the diff, s toggles the mode, other keys are ignored', () => {
    expect(listKey(1, 'Enter', 3)).toEqual({ type: 'open', index: 1 })
    expect(listKey(1, ' ', 3)).toEqual({ type: 'open', index: 1 })
    expect(listKey(-1, 'Enter', 3)).toBeNull()
    expect(listKey(5, 'Enter', 3)).toBeNull()
    expect(listKey(0, 's', 3)).toEqual({ type: 'mode' })
    expect(listKey(0, 's', 0)).toBeNull()
    expect(listKey(0, 'x', 3)).toBeNull()
    expect(listKey(0, 'ArrowDown', 0)).toBeNull()
  })
})
