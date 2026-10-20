import { type AppApi, useAppEvents, useNavigate } from '@kirocrew/app-sdk'
import { Btn } from '@kirocrew/app-sdk/ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  childSessions,
  classifySession,
  clip,
  DETAIL_ROWS,
  detailTargets,
  type LinkedTask,
  listGeneration,
  MAX_DETAIL_SESSIONS,
  parseSlotList,
  partitionSessions,
  repoForProject,
  rowFingerprint,
  type RunState,
  type SessionRow,
  sessionFlags,
  sessionStatus,
  shouldReadDetail,
  type SubagentRecord,
  SUMMARY_ROWS,
  summarizeTranscript,
  tasksForSession,
  type TranscriptSummary,
  VISIBILITY_CAN,
  VISIBILITY_CANNOT,
  workspaceForSession,
} from './agentsModel'
import { Alert } from './Chat'
import {
  freshnessView,
  type Freshness,
  INITIAL_FRESHNESS,
  nextDelay,
  onPollFailure,
  onPollSuccess,
  POLL_MS,
  resumeDelay,
  withTimeout,
} from './freshness'
import { listRepos, type Repo } from './gitApi'
import { listWorkspaces, toFailure, type Workspace } from './notesApi'
import { classifyError, type Failure, listCreatedSlots, SLOTS_PATH, slotDetailPath, transcriptPath } from './slots'
import { listTasks, type Task } from './tasksApi'

