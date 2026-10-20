import { describe, expect, it } from 'vitest'
import {
  childSessions,
  classifySession,
  clip,
  DETAIL_ROWS,
  detailTargets,
  listGeneration,
  parseSlotList,
  parseSlotRow,
  parseTs,
  partitionSessions,
  repoForProject,
  rowFingerprint,
  shouldReadDetail,
  type SessionRow,
  sessionFlags,
  sessionStatus,
  summarizeTranscript,
  SUMMARY_ROWS,
  tasksForSession,
  VISIBILITY_CANNOT,
  workspaceForSession,
} from '../src/agentsModel'
import type { Repo } from '../src/gitApi'
import type { Workspace } from '../src/notesApi'
import type { Task } from '../src/tasksApi'

const UID = '0123456789abcdef0123456789abcdef'
const WS_KEY = `quartizo-w${UID}-lx2k9a-0a1b2c`
const TAB_KEY = 'quartizo-lx2k9a-0a1b2c'

/** A slot row as measured on kirocrew 0.10.0rc4 (subset of GET /api/chat/slots fields). */
function wire(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    key: TAB_KEY,
    title: '',
    app: '',
    origin: 'user',
    running: false,
    stopping: false,
    stop_state: 'idle',
    compacting: false,
    pending_approval: false,
    needs_input: false,
    interrupted: false,
    last_activity_ts: '',
    last_ts: '2026-10-20T16:29:37.227399+00:00',
    created: '2026-10-20T10:53:21.536770-04:00',
    workspace: 'default',
    project: '/home/u/.kiro/crew/workspace',
    messages: 1,
    turn: 3,
    turn_gen: 'gen-a',
    queue_depth: 0,
    subagents_running: false,
    subagents_queued: 0,
    parent: null,
    ...over,
  }
}

function row(over: Record<string, unknown> = {}): SessionRow {
  return parseSlotRow(wire(over))!
}

describe('clip', () => {
  it('flattens control, bidi and line separators and caps length', () => {
    expect(clip('a\nb\tc\u202ed\u2028e\u0000f')).toBe('a b c d e f')
    expect(clip('x'.repeat(10), 5)).toBe('xxxx…')
    expect(clip('😀😀😀', 2)).toBe('😀…')
    expect(clip(42)).toBe('')
    expect(clip(null)).toBe('')
  })

  it('leaves markup as plain text (rendered as text nodes, never parsed)', () => {
    expect(clip('<img src=x onerror=alert(1)>')).toBe('<img src=x onerror=alert(1)>')
  })
})

describe('parseSlotRow / parseSlotList', () => {
  it('reads the measured wire fields', () => {
    const r = row({ last_activity_ts: '2026-10-20T16:30:00+00:00', subagents_running: true, subagents_queued: 2, parent: { slot: 'p', key: 'p' } })
    expect(r).toMatchObject({
      key: TAB_KEY,
      app: '',
      running: false,
      lastActivityAt: Date.parse('2026-10-20T16:30:00+00:00'),
      createdAt: Date.parse('2026-10-20T10:53:21.536770-04:00'),
      subagentsRunning: true,
      subagentsQueued: 2,
      parentKey: 'p',
      turnGen: 'gen-a',
    })
  })

  it('falls back to last_ts when there is no tool/assistant activity', () => {
    expect(row().lastActivityAt).toBe(Date.parse('2026-10-20T16:29:37.227399+00:00'))
    expect(row({ last_ts: '', last_activity_ts: '' }).lastActivityAt).toBeNull()
  })

  it('treats only literal true as true', () => {
    const r = row({ running: 'true', stopping: 1, subagents_running: 'yes' })
    expect([r.running, r.stopping, r.subagentsRunning]).toEqual([false, false, false])
  })

  it('drops rows without a key and duplicate keys', () => {
    expect(parseSlotList([wire(), { title: 'x' }, wire(), null, 'junk']).map(r => r.key)).toEqual([TAB_KEY])
  })

  it('refuses a body that is not a list instead of reading it as "no sessions"', () => {
    expect(() => parseSlotList({ slots: [] })).toThrow(/did not return a list/)
    expect(() => parseSlotList(undefined)).toThrow()
  })

  it('finds the process generation', () => {
    expect(listGeneration([row({ turn_gen: '' }), row({ key: 'b', turn_gen: 'g2' })])).toBe('g2')
    expect(listGeneration([])).toBe('')
  })
})

