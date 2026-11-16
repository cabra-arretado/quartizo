import { existsSync, readFileSync } from 'node:fs'
import { buildSync } from 'esbuild'
import { describe, expect, it } from 'vitest'
import { HOST_MODULES } from '../vite.config'

const BUNDLE = new URL('../dist/index.mjs', import.meta.url)

function moduleMetadata(src: string) {
  // Bundled grammars contain source examples that look like import statements in strings.
  const { metafile } = buildSync({ stdin: { contents: src }, format: 'esm', write: false, metafile: true })
  const output = Object.values(metafile.outputs)[0]
  return { imports: output.imports.map(item => item.path), exports: output.exports }
}

describe('built bundle', () => {
  it('finds every import form', () => {
    expect(moduleMetadata('import { a } from "react";import "side-effect";const m = import( \'lazy\' )').imports)
      .toEqual(['react', 'side-effect', 'lazy'])
    expect(moduleMetadata('import "a";\nimport "b";const p = \'from "grammar"\'').imports).toEqual(['a', 'b'])
  })

  it('exists (npm test builds first)', () => {
    expect(existsSync(BUNDLE), 'ui/dist/index.mjs is missing: run `npm run build` (npm test does)').toBe(true)
  })

  it('imports only specifiers the host import map provides, and has a default export', () => {
    const src = readFileSync(BUNDLE, 'utf8')
    const { imports, exports } = moduleMetadata(src)
    expect(imports.length).toBeGreaterThan(0)
    for (const specifier of imports) expect(HOST_MODULES).toContain(specifier)
    expect(exports).toContain('default')
  })
})
