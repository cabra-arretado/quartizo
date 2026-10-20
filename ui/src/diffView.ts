/**
 * Unified diff text -> classified lines for the Git diff viewer (QTZ-010).
 *
 * Pure and DOM-free. The viewer renders each line's text as a React text node
 * (never HTML), so the classification only picks a style. Header lines are
 * recognised only outside a hunk: inside one, `+++ x` is an added line whose
 * text is `++ x`, and `--- x` a removed one.
 */

export type LineKind = 'file' | 'meta' | 'binary' | 'hunk' | 'add' | 'del' | 'context' | 'note'

export interface DiffLine {
  kind: LineKind
  text: string
  /** Line numbers in the old / new file (null outside hunks and in combined diffs). */
  oldNo: number | null
  newNo: number | null
}

const HUNK_RE = /^(@{2,}) (.*?) @{2,}/

export function parseDiff(text: string): DiffLine[] {
  const raw = text.split('\n')
  if (raw.length && raw[raw.length - 1] === '') raw.pop()
  const out: DiffLine[] = []
  // Inside a hunk: number of prefix columns (1, or more for a combined diff).
  let cols = 0
  let oldNo = 0
  let newNo = 0
  for (const line of raw) {
    if (line.startsWith('diff --git ') || line.startsWith('diff --cc ') || line.startsWith('diff --combined ')) {
      cols = 0
      out.push({ kind: 'file', text: line, oldNo: null, newNo: null })
      continue
    }
    const hunk = HUNK_RE.exec(line)
    // Inside a hunk every content line starts with ' ', '+', '-' or '\', so
    // a line starting with '@' is always the next hunk header.
    if (hunk) {
      cols = hunk[1].length - 1
      if (cols === 1) {
        const m = /^-(\d+)(?:,\d+)? \+(\d+)(?:,\d+)?$/.exec(hunk[2])
        oldNo = m ? Number(m[1]) : 0
        newNo = m ? Number(m[2]) : 0
      }
      out.push({ kind: 'hunk', text: line, oldNo: null, newNo: null })
      continue
    }
    if (cols === 0) {
      out.push({ kind: line.startsWith('Binary files ') ? 'binary' : 'meta', text: line, oldNo: null, newNo: null })
      continue
    }
    if (line.startsWith('\\')) {
      out.push({ kind: 'note', text: line, oldNo: null, newNo: null })
      continue
    }
    const prefix = line.slice(0, cols)
    const kind: LineKind = prefix.includes('-') ? 'del' : prefix.includes('+') ? 'add' : 'context'
    if (cols !== 1) {
      out.push({ kind, text: line, oldNo: null, newNo: null })
      continue
    }
    out.push({
      kind,
      text: line,
      oldNo: kind === 'add' ? null : oldNo,
      newNo: kind === 'del' ? null : newNo,
    })
    if (kind !== 'add') oldNo++
    if (kind !== 'del') newNo++
  }
  return out
}

export function diffStats(lines: DiffLine[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const l of lines) {
    if (l.kind === 'add') added++
    else if (l.kind === 'del') removed++
  }
  return { added, removed }
}

/**
 * Which lines to render for a fixed-height virtual list: the rows in view plus
 * `overscan` on each side, clamped to [0, total).
 */
export function visibleRange(
  scrollTop: number,
  viewportHeight: number,
  lineHeight: number,
  total: number,
  overscan = 30,
): { start: number; end: number } {
  if (total <= 0 || lineHeight <= 0) return { start: 0, end: 0 }
  const first = Math.floor(Math.max(0, scrollTop) / lineHeight)
  const count = Math.ceil(Math.max(0, viewportHeight) / lineHeight) + 1
  const start = Math.max(0, Math.min(first - overscan, total - 1))
  const end = Math.min(total, first + count + overscan)
  return { start, end: Math.max(start, end) }
}