describe('classifySession (visibility)', () => {
  const CREATED = new Set([TAB_KEY, WS_KEY])

  it('Quartizo-created: recorded generated names on owner or quartizo app sessions', () => {
    expect(classifySession({ key: TAB_KEY, app: '' }, CREATED)).toEqual({ cls: 'quartizo', kind: 'chat-tab' })
    expect(classifySession({ key: WS_KEY, app: '' }, CREATED)).toEqual({ cls: 'quartizo', kind: 'workspace', workspaceUid: UID })
    expect(classifySession({ key: TAB_KEY, app: 'quartizo' }, CREATED).cls).toBe('quartizo')
  })

  it('a matching name that was never recorded is other', () => {
    const unrecorded = 'quartizo-lx2k9b-ffffff'
    expect(classifySession({ key: unrecorded, app: '' }, CREATED)).toEqual({ cls: 'other' })
    expect(classifySession({ key: TAB_KEY, app: '' }, new Set())).toEqual({ cls: 'other' })
    const p = partitionSessions([row({ key: unrecorded }), row({ key: TAB_KEY })], CREATED)
    expect(p.quartizo.map(r => r.key)).toEqual([TAB_KEY])
    expect(p.other.map(r => r.key)).toEqual([unrecorded])
  })

  it('a recorded key that is not a Quartizo name is still other', () => {
    expect(classifySession({ key: 'main', app: 'quartizo' }, new Set(['main']))).toEqual({ cls: 'other' })
  })

  it('everything else is other (read-only)', () => {
    for (const r of [
      { key: 'dashboard:chat-2-1787502679', app: '' },
      { key: 'main', app: 'quartizo' }, // app-token slot measured live: not a name the page makes
      { key: 'quartizo-it-1792504816', app: 'quartizo' },
      { key: 'quartizo-ap-1792505298', app: '' },
      { key: TAB_KEY, app: 'other-app' }, // a Quartizo-looking name owned by another app
      { key: `${TAB_KEY} `, app: '' },
      { key: 'QUARTIZO-a-000000', app: '' },
    ]) {
      expect(classifySession(r, new Set([...CREATED, r.key])), r.key).toEqual({ cls: 'other' })
    }
  })

  it('partitions and orders by last activity', () => {
    const a = row({ key: TAB_KEY, last_ts: '2026-10-20T10:00:00Z' })
    const b = row({ key: WS_KEY, last_ts: '2026-10-20T12:00:00Z' })
    const o = row({ key: 'dashboard:x', last_ts: '2026-10-20T13:00:00Z' })
    const p = partitionSessions([a, o, b], new Set([TAB_KEY, WS_KEY, 'dashboard:x']))
    expect(p.quartizo.map(r => r.key)).toEqual([WS_KEY, TAB_KEY])
    expect(p.other.map(r => r.key)).toEqual(['dashboard:x'])
  })
})

describe('shouldReadDetail', () => {
  const r = row()
  const ok = { fp: rowFingerprint(r), failure: null, failedAt: null, failures: 0 }
  const failed = (failures: number, failedAt = 1000) => ({ ...ok, failure: { kind: 'unknown' }, failedAt, failures })

  it('reads a key never read, or whose fingerprint changed; skips an unchanged idle one', () => {
    expect(shouldReadDetail(undefined, r, 0)).toBe(true)
    expect(shouldReadDetail(ok, r, 0)).toBe(false)
    expect(shouldReadDetail({ ...ok, fp: 'old' }, r, 0)).toBe(true)
  })

  it('always re-reads a running session, even with an unchanged fingerprint', () => {
    const running = row({ running: true })
    expect(shouldReadDetail({ ...ok, fp: rowFingerprint(running) }, running, 0)).toBe(true)
  })

  it('backs a failed key off 60 s, doubling to 5 min, whatever its fingerprint', () => {
    const running = row({ running: true })
    expect(shouldReadDetail(failed(1), r, 1000 + 59_999)).toBe(false)
    expect(shouldReadDetail(failed(1), r, 1000 + 60_000)).toBe(true)
    expect(shouldReadDetail(failed(2), r, 1000 + 119_999)).toBe(false)
    expect(shouldReadDetail(failed(2), r, 1000 + 120_000)).toBe(true)
    expect(shouldReadDetail(failed(1), running, 1000 + 1)).toBe(false)
    expect(shouldReadDetail({ ...failed(3), fp: 'old' }, r, 1000 + 239_999)).toBe(false)
    expect(shouldReadDetail(failed(9), r, 1000 + 299_999)).toBe(false)
    expect(shouldReadDetail(failed(9), r, 1000 + 300_000)).toBe(true)
  })
})

