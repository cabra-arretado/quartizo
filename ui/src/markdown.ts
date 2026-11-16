import MarkdownIt from 'markdown-it/browser'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import yaml from 'highlight.js/lib/languages/yaml'
import sql from 'highlight.js/lib/languages/sql'
import { installWikilinks, type WikilinkResolver } from './wikilinks'

// Notes may come from a Bot or synced folder. Keep raw HTML disabled and
// render images as text so previews never fetch a URL from the note.
const highlighter = hljs.newInstance()
for (const [name, grammar] of Object.entries({ javascript, typescript, json, css, xml, python, bash, yaml, sql })) {
  highlighter.registerLanguage(name, grammar)
}

// Unknown languages fall back to markdown-it's escaped plaintext. Never
// auto-detect a grammar for untrusted content.
const markdown = new MarkdownIt({ html: false, highlight: (code, language) => {
  return code.length <= 32_768 && highlighter.getLanguage(language)
    ? highlighter.highlight(code, { language, ignoreIllegals: true }).value
    : ''
} })
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
markdown.renderer.rules.note_task = (tokens, index, options, _env, renderer) =>
  renderer.renderToken(tokens, index, options) + ' '

markdown.core.ruler.push('note_tasks', state => {
  const { tokens, env } = state
  const lineOffset = typeof env.lineOffset === 'number' ? env.lineOffset : 0
  const lines = state.src.split('\n')
  for (let i = 0; i < tokens.length; i++) {
    const item = tokens[i]
    if (item.type !== 'list_item_open' || !item.map) continue
    const line = item.map[0]
    const match = /^[ \t]*- \[([ x])\] (.*)$/.exec(lines[line] || '')
    if (!match) continue
    const paragraph = tokens[i + 1]
    const inline = tokens[i + 2]
    const children = inline?.children
    const first = children?.[0]
    const marker = `[${match[1]}]`
    if (paragraph?.type !== 'paragraph_open' || inline?.type !== 'inline' || !children
      || first?.type !== 'text' || (first.content !== marker && !first.content.startsWith(`${marker} `))) continue

    const task = new state.Token('note_task', 'input', 0)
    task.attrSet('type', 'checkbox')
    task.attrSet('class', 'qz-note-task-checkbox')
    task.attrSet('data-note-task-line', String(line + lineOffset))
    task.attrSet('aria-label', match[2].trim() || 'Task')
    if (!env.editable) task.attrSet('disabled', '')
    const checked = match[1] === 'x'
    if (checked) task.attrSet('checked', '')
    item.attrJoin('class', checked ? 'qz-note-task qz-note-task-completed' : 'qz-note-task')

    first.content = first.content.slice(4)
    const label = new state.Token('span_open', 'span', 1)
    label.attrSet('class', 'qz-note-task-text')
    children.unshift(task, label)
    children.push(new state.Token('span_close', 'span', -1))
  }
})

export interface MarkdownOptions { editable?: boolean }
export interface MarkdownBlock { html: string; start?: number; end?: number }

/** Ranges refer to original source lines, start inclusive and end exclusive. */
export function renderMarkdownBlocks(text: string, resolveWikilink?: WikilinkResolver, options: MarkdownOptions = {}): MarkdownBlock[] {
  // The editor still shows frontmatter and preserves it verbatim.
  let body = text
  let lineOffset = 0
  const open = /^---[ \t]*\n/.exec(text)
  if (open) {
    const close = /^---[ \t]*(?:\n|$)/gm
    close.lastIndex = open[0].length
    if (close.test(text)) {
      const prefix = text.slice(0, close.lastIndex)
      lineOffset = (prefix.match(/\n/g) || []).length
      body = text.slice(close.lastIndex)
    }
  }
  const env = { resolveWikilink, editable: options.editable === true, lineOffset }
  const tokens = markdown.parse(body, env)
  const lines = body.split('\n')
  const blocks: MarkdownBlock[] = []
  for (let i = 0; i < tokens.length;) {
    const start = i
    const token = tokens[i++]
    if (token.nesting === 1) {
      let depth = 1
      while (i < tokens.length && depth > 0) depth += tokens[i++].nesting
    }
    const map = token.map
    const block: MarkdownBlock = { html: markdown.renderer.render(tokens.slice(start, i), markdown.options, env) }
    if (map) {
      // List tokens may include the blank lines separating them from the next block.
      let end = map[1]
      while (end > map[0] + 1 && /^[ \t]*$/.test(lines[end - 1] ?? '')) end--
      block.start = map[0] + lineOffset
      block.end = end + lineOffset
    }
    blocks.push(block)
  }
  return blocks
}

export function renderMarkdown(text: string, resolveWikilink?: WikilinkResolver, options?: MarkdownOptions): string {
  return renderMarkdownBlocks(text, resolveWikilink, options).map(block => block.html).join('')
}
