import { describe, expect, it } from 'vitest'
import { detectLineStyle, fromEditor, toEditor } from '../src/lineEndings'

describe('line endings', () => {
  it('detects the style', () => {
    expect(detectLineStyle('')).toBe('lf')
    expect(detectLineStyle('no newline')).toBe('lf')
    expect(detectLineStyle('a\nb\n')).toBe('lf')
    expect(detectLineStyle('a\r\nb\r\n')).toBe('crlf')
    expect(detectLineStyle('a\r\nb\n')).toBe('mixed')
    expect(detectLineStyle('a\rb')).toBe('mixed')
    expect(detectLineStyle('a\r\n\rb')).toBe('mixed')
  })

  it('round-trips LF and CRLF files exactly through the LF editor text', () => {
    for (const content of ['', 'x', '# T\n\nbody\n', '# T\r\n\r\nbody\r\n', '﻿bom\r\n', 'end without newline\r\nx']) {
      const style = detectLineStyle(content)
      const text = toEditor(content)
      expect(text).not.toContain('\r')
      expect(fromEditor(text, style)).toBe(content)
    }
  })

  it('writes new lines in the file style', () => {
    expect(fromEditor('a\nb', 'crlf')).toBe('a\r\nb')
    expect(fromEditor('a\nb', 'lf')).toBe('a\nb')
    // A textarea never yields "\r", but stray ones are normalized, not doubled.
    expect(fromEditor('a\r\nb\rc', 'crlf')).toBe('a\r\nb\r\nc')
  })
})
