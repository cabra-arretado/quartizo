import { describe, expect, it } from 'vitest'
import { renderMarkdown, renderMarkdownBlocks } from '../src/markdown'
import { documentContent, makeNoteTree, noteBlockOffsets, openDocument, setNoteTaskChecked } from '../src/notesModel'
import { makeWikilinkResolver } from '../src/wikilinks'

describe('notes tree', () => {
  it('groups exact paths through nested folders without conflating identical titles', () => {
    const rootNote = { path: 'root.md', title: 'Root' }
    const noteA = { path: 'a/demo.md', title: 'Demo' }
    const noteB = { path: 'a/b/demo.md', title: 'Demo' }
    const tree = makeNoteTree([rootNote, noteA, noteB])
    expect(tree.notes).toEqual([rootNote])
    expect(tree.folders.get('a')?.notes).toEqual([noteA])
    expect(tree.folders.get('a')?.folders.get('b')?.notes).toEqual([noteB])
  })
})

describe('notes editor line endings', () => {
  it('preserves a BOM and uniform CRLF around edited text', () => {
    const doc = openDocument({ path: 'one.md', content: '\ufeff# One\r\nText\r\n', hash: 'h' })
    expect(doc.text).toBe('# One\nText\n')
    expect(documentContent({ ...doc, text: '# Two\nText\n' })).toBe('\ufeff# Two\r\nText\r\n')
  })

  it.each(['# One\r\nText\n', '# One\rText'])('preserves the bytes of a read-only mixed document %j', content => {
    const doc = openDocument({ path: 'one.md', content, hash: 'h' })
    expect(doc.lineEnding).toBe('mixed')
    expect(documentContent({ ...doc, text: 'Discarded' })).toBe(content)
  })
})

describe('untrusted note preview', () => {
  it('renders the body and hides the ticket frontmatter', () => {
    const html = renderMarkdown('---\nstatus: backlog\n---\n# Launch\n\n**Soon**')
    expect(html).toContain('<h1>Launch</h1>')
    expect(html).toContain('<strong>Soon</strong>')
    expect(html).not.toContain('status: backlog')
  })

  it('renders neither note-supplied HTML nor embedded remote images', () => {
    const html = renderMarkdown([
      '<img src=x onerror=alert(1)>',
      '![a <tag>](https://example.test/tracker.png)',
      '[unsafe](javascript:alert(1)) [unsafe too](java&#x73;cript:alert(1))',
      '[relative](/api/data) [safe](https://example.test)',
    ].join('\n\n'))
    expect(html).toContain('&lt;img')
    expect(html).toContain('[image: a &lt;tag&gt;]')
    expect(html).not.toMatch(/<img|tracker\.png|href="(?:javascript:|\/api\/)/i)
    expect(html).toContain('href="https://example.test" target="_blank" rel="noopener noreferrer nofollow"')
  })

  it('renders escaped wikilink labels and paths while leaving code and unresolved links literal', () => {
    const resolve = makeWikilinkResolver([{ path: 'Projects/"Launch".md', title: 'Launch' }])
    const html = renderMarkdown([
      '---\nrelated: "[[Launch]]"\n---',
      '[[Launch|<b>Go</b>]] `[[Launch]]` [[Missing]] [website](https://example.test)',
      '```text\n[[Launch]]\n```',
    ].join('\n\n'), resolve)
    expect(html).toContain('data-note-path="Projects/&quot;Launch&quot;.md"')
    expect(html).toContain('&lt;b&gt;Go&lt;/b&gt;')
    expect(html).toContain('<code>[[Launch]]</code>')
    expect(html).toContain('[[Missing]]')
    expect(html.match(/data-note-path=/g)).toHaveLength(1)
    expect(html).toContain('href="https://example.test" target="_blank"')
    expect(html).not.toMatch(/related:|<b>Go<\/b>/)
  })
})

describe('note preview source mapping', () => {
  it('maps whole top-level blocks to original lines after frontmatter', () => {
    const text = '---\nstatus: todo\n---\n# Heading\n\n- [ ] One\n  - [x] Nested\n\n> Quote\n\n```js\nconst x = 1\n```\n'
    const blocks = renderMarkdownBlocks(text, undefined, { editable: true })
    expect(blocks.map(({ start, end }) => [start, end])).toEqual([[3, 4], [5, 7], [8, 9], [10, 13]])
    const html = blocks.map(block => block.html).join('')
    expect(html).toContain('data-note-task-line="5"')
    expect(html).toContain('data-note-task-line="6" aria-label="Nested" checked=""')
    expect(html).toContain('class="qz-note-task qz-note-task-completed"')
    expect(html).not.toContain(' disabled')
    expect(renderMarkdown(text)).toContain('data-note-task-line="5" aria-label="One" disabled=""')
  })

  it('creates no tasks for lookalikes in text, fences, or HTML', () => {
    const text = 'Text - [ ] task\n\n```\n- [ ] fenced\n```\n\n&lt;input type="checkbox"&gt;\n\n- [X] uppercase\n- [ ] "quoted" <tag>'
    const html = renderMarkdown(text, undefined, { editable: true })
    expect(html.match(/class="qz-note-task-checkbox"/g)).toHaveLength(1)
    expect(html).toContain('data-note-task-line="9" aria-label="&quot;quoted&quot; &lt;tag&gt;"')
  })

  it('maps normalized block offsets and changes only the selected duplicate task marker', () => {
    const text = '---\nstatus: todo\n---\n- [ ] One\n- [ ] One\n\nAfter\n'
    const offsets = noteBlockOffsets(text, 3, 5)
    expect(offsets && text.slice(offsets.from, offsets.to)).toBe('- [ ] One\n- [ ] One')
    expect(setNoteTaskChecked(text, 4, true)).toBe('---\nstatus: todo\n---\n- [ ] One\n- [x] One\n\nAfter\n')
    expect(setNoteTaskChecked(text, 5, true)).toBe(text)
  })

  it('highlights supported fenced code without interpreting its contents as HTML', () => {
    const html = renderMarkdown('```js\nconst text = "<img src=x>"; // <script>\n```\n\n```unknown\n<svg onload=alert(1)>\n```')
    expect(html).toContain('<span class="hljs-keyword">const</span>')
    expect(html).toContain('<span class="hljs-string">&quot;&lt;img src=x&gt;&quot;</span>')
    expect(html).toContain('&lt;svg onload=alert(1)&gt;')
    expect(html).not.toMatch(/<img|<svg|<script>/)
  })
})
