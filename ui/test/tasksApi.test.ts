import { describe, expect, it, vi } from 'vitest'
import type { AppApi } from '@kirocrew/app-sdk'
import {
  checkTitle, createTask, deleteTask, descriptionTooLarge, exportTasks, importTasks, isLinkableSlot, isNoteRef,
  listTasks, moveTask, removeWorkspace, toTaskFailure, updateTask,
} from '../src/tasksApi'

const B = '/apps/quartizo/api'
const UID = 'a'.repeat(32)

function apiError(status: number, body: unknown): Error {
  const text = JSON.stringify(body)
  return Object.assign(new Error(`API ${status}: ${text}`), { name: 'AppApiError', status, body: text })
}

function mockApi(): AppApi & Record<string, ReturnType<typeof vi.fn>> {
  const ok = () => Promise.resolve({ task: {}, tasks: [] })
  return {
    raw: vi.fn(ok), request: vi.fn(ok), get: vi.fn(ok), post: vi.fn(ok),
    put: vi.fn(ok), patch: vi.fn(ok), del: vi.fn(ok),
  } as never
}

describe('tasks API client', () => {
  it('builds routes under the workspace and sends the version', async () => {
    const api = mockApi()
    const t = { id: 4, version: 3 }
    await listTasks(api, 2)
    await createTask(api, 2, { title: 'x', status: 'ready' })
    await updateTask(api, 2, t, { title: 'y' })
    await deleteTask(api, 2, t)
    await exportTasks(api, 2)
    expect(api.get).toHaveBeenCalledWith(`${B}/workspaces/2/tasks`)
    expect(api.post).toHaveBeenCalledWith(`${B}/workspaces/2/tasks`, { title: 'x', status: 'ready' })
    expect(api.patch).toHaveBeenCalledWith(`${B}/workspaces/2/tasks/4`, { title: 'y', expectedVersion: 3 })
    expect(api.post).toHaveBeenCalledWith(`${B}/workspaces/2/tasks/4/delete`, { expectedVersion: 3, confirm: true })
    expect(api.get).toHaveBeenCalledWith(`${B}/workspaces/2/tasks/export`)
  })

  it('a move calls only the move route: no chat, no send, no agent', async () => {
    const api = mockApi()
    await moveTask(api, 2, { id: 4, version: 3 }, 'in_progress', 1)
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith(`${B}/workspaces/2/tasks/4/move`, { expectedVersion: 3, status: 'in_progress', index: 1 })
    for (const fn of [api.get, api.put, api.patch, api.del, api.raw, api.request]) expect(fn).not.toHaveBeenCalled()
    expect(JSON.stringify((api.post as ReturnType<typeof vi.fn>).mock.calls)).not.toContain('/api/chat')
  })

  it('sends replace with confirm, and the deleteTasks flag, only when asked', async () => {
    const api = mockApi()
    await importTasks(api, 1, { x: 1 })
    expect(api.post).toHaveBeenLastCalledWith(`${B}/workspaces/1/tasks/import`, { data: { x: 1 } })
    await importTasks(api, 1, { x: 1 }, { replace: true, newUids: true })
    expect(api.post).toHaveBeenLastCalledWith(`${B}/workspaces/1/tasks/import`,
      { data: { x: 1 }, replace: true, confirm: true, newUids: true })
    await removeWorkspace(api, 5)
    expect(api.del).toHaveBeenLastCalledWith(`${B}/workspaces/5`)
    await removeWorkspace(api, 5, true)
    expect(api.del).toHaveBeenLastCalledWith(`${B}/workspaces/5?deleteTasks=1`)
  })

  it('parses stale and count refusals', () => {
    const current = { id: 4, version: 5, title: 'theirs' }
    const stale = toTaskFailure(apiError(409, { error: 'the task changed', code: 'stale', currentVersion: 5, task: current }))
    expect(stale).toMatchObject({ status: 409, code: 'stale', current })
    expect(toTaskFailure(apiError(409, { error: 'x', code: 'project_has_tasks', taskCount: 3 })).taskCount).toBe(3)
    expect(toTaskFailure(new Error('boom')).message).toBe('boom')
  })
})

describe('client-side checks (mirror the backend)', () => {
  it('titles', () => {
    expect(checkTitle('  ok  ')).toEqual({ title: 'ok' })
    expect(checkTitle('😀'.repeat(200))).toEqual({ title: '😀'.repeat(200) }) // characters, not UTF-16 units
    for (const bad of ['', '  ', 'x'.repeat(201), 'a\nb', 'a\u0085b', 'a\u2028b', 'a\u202eb', 'a\u2066b', 'a\u2069b', 'a\u202ab']) expect(checkTitle(bad)).toHaveProperty('error')
  })

  it('description size in UTF-8 bytes', () => {
    expect(descriptionTooLarge('é'.repeat(32 * 1024))).toBe(false)
    expect(descriptionTooLarge('é'.repeat(32 * 1024) + 'x')).toBe(true)
  })

  it('note refs follow the note path rules exactly', () => {
    expect(isNoteRef('a/b.md')).toBe(true)
    for (const bad of ['a/b', '/a.md', '../a.md', '.obsidian/a.md', 'a//b.md', 'a\\b.md', '.md', ' a.md', null]) {
      expect(isNoteRef(bad)).toBe(false)
    }
  })

  it('linkable slots: Quartizo names, workspace sessions only of this workspace', () => {
    expect(isLinkableSlot('quartizo-lx2k9a-abc123', UID)).toBe(true)
    expect(isLinkableSlot(`quartizo-w${UID}-lx2k9a-abc123`, UID)).toBe(true)
    expect(isLinkableSlot(`quartizo-w${'b'.repeat(32)}-lx2k9a-abc123`, UID)).toBe(false)
    expect(isLinkableSlot('main', UID)).toBe(false)
    expect(isLinkableSlot(null, UID)).toBe(false)
  })
})
