import { describe, expect, it } from 'vitest'
import { applyMove, dropIndex, groupColumns, isNoop, keyboardMove, locate, moveLabel } from '../src/board'
import { STATUS_LABELS, type Task, type TaskStatus } from '../src/tasksApi'

let nextId = 1
function task(title: string, status: TaskStatus, order: number): Task {
  const id = nextId++
  return {
    id, uid: title.padEnd(32, '0').slice(0, 32), project_id: 'p'.repeat(32), title, description_markdown: '',
    status, order, version: 1, note_ref: null, slot_id: null, created_at: 0, updated_at: 0,
  }
}

const A = task('a', 'backlog', 0)
const B = task('b', 'backlog', 1)
const C = task('c', 'backlog', 2)
const R = task('r', 'ready', 0)
const D = task('d', 'done', 0)
const ALL = [D, C, R, A, B] // deliberately unsorted

const titles = (tasks: Task[], s: TaskStatus) => groupColumns(tasks)[s].map(t => `${t.title}${t.order}`)

describe('groupColumns', () => {
  it('groups by status and sorts by order, then id', () => {
    const cols = groupColumns(ALL)
    expect(cols.backlog.map(t => t.title)).toEqual(['a', 'b', 'c'])
    expect(cols.ready.map(t => t.title)).toEqual(['r'])
    expect(cols.in_progress).toEqual([])
    expect(cols.review).toEqual([])
    expect(cols.done.map(t => t.title)).toEqual(['d'])
    const tie = [task('y', 'review', 0), task('x', 'review', 0)]
    expect(groupColumns(tie).review.map(t => t.title)).toEqual(['y', 'x'])
  })

  it('ignores an unknown status instead of inventing a column', () => {
    const odd = { ...task('z', 'backlog', 0), status: 'running' as TaskStatus }
    expect(Object.values(groupColumns([odd])).flat()).toEqual([])
  })
})

describe('applyMove (mirrors the backend reindex)', () => {
  it('reorders within a column with dense orders', () => {
    const after = applyMove(ALL, C.uid, { status: 'backlog', index: 0 })
    expect(titles(after, 'backlog')).toEqual(['c0', 'a1', 'b2'])
    expect(titles(applyMove(ALL, A.uid, { status: 'backlog', index: 99 }), 'backlog')).toEqual(['b0', 'c1', 'a2'])
  })

  it('moves across columns and reindexes both', () => {
    const after = applyMove(ALL, A.uid, { status: 'ready', index: 0 })
    expect(titles(after, 'backlog')).toEqual(['b0', 'c1'])
    expect(titles(after, 'ready')).toEqual(['a0', 'r1'])
    expect(after.find(t => t.uid === A.uid)?.status).toBe('ready')
    expect(after).toHaveLength(ALL.length)
  })

  it('does not mutate its input and leaves untouched cards as the same objects', () => {
    const copy = JSON.parse(JSON.stringify(ALL))
    const after = applyMove(ALL, B.uid, { status: 'done', index: 1 })
    expect(ALL).toEqual(copy)
    expect(after.find(t => t.uid === R.uid)).toBe(R)
    expect(titles(after, 'done')).toEqual(['d0', 'b1'])
  })

  it('only touches status and order (never slot_id or anything else)', () => {
    const linked = { ...A, slot_id: 'quartizo-abc-abc123', note_ref: 'n.md' }
    const moved = applyMove([linked, B], A.uid, { status: 'in_progress', index: 0 }).find(t => t.uid === A.uid)!
    expect({ ...moved, status: linked.status, order: linked.order }).toEqual(linked)
  })

  it('is a no-op copy for an unknown card', () => {
    expect(applyMove(ALL, 'nope', { status: 'done', index: 0 })).toEqual(ALL)
  })
})

describe('isNoop / locate', () => {
  it('detects moves that change nothing', () => {
    const cols = groupColumns(ALL)
    expect(locate(cols, B.uid)).toEqual({ status: 'backlog', index: 1 })
    expect(locate(cols, 'nope')).toBeNull()
    expect(isNoop(cols, B.uid, { status: 'backlog', index: 1 })).toBe(true)
    expect(isNoop(cols, C.uid, { status: 'backlog', index: 50 })).toBe(true) // clamped to its own slot
    expect(isNoop(cols, B.uid, { status: 'backlog', index: 0 })).toBe(false)
    expect(isNoop(cols, B.uid, { status: 'ready', index: 1 })).toBe(false)
  })
})

describe('keyboard moves', () => {
  const cols = groupColumns(ALL)

  it('up/down reorder inside the column and stop at the ends', () => {
    expect(keyboardMove(cols, B.uid, 'up')).toEqual({ status: 'backlog', index: 0 })
    expect(keyboardMove(cols, B.uid, 'down')).toEqual({ status: 'backlog', index: 2 })
    expect(keyboardMove(cols, A.uid, 'up')).toBeNull()
    expect(keyboardMove(cols, C.uid, 'down')).toBeNull()
  })

  it('left/right go to the neighbouring column at the same index, clamped', () => {
    expect(keyboardMove(cols, A.uid, 'left')).toBeNull()
    expect(keyboardMove(cols, A.uid, 'right')).toEqual({ status: 'ready', index: 0 })
    expect(keyboardMove(cols, C.uid, 'right')).toEqual({ status: 'ready', index: 1 }) // ready has 1 card
    expect(keyboardMove(cols, R.uid, 'right')).toEqual({ status: 'in_progress', index: 0 })
    expect(keyboardMove(cols, D.uid, 'right')).toBeNull()
    expect(keyboardMove(cols, D.uid, 'left')).toEqual({ status: 'review', index: 0 })
    expect(keyboardMove(cols, 'nope', 'left')).toBeNull()
  })

  it('a keyboard move applied gives the expected board', () => {
    const target = keyboardMove(cols, C.uid, 'right')!
    const after = applyMove(ALL, C.uid, target)
    expect(titles(after, 'ready')).toEqual(['r0', 'c1'])
    expect(titles(after, 'backlog')).toEqual(['a0', 'b1'])
  })

  it('labels say where the card goes, and nothing when it cannot move', () => {
    expect(moveLabel(cols, A, 'right', STATUS_LABELS)).toBe('Move “a” to Ready')
    expect(moveLabel(cols, B, 'down', STATUS_LABELS)).toBe('Move “b” down to position 3 in Backlog')
    expect(moveLabel(cols, A, 'left', STATUS_LABELS)).toBeNull()
    expect(moveLabel(cols, A, 'up', STATUS_LABELS)).toBeNull()
  })
})

describe('dropIndex', () => {
  it('counts card midpoints above the pointer', () => {
    expect(dropIndex(5, [])).toBe(0)
    expect(dropIndex(5, [10, 30, 50])).toBe(0)
    expect(dropIndex(20, [10, 30, 50])).toBe(1)
    expect(dropIndex(30, [10, 30, 50])).toBe(1)
    expect(dropIndex(99, [10, 30, 50])).toBe(3)
  })
})
