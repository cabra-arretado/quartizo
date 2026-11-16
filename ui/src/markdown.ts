import MarkdownIt from 'markdown-it/browser'
import { installWikilinks, type WikilinkResolver } from './wikilinks'

// Notes may come from a Bot or synced folder. Keep raw HTML disabled and
// render images as text so previews never fetch a URL from the note.
const markdown = new MarkdownIt({ html: false })
installWikilinks(markdown)
markdown.validateLink = url => /^(https?:\/\/|mailto:)/i.test(url)
markdown.renderer.rules.image = (tokens, index) => {
  const alt = markdown.utils.escapeHtml(tokens[index].content || 'image')
  return `<span class="qz-note-image">[image: ${alt}]</span>`
}
markdown.renderer.rules.link_open = (tokens, index, options, _env, renderer) => {
  tokens[index].attrSet('target', '_blank')
  tokens[index].attrSet('rel', 'noopener noreferrer nofollow')
  return renderer.renderToken(tokens, index, options)
}

export function renderMarkdown(text: string, resolveWikilink?: WikilinkResolver): string {
  const env = { resolveWikilink }
  // The source editor still shows the frontmatter and preserves it verbatim.
  const open = /^---[ \t]*\n/.exec(text)
  if (!open) return markdown.render(text, env)
  const close = /^---[ \t]*(?:\n|$)/gm
  close.lastIndex = open[0].length
  return markdown.render(close.test(text) ? text.slice(close.lastIndex) : text, env)
}