describe('sessionStatus', () => {
  const err = { lastIsError: true }
  it('takes the gateway flags first', () => {
    expect(sessionStatus({ running: true, stopping: true }, err)).toBe('stopping')
    expect(sessionStatus({ running: true, stopping: false }, err)).toBe('running')
  })
  it('error only from a read transcript whose last row is an error', () => {
    expect(sessionStatus({ running: false, stopping: false }, err)).toBe('error')
    expect(sessionStatus({ running: false, stopping: false }, { lastIsError: false })).toBe('idle')
  })
  it('never reports done: without a transcript the answer is idle', () => {
    expect(sessionStatus({ running: false, stopping: false })).toBe('idle')
    expect(sessionStatus({ running: false, stopping: false }, null)).toBe('idle')
  })

  it('lists flags', () => {
    expect(sessionFlags(row({ pending_approval: true, interrupted: true, queue_depth: 2, subagents_running: true, subagents_queued: 1 }))).toEqual([
      'approval pending',
      'last turn interrupted',
      '2 queued message(s)',
      'subagents running',
      '1 subagent(s) queued',
    ])
    expect(sessionFlags(row({ interrupted: true, running: true }))).toEqual([])
  })
})

describe('detail targets and fingerprints', () => {
  it('reads the selected session first, then the most recent, bounded', () => {
    const rows = ['a', 'b', 'c', 'd'].map(k => row({ key: k }))
    expect(detailTargets(rows, 'c', 2).map(r => r.key)).toEqual(['c', 'a'])
    expect(detailTargets(rows, null, 2).map(r => r.key)).toEqual(['a', 'b'])
    expect(detailTargets(rows, 'zz', 0)).toEqual([])
  })

  it('changes when the transcript or run state changes, including a gateway restart', () => {
    const base = rowFingerprint(row())
    expect(rowFingerprint(row())).toBe(base)
    for (const over of [{ messages: 2 }, { running: true }, { stopping: true }, { turn: 4 }, { turn_gen: 'gen-b' }, { last_activity_ts: '2026-10-21T00:00:00Z' }]) {
      expect(rowFingerprint(row(over)), JSON.stringify(over)).not.toBe(base)
    }
  })
})

const T0 = '2026-10-20T16:00:00.000000+00:00'
const ts = (s: number) => new Date(Date.parse(T0) + s * 1000).toISOString()

