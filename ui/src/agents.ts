/**
 * Agent and subagent monitoring (QTZ-012, M5): pure logic for the Agents tab,
 * kept free of React and of runtime SDK imports so it can be tested in Node.
 *
 * Everything here reads what the `/api/chat` grant already reaches; see
 * docs/m5.md for the route table. Wire shapes, read from kirocrew 0.10.0rc4:
 *
 *   GET /api/chat/slots -> array of slot rows (chat_api/slot_detail.py:50,
 *     slot_projection.py:378-518, state.py:9698-9750). The owner's page gets
 *     every listed session; nothing in the list is filtered for it.
 *   GET /api/chat/slots/{key}?limit=N -> {key, title, running, stopping,
 *     messages[], total, has_more, ...} (chat_api/slot_detail.py:786-1315;
 *     N is clamped to 500).
 *   Transcript rows: {role, content, ts, meta?}. Tool calls are role "tool"
 *     with content "<icon> <title>": 🔧 started, ✅ approved/finished, 🚫 refused
 *     ("🚫 <title> — <reason>"); meta {tool_call_id, input, kind, done?, output?}
 *     (chat_turn/tool_rows.py:49-130, chat_runner.py:10885, :11856). A failed
 *     tool is NOT marked on the row; `done` only says the call ended.
 *   Subagent completions are injected rows whose content starts with
 *     "[Subagent completion event]" and whose meta.subagentCompletion is
 *     {kind: "single", agentId, agentName, outcome: ok|failed|stopped|interrupted,
 *     task, resolvedModel} (subagent_completion_meta.py, system_notices.py:59-101).
 *
 * All strings that reach the page are untrusted (tool args and outputs, agent
 * text, titles): they are flattened and clipped here, and rendered as text nodes.
 */
import type { Repo } from './gitApi'
import type { Workspace } from './notesApi'
import { isSlotName, slotWorkspaceUid } from './slots'
import type { Task } from './tasksApi'

/** Rows asked for per transcript read (`?limit=`). */
export const DETAIL_ROWS = 50
/** Rows of that page shown in the detail view. */
export const SUMMARY_ROWS = 20
/** At most this many Quartizo sessions get a transcript read per poll, most recent first. */
export const MAX_DETAIL_SESSIONS = 12
export const TEXT_MAX = 120
export const ERROR_MAX = 300
export const INPUT_MAX = 160

const CONTROL_RE = /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g