const S = {
  column: { display: 'flex', flexDirection: 'column' as const, gap: 8, minHeight: 0, minWidth: 0 },
  row: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const },
  panel: { padding: 8, borderRadius: 4, border: '1px solid rgba(128,128,128,.3)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  note: { padding: 8, borderRadius: 4, border: '1px solid rgba(80,140,255,.5)', fontSize: 13 },
  stale: { padding: 6, borderRadius: 4, border: '1px solid rgba(220,120,0,.7)' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  cell: { padding: '3px 6px', borderBottom: '1px solid rgba(128,128,128,.2)', textAlign: 'left' as const, verticalAlign: 'top' as const },
  plain: { background: 'transparent', color: 'inherit', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' as const, font: 'inherit' },
  mono: { fontFamily: 'ui-monospace, monospace', fontSize: 12, overflowWrap: 'anywhere' as const },
}

const STATUS_COLOR: Record<RunState, string> = {
  running: 'rgba(40,160,80,.9)',
  stopping: 'rgba(220,120,0,.9)',
  idle: 'rgba(128,128,128,.9)',
  error: 'rgba(210,50,50,.9)',
}

function fmtTime(ms: number | null): string {
  return ms === null ? '—' : new Date(ms).toLocaleTimeString()
}

function fmtWhen(ms: number | null, now: number): string {
  if (ms === null) return '—'
  const s = Math.round((now - ms) / 1000)
  if (s < 0) return new Date(ms).toLocaleString()
  if (s < 60) return `${s} s ago`
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return new Date(ms).toLocaleDateString()
}

function StatusBadge({ status, stale }: { status: RunState; stale: boolean }) {
  return (
    <span
      data-status={status}
      title={stale ? 'Last known state; the latest poll failed' : undefined}
      style={{ color: STATUS_COLOR[status], fontWeight: 600, opacity: stale ? 0.6 : 1 }}
    >
      {status}
      {stale ? ' (stale)' : ''}
    </span>
  )
}

interface SummaryEntry {
  fp: string
  summary: TranscriptSummary | null
  at: number | null
  failure: Failure | null
  /** Latest failed read (epoch ms) and consecutive failures: the per-key backoff. */
  failedAt: number | null
  failures: number
}

interface Links {
  workspaces: Workspace[]
  boards: { workspace: Workspace; tasks: Task[] }[]
  repos: Repo[]
  failure: string | null
}

const NO_LINKS: Links = { workspaces: [], boards: [], repos: [], failure: null }

/** Workspaces, their boards and registered repos: what sessions link to. Partial failures are reported, not fatal. */
async function loadLinks(api: AppApi): Promise<Links> {
  const problems: string[] = []
  let workspaces: Workspace[] = []
  let repos: Repo[] = []
  const boards: Links['boards'] = []
  try {
    workspaces = await listWorkspaces(api)
  } catch (err) {
    problems.push(`workspaces: ${toFailure(err).message}`)
  }
  for (const w of workspaces) {
    try {
      boards.push({ workspace: w, tasks: (await listTasks(api, w.id)).tasks })
    } catch (err) {
      problems.push(`tasks of ${clip(w.name, 40)}: ${toFailure(err).message}`)
    }
  }
  try {
    repos = await listRepos(api)
  } catch (err) {
    problems.push(`repos: ${toFailure(err).message}`)
  }
  return { workspaces, boards, repos, failure: problems.length ? problems.join('; ') : null }
}

export interface AgentsRequest {
  seq: number
  slotKey: string
}

export interface AgentsProps {
  api: AppApi
  active: boolean
  request: AgentsRequest | null
  onOpenTask: (wsId: number, taskUid: string) => void
  onOpenRepo: (repoId: number) => void
  /** Asks before leaving the page when the Notes tab has unsaved edits. */
  confirmLeave: () => boolean
}

/** The Agents tab (QTZ-012): Quartizo sessions, their transcripts' tool calls and errors, and subagents. Read only. */
export default function Agents(props: AgentsProps) {
  const { api, active } = props
  const navigate = useNavigate()
  const [rows, setRows] = useState<SessionRow[] | null>(null)
  const [created, setCreated] = useState<ReadonlySet<string>>(new Set())
  const [freshness, setFreshness] = useState<Freshness>(INITIAL_FRESHNESS)
  const [summaries, setSummaries] = useState<Record<string, SummaryEntry>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [selectedSub, setSelectedSub] = useState<string | null>(null)
  const [links, setLinks] = useState<Links>(NO_LINKS)
  const [linksSeq, setLinksSeq] = useState(0)
  const freshRef = useRef(freshness)
  const cache = useRef<Record<string, SummaryEntry>>({})
  const selectedRef = useRef(selected)
  const pollSoon = useRef<(() => void) | null>(null)
  selectedRef.current = selected

  const setFresh = (f: Freshness) => {
    freshRef.current = f
    setFreshness(f)
  }

  // Linked workspaces, tasks and repos: on first view, on each return to the tab, and on Refresh.
  useEffect(() => {
    if (!active) return
    let cancelled = false
    loadLinks(api).then(l => !cancelled && setLinks(l))
    return () => {
      cancelled = true
    }
  }, [api, active, linksSeq])

  // Bounded polling: POLL_MS while the tab is active and the page visible, backoff on failure, nothing while hidden.
  useEffect(() => {
    if (!active) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let inFlight = false
    let again = false
    let lastStart = 0
    const schedule = (ms: number) => {
      clearTimeout(timer)
      if (!cancelled && !document.hidden) timer = setTimeout(() => void tick(), ms)
    }
    const tick = async () => {
      if (cancelled || document.hidden) return
      if (inFlight) {
        again = true
        return
      }
      inFlight = true
      lastStart = Date.now()
      try {
        const [raw, createdKeys] = await Promise.all([withTimeout(api.get(SLOTS_PATH)), withTimeout(listCreatedSlots(api))])
        const list = parseSlotList(raw)
        if (cancelled) return
        const gen = listGeneration(list)
        const prev = freshRef.current
        // Gateway restart: cached transcript summaries describe the old process. Drop them.
        if (gen && prev.generation && gen !== prev.generation) cache.current = {}
        setFresh(onPollSuccess(prev, Date.now(), gen))
        setRows(list)
        setCreated(createdKeys)
        const keys = new Set(list.map(r => r.key))
        for (const k of Object.keys(cache.current)) if (!keys.has(k)) delete cache.current[k]
        const { quartizo } = partitionSessions(list, createdKeys)
        for (const row of detailTargets(quartizo, selectedRef.current)) {
          if (cancelled) return
          const fp = rowFingerprint(row)
          const before = cache.current[row.key]
          if (!shouldReadDetail(before, row, Date.now())) continue
          try {
            const detail = await withTimeout(api.get(slotDetailPath(row.key, DETAIL_ROWS)))
            cache.current[row.key] = { fp, summary: summarizeTranscript(detail), at: Date.now(), failure: null, failedAt: null, failures: 0 }
          } catch (err) {
            cache.current[row.key] = {
              fp,
              summary: before?.summary ?? null,
              at: before?.at ?? null,
              failure: classifyError(err, { missingIsSlotNotFound: true }),
              failedAt: Date.now(),
              failures: (before?.failures ?? 0) + 1,
            }
          }
        }
        if (!cancelled) setSummaries({ ...cache.current })
      } catch (err) {
        if (!cancelled) setFresh(onPollFailure(freshRef.current, Date.now(), classifyError(err).message))
      } finally {
        inFlight = false
      }
      if (cancelled) return
      if (again) {
        again = false
        schedule(0)
      } else schedule(nextDelay(freshRef.current.failures))
    }
    const onVisibility = () => {
      if (document.hidden) clearTimeout(timer)
      else schedule(resumeDelay(freshRef.current.failures, Date.now() - lastStart))
    }
    document.addEventListener('visibilitychange', onVisibility)
    // A host `slots` frame or a new selection: poll soon, at most once a second, never during a backoff.
    pollSoon.current = () => {
      if (freshRef.current.failures === 0) schedule(Math.max(0, 1000 - (Date.now() - lastStart)))
    }
    schedule(0)
    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      pollSoon.current = null
    }
  }, [api, active])

  // The host relays its own WS `slots` frames as `mc:app:slots` (no payload, no grant needed): a hint to re-read, never data.
  useAppEvents(
    'slots',
    useCallback(() => pollSoon.current?.(), []),
  )

  useEffect(() => {
    if (!props.request) return
    setSelected(props.request.slotKey)
    setSelectedSub(null)
    pollSoon.current?.()
  }, [props.request?.seq]) // eslint-disable-line react-hooks/exhaustive-deps

  const parts = useMemo(() => partitionSessions(rows ?? [], created), [rows, created])
  const view = freshnessView(freshness)
  const stale = view.kind === 'stale'
  const now = Date.now()
  const current = parts.quartizo.find(r => r.key === selected) ?? null
  const selectedOther = !current && selected ? (rows ?? []).find(r => r.key === selected) : undefined

  const select = (key: string) => {
    setSelected(key)
    setSelectedSub(null)
    pollSoon.current?.()
  }
  const openTranscript = (key: string) => {
    if (props.confirmLeave()) navigate(transcriptPath(key))
  }

  return (
    <div style={{ ...S.column, flex: 1 }}>
      <VisibilityNote quartizo={parts.quartizo.length} other={parts.other.length} loaded={rows !== null} />
      <div style={S.row}>
        <span className="text-sm text-muted" aria-live="polite">
          {view.kind === 'loading' && 'Loading sessions…'}
          {view.kind === 'fresh' && `Updated ${fmtTime(view.at)}. Polling every ${POLL_MS / 1000} s while this tab is visible.`}
        </span>
        <span style={{ flex: 1 }} />
        <Btn
          onClick={() => {
            setLinksSeq(n => n + 1)
            cache.current = {}
            pollSoon.current?.()
          }}
        >
          Refresh
        </Btn>
      </div>
      {view.kind === 'stale' && (
        <div role="status" className="text-sm" style={S.stale} data-testid="qz-agents-stale">
          Stale since {fmtTime(view.since)}: the session list could not be read ({clip(view.error, 200)}). Showing the last data
          received{view.dataAt !== null ? ` at ${fmtTime(view.dataAt)}` : ''}; statuses below may be out of date and nothing is
          assumed finished. Retrying in {Math.round(view.retryInMs / 1000)} s.
        </div>
      )}
      {freshness.restartedAt !== null && (
        <div role="status" className="text-sm text-muted">
          The gateway restarted at {fmtTime(freshness.restartedAt)} (new process generation). Transcripts were re-read; turns that
          were running before the restart show whatever state the gateway reports now.
        </div>
      )}
      {links.failure && <div className="text-sm text-muted">Task and repository links are incomplete: {clip(links.failure, 300)}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(340px, 44%)', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={{ ...S.column, overflowY: 'auto' }}>
          <section aria-label="Quartizo sessions" style={S.panel}>
            <strong className="text-sm">Sessions Quartizo created (recorded by Quartizo) ({parts.quartizo.length})</strong>
            {rows !== null && parts.quartizo.length === 0 && (
              <span className="text-sm text-muted">No session recorded by Quartizo is listed. Open the Chat tab or a workspace chat first.</span>
            )}
            {parts.quartizo.length > 0 && (
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Session', 'Linked to', 'Status', 'Last activity', 'Tools', 'Errors', 'Subagents'].map(h => (
                      <th key={h} style={S.cell} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parts.quartizo.map(row => (
                    <SessionLine
                      key={row.key}
                      row={row}
                      entry={summaries[row.key]}
                      links={links}
                      created={created}
                      stale={stale}
                      now={now}
                      selected={row.key === selected}
                      onSelect={() => select(row.key)}
                    />
                  ))}
                </tbody>
              </table>
            )}
            {parts.quartizo.length > MAX_DETAIL_SESSIONS && (
              <span className="text-sm text-muted">
                Tool and error counts are read for the selected session and the {MAX_DETAIL_SESSIONS} most recent ones; “—” means not read.
              </span>
            )}
          </section>

          <details>
            <summary className="text-sm">Other sessions (read-only) ({parts.other.length})</summary>
            <p className="text-sm text-muted" style={{ margin: '4px 0' }}>
              Sessions Quartizo did not record creating, as the gateway lists them to the dashboard owner (a Quartizo-looking name
              alone does not count). Quartizo does not read their transcripts and never attaches context to them.
            </p>
            {parts.other.length > 0 && (
              <table style={S.table}>
                <thead>
                  <tr>
                    {['Session', 'Owner', 'Status', 'Last activity'].map(h => (
                      <th key={h} style={S.cell} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parts.other.map(row => (
                    <tr key={row.key} data-qz-other={row.key}>
                      <td style={{ ...S.cell, ...S.mono }}>
                        <button type="button" style={S.plain} onClick={() => select(row.key)} aria-pressed={row.key === selected}>
                          {clip(row.title || row.key, 60)}
                        </button>
                      </td>
                      <td style={S.cell}>{row.app ? `app: ${clip(row.app, 40)}` : 'owner'}</td>
                      <td style={S.cell}>
                        <StatusBadge status={sessionStatus(row)} stale={stale} />
                      </td>
                      <td style={S.cell} title={row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString() : undefined}>
                        {fmtWhen(row.lastActivityAt, now)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </details>
        </div>

        <div style={{ ...S.column, overflowY: 'auto' }}>
          {current ? (
            <SessionDetail
              key={current.key}
              row={current}
              entry={summaries[current.key]}
              rows={rows ?? []}
              links={links}
              created={created}
              stale={stale}
              now={now}
              selectedSub={selectedSub}
              onSelectSub={setSelectedSub}
              onSelect={select}
              onOpenTranscript={openTranscript}
              onOpenTask={props.onOpenTask}
              onOpenRepo={props.onOpenRepo}
            />
          ) : selectedOther ? (
            <section aria-label="Other session" style={S.panel}>
              <strong className="text-sm" style={S.mono}>
                {clip(selectedOther.key, 120)}
              </strong>
              <span className="text-sm">
                Other session (read-only): <StatusBadge status={sessionStatus(selectedOther)} stale={stale} /> · last activity{' '}
                {fmtWhen(selectedOther.lastActivityAt, now)}
              </span>
              <span className="text-sm text-muted">Quartizo has no record of creating this session, so it shows only the list fields above.</span>
              <div style={S.row}>
                <Btn onClick={() => openTranscript(selectedOther.key)}>Open in KiroCrew chat</Btn>
              </div>
            </section>
          ) : (
            <p className="text-sm text-muted">Select a session to see its recent tool calls, errors and subagents.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function VisibilityNote(props: { quartizo: number; other: number; loaded: boolean }) {
  return (
    <div role="note" aria-label="Visibility" style={S.note}>
      <strong>Visibility:</strong>{' '}
      {props.loaded
        ? `the gateway lists ${props.quartizo} session(s) Quartizo created (recorded by Quartizo) and ${props.other} other session(s) to this page.`
        : 'reading the session list…'}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8, marginTop: 4 }}>
        <div>
          Can see:
          <ul style={{ margin: '2px 0', paddingLeft: 18 }}>
            {VISIBILITY_CAN.map(t => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          Cannot see:
          <ul style={{ margin: '2px 0', paddingLeft: 18 }}>
            {VISIBILITY_CANNOT.map(t => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function sessionLabel(row: SessionRow, links: Links, created: ReadonlySet<string>): string {
  const vis = classifySession(row, created)
  if (vis.cls !== 'quartizo') return 'other'
  if (vis.kind === 'chat-tab') return 'Chat tab'
  const ws = workspaceForSession(links.workspaces, row.key)
  return ws ? `Workspace: ${clip(ws.name, 40)}` : 'Workspace (not registered now)'
}

function SessionLine(props: {
  row: SessionRow
  entry: SummaryEntry | undefined
  links: Links
  created: ReadonlySet<string>
  stale: boolean
  now: number
  selected: boolean
  onSelect: () => void
}) {
  const { row, entry, links } = props
  const summary = entry?.summary ?? null
  const tasks = tasksForSession(links.boards, row.key)
  const status = sessionStatus(row, summary)
  const subDone = summary?.subagents.length ?? 0
  return (
    <tr data-qz-session={row.key} style={{ background: props.selected ? 'rgba(80,140,255,.15)' : undefined }}>
      <td style={S.cell}>
        <button type="button" style={{ ...S.plain, fontWeight: 600 }} onClick={props.onSelect} aria-pressed={props.selected}>
          {clip(row.title, 60) || <span style={S.mono}>{clip(row.key, 60)}</span>}
        </button>
        <div className="text-muted" style={{ fontSize: 12 }}>
          {sessionLabel(row, links, props.created)}
        </div>
      </td>
      <td style={S.cell}>{tasks.length ? tasks.map(t => clip(t.task.title, 40)).join(', ') : '—'}</td>
      <td style={S.cell}>
        <StatusBadge status={status} stale={props.stale || !!entry?.failure} />
      </td>
      <td style={S.cell} title={row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString() : undefined}>
        {fmtWhen(row.lastActivityAt, props.now)}
      </td>
      <td style={S.cell}>{summary ? `${summary.toolCalls}${entry?.failure ? ' (stale)' : ''}` : '—'}</td>
      <td style={S.cell}>{summary ? `${summary.errors}${entry?.failure ? ' (stale)' : ''}` : '—'}</td>
      <td style={S.cell}>
        {row.subagentsRunning ? 'running' : ''}
        {row.subagentsQueued > 0 ? ` ${row.subagentsQueued} queued` : ''}
        {subDone > 0 ? ` ${subDone} finished` : ''}
        {!row.subagentsRunning && !row.subagentsQueued && !subDone ? '—' : ''}
      </td>
    </tr>
  )
}

const OUTCOME_LABEL: Record<SubagentRecord['outcome'], string> = {
  ok: 'finished',
  failed: 'failed',
  stopped: 'stopped',
  interrupted: 'interrupted',
}

function SessionDetail(props: {
  row: SessionRow
  entry: SummaryEntry | undefined
  rows: SessionRow[]
  links: Links
  created: ReadonlySet<string>
  stale: boolean
  now: number
  selectedSub: string | null
  onSelectSub: (id: string | null) => void
  onSelect: (key: string) => void
  onOpenTranscript: (key: string) => void
  onOpenTask: (wsId: number, taskUid: string) => void
  onOpenRepo: (repoId: number) => void
}) {
  const { row, entry, links } = props
  const summary = entry?.summary ?? null
  const status = sessionStatus(row, summary)
  const flags = sessionFlags(row)
  const linked: LinkedTask[] = tasksForSession(links.boards, row.key)
  const repo = repoForProject(links.repos, row.project)
  const children = childSessions(props.rows, row.key)
  const sub = summary?.subagents.find(s => s.agentId === props.selectedSub) ?? null

  return (
    <section aria-label={`Session ${row.key}`} style={S.column}>
      <div style={S.panel}>
        <strong style={S.mono}>{clip(row.key, 120)}</strong>
        {row.title && <span className="text-sm">{clip(row.title, 120)}</span>}
        <span className="text-sm">
          <StatusBadge status={status} stale={props.stale || !!entry?.failure} /> · {sessionLabel(row, links, props.created)} · last activity{' '}
          {fmtWhen(row.lastActivityAt, props.now)}
          {row.app === 'quartizo' ? ' · app-token session' : ''}
        </span>
        {flags.length > 0 && <span className="text-sm text-muted">{flags.join(' · ')}</span>}
        {row.project && (
          <span className="text-sm text-muted" style={S.mono}>
            Working directory: {clip(row.project, 200)}
          </span>
        )}
        <div style={S.row}>
          <Btn onClick={() => props.onOpenTranscript(row.key)}>Open transcript in KiroCrew chat</Btn>
          {repo && <Btn onClick={() => props.onOpenRepo(repo.id)}>Open repository “{clip(repo.name, 40)}” in Git</Btn>}
        </div>
        {entry?.failure && <Alert failure={entry.failure} />}
      </div>

      <div style={S.panel}>
        <strong className="text-sm">Linked tasks</strong>
        {linked.length === 0 ? (
          <span className="text-sm text-muted">No task links this session (link one from a task’s details in the Tasks tab).</span>
        ) : (
          linked.map(l => (
            <div key={l.task.uid} style={S.row}>
              <span className="text-sm">
                {clip(l.task.title, 80)} <span className="text-muted">({clip(l.workspace.name, 40)})</span>
              </span>
              <Btn onClick={() => props.onOpenTask(l.workspace.id, l.task.uid)}>Open task</Btn>
            </div>
          ))
        )}
      </div>

      <div style={S.panel}>
        <strong className="text-sm">Subagents</strong>
        <span className="text-sm">
          Live (from the session list): {row.subagentsRunning ? 'at least one running' : 'none running'}
          {row.subagentsQueued > 0 ? `, ${row.subagentsQueued} queued` : ''}. Running subagents are not listed individually.
        </span>
        {summary && summary.subagents.length === 0 && (
          <span className="text-sm text-muted">No subagent completion in the newest {summary.scanned} transcript row(s).</span>
        )}
        {summary && summary.subagents.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {summary.subagents.map(s => (
              <li key={s.agentId} className="text-sm">
                <button type="button" style={S.plain} aria-pressed={s.agentId === props.selectedSub} onClick={() => props.onSelectSub(s.agentId === props.selectedSub ? null : s.agentId)}>
                  <span style={S.mono}>{s.agentName || s.agentId}</span> — {OUTCOME_LABEL[s.outcome]} at {fmtTime(s.at)}
                </button>
              </li>
            ))}
          </ul>
        )}
        {summary && summary.subagentBatches > 0 && (
          <span className="text-sm text-muted">{summary.subagentBatches} batch result row(s); open the transcript for their details.</span>
        )}
        {sub && (
          <div style={{ ...S.panel, borderColor: 'rgba(80,140,255,.5)' }} aria-label={`Subagent ${sub.agentId}`}>
            <span className="text-sm" style={S.mono}>
              {sub.agentId}
              {sub.agentName ? ` (${sub.agentName})` : ''}
            </span>
            <span className="text-sm">
              Outcome: {OUTCOME_LABEL[sub.outcome]} · reported {sub.at !== null ? new Date(sub.at).toLocaleString() : '—'}
              {sub.model ? ` · model ${sub.model}` : ''}
            </span>
            {sub.task && <span className="text-sm">Task: {sub.task}</span>}
            <div style={S.row}>
              {repo ? (
                <Btn onClick={() => props.onOpenRepo(repo.id)}>Open repository “{clip(repo.name, 40)}” in Git</Btn>
              ) : (
                <span className="text-sm text-muted">
                  No registered repository contains this session’s working directory (a subagent’s own directory is not exposed).
                </span>
              )}
              <Btn onClick={() => props.onSelectSub(null)}>Back to session</Btn>
            </div>
          </div>
        )}
      </div>

      {children.length > 0 && (
        <div style={S.panel}>
          <strong className="text-sm">Sessions opened by this session (read-only)</strong>
          {children.map(c => (
            <div key={c.key} style={S.row}>
              <button type="button" style={{ ...S.plain, ...S.mono }} onClick={() => props.onSelect(c.key)}>
                {clip(c.title || c.key, 80)}
              </button>
              <StatusBadge status={sessionStatus(c)} stale={props.stale} />
            </div>
          ))}
        </div>
      )}

      <div style={S.panel}>
        <strong className="text-sm">Recent transcript{summary && entry?.failure ? ' (stale)' : ''}</strong>
        {!summary && !entry?.failure && <span className="text-sm text-muted">Reading…</span>}
        {summary && (
          <>
            <span className="text-sm text-muted">
              {summary.toolCalls} tool call(s) ({summary.toolsRunning} running, {summary.toolsRefused} refused), {summary.errors} error(s) in
              the newest {summary.scanned} row(s){summary.hasMore ? ` of ${summary.total ?? 'more'}` : ''}; the last {summary.rows.length}{' '}
              are shown{entry?.at ? `, read at ${fmtTime(entry.at)}` : ''}. “ended” means the gateway recorded the call as finished; it does not
              say whether it succeeded.
            </span>
            {summary.rows.length === 0 ? (
              <span className="text-sm text-muted">No rows yet.</span>
            ) : (
              <table style={S.table} data-testid="qz-transcript-summary">
                <thead>
                  <tr>
                    {['Time', 'Kind', 'What', 'Status'].map(h => (
                      <th key={h} style={S.cell} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.rows.map((r, i) => (
                    <tr key={i} data-kind={r.kind}>
                      <td style={S.cell}>{fmtTime(r.at)}</td>
                      <td style={S.cell}>{r.kind}</td>
                      <td style={{ ...S.cell, overflowWrap: 'anywhere', color: r.kind === 'error' ? STATUS_COLOR.error : undefined }}>
                        {r.label}
                        {r.detail && (
                          <div className="text-muted" style={S.mono}>
                            {r.detail}
                          </div>
                        )}
                      </td>
                      <td style={S.cell}>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <span className="text-sm text-muted">
              Tool inputs and texts are untrusted and shown cut to one line; at most {SUMMARY_ROWS} rows.
            </span>
          </>
        )}
      </div>
    </section>
  )
}