describe('summarizeTranscript', () => {
  it('counts tool calls once per tool_call_id and derives their state', () => {
    const s = summarizeTranscript({
      running: false,
      total: 9,
      has_more: false,
      messages: [
        { role: 'user', content: 'do it', ts: ts(0) },
        { role: 'tool', content: '🔧 Read file', ts: ts(1), meta: { tool_call_id: 'a', input: '{"path":"x"}', done: true } },
        // auto-approved: a second row with the same id
        { role: 'tool', content: '✅ Read file', ts: ts(2), meta: { tool_call_id: 'a' } },
        { role: 'tool', content: '🚫 Shell — denied by policy', ts: ts(3), meta: { tool_call_id: 'b' } },
        { role: 'tool', content: '🔧 grep', ts: ts(4), meta: { tool_call_id: 'c' } },
        { role: 'assistant', content: 'done', ts: ts(5) },
      ],
    })
    expect(s.toolCalls).toBe(3)
    expect(s.toolsRefused).toBe(1)
    expect(s.toolsRunning).toBe(0)
    const tools = s.rows.filter(r => r.kind === 'tool')
    expect(tools.map(t => [t.label, t.status])).toEqual([
      ['Read file', 'ended'],
      ['Read file', 'ended'],
      ['Shell', 'refused'],
      // not running and no completion recorded: say so, do not call it running or done
      ['grep', 'no result recorded'],
    ])
    expect(tools[0].detail).toBe('{"path":"x"}')
    expect(s.lastAt).toBe(Date.parse(ts(5)))
    expect(s.errors).toBe(0)
    expect(s.lastIsError).toBe(false)
  })

  it('reports a started call as running only while the session runs', () => {
    const s = summarizeTranscript({ running: true, messages: [{ role: 'tool', content: '🔧 Shell', meta: { tool_call_id: 'x' } }] })
    expect(s.toolsRunning).toBe(1)
    expect(s.rows[0].status).toBe('running')
  })

  it('a refusal outranks a later done row for the same call', () => {
    const s = summarizeTranscript({
      messages: [
        { role: 'tool', content: '🚫 Shell — no', meta: { tool_call_id: 'x' } },
        { role: 'tool', content: '🔧 Shell', meta: { tool_call_id: 'x', done: true } },
      ],
    })
    expect([s.toolCalls, s.toolsRefused]).toEqual([1, 1])
  })

  it('counts tool rows without an id individually', () => {
    expect(summarizeTranscript({ messages: [{ role: 'tool', content: '🔧 a' }, { role: 'tool', content: '🔧 a' }] }).toolCalls).toBe(2)
  })

  it('counts errors and flags a trailing error', () => {
    const s = summarizeTranscript({
      messages: [
        { role: 'error', content: 'boom 1', ts: ts(1) },
        { role: 'assistant', content: 'retrying', ts: ts(2) },
        { role: 'error', content: 'boom 2\nstack', ts: ts(3) },
      ],
    })
    expect(s.errors).toBe(2)
    expect(s.lastIsError).toBe(true)
    expect(s.rows.at(-1)).toMatchObject({ kind: 'error', label: 'boom 2 stack', status: 'error' })
  })

  it('keeps only the newest SUMMARY_ROWS rows but counts all rows read', () => {
    const msgs = Array.from({ length: DETAIL_ROWS }, (_, i) => ({ role: 'tool', content: `🔧 t${i}`, meta: { tool_call_id: `id${i}`, done: true }, ts: ts(i) }))
    const s = summarizeTranscript({ messages: msgs, total: 400, has_more: true })
    expect(s.rows).toHaveLength(SUMMARY_ROWS)
    expect(s.rows[0].label).toBe(`t${DETAIL_ROWS - SUMMARY_ROWS}`)
    expect(s.toolCalls).toBe(DETAIL_ROWS)
    expect([s.scanned, s.total, s.hasMore]).toEqual([DETAIL_ROWS, 400, true])
  })

  it('clips untrusted tool input and text', () => {
    const s = summarizeTranscript({
      messages: [
        { role: 'tool', content: `🔧 ${'n'.repeat(500)}`, meta: { tool_call_id: 'a', input: `${'x'.repeat(1000)}\n\u202erm -rf` } },
        { role: 'assistant', content: `<script>alert(1)</script>${'y'.repeat(1000)}` },
      ],
    })
    expect(Array.from(s.rows[0].label).length).toBeLessThanOrEqual(120)
    expect(Array.from(s.rows[0].detail).length).toBeLessThanOrEqual(160)
    expect(s.rows[0].detail).not.toMatch(/[\n\u202e]/)
    expect(s.rows[1].label.startsWith('<script>')).toBe(true)
    expect(Array.from(s.rows[1].label).length).toBeLessThanOrEqual(120)
  })

  it('never throws on odd bodies and rows', () => {
    for (const body of [null, undefined, 'x', [], { messages: 'no' }, { messages: [null, 1, 'x', { role: 7 }, { content: { a: 1 } }] }]) {
      const s = summarizeTranscript(body)
      expect(s.toolCalls).toBe(0)
    }
    expect(summarizeTranscript({}).total).toBeNull()
  })

  it('reads subagent completions from structured meta, the last one per agent winning', () => {
    const s = summarizeTranscript({
      messages: [
        {
          role: 'user',
          content: '[Subagent completion event]\nAgent `a1` ✅\nTask: x',
          ts: ts(1),
          meta: { subagentCompletion: { kind: 'single', agentId: 'a1', agentName: 'reviewer', outcome: 'failed', task: 'review\nPR', resolvedModel: 'm1' } },
        },
        { role: 'user', content: '[Subagent completion event]', ts: ts(2), meta: { subagentCompletion: { kind: 'single', agentId: 'a2', outcome: 'ok' } } },
        { role: 'user', content: 'x', ts: ts(3), meta: { subagentCompletion: { kind: 'single', agentId: 'a1', agentName: 'reviewer', outcome: 'ok' } } },
        { role: 'user', content: '[Subagent batch completion event]\nBatch results 1/1 — wave finished', ts: ts(4) },
      ],
    })
    expect(s.subagents.map(a => [a.agentId, a.outcome])).toEqual([
      ['a2', 'ok'],
      ['a1', 'ok'],
    ])
    expect(s.subagentBatches).toBe(1)
    expect(s.rows.map(r => r.kind)).toEqual(['subagent', 'subagent', 'subagent', 'subagent'])
  })

  it('falls back to the header line for legacy completion rows, and ignores unknown outcomes', () => {
    const s = summarizeTranscript({
      messages: [
        { role: 'user', content: '[Subagent completion event]\nAgent `b7` ❌ timed out\nTask: build it\nUsage: 1', ts: ts(1) },
        { role: 'user', content: '[Subagent completion event]\nAgent `b8` no glyph here' },
        { role: 'user', content: 'x', meta: { subagentCompletion: { kind: 'single', agentId: 'z', outcome: 'exploded' } } },
      ],
    })
    expect(s.subagents).toEqual([{ agentId: 'b7', agentName: '', outcome: 'failed', task: 'build it', model: '', at: Date.parse(ts(1)) }])
  })

  it('marks pending permissions', () => {
    const s = summarizeTranscript({ messages: [{ role: 'permission', content: 'Shell', meta: { tool_input: 'ls' } }, { role: 'permission', content: 'Write', meta: { resolved: 'approved' } }] })
    expect(s.rows.map(r => r.status)).toEqual(['pending', 'approved'])
  })
})

