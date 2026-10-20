import { describe, expect, it } from 'vitest'
import { isSafeUrl, parseSourceLines, renderMarkdown } from '../src/markdown'

const ALLOWED_TAGS = new Set([
  'a', 'blockquote', 'br', 'code', 'del', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'li', 'ol', 'p',
  'pre', 's', 'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul',
])
const ALLOWED_ATTRS = new Set(['href', 'title', 'target', 'rel', 'class', 'start', 'style', 'data-qz-lines'])

/** Every tag and attribute in the output must be on the allowlist; no URL may carry a script scheme. */
function assertSafe(html: string): void {
  for (const m of html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g)) {
    const [, tag, attrs] = m
    expect(ALLOWED_TAGS, `tag <${tag}> in ${html}`).toContain(tag.toLowerCase())
    for (const a of attrs.matchAll(/([^\s=]+)\s*=\s*"([^"]*)"/g)) {
      const [, name, value] = a
      expect(ALLOWED_ATTRS, `attribute ${name} in ${m[0]}`).toContain(name.toLowerCase())
      if (name === 'href') expect(value).toMatch(/^(https?:\/\/|mailto:)/i)
      if (name === 'style') expect(value).toMatch(/^text-align:(left|right|center)$/)
      if (name === 'data-qz-lines') expect(value).toMatch(/^[0-9]+-[0-9]+$/)
    }
    // Anything left after removing well-formed attributes must be whitespace.
    expect(attrs.replace(/([^\s=]+)\s*=\s*"([^"]*)"/g, '').trim(), m[0]).toBe('')
  }
  expect(html).not.toMatch(/<script|<iframe|<img|<svg|<object|<embed|<style|<form|<input|<link|<meta/i)
}

const PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<a href="javascript:alert(1)">x</a>',
  '<svg onload=alert(1)>',
  '<iframe src="https://evil.example"></iframe>',
  '<div style="background:url(javascript:alert(1))">x</div>',
  '[click](javascript:alert(1))',
  '[click](JaVaScRiPt:alert(1))',
  '[click](  javascript:alert(1))',
  '[click](java\tscript:alert(1))',
  '[click](&#106;avascript:alert(1))',
  '[click](javascript&#58;alert(1))',
  '[click](%6aavascript:alert(1))',
  '[click](vbscript:msgbox(1))',
  '[click](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
  '[click](file:///etc/passwd)',
  '[click](//evil.example/x)',
  '[click](/api/chat/slots)',
  '<javascript:alert(1)>',
  '[x][ref]\n\n[ref]: javascript:alert(1)',
  '![x](javascript:alert(1))',
  '![tracker](https://evil.example/pixel.gif)',
  '![a" onerror="alert(1)](https://x.example/a.png)',
  '[a](https://ok.example "t\\" onmouseover=\\"alert(1)")',
  '```html\n<script>alert(1)</script>\n```',
  '`<img src=x onerror=alert(1)>`',
  '<!-- <script>alert(1)</script> -->',
  '<details open ontoggle=alert(1)>',
  '| a | b |\n|--:|:-:|\n| <b onclick=x>1</b> | 2 |',
  '> <a href="https://ok">quote</a>',
]

describe('renderMarkdown (untrusted input)', () => {
  for (const payload of PAYLOADS) {
    it(`neutralizes ${JSON.stringify(payload).slice(0, 60)}`, () => {
      assertSafe(renderMarkdown(payload))
    })
  }

  it('escapes raw HTML instead of dropping it', () => {
    expect(renderMarkdown('<b>hi</b>')).toContain('&lt;b&gt;hi&lt;/b&gt;')
  })

  it('renders an unsafe link as text, with no anchor', () => {
    const html = renderMarkdown('[click](javascript:alert(1))')
    expect(html).not.toContain('<a')
  })

  it('keeps safe links, opening them in a new tab without opener', () => {
    const html = renderMarkdown('[site](https://example.com/a?b=1) and <mailto:me@example.com>')
    expect(html).toContain('<a href="https://example.com/a?b=1" target="_blank" rel="noopener noreferrer nofollow">site</a>')
    expect(html).toContain('href="mailto:me@example.com"')
    assertSafe(html)
  })

  it('never loads images: they become a text placeholder', () => {
    const html = renderMarkdown('![a cat](https://example.com/cat.png)')
    expect(html).toContain('[image: a cat]')
    expect(html).not.toContain('<img')
  })

  it('renders ordinary Markdown', () => {
    const html = renderMarkdown('# Title\n\n- **bold** and *em*\n- `code`\n\n1. one\n\n| a | b |\n|---|--:|\n| 1 | 2 |')
    expect(html).toMatch(/<h1 data-qz-lines="1-1">Title<\/h1>/)
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<code>code</code>')
    expect(html).toMatch(/<table data-qz-lines="8-10">/)
    assertSafe(html)
  })

  it('allows only http(s) and mailto URLs', () => {
    for (const ok of ['https://a.example', 'http://a.example', 'HTTPS://A.EXAMPLE', 'mailto:x@y.z']) expect(isSafeUrl(ok)).toBe(true)
    for (const bad of ['javascript:x', ' https://a', '//a.example', '/x', 'x.md', 'data:,x', 'ftp://a', '']) expect(isSafeUrl(bad)).toBe(false)
  })
})

describe('source line ranges', () => {
  it('tags blocks with their 1-based source lines', () => {
    const html = renderMarkdown('# T\n\npara one\npara two\n\n```js\nx\n```\n\n- a\n- b\n')
    expect(html).toContain('<h1 data-qz-lines="1-1">')
    expect(html).toContain('<p data-qz-lines="3-4">')
    expect(html).toMatch(/<code data-qz-lines="6-8" class="language-js">|<code class="language-js" data-qz-lines="6-8">/)
    expect(html).toContain('<ul data-qz-lines="10-11">')
    assertSafe(html)
  })

  it('parses only well-formed ranges', () => {
    expect(parseSourceLines('3-4')).toEqual([3, 4])
    expect(parseSourceLines('5-5')).toEqual([5, 5])
    for (const bad of [null, undefined, '', '0-1', '4-3', '1-', '-1', '1-2-3', ' 1-2', '1e3-2000', '01-2']) {
      expect(parseSourceLines(bad as string)).toBeNull()
    }
  })
})