/** One line, no control or bidi characters, at most `max` code points (with `…`). */
export function clip(value: unknown, max = TEXT_MAX): string {
  if (typeof value !== 'string') return ''
  const flat = value.replace(CONTROL_RE, ' ').replace(/\s+/g, ' ').trim()
  const chars = Array.from(flat)
  return chars.length <= max ? flat : `${chars.slice(0, Math.max(0, max - 1)).join('')}…`
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

/** Epoch ms of an ISO timestamp, or null. */
export function parseTs(value: unknown): number | null {
  if (typeof value !== 'string' || !value) return null
  const t = Date.parse(value)
  return Number.isFinite(t) ? t : null
}

// ---------------------------------------------------------------- slot list

export interface SessionRow {
  key: string
  title: string
  /** Owning app ("" = an owner session, which is what the page creates). */
  app: string
  origin: string
  running: boolean
  stopping: boolean
  compacting: boolean
  pendingApproval: boolean
  needsInput: boolean
  interrupted: boolean
  /** Newest tool / assistant row, else the newest row, else creation. */
  lastActivityAt: number | null
  createdAt: number | null
  workspace: string
  project: string
  messages: number
  turn: number | null
  /** Per gateway process: a change means the gateway restarted. */
  turnGen: string
  queueDepth: number
  subagentsRunning: boolean
  subagentsQueued: number
  /** Slot key of the session that opened this one (`parent.slot`), or "". */
  parentKey: string
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

export function parseSlotRow(raw: unknown): SessionRow | null {
  const r = obj(raw)
  const key = str(r.key)
  if (!key) return null
  const parent = obj(r.parent)
  return {
    key,
    title: str(r.title),
    app: str(r.app),
    origin: str(r.origin),
    running: r.running === true,
    stopping: r.stopping === true,
    compacting: r.compacting === true,
    pendingApproval: r.pending_approval === true,
    needsInput: r.needs_input === true,
    interrupted: r.interrupted === true,
    lastActivityAt: parseTs(r.last_activity_ts) ?? parseTs(r.last_ts) ?? null,
    createdAt: parseTs(r.created),
    workspace: str(r.workspace),
    project: str(r.project),
    messages: num(r.messages),
    turn: typeof r.turn === 'number' ? r.turn : null,
    turnGen: str(r.turn_gen),
    queueDepth: num(r.queue_depth),
    subagentsRunning: r.subagents_running === true,
    subagentsQueued: num(r.subagents_queued),
    parentKey: str(parent.slot) || str(parent.key),
  }
}

/** GET /api/chat/slots body -> rows. Anything but an array is a protocol error, not "no sessions". */
export function parseSlotList(raw: unknown): SessionRow[] {
  if (!Array.isArray(raw)) throw new Error('GET /api/chat/slots did not return a list')
  const out: SessionRow[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    const row = parseSlotRow(item)
    if (row && !seen.has(row.key)) {
      seen.add(row.key)
      out.push(row)
    }
  }
  return out
}

/** The process generation the list was served by ("" when absent). */
export function listGeneration(rows: SessionRow[]): string {
  return rows.find(r => r.turnGen)?.turnGen ?? ''
}

// ------------------------------------------------------------ visibility

export type Visibility =
  | { cls: 'quartizo'; kind: 'chat-tab' }
  | { cls: 'quartizo'; kind: 'workspace'; workspaceUid: string }
  | { cls: 'other' }

/**
 * Quartizo-created = a name the page generates (`isSlotName`) on an owner
 * session or one owned by Quartizo's app token. Anything else, including a
 * Quartizo-looking name owned by another app, is "other": shown read-only,
 * never given a transcript read or any context.
 */
export function classifySession(row: Pick<SessionRow, 'key' | 'app'>): Visibility {
  if (!isSlotName(row.key) || (row.app !== '' && row.app !== 'quartizo')) return { cls: 'other' }
  const uid = slotWorkspaceUid(row.key)
  return uid ? { cls: 'quartizo', kind: 'workspace', workspaceUid: uid } : { cls: 'quartizo', kind: 'chat-tab' }
}

export function partitionSessions(rows: SessionRow[]): { quartizo: SessionRow[]; other: SessionRow[] } {
  const quartizo: SessionRow[] = []
  const other: SessionRow[] = []
  for (const r of rows) (classifySession(r).cls === 'quartizo' ? quartizo : other).push(r)
  const byActivity = (a: SessionRow, b: SessionRow) =>
    (b.lastActivityAt ?? b.createdAt ?? 0) - (a.lastActivityAt ?? a.createdAt ?? 0) || a.key.localeCompare(b.key)
  return { quartizo: quartizo.sort(byActivity), other: other.sort(byActivity) }
}

// --------------------------------------------------------------- status

export type RunState = 'running' | 'stopping' | 'idle' | 'error'

/**
 * Factual state: the gateway's own `stopping` / `running` flags first, then
 * `error` only when the newest transcript row read is an error row (the same
 * rule as the Notes chat status). Without a transcript read the answer is
 * `idle`, never `done`: nothing here infers completion from silence.
 */
export function sessionStatus(
  row: Pick<SessionRow, 'running' | 'stopping'>,
  summary?: Pick<TranscriptSummary, 'lastIsError'> | null,
): RunState {
  if (row.stopping) return 'stopping'
  if (row.running) return 'running'
  return summary?.lastIsError ? 'error' : 'idle'
}

/** Extra facts from the list row, shown beside the status. */
export function sessionFlags(row: SessionRow): string[] {
  const flags: string[] = []
  if (row.compacting) flags.push('compacting')
  if (row.pendingApproval) flags.push('approval pending')
  if (row.needsInput) flags.push('waiting for input')
  if (row.interrupted && !row.running) flags.push('last turn interrupted')
  if (row.queueDepth > 0) flags.push(`${row.queueDepth} queued message(s)`)
  if (row.subagentsRunning) flags.push('subagents running')
  if (row.subagentsQueued > 0) flags.push(`${row.subagentsQueued} subagent(s) queued`)
  return flags
}

/** What changes when a session's transcript changes, so unchanged sessions are not re-read. */
export function rowFingerprint(row: SessionRow): string {
  return [row.messages, row.lastActivityAt, row.running, row.stopping, row.turn, row.turnGen].join('|')
}

/** The Quartizo sessions whose transcripts a poll reads: the selected one, then the most recent. */
export function detailTargets(quartizo: SessionRow[], selected: string | null, max = MAX_DETAIL_SESSIONS): SessionRow[] {
  const sel = quartizo.find(r => r.key === selected)
  const rest = quartizo.filter(r => r.key !== selected)
  return (sel ? [sel, ...rest] : rest).slice(0, Math.max(0, max))
}

// ------------------------------------------------------------ transcript

export type ToolState = 'running' | 'done' | 'refused' | 'no-result'

export const TOOL_STATE_LABELS: Record<ToolState, string> = {
  running: 'running',
  done: 'ended',
  refused: 'refused',
  'no-result': 'no result recorded',
}

export type SubagentOutcome = 'ok' | 'failed' | 'stopped' | 'interrupted'
const OUTCOMES = new Set<string>(['ok', 'failed', 'stopped', 'interrupted'])
const GLYPH_OUTCOME: Record<string, SubagentOutcome> = { '✅': 'ok', '❌': 'failed', '⏹': 'stopped', '⚠': 'interrupted' }

export interface SubagentRecord {
  agentId: string
  agentName: string
  outcome: SubagentOutcome
  task: string
  model: string
  at: number | null
}

export type SummaryKind = 'tool' | 'error' | 'user' | 'assistant' | 'permission' | 'subagent' | 'other'

export interface SummaryRow {
  at: number | null
  kind: SummaryKind
  /** Tool name, or a clipped text preview. */
  label: string
  /** Tool state, subagent outcome, or permission state. */
  status: string
  /** Clipped tool input (untrusted). */
  detail: string
}

export interface TranscriptSummary {
  /** The newest SUMMARY_ROWS rows, oldest first. */
  rows: SummaryRow[]
  /** Rows actually read (at most DETAIL_ROWS). */
  scanned: number
  /** The gateway's transcript size, or null when it did not say. */
  total: number | null
  /** Older rows exist beyond what was read. */
  hasMore: boolean
  toolCalls: number
  toolsRunning: number
  toolsRefused: number
  errors: number
  lastIsError: boolean
  lastAt: number | null
  running: boolean
  subagents: SubagentRecord[]
  subagentBatches: number
}

const TOOL_ICONS: Record<string, ToolState> = { '🔧': 'running', '✅': 'done', '🚫': 'refused' }
const TOOL_RANK: Record<ToolState, number> = { running: 0, 'no-result': 0, done: 1, refused: 2 }

function parseTool(content: string, meta: Record<string, unknown>, sessionRunning: boolean): { name: string; state: ToolState } {
  const icon = Array.from(content)[0] ?? ''
  let state: ToolState = TOOL_ICONS[icon] ?? 'running'
  let name = TOOL_ICONS[icon] ? content.slice(icon.length).trim() : content.trim()
  if (state === 'refused') name = name.split(' — ')[0]
  if (state === 'running' && meta.done === true) state = 'done'
  // A call with no completion on record in a session that is not running is
  // not "running": the gateway just never recorded its result.
  if (state === 'running' && !sessionRunning) state = 'no-result'
  return { name, state }
}

function parseSubagent(content: string, meta: Record<string, unknown>, at: number | null): SubagentRecord | 'batch' | null {
  const facts = obj(meta.subagentCompletion)
  if (facts.kind === 'single' && str(facts.agentId) && OUTCOMES.has(str(facts.outcome))) {
    return {
      agentId: clip(facts.agentId, 80),
      agentName: clip(facts.agentName, 80),
      outcome: str(facts.outcome) as SubagentOutcome,
      task: clip(facts.task),
      model: clip(facts.resolvedModel, 80),
      at,
    }
  }
  if (facts.kind === 'batch' || content.startsWith('[Subagent batch completion event]')) return 'batch'
  if (!content.startsWith('[Subagent completion event]')) return null
  // Legacy rows without meta: the header line "Agent `<id>` <glyph> ...".
  const m = /^Agent `([^`\n]+)`[^\n]*?([✅❌⏹⚠])/m.exec(content.split('\n\n', 1)[0])
  if (!m) return null
  const task = /^Task: (.*)$/m.exec(content)
  return { agentId: clip(m[1], 80), agentName: '', outcome: GLYPH_OUTCOME[m[2]], task: clip(task?.[1] ?? ''), model: '', at }
}

/** Summarize one GET /api/chat/slots/{key}?limit=N body. Never throws on odd rows. */
export function summarizeTranscript(detail: unknown, opts: { rows?: number } = {}): TranscriptSummary {
  const d = obj(detail)
  const msgs = Array.isArray(d.messages) ? d.messages : []
  const running = d.running === true
  const keep = opts.rows ?? SUMMARY_ROWS
  const out: SummaryRow[] = []
  const tools = new Map<string, ToolState>()
  let anon = 0
  let errors = 0
  let lastAt: number | null = null
  const subagents = new Map<string, SubagentRecord>()
  let batches = 0
  let lastRole = ''

  for (const raw of msgs) {
    const m = obj(raw)
    const role = str(m.role)
    const content = typeof m.content === 'string' ? m.content : ''
    const meta = obj(m.meta)
    const at = parseTs(m.ts)
    if (at !== null && (lastAt === null || at > lastAt)) lastAt = at
    lastRole = role

    const sub = parseSubagent(content, meta, at)
    if (sub === 'batch') {
      batches++
      out.push({ at, kind: 'subagent', label: 'Subagent batch results', status: '', detail: '' })
      continue
    }
    if (sub) {
      subagents.delete(sub.agentId)
      subagents.set(sub.agentId, sub)
      out.push({ at, kind: 'subagent', label: sub.agentName || sub.agentId, status: sub.outcome, detail: sub.task })
      continue
    }

    if (role === 'tool') {
      const { name, state } = parseTool(content, meta, running)
      const id = str(meta.tool_call_id)
      const toolKey = id ? `id:${id}` : `row:${anon++}`
      const prev = tools.get(toolKey)
      tools.set(toolKey, prev && TOOL_RANK[prev] > TOOL_RANK[state] ? prev : state)
      out.push({ at, kind: 'tool', label: clip(name) || '(unnamed tool)', status: TOOL_STATE_LABELS[state], detail: clip(meta.input, INPUT_MAX) })
    } else if (role === 'error') {
      errors++
      out.push({ at, kind: 'error', label: clip(content, ERROR_MAX) || '(error)', status: 'error', detail: '' })
    } else if (role === 'user' || role === 'assistant' || role === 'streaming') {
      out.push({
        at,
        kind: role === 'user' ? 'user' : 'assistant',
        label: clip(content),
        status: role === 'streaming' ? 'streaming' : '',
        detail: '',
      })
    } else if (role === 'permission') {
      out.push({ at, kind: 'permission', label: clip(content), status: meta.resolved ? clip(meta.resolved, 40) : 'pending', detail: clip(meta.tool_input, INPUT_MAX) })
    } else {
      out.push({ at, kind: 'other', label: clip(content), status: clip(role, 40), detail: '' })
    }
  }

  let toolsRunning = 0
  let toolsRefused = 0
  for (const s of tools.values()) {
    if (s === 'running') toolsRunning++
    if (s === 'refused') toolsRefused++
  }
  const total = typeof d.total === 'number' && Number.isFinite(d.total) ? d.total : null
  return {
    rows: out.slice(-Math.max(0, keep)),
    scanned: msgs.length,
    total,
    hasMore: d.has_more === true || (total !== null && total > msgs.length),
    toolCalls: tools.size,
    toolsRunning,
    toolsRefused,
    errors,
    lastIsError: lastRole === 'error',
    lastAt,
    running,
    subagents: [...subagents.values()],
    subagentBatches: batches,
  }
}

// ---------------------------------------------------------------- links

export interface LinkedTask {
  workspace: Workspace
  task: Task
}

/** Tasks whose `slot_id` names this session, across the loaded boards. */
export function tasksForSession(boards: { workspace: Workspace; tasks: Task[] }[], key: string): LinkedTask[] {
  const out: LinkedTask[] = []
  for (const b of boards) for (const t of b.tasks) if (t.slot_id === key) out.push({ workspace: b.workspace, task: t })
  return out
}

export function workspaceForSession(workspaces: Workspace[], key: string): Workspace | null {
  const uid = slotWorkspaceUid(key)
  return uid ? (workspaces.find(w => w.uid === uid) ?? null) : null
}

/**
 * The registered repo containing the session's working directory (`project`),
 * deepest first; null when there is none. A path-boundary match, so
 * /a/repo-x is not inside /a/repo.
 */
export function repoForProject(repos: Repo[], project: string): Repo | null {
  if (!project || !project.startsWith('/')) return null
  const p = project.length > 1 ? project.replace(/\/+$/, '') : project
  let best: Repo | null = null
  for (const r of repos) {
    const base = r.path.length > 1 ? r.path.replace(/\/+$/, '') : r.path
    if (p === base || p.startsWith(base + '/')) {
      if (!best || base.length > best.path.length) best = r
    }
  }
  return best
}

/** Sessions the gateway lists as opened by `key` (its `parent` edge). Read-only. */
export function childSessions(rows: SessionRow[], key: string): SessionRow[] {
  return rows.filter(r => r.parentKey === key && r.key !== key)
}

// ------------------------------------------------------------ visibility note

export const VISIBILITY_CAN = [
  'every session GET /api/chat/slots lists for the dashboard owner (this page calls as the owner); only sessions Quartizo named (quartizo-…) get details',
  `the newest ${DETAIL_ROWS} transcript rows of a Quartizo session: tool call names and whether they ended or were refused, errors, timestamps`,
  'subagents that finished: their completion rows in that transcript page (id, name, outcome, task)',
  'whether a session has subagents running, and how many are queued (flags on the session list)',
]

export const VISIBILITY_CANNOT = [
  'individual running subagents, their tools or their transcripts (no /api/chat route exposes them; see docs/m5.md)',
  'whether a tool call failed: the gateway records only that it ended',
  'live streaming: this view polls every 5 s while visible, so it can lag',
  'rows older than the page read, and sessions the gateway does not list (cron, system, other hosts)',
  'other sessions’ contents: they are listed read-only, never read or given context',
]
