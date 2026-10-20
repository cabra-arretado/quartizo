/**
 * Rendering of UNTRUSTED Markdown (anything in a workspace may have been
 * written by an agent, a synced vault or a download).
 *
 * - `html: false`: raw HTML in the source is escaped, never emitted.
 * - Link URLs must be http(s) or mailto. Anything else (javascript:, data:,
 *   vbscript:, file:, relative paths, protocol-relative //host) fails
 *   validation, and markdown-it then prints the link as literal text.
 * - Images are not loaded: they render as a text placeholder, so a preview
 *   makes no network request (no tracking pixels, no GETs against the gateway
 *   with the owner's cookie).
 * - Links open in a new tab with rel="noopener noreferrer nofollow".
 */
// The package's prebuilt, minified ESM build (dependencies included). The plain
// entry would leave its JSDoc `import ... from 'markdown-it'` examples in our
// unminified lib bundle, where they read as imports.
import MarkdownIt from 'markdown-it/browser'

const SAFE_URL = /^(https?:\/\/|mailto:)/i

export function isSafeUrl(url: string): boolean {
  // markdown-it hands over the normalized (percent-encoded) URL; control and
  // whitespace characters are already encoded, so they cannot hide a scheme.
  return SAFE_URL.test(url)
}

const md = new MarkdownIt({ html: false, linkify: false, typographer: false })
md.validateLink = isSafeUrl

md.renderer.rules.image = (tokens, idx) => {
  const token = tokens[idx]
  const alt = md.utils.escapeHtml(token.content || 'image')
  const src = md.utils.escapeHtml(String(token.attrGet('src') ?? ''))
  return `<span class="qz-image" title="${src}">[image: ${alt}]</span>`
}

const defaultLinkOpen =
  md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer nofollow')
  return defaultLinkOpen(tokens, idx, options, env, self)
}

export function renderMarkdown(source: string): string {
  return md.render(source)
}
