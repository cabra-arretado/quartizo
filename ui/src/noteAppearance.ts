import { storage } from './ui'

const APPEARANCE_KEY = 'quartizo-notes-appearance'

export type HeadingColor = 'theme' | 'accent' | `#${string}`
export type HeadingLines = 'theme' | 'all' | 'none'

export interface NoteAppearance {
  headingColor: HeadingColor
  headingLines: HeadingLines
  lineColor: HeadingColor
}

export const DEFAULT_NOTE_APPEARANCE: NoteAppearance = {
  headingColor: 'theme',
  headingLines: 'theme',
  lineColor: 'theme',
}

export function headingColor(value: unknown): HeadingColor {
  if (value === 'accent') return 'accent'
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value as HeadingColor : 'theme'
}

export function headingLines(value: unknown): HeadingLines {
  return value === 'all' || value === 'none' ? value : 'theme'
}

export function loadNoteAppearance(): NoteAppearance {
  try {
    const raw = storage()?.getItem(APPEARANCE_KEY)
    if (!raw) return DEFAULT_NOTE_APPEARANCE
    const value = JSON.parse(raw)
    return {
      headingColor: headingColor(value?.headingColor),
      headingLines: headingLines(value?.headingLines),
      lineColor: headingColor(value?.lineColor),
    }
  } catch {
    return DEFAULT_NOTE_APPEARANCE
  }
}

export function saveNoteAppearance(appearance: NoteAppearance) {
  try { storage()?.setItem(APPEARANCE_KEY, JSON.stringify(appearance)) } catch { /* Storage can be unavailable. */ }
}

export function headingColorCss(color: HeadingColor): string | undefined {
  if (color === 'theme') return undefined
  return color === 'accent' ? 'var(--qz-accent)' : color
}
