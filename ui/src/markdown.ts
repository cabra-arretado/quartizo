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
 * - Block elements carry `data-qz-lines="<first>-<last>"` (1-based source
 *   lines, integers only), so a selection in the preview can be mapped back
 *   to the note's own lines for the chat context (context.ts).
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

// Source line ranges on block tokens. markdown-it renders token attrs on the
// opening tag (and on <code>/<pre> for fences and code blocks).
md.core.ruler.push('qz_source_lines', state => {
  for (const token of state.tokens) {
    if (token.map && token.nesting !== -1 && token.type !== 'inline') {
      token.attrSet('data-qz-lines', `${token.map[0] + 1}-${Math.max(token.map[0] + 1, token.map[1])}`)
    }
  }
})

/** Parse a `data-qz-lines` value; null for anything that is not `<a>-<b>` with 1 <= a <= b. */
export function parseSourceLines(value: string | null | undefined): [number, number] | null {
  const m = /^([1-9][0-9]{0,8})-([1-9][0-9]{0,8})$/.exec(value ?? '')
  if (!m) return null
  const a = Number(m[1])
  const b = Number(m[2])
  return a <= b ? [a, b] : null
}

export function renderMarkdown(source: string): string {
  return md.render(source)
}
