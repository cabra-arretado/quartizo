/**
 * Kanban board ordering (QTZ-009), as pure functions.
 *
 * The backend is authoritative: a move is sent as (status, index in the target
 * column without the moved card) and the server reindexes. `applyMove` mirrors
 * that exactly, so the board can update optimistically and agree with the
 * server's answer.
 */
import { STATUSES, type Task, type TaskStatus } from './tasksApi'

export type Columns = Record<TaskStatus, Task[]>

/** Tasks per column, each sorted by `order` (then id, like the backend). */
export function groupColumns(tasks: readonly Task[]): Columns {
  const cols = Object.fromEntries(STATUSES.map(s => [s, [] as Task[]])) as Columns
  for (const t of tasks) if (t.status in cols) cols[t.status].push(t)
  for (const s of STATUSES) cols[s].sort((a, b) => a.order - b.order || a.id - b.id)
  return cols
}

export interface MoveTarget {
  status: TaskStatus
  /** Position in the target column once the moved card is taken out of it. */
  index: number
}

/** Where a card is now, as a MoveTarget (null if unknown). */
export function locate(cols: Columns, uid: string): MoveTarget | null {
  for (const s of STATUSES) {
    const i = cols[s].findIndex(t => t.uid === uid)
    if (i >= 0) return { status: s, index: i }
  }
  return null
}

/** True when moving to `target` would change nothing (same column, same slot). */
export function isNoop(cols: Columns, uid: string, target: MoveTarget): boolean {
  const at = locate(cols, uid)
  if (!at || at.status !== target.status) return false
  return Math.min(target.index, cols[target.status].length - 1) === at.index
}

/** The board after a move, with dense 0..n-1 orders in the touched columns (same rule as the backend). */
export function applyMove(tasks: readonly Task[], uid: string, target: MoveTarget): Task[] {
  const cols = groupColumns(tasks)
  const at = locate(cols, uid)
  if (!at) return [...tasks]
  const moving = cols[at.status][at.index]
  cols[at.status] = cols[at.status].filter(t => t.uid !== uid)
  const dest = at.status === target.status ? cols[at.status] : [...cols[target.status]]
  const index = Math.max(0, Math.min(target.index, dest.length))
  dest.splice(index, 0, { ...moving, status: target.status })
  cols[target.status] = dest
  return STATUSES.flatMap(s => cols[s].map((t, i) => (t.order === i && t.status === s ? t : { ...t, order: i })))
}

export type Direction = 'left' | 'right' | 'up' | 'down'

/** Keyboard move: left/right go to the neighbouring column (same index, clamped), up/down reorder. */
export function keyboardMove(cols: Columns, uid: string, dir: Direction): MoveTarget | null {
  const at = locate(cols, uid)
  if (!at) return null
  const col = STATUSES.indexOf(at.status)
  switch (dir) {
    case 'up':
      return at.index > 0 ? { status: at.status, index: at.index - 1 } : null
    case 'down':
      return at.index < cols[at.status].length - 1 ? { status: at.status, index: at.index + 1 } : null
    case 'left':
    case 'right': {
      const next = col + (dir === 'left' ? -1 : 1)
      if (next < 0 || next >= STATUSES.length) return null
      const status = STATUSES[next]
      return { status, index: Math.min(at.index, cols[status].length) }
    }
  }
}

/**
 * Drop index from the pointer's y and the card midpoints of the target column
 * (in order, the dragged card's own rect excluded): the number of cards whose
 * midpoint is above the pointer.
 */
export function dropIndex(clientY: number, midpoints: readonly number[]): number {
  let i = 0
  while (i < midpoints.length && clientY > midpoints[i]) i++
  return i
}

/** Accessible label for a keyboard move button, or null when the move is not possible. */
export function moveLabel(cols: Columns, task: Task, dir: Direction, labels: Record<TaskStatus, string>): string | null {
  const target = keyboardMove(cols, task.uid, dir)
  if (!target) return null
  if (dir === 'up' || dir === 'down') return `Move “${task.title}” ${dir} to position ${target.index + 1} in ${labels[target.status]}`
  return `Move “${task.title}” to ${labels[target.status]}`
}
