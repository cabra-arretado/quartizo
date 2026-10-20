import { describe, expect, it, vi } from 'vitest'
import type { AppApi } from '@kirocrew/app-sdk'
import { describeHead, fileDiff, isRepoPath, listRepos, registerRepo, removeRepo, repoInfo, repoStatus } from '../src/gitApi'

const B = '/apps/quartizo/api'

function mockApi(): AppApi & Record<string, ReturnType<typeof vi.fn>> {
  const ok = () => Promise.resolve({ repos: [], repo: {} })
  return {
    raw: vi.fn(ok), request: vi.fn(ok), get: vi.fn(ok), post: vi.fn(ok),
    put: vi.fn(ok), patch: vi.fn(ok), del: vi.fn(ok),
  } as never
}

describe('git API client', () => {
  it('routes, and only reads after registration', async () => {
    const api = mockApi()
    await listRepos(api)
    await registerRepo(api, '/r', 'R')
    await registerRepo(api, '/r')
    await repoInfo(api, 3)
    await repoStatus(api, 3)
    await removeRepo(api, 3)
    expect(api.get).toHaveBeenCalledWith(`${B}/repos`)
    expect(api.post).toHaveBeenCalledWith(`${B}/repos`, { path: '/r', name: 'R' })
    expect(api.post).toHaveBeenLastCalledWith(`${B}/repos`, { path: '/r' })
    expect(api.get).toHaveBeenCalledWith(`${B}/repos/3/info`)
    expect(api.get).toHaveBeenCalledWith(`${B}/repos/3/status`)
    expect(api.del).toHaveBeenCalledWith(`${B}/repos/3`)
    for (const fn of [api.put, api.patch, api.raw, api.request]) expect(fn).not.toHaveBeenCalled()
  })

  it('a diff sends only a path, a mode and (staged renames) the original path, encoded', async () => {
    const api = mockApi()
    await fileDiff(api, 2, 'dir/a b+&=.txt', 'worktree', 'old.txt')
    expect(api.get).toHaveBeenLastCalledWith(`${B}/repos/2/diff?path=dir%2Fa%20b%2B%26%3D.txt&mode=worktree`)
    await fileDiff(api, 2, 'new.txt', 'staged', 'old.txt')
    expect(api.get).toHaveBeenLastCalledWith(`${B}/repos/2/diff?path=new.txt&mode=staged&orig=old.txt`)
    await fileDiff(api, 2, '--output=x', 'staged', null)
    expect(api.get).toHaveBeenLastCalledWith(`${B}/repos/2/diff?path=--output%3Dx&mode=staged`)
  })

  it('repo paths mirror the backend rules', () => {
    for (const ok of ['a.txt', '.gitignore', '.github/w.yml', 'dir/-c', '*']) expect(isRepoPath(ok)).toBe(true)
    for (const bad of ['', '/abs', '../x', 'a//b', 'a/./b', 'a\\b', 'a\nb', '.git/config', 'x/.GIT/HEAD', null, 'x'.repeat(1025)]) {
      expect(isRepoPath(bad)).toBe(false)
    }
  })

  it('describes HEAD', () => {
    const head = { oid: '1234567890abcdef1234567890abcdef12345678', branch: 'main', detached: false, unborn: false,
      upstream: null, ahead: null, behind: null }
    expect(describeHead(head)).toBe('main')
    expect(describeHead({ ...head, upstream: 'origin/main', ahead: 2, behind: 1 })).toBe('main → origin/main ↑2 ↓1')
    expect(describeHead({ ...head, upstream: 'origin/main', ahead: 0, behind: 0 })).toBe('main → origin/main (up to date)')
    expect(describeHead({ ...head, branch: null, detached: true })).toBe('detached at 1234567')
    expect(describeHead({ ...head, oid: null, unborn: true })).toBe('main (no commits yet)')
  })
})