describe('links', () => {
  const ws: Workspace = { id: 3, uid: UID, name: 'Vault', path: '/v' }
  const task = (uid: string, slot: string | null): Task => ({
    id: 1, uid, project_id: UID, title: `t-${uid}`, description_markdown: '', status: 'backlog', order: 0, version: 1,
    note_ref: null, slot_id: slot, created_at: 0, updated_at: 0,
  })

  it('finds tasks linked to a session across boards', () => {
    const boards = [{ workspace: ws, tasks: [task('a', WS_KEY), task('b', null), task('c', TAB_KEY)] }]
    expect(tasksForSession(boards, WS_KEY).map(l => l.task.uid)).toEqual(['a'])
    expect(tasksForSession(boards, 'nope')).toEqual([])
  })

  it('maps a workspace session to its workspace by uid only', () => {
    expect(workspaceForSession([ws], WS_KEY)).toBe(ws)
    expect(workspaceForSession([ws], TAB_KEY)).toBeNull()
    expect(workspaceForSession([{ ...ws, uid: 'f'.repeat(32) }], WS_KEY)).toBeNull()
  })

  it('picks the deepest registered repo containing the working directory, on a path boundary', () => {
    const repos: Repo[] = [
      { id: 1, uid: 'u1', name: 'outer', path: '/a/repo' },
      { id: 2, uid: 'u2', name: 'inner', path: '/a/repo/sub' },
      { id: 3, uid: 'u3', name: 'sibling', path: '/a/repo-x' },
    ]
    expect(repoForProject(repos, '/a/repo')?.id).toBe(1)
    expect(repoForProject(repos, '/a/repo/src/')?.id).toBe(1)
    expect(repoForProject(repos, '/a/repo/sub/x')?.id).toBe(2)
    expect(repoForProject(repos, '/a/repo-x/y')?.id).toBe(3)
    expect(repoForProject(repos, '/a/rep')).toBeNull()
    expect(repoForProject(repos, '')).toBeNull()
    expect(repoForProject(repos, 'a/repo')).toBeNull()
  })

  it('lists sessions opened by a session', () => {
    const rows = [row({ key: 'c1', parent: { slot: TAB_KEY, key: TAB_KEY } }), row({ key: TAB_KEY }), row({ key: 'c2', parent: null })]
    expect(childSessions(rows, TAB_KEY).map(r => r.key)).toEqual(['c1'])
  })
})

describe('visibility note', () => {
  it('states what is not visible', () => {
    const text = VISIBILITY_CANNOT.join(' ')
    expect(text).toMatch(/running subagents/)
    expect(text).toMatch(/failed/)
    expect(text).toMatch(/polls every 5 s/)
    expect(text).toMatch(/never read or given context/)
  })
})

describe('parseTs', () => {
  it('parses the gateway ISO stamps and rejects junk', () => {
    expect(parseTs('2026-10-20T16:29:37.227399+00:00')).toBe(Date.parse('2026-10-20T16:29:37.227Z'))
    expect(parseTs('')).toBeNull()
    expect(parseTs('nope')).toBeNull()
    expect(parseTs(5)).toBeNull()
  })
})
