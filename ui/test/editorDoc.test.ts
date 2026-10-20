import { describe, expect, it } from 'vitest'
import {
  acceptOverwrite, canEdit, conflicted, contentToSave, dismissConflict, editText, isDirty, openDoc, saved,
} from '../src/editorDoc'

const note = (content: string, hash = 'h1') => ({ path: 'a.md', content, hash, size: content.length, mtimeMs: 1 })

describe('editor document', () => {
  it('opens clean and becomes dirty on edit', () => {
    const doc = openDoc(note('a\r\nb\r\n'))
    expect(doc.text).toBe('a\nb\n')
    expect(isDirty(doc)).toBe(false)
    const edited = editText(doc, 'a\nb\nc\n')
    expect(isDirty(edited)).toBe(true)
    expect(contentToSave(edited)).toBe('a\r\nb\r\nc\r\n')
    expect(isDirty(editText(edited, 'a\nb\n'))).toBe(false)
  })

  it('keeps mixed line endings read-only', () => {
    const doc = openDoc(note('a\r\nb\n'))
    expect(canEdit(doc)).toBe(false)
    expect(editText(doc, 'changed')).toBe(doc)
    expect(isDirty(doc)).toBe(false)
  })

  it('a save updates the base hash; typing during the save stays dirty', () => {
    const doc = editText(openDoc(note('v1')), 'v2')
    const after = saved(editText(doc, 'v3'), 'v2', { path: 'a.md', hash: 'h2', size: 2, mtimeMs: 2 })
    expect(after.hash).toBe('h2')
    expect(after.disk).toBe('v2')
    expect(isDirty(after)).toBe(true)
  })

  it('a 409 never moves the expected hash; keep-editing still conflicts next time', () => {
    const doc = editText(openDoc(note('v1', 'h1')), 'mine')
    const c = conflicted(doc, 'h-external')
    expect(c.hash).toBe('h1')
    expect(c.conflict).toEqual({ currentHash: 'h-external' })
    expect(c.text).toBe('mine')
    const kept = dismissConflict(c)
    expect(kept.hash).toBe('h1')
    expect(kept.conflict).toBeNull()
  })

  it('only an explicit overwrite adopts the current disk hash', () => {
    const c = conflicted(editText(openDoc(note('v1', 'h1')), 'mine'), 'h-external')
    expect(acceptOverwrite(c).hash).toBe('h-external')
    expect(acceptOverwrite(dismissConflict(c)).hash).toBe('h1') // nothing to accept
    const gone = acceptOverwrite(conflicted(c, null))
    expect(gone.hash).toBeNull() // next save re-creates the deleted note
    expect(isDirty(gone)).toBe(true)
  })
})
