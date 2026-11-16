/** The optional jump to the native Kiro Notes app. */
export const KIRO_NOTES_ROUTE = '/md-notebook'

export interface NoteLocation { workspaceId: number; path: string }

/** The note's name as Kiro Notes lists it: the file name without `.md`. */
export function noteName(path: string): string {
  return (path.split('/').pop() ?? path).replace(/\.md$/i, '')
}
