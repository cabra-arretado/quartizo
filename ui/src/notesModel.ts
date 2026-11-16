import type { NoteEntry, SourceNote } from './companionApi'

export interface NoteTree {
  folders: Map<string, NoteTree>
  notes: NoteEntry[]
}

export function makeNoteTree(notes: readonly NoteEntry[]): NoteTree {
  const root: NoteTree = { folders: new Map(), notes: [] }
  for (const note of notes) {
    let parent = root
    for (const name of note.path.split('/').slice(0, -1)) {
      let folder = parent.folders.get(name)
      if (!folder) {
        folder = { folders: new Map(), notes: [] }
        parent.folders.set(name, folder)
      }
      parent = folder
    }
    parent.notes.push(note)
  }
  return root
}

export interface NoteDocument {
  source: SourceNote
  text: string
  bom: string
  lineEnding: '\n' | '\r\n' | 'mixed'
  conflict?: boolean
}

/** A textarea normalizes newlines. Preserve the file's uniform style and BOM on save. */
export function openDocument(source: SourceNote): NoteDocument {
  const bom = source.content.startsWith('\ufeff') ? '\ufeff' : ''
  const body = source.content.slice(bom.length)
  const other = body.replace(/\r\n/g, '')
  const hasCrlf = other.length !== body.length
  const lineEnding = other.includes('\r') || (hasCrlf && other.includes('\n')) ? 'mixed' : hasCrlf ? '\r\n' : '\n'
  return { source, text: body.replace(/\r\n?/g, '\n'), bom, lineEnding }
}

export function documentContent(doc: NoteDocument): string {
  if (doc.lineEnding === 'mixed') return doc.source.content
  return doc.bom + (doc.lineEnding === '\r\n' ? doc.text.replace(/\n/g, '\r\n') : doc.text)
}

/** Map a nonempty range of normalized source lines to its content, excluding the final newline. */
export function noteBlockOffsets(text: string, start: number, end: number): { from: number; to: number } | null {
  const lines = text.split('\n')
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start || end > lines.length) return null
  let from = 0
  for (let line = 0; line < start; line++) from += lines[line].length + 1
  let to = from + lines[start].length
  for (let line = start + 1; line < end; line++) to += 1 + lines[line].length
  return { from, to }
}

/** Change only the marker of a task on the specified normalized source line. */
export function setNoteTaskChecked(text: string, line: number, checked: boolean): string {
  const offsets = noteBlockOffsets(text, line, line + 1)
  if (!offsets) return text
  const match = /^([ \t]*- \[)( |x)(\] )/.exec(text.slice(offsets.from, offsets.to))
  if (!match) return text
  const marker = offsets.from + match[1].length
  return text.slice(0, marker) + (checked ? 'x' : ' ') + text.slice(marker + 1)
}
