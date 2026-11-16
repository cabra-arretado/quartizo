import type { MarkdownIt } from 'markdown-it/browser'
import type { NoteEntry } from './companionApi'

export type WikilinkResolver = (target: string) => NoteEntry | null

export function makeWikilinkResolver(notes: readonly NoteEntry[]): WikilinkResolver {
  const paths = new Map<string, NoteEntry | null>()
  const stems = new Map<string, NoteEntry | null>()
  const titles = new Map<string, NoteEntry | null>()
  const add = (index: Map<string, NoteEntry | null>, name: string, note: NoteEntry) => {
    const key = name.toLowerCase()
    const previous = index.get(key)
    index.set(key, previous === undefined || previous?.path === note.path ? note : null)
  }
  for (const note of notes) {
    const path = note.path.replace(/\.md$/i, '')
    add(paths, path, note)
    add(stems, path.slice(path.lastIndexOf('/') + 1), note)
    add(titles, note.title.trim(), note)
  }
  return target => {
    const text = target.trim()
    const explicit = text.includes('/') || /\.md$/i.test(text)
    const key = text.replace(/^\//, '').replace(/\.md$/i, '').toLowerCase()
    if (!key || key.split('/').some(segment => !segment || segment === '.' || segment === '..')) return null
    if (explicit) return paths.get(key) ?? null
    const title = titles.get(key)
    return title === undefined ? stems.get(key) ?? null : title
  }
}

const WIKILINK = /^\[\[([^\[\]\r\n]{1,256})\]\]/

export function installWikilinks(markdown: MarkdownIt): void {
  markdown.inline.ruler.after('image', 'wikilink', (state, silent) => {
    if (silent || state.linkLevel || !state.src.startsWith('[[', state.pos)) return false
    const match = WIKILINK.exec(state.src.slice(state.pos, Math.min(state.posMax, state.pos + 260)))
    if (!match) return false
    const separator = match[1].indexOf('|')
    const target = (separator < 0 ? match[1] : match[1].slice(0, separator)).trim()
    if (!target) return false
    const resolve = state.env.resolveWikilink as WikilinkResolver | undefined
    const note = resolve?.(target)
    const token = state.push('wikilink', '', 0)
    token.content = match[0]
    if (note) {
      const alias = separator < 0 ? '' : match[1].slice(separator + 1).trim()
      token.content = alias || target
      token.attrSet('data-note-path', note.path)
    }
    state.pos += match[0].length
    return true
  })
  markdown.renderer.rules.wikilink = (tokens, index) => {
    const token = tokens[index]
    const label = markdown.utils.escapeHtml(token.content)
    const path = token.attrGet('data-note-path')
    return typeof path === 'string'
      ? `<button type="button" class="qz-wikilink" data-note-path="${markdown.utils.escapeHtml(path)}">${label}</button>`
      : label
  }
}
