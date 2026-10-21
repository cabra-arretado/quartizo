/**
 * Opening a note: native Kiro Notes can only be opened on its own page (its
 * notes are buttons and the URL stays /md-notebook; verified on kirocrew
 * 0.10.0rc4, docs/markdown-tickets-phase1.md#native-notes-verification), so
 * the views navigate there and offer the note's name to copy.
 */
export const KIRO_NOTES_ROUTE = '/md-notebook'

/** The note's name as Kiro Notes lists it: the file name without `.md`. */
export function noteName(path: string): string {
  return (path.split('/').pop() ?? path).replace(/\.md$/i, '')
}
