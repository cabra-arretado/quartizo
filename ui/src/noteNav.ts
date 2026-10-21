/**
 * The replaceable note-navigation adapter (docs/markdown-tickets-plan.md,
 * "Replaceable note navigation"). Board and TODOs emit one open-note request
 * with the source reference; the adapter decides what the available editor
 * can do with it.
 *
 * Release 1 targets native Kiro Notes. Verified on kirocrew 0.10.0rc4
 * (docs/markdown-tickets-phase1.md#native-notes-verification): navigating to
 * the Notes app route works; selecting a note or line does not (its notes are
 * buttons, the URL stays /md-notebook). So the adapter promises app-level
 * navigation only and the views always show the source path, heading and line
 * for the user to find the note there.
 */
export const KIRO_NOTES_ROUTE = '/md-notebook'

export interface NavCapabilities {
  /** Open the editor app. */
  app: boolean
  /** Open this exact note. */
  note: boolean
  /** Put the cursor on the source line/checkbox. */
  line: boolean
}

export const KIRO_NOTES: NavCapabilities = { app: true, note: false, line: false }

export interface NoteRef {
  workspaceId: number
  workspaceName: string
  /** Relative to the workspace root, as indexed. */
  path: string
  title?: string
  heading?: string | null
  line?: number
  column?: number
}

export interface OpenResult {
  /** What happened, said plainly; shown next to the action. */
  message: string
  exact: boolean
}

/** The one place Board and TODOs open a note. */
export function openInKiroNotes(navigate: (path: string) => void, ref: NoteRef, caps: NavCapabilities = KIRO_NOTES): OpenResult {
  navigate(KIRO_NOTES_ROUTE)
  return caps.note
    ? { message: `Opened ${ref.path} in Kiro Notes.`, exact: true }
    : { message: `Opened Kiro Notes. Select ${ref.path} there (Kiro Notes cannot be told which note to open).`, exact: false }
}

/** The note's name as Kiro Notes lists it: the file name without `.md`. */
export function noteName(path: string): string {
  return (path.split('/').pop() ?? path).replace(/\.md$/i, '')
}

/** "Workspace › folder/note.md · line 12, column 3 · under “Heading”". */
export function describeSource(ref: NoteRef): string {
  const parts = [`${ref.workspaceName} › ${ref.path}`]
  if (ref.line !== undefined) parts.push(ref.column !== undefined ? `line ${ref.line}, column ${ref.column}` : `line ${ref.line}`)
  if (ref.heading) parts.push(`under “${ref.heading}”`)
  return parts.join(' · ')
}
