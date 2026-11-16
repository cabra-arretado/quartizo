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
