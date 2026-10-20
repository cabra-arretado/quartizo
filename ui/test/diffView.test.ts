import { describe, expect, it } from 'vitest'
import { diffStats, parseDiff, visibleRange } from '../src/diffView'
import { MAX_DIFF_BYTES } from '../src/gitApi'

const kinds = (text: string) => parseDiff(text).map(l => l.kind)

describe('parseDiff line classification', () => {
  it('classifies a normal diff and numbers its lines', () => {
    const text = [
      'diff --git a/a.txt b/a.txt',
      'index 45b983b..65ef226 100644',
      '--- a/a.txt',
      '+++ b/a.txt',
      '@@ -1,3 +1,3 @@ fn x',
      ' keep',
      '-old',
      '+new',
      ' tail',
      '\\ No newline at end of file',
      '',
    ].join('\n')
    const lines = parseDiff(text)
    expect(lines.map(l => l.kind)).toEqual(['file', 'meta', 'meta', 'meta', 'hunk', 'context', 'del', 'add', 'context', 'note'])
    expect(lines.slice(5, 9).map(l => [l.oldNo, l.newNo])).toEqual([[1, 1], [2, null], [null, 2], [3, 3]])
    expect(diffStats(lines)).toEqual({ added: 1, removed: 1 })
  })

  it('treats header-looking lines inside a hunk as content', () => {
    const text = 'diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -1,2 +1,2 @@\n--- not a header\n+++ still content\n diff --git in context\n'
    expect(kinds(text)).toEqual(['file', 'meta', 'meta', 'hunk', 'del', 'add', 'context'])
  })

  it('starts a new file after a hunk and handles several hunks', () => {
    const text = [
      'diff --git a/a b/a', '--- a/a', '+++ b/a', '@@ -1 +1 @@', '-a', '+b', '@@ -10,2 +10,2 @@', ' c', '+d',
      'diff --git a/b b/b', 'new file mode 100644', '--- /dev/null', '+++ b/b', '@@ -0,0 +1 @@', '+x',
    ].join('\n')
    const lines = parseDiff(text)
    expect(lines.map(l => l.kind)).toEqual([
      'file', 'meta', 'meta', 'hunk', 'del', 'add', 'hunk', 'context', 'add',
      'file', 'meta', 'meta', 'meta', 'hunk', 'add',
    ])
    expect(lines[7].oldNo).toBe(10)
    expect(lines[14].newNo).toBe(1)
  })

  it('binary, rename and submodule diffs', () => {
    expect(kinds('diff --git a/b.bin b/b.bin\nindex 1..2 100644\nBinary files a/b.bin and b/b.bin differ\n')).toEqual(['file', 'meta', 'binary'])
    expect(kinds('diff --git a/a b/b\nsimilarity index 100%\nrename from a\nrename to b\n')).toEqual(['file', 'meta', 'meta', 'meta'])
    expect(kinds('diff --git a/sm b/sm\nindex 1..2 160000\n--- a/sm\n+++ b/sm\n@@ -1 +1 @@\n-Subproject commit 1\n+Subproject commit 2\n'))
      .toEqual(['file', 'meta', 'meta', 'meta', 'hunk', 'del', 'add'])
  })

  it('combined (conflict) diffs use one prefix column per parent', () => {
    const text = 'diff --cc m.txt\nindex 1,2..0\n--- a/m.txt\n+++ b/m.txt\n@@@ -1,1 -1,1 +1,5 @@@\n++<<<<<<< HEAD\n+ mine\n - other\n  both\n'
    const lines = parseDiff(text)
    expect(lines.map(l => l.kind)).toEqual(['file', 'meta', 'meta', 'meta', 'hunk', 'add', 'add', 'del', 'context'])
    expect(lines[5].oldNo).toBeNull()
  })

  it('keeps hostile text as plain text', () => {
    const lines = parseDiff('@@ -1 +1 @@\n+<img src=x onerror=alert(1)>\n')
    expect(lines[1]).toMatchObject({ kind: 'add', text: '+<img src=x onerror=alert(1)>' })
  })

  it('handles empty and truncated input', () => {
    expect(parseDiff('')).toEqual([])
    expect(kinds('diff --git a/a b/a\n@@ -1 +1 @@\n+partial line without newline')).toEqual(['file', 'hunk', 'add'])
  })

  it('parses a 512 KiB diff quickly', () => {
    const body = Array.from({ length: 30000 }, (_, i) => (i % 3 === 0 ? `+added ln ${i}` : i % 3 === 1 ? `-removed ln ${i}` : ` same ln ${i}`))
    const text = `diff --git a/big b/big\n--- a/big\n+++ b/big\n@@ -1,20000 +1,20000 @@\n${body.join('\n')}\n`
    expect(text.length).toBeGreaterThan(450 * 1024)
    expect(text.length).toBeLessThanOrEqual(MAX_DIFF_BYTES)
    const t0 = performance.now()
    const lines = parseDiff(text)
    expect(performance.now() - t0).toBeLessThan(500)
    expect(lines).toHaveLength(30004)
    expect(diffStats(lines)).toEqual({ added: 10000, removed: 10000 })
  })
})

describe('visibleRange', () => {
  it('renders only the rows in view plus overscan', () => {
    expect(visibleRange(0, 180, 18, 30000, 5)).toEqual({ start: 0, end: 16 })
    expect(visibleRange(18 * 1000, 180, 18, 30000, 5)).toEqual({ start: 995, end: 1016 })
    expect(visibleRange(18 * 29999, 180, 18, 30000, 5)).toEqual({ start: 29994, end: 30000 })
  })

  it('clamps odd inputs', () => {
    expect(visibleRange(-50, 180, 18, 10, 5)).toEqual({ start: 0, end: 10 })
    expect(visibleRange(1e9, 180, 18, 10, 5)).toEqual({ start: 9, end: 10 })
    expect(visibleRange(0, 180, 18, 0)).toEqual({ start: 0, end: 0 })
    expect(visibleRange(0, 0, 18, 100, 0)).toEqual({ start: 0, end: 1 })
  })
})
