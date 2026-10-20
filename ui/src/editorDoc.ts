/**
 * State of the note open in the editor, as pure functions so the conflict
 * rules are testable: a save always sends the hash of what was last read or
 * saved, a 409 never changes that hash on its own, and only an explicit user
 * choice (reload, or overwrite with mine) resolves a conflict.
 */
import { detectLineStyle, fromEditor, type LineStyle, toEditor } from './lineEndings'
import type { Note, NoteMeta } from './notesApi'

export interface EditorDoc {
  path: string
  /** Exact content on disk as last read or saved. */
  disk: string
  /** Hash of `disk`; null when the note no longer exists (a save re-creates it). */
  hash: string | null
  style: LineStyle
  /** Editor text (LF line breaks). */
  text: string
  conflict: null | { currentHash: string | null }
}

export function openDoc(note: Note): EditorDoc {
  return {
    path: note.path,
    disk: note.content,
    hash: note.hash,
    style: detectLineStyle(note.content),
    text: toEditor(note.content),
    conflict: null,
  }
}

/** Mixed line endings cannot survive a textarea round trip: view only. */
export function canEdit(doc: EditorDoc): boolean {
  return doc.style !== 'mixed'
}

export function editText(doc: EditorDoc, text: string): EditorDoc {
  return canEdit(doc) ? { ...doc, text } : doc
}

/** What a save would write. */
export function contentToSave(doc: EditorDoc): string {
  return fromEditor(doc.text, doc.style)
}

export function isDirty(doc: EditorDoc): boolean {
  return doc.hash === null || (canEdit(doc) && contentToSave(doc) !== doc.disk)
}

/** A save of `content` succeeded; the user may have kept typing meanwhile. */
export function saved(doc: EditorDoc, content: string, meta: NoteMeta): EditorDoc {
  return { ...doc, disk: content, hash: meta.hash, conflict: null }
}

/** The backend answered 409 conflict. The expected hash is NOT updated. */
export function conflicted(doc: EditorDoc, currentHash: string | null): EditorDoc {
  return { ...doc, conflict: { currentHash } }
}

/** "Keep editing": hide the notice; the next save conflicts again. */
export function dismissConflict(doc: EditorDoc): EditorDoc {
  return { ...doc, conflict: null }
}

/**
 * "Overwrite with my version": an explicit user decision to replace what is
 * on disk now (or to re-create a deleted note). Only this moves the expected
 * hash to the disk's current one.
 */
export function acceptOverwrite(doc: EditorDoc): EditorDoc {
  if (!doc.conflict) return doc
  return { ...doc, hash: doc.conflict.currentHash, conflict: null }
}
