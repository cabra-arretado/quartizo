import MarkdownIt from 'markdown-it/browser'
import { describe, expect, it } from 'vitest'
import { installWikilinks, makeWikilinkResolver } from '../src/wikilinks'

describe('wikilinks', () => {
  const guide = { path: 'Projects/Guide.md', title: 'Project guide' }
  const notes = [guide, { path: 'Archive/Guide.md', title: 'Old documentation' }]

  it('resolves a workspace path or unique name without choosing between ambiguous matches', () => {
    const resolve = makeWikilinkResolver(notes)
    expect(resolve(' PROJECTS/GUIDE ')).toEqual(guide)
    expect(resolve('/Projects/Guide.md')).toEqual(guide)
    expect(resolve('pRoJeCt GuIdE')).toEqual(guide)
    expect(resolve('Guide')).toBeNull()
    expect(resolve('../Projects/Guide')).toBeNull()
    expect(resolve('https://example.com/Guide.md')).toBeNull()
    expect(makeWikilinkResolver([guide])('guide')).toEqual(guide)
  })

  it('prefers a unique title and leaves duplicate titles unresolved', () => {
    const namedGuide = { path: 'Index.md', title: 'Guide' }
    expect(makeWikilinkResolver([...notes, namedGuide])('guide')).toEqual(namedGuide)
    const other = { path: 'Other.md', title: 'Guide' }
    expect(makeWikilinkResolver([guide, namedGuide, other])('guide')).toBeNull()
  })

  it('labels a path link with the note title but keeps a typed name as written', () => {
    const markdown = new MarkdownIt({ html: false })
    installWikilinks(markdown)
    const html = markdown.render('[[Projects/Guide]] [[project guide]]', { resolveWikilink: makeWikilinkResolver(notes) })
    expect(html).toContain('>Project guide</button>')
    expect(html).toContain('>project guide</button>')
    expect(html).not.toContain('>Projects/Guide</button>')
  })

  it('renders aliases as safe buttons and leaves code, escaped, or unresolved text alone', () => {
    const markdown = new MarkdownIt({ html: false })
    installWikilinks(markdown)
    const unsafe = { path: 'Some "file".md', title: 'Escaping fixture' }
    const html = markdown.render([
      '**[[Escaping fixture|<read>]]** [[Guide|unclear]] `[[Escaping fixture]]` \\[[Escaping fixture]]',
      '',
      '```',
      '[[Escaping fixture]]',
      '```',
    ].join('\n'), { resolveWikilink: makeWikilinkResolver([...notes, unsafe]) })
    expect(html).toContain('<strong><button type="button" class="qz-wikilink" data-note-path="Some &quot;file&quot;.md">&lt;read&gt;</button></strong>')
    expect(html.match(/<button/g)).toHaveLength(1)
    expect(html).toContain('[[Guide|unclear]]')
    expect(html).toContain('<code>[[Escaping fixture]]</code>')
  })

  it('preserves ordinary Markdown links and finds wikilinks in nested paragraphs', () => {
    const markdown = new MarkdownIt({ html: false })
    installWikilinks(markdown)
    const html = markdown.render([
      '[See [[Project guide]]](https://example.com) [[Project guide]](https://example.org)',
      '',
      '- A list item',
      '',
      '    [[Project guide]]',
    ].join('\n'), { resolveWikilink: makeWikilinkResolver(notes) })
    expect(html).toContain('<a href="https://example.com">See [[Project guide]]</a>')
    expect(html).toContain('<a href="https://example.org">[Project guide]</a>')
    expect(html.match(/<button/g)).toHaveLength(1)
  })
})
