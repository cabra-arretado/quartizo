import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { HOST_MODULES } from '../vite.config'

const BUNDLE = new URL('../dist/index.mjs', import.meta.url)

/** Every module specifier in an ES bundle: `from "x"`, bare `import "x"`, `import("x")`. */
export function importSpecifiers(src: string): string[] {
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    // Bare side-effect import: only at statement start, so a string such as "/import" is not one.
    /(?:^|[;{}\n])\s*import\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
  ]
  return patterns.flatMap(re => [...src.matchAll(re)].map(m => m[1]))
}

describe('built bundle', () => {
  it('finds every import form', () => {
    expect(importSpecifiers('import { a } from "react";import "side-effect";const m = import( \'lazy\' )'))
      .toEqual(['react', 'side-effect', 'lazy'])
    expect(importSpecifiers('import "a";\nimport "b";const p = "/tasks/import"')).toEqual(['a', 'b'])
  })

  it('exists (npm test builds first)', () => {
    expect(existsSync(BUNDLE), 'ui/dist/index.mjs is missing: run `npm run build` (npm test does)').toBe(true)
  })

  it('imports only specifiers the host import map provides, and has a default export', () => {
    const src = readFileSync(BUNDLE, 'utf8')
    const specs = importSpecifiers(src)
    expect(specs.length).toBeGreaterThan(0)
    for (const s of specs) expect(HOST_MODULES).toContain(s)
    expect(src).toMatch(/export\s*\{[^}]*\bas default\b/)
  })
})
