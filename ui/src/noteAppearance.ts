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

export function headingColorCss(color: HeadingColor): string | undefined {
  if (color === 'theme') return undefined
  return color === 'accent' ? 'var(--qz-accent)' : color
}

export function linearColorChannel(value: number): number {
  const channel = value / 255
  return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
}

export function relativeLuminance(r: number, g: number, b: number): number {
  return .2126 * linearColorChannel(r) + .7152 * linearColorChannel(g) + .0722 * linearColorChannel(b)
}

export function accentForeground(color: HeadingColor): string | undefined {
  if (!color.startsWith('#')) return undefined
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return relativeLuminance(r, g, b) >= Math.sqrt(1.05 * .05) - .05 ? '#000' : '#fff'
}
