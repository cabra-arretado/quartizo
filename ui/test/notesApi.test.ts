import { describe, expect, it, vi } from 'vitest'
import type { AppApi } from '@kirocrew/app-sdk'
import {
  createNote, deleteNote, dirname, listNotes, listWorkspaces, normalizeNotePath, query, readNote,
  registerWorkspace, renameNote, saveNote, toFailure, unregisterWorkspace,
} from '../src/notesApi'

const B = '/apps/quartizo/api'

function apiError(status: number, body: unknown): Error {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return Object.assign(new Error(`API ${status}: ${text}`), { name: 'AppApiError', status, body: text })
}

function mockApi(): AppApi & Record<string, ReturnType<typeof vi.fn>> {
  const ok = () => Promise.resolve({ workspaces: [], workspace: {}, files: [], truncated: false })
  return {
    raw: vi.fn(ok), request: vi.fn(ok), get: vi.fn(ok), post: vi.fn(ok),
    put: vi.fn(ok), patch: vi.fn(ok), del: vi.fn(ok),
  } as never
}

describe('notes API client', () => {
  it('builds workspace routes under the backend proxy prefix', async () => {
    const api = mockApi()
    await listWorkspaces(api)
    await registerWorkspace(api, '/home/u/notes')
    await registerWorkspace(api, '/home/u/notes', 'Vault')
    await unregisterWorkspace(api, 3)
    expect(api.get).toHaveBeenCalledWith(`${B}/workspaces`)
    expect(api.post).toHaveBeenCalledWith(`${B}/workspaces`, { path: '/home/u/notes' })
    expect(api.post).toHaveBeenCalledWith(`${B}/workspaces`, { path: '/home/u/notes', name: 'Vault' })
    expect(api.del).toHaveBeenCalledWith(`${B}/workspaces/3`)
  })

  it('percent-encodes query values (a raw + would read as a space)', async () => {
    const api = mockApi()
    await readNote(api, 1, 'a b+c/ü&x=1.md')
    expect(api.get).toHaveBeenCalledWith(`${B}/workspaces/1/note?path=a%20b%2Bc%2F%C3%BC%26x%3D1.md`)
    await listNotes(api, 1, '  q  ', true)
    expect(api.get).toHaveBeenLastCalledWith(`${B}/workspaces/1/notes?q=q&content=1`)
    await listNotes(api, 1, '', true)
    expect(api.get).toHaveBeenLastCalledWith(`${B}/workspaces/1/notes`)
    expect(query({ a: undefined, b: '' })).toBe('')
  })

  it('sends write bodies; confirm only where the UI confirmed', async () => {
    const api = mockApi()
    await createNote(api, 1, 'n.md', 'x')
    expect(api.post).toHaveBeenLastCalledWith(`${B}/workspaces/1/note`, { path: 'n.md', content: 'x' })
    await saveNote(api, 1, 'n.md', 'y', 'h')
    expect(api.put).toHaveBeenLastCalledWith(`${B}/workspaces/1/note`, { path: 'n.md', content: 'y', expectedHash: 'h' })
    await renameNote(api, 1, 'a.md', 'b.md')
    expect(api.post).toHaveBeenLastCalledWith(`${B}/workspaces/1/rename`, { from: 'a.md', to: 'b.md' })
    await renameNote(api, 1, 'a.md', 'b.md', { expectedHash: 'h', overwrite: true })
    expect(api.post).toHaveBeenLastCalledWith(`${B}/workspaces/1/rename`,
      { from: 'a.md', to: 'b.md', expectedHash: 'h', overwrite: true, confirm: true })
    await deleteNote(api, 1, 'a.md', 'h')
    expect(api.post).toHaveBeenLastCalledWith(`${B}/workspaces/1/delete`, { path: 'a.md', confirm: true, expectedHash: 'h' })
  })

  it('classifies backend failures, including the 409 conflict hash', () => {
    expect(toFailure(apiError(409, { error: 'changed', code: 'conflict', currentHash: 'abc' })))
      .toEqual({ status: 409, code: 'conflict', message: 'changed', currentHash: 'abc' })
    expect(toFailure(apiError(409, { error: 'gone', code: 'conflict', currentHash: null })).currentHash).toBeNull()
    expect(toFailure(apiError(403, { error: 'no', code: 'symlink_refused' })))
      .toMatchObject({ status: 403, code: 'symlink_refused', message: 'no' })
    expect(toFailure(apiError(502, '<html>'))).toMatchObject({ status: 502, code: undefined })
    expect(toFailure(new TypeError('Failed to fetch')).message).toBe('Failed to fetch')
    expect(toFailure(Object.assign(new Error('x'), { name: 'AppApiPermissionError' })).code).toBe('permission_denied')
  })
})

describe('normalizeNotePath', () => {
  it('adds .md and accepts folders', () => {
    expect(normalizeNotePath(' ideas ')).toEqual({ path: 'ideas.md' })
    expect(normalizeNotePath('daily/2026-10-20')).toEqual({ path: 'daily/2026-10-20.md' })
    expect(normalizeNotePath('x.md')).toEqual({ path: 'x.md' })
  })

  it('refuses what the backend would refuse', () => {
    for (const bad of ['', '  ', '/abs', '../x', 'a/../b', 'a//b', './a', '.hidden', 'a/.trash/b', 'a\\b', 'a\u0000b', '.md', 'a/.md']) {
      expect(normalizeNotePath(bad), bad).toHaveProperty('error')
    }
  })

  it('splits folders', () => {
    expect(dirname('a/b/c.md')).toBe('a/b')
    expect(dirname('c.md')).toBe('')
  })
})
