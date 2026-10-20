/**
 * A <textarea> normalizes line breaks: its `.value` always reads back with
 * "\n", whatever was assigned (HTML "API value"). CodeMirror 6 does the same
 * by default. So the editor works on LF text, and the file's own style is
 * restored on save. A file mixing styles (or using lone "\r") cannot be
 * restored exactly after editing, so the UI keeps it read-only.
 */
export type LineStyle = 'lf' | 'crlf' | 'mixed'

export function detectLineStyle(content: string): LineStyle {
  const crlf = (content.match(/\r\n/g) ?? []).length
  const cr = (content.match(/\r/g) ?? []).length
  const lf = (content.match(/\n/g) ?? []).length
  if (cr !== crlf) return 'mixed' // a lone "\r"
  if (crlf === 0) return 'lf'
  return crlf === lf ? 'crlf' : 'mixed'
}

/** Disk content -> editor text. */
export function toEditor(content: string): string {
  return content.replace(/\r\n/g, '\n')
}

/** Editor text -> disk content in the file's style. Never called for 'mixed'. */
export function fromEditor(text: string, style: LineStyle): string {
  const lf = text.replace(/\r\n?/g, '\n')
  return style === 'crlf' ? lf.replace(/\n/g, '\r\n') : lf
}
