import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../src/markdown'
import { documentContent, makeNoteTree, openDocument } from '../src/notesModel'
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
