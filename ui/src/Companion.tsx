/**
 * Kiro Notes companion views: a read-only Board of ticket notes and a TODO list
 * of Markdown checkboxes, both from the backend's rebuildable index of the
 * shared folders (backend/companion.py).
 *
 * Read only, on purpose (docs/markdown-tickets-plan.md, 2026-10-20 update):
 * native Kiro Notes can silently overwrite external edits that keep the file's
 * timestamp, so nothing here moves a card or checks a box. Native Notes is the
 * editor. Opening a note goes through the navigation adapter (noteNav.ts),
 * which can only open the Notes app; the source path, heading and line stay
 * visible so the user can select the note there.
 */
import { type AppApi, useNavigate } from '@kirocrew/app-sdk'
import { Btn } from '@kirocrew/app-sdk/ui'
import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type BoardData,
  companionStatus,
  type CompanionWorkspace,
  describeIndex,
  type Diagnostic,
  filterTodos,
  groupLanes,
  indexWarning,
  type IndexStatus,
  LANE_LABELS,
  LANES,
  loadBoard,
  loadTodos,
  requestRefresh,
  type Ticket,
  type TodoData,
  type TodoState,
  todoLabel,
} from './companionApi'
import { withTimeout } from './freshness'
import { type NoteRef, KIRO_NOTES, describeSource, openInKiroNotes } from './noteNav'
import { type ApiFailure, toFailure, type Workspace } from './notesApi'
import { STATUS_LABELS } from './tasksApi'

/** While a scan runs the views check every SCANNING_MS; otherwise they rescan every IDLE_MS while visible. */
export const SCANNING_MS = 1500
export const IDLE_MS = 30000

const S = {
  column: { display: 'flex', flexDirection: 'column' as const, gap: 8, minHeight: 0, minWidth: 0 },
  row: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const },
  input: { padding: '4px 6px', border: '1px solid rgba(128,128,128,.4)', borderRadius: 4, background: 'transparent', color: 'inherit' },
  board: { display: 'grid', gridAutoFlow: 'column' as const, gridAutoColumns: 'minmax(170px, 1fr)', gap: 8, overflowX: 'auto' as const, minHeight: 0, flex: 1 },
  lane: { display: 'flex', flexDirection: 'column' as const, gap: 6, minHeight: 120, padding: 6, borderRadius: 4, border: '1px solid rgba(128,128,128,.25)' },
  cards: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' as const, gap: 6 },
  card: { width: '100%', padding: 6, borderRadius: 4, border: '1px solid rgba(128,128,128,.35)', display: 'flex', flexDirection: 'column' as const, gap: 2, background: 'transparent', color: 'inherit', textAlign: 'left' as const, cursor: 'pointer' },
  selected: { borderColor: 'rgba(80,140,255,.9)', boxShadow: '0 0 0 1px rgba(80,140,255,.9)' },
  notice: { padding: 8, borderRadius: 4, border: '1px solid rgba(220,120,0,.6)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  info: { padding: 8, borderRadius: 4, border: '1px solid rgba(128,128,128,.35)', display: 'flex', flexDirection: 'column' as const, gap: 4 },
  panel: { padding: 8, borderRadius: 4, border: '1px solid rgba(80,140,255,.5)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  badge: { fontSize: 11, padding: '0 4px', borderRadius: 3, border: '1px solid rgba(220,120,0,.7)' },
  mono: { fontFamily: 'ui-monospace, monospace', fontSize: 12, wordBreak: 'break-all' as const },
  todoRow: { display: 'flex', gap: 6, alignItems: 'baseline', width: '100%', padding: '2px 4px', border: '1px solid transparent', borderRadius: 4, background: 'transparent', color: 'inherit', textAlign: 'left' as const, cursor: 'pointer' },
}

function ErrorLine({ failure }: { failure: ApiFailure | null }) {
  if (!failure) return null
  return (
    <div role="alert" className="text-sm text-danger" data-code={failure.code}>
      {failure.message}
    </div>
  )
}

function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden')
  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return visible
}

/**
 * Load a view's data while it is shown: ask for a (throttled) rescan when it
 * opens and every IDLE_MS, and re-read the index while a scan runs. Nothing
 * runs while the tab or page is hidden. A failed read keeps the last data.
 */
function useIndexed<T>(
  active: boolean,
  key: string,
  fetch: () => Promise<T>,
  rescan: (manual: boolean, rebuild: boolean) => Promise<unknown>,
  scanning: (data: T) => boolean,
) {
  const visible = usePageVisible()
  const [data, setData] = useState<T | null>(null)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const [tick, setTick] = useState(0)
  const [busy, setBusy] = useState(false)
  const latest = useRef<T | null>(null)
  const fetchRef = useRef(fetch)
  const rescanRef = useRef(rescan)
  fetchRef.current = fetch
  rescanRef.current = rescan

  useEffect(() => {
    latest.current = null
    setData(null)
    setFailure(null)
  }, [key])

  useEffect(() => {
    if (!active || !visible) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let first = true
    const run = async () => {
      try {
        // Opening the view and each idle period ask for a rescan; the backend skips it if one just ran.
        if (first || !latest.current || !scanning(latest.current)) await withTimeout(rescanRef.current(false, false))
        const value = await withTimeout(fetchRef.current())
        if (cancelled) return
        latest.current = value
        setData(value)
        setFailure(null)
      } catch (err) {
        if (!cancelled) setFailure(toFailure(err))
      }
      first = false
      if (!cancelled) timer = setTimeout(run, latest.current && scanning(latest.current) ? SCANNING_MS : IDLE_MS)
    }
    void run()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [active, visible, key, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Refresh or Rebuild from a button: never throttled. */
  const manual = useCallback(async (rebuild: boolean) => {
    setBusy(true)
    try {
      await withTimeout(rescanRef.current(true, rebuild))
      setFailure(null)
      setTick(n => n + 1)
    } catch (err) {
      setFailure(toFailure(err))
    } finally {
      setBusy(false)
    }
  }, [])
  return { data, failure, busy, manual }
}

function IndexBar(props: {
  statuses: IndexStatus[]
  busy: boolean
  onRefresh: () => void
  onRebuild: () => void
}) {
  const [confirmRebuild, setConfirmRebuild] = useState(false)
  const now = Date.now()
  const lines = props.statuses.map(s => describeIndex(s, now)).filter(Boolean)
  const warnings = props.statuses.map(s => indexWarning(s)).filter((w): w is string => !!w)
  return (
    <div style={S.column}>
      <div style={S.row}>
        <span className="text-sm text-muted" role="status" aria-live="polite">
          {lines.join(' · ') || 'Index status unknown'}
        </span>
        <Btn onClick={props.onRefresh} disabled={props.busy}>
          Refresh
        </Btn>
        {!confirmRebuild && (
          <Btn onClick={() => setConfirmRebuild(true)} disabled={props.busy}>
            Rebuild index…
          </Btn>
        )}
      </div>
      {confirmRebuild && (
        <div role="alertdialog" aria-label="Rebuild index" style={S.notice}>
          <span className="text-sm">
            Re-read and re-parse every note? The current results stay visible until the rebuild finishes. Only Quartizo's own index
            changes: no note is modified.
          </span>
          <div style={S.row}>
            <Btn
              onClick={() => {
                setConfirmRebuild(false)
                props.onRebuild()
              }}
              disabled={props.busy}
            >
              Rebuild
            </Btn>
            <Btn onClick={() => setConfirmRebuild(false)}>Cancel</Btn>
          </div>
        </div>
      )}
      {warnings.map(w => (
        <div key={w} role="note" className="text-sm" style={S.notice}>
          {w}
        </div>
      ))}
    </div>
  )
}

function ReadOnlyNote() {
  return (
    <p className="text-sm text-muted">
      Read only. Edit tickets, statuses and checkboxes in Kiro Notes; this view follows the files. Moving cards and checking items
      here stay off until Kiro Notes guards its saves against every external change.
    </p>
  )
}

function DiagnosticList({ diagnostics }: { diagnostics: Diagnostic[] }) {
  if (!diagnostics.length) return null
  return (
    <ul className="text-sm" style={{ margin: 0, paddingLeft: 18 }}>
      {diagnostics.map(d => (
        <li key={d.code} data-code={d.code}>
          {d.message}
          {d.others && d.others.length > 0 && (
            <>
              {': '}
              {d.others.map(o => `${o.workspace} › ${o.path}`).join(', ')}
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

/** Where the selected item lives, and the ways to open it. */
function SourcePanel(props: {
  source: NoteRef
  details?: ReactNode
  onViewNote: (wsId: number, path: string) => void
  onClose: () => void
}) {
  const navigate = useNavigate()
  const { source } = props
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => setMessage(null), [source])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source.path)
      setMessage('Path copied.')
    } catch {
      setMessage('Copying was refused; select the path above instead.')
    }
  }
  return (
    <section aria-label="Source" style={S.panel}>
      <div style={S.row}>
        <strong className="text-sm">{source.title ?? source.path}</strong>
        <span style={{ flex: 1 }} />
        <Btn onClick={props.onClose}>Close</Btn>
      </div>
      <span className="text-sm" style={S.mono}>
        {describeSource(source)}
      </span>
      {props.details}
      <div style={S.row}>
        <Btn onClick={() => setMessage(openInKiroNotes(navigate, source).message)}>Open Kiro Notes</Btn>
        <Btn onClick={() => props.onViewNote(source.workspaceId, source.path)}>View in Quartizo (read-only)</Btn>
        <Btn onClick={() => void copy()}>Copy path</Btn>
      </div>
      {!KIRO_NOTES.note && (
        <span className="text-sm text-muted">Kiro Notes opens on its own page: select this note there by its path.</span>
      )}
      {message && (
        <span className="text-sm" role="status">
          {message}
        </span>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

export function TicketBoard(props: {
  api: AppApi
  workspace: Workspace
  active: boolean
  onViewNote: (wsId: number, path: string) => void
}) {
  const { api, workspace } = props
  const wsId = workspace.id
  const { data, failure, busy, manual } = useIndexed<BoardData>(
    props.active,
    String(wsId),
    () => loadBoard(api, wsId),
    (isManual, rebuild) => requestRefresh(api, { workspaceId: wsId, manual: isManual, rebuild }),
    d => d.index.state === 'scanning',
  )
  const [selected, setSelected] = useState<string | null>(null)
  const lanes = useMemo(() => groupLanes(data?.tickets ?? []), [data])
  const shown = LANES.filter(l => l !== 'repair' || lanes.repair.length > 0)
  const ticket = data?.tickets.find(t => t.path === selected) ?? null
  const boardRef = useRef<HTMLDivElement>(null)

  // Arrow keys move between cards: up/down in a lane, left/right to the neighbouring lane.
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
    const el = e.target as HTMLElement
    const lane = Number(el.dataset.lane)
    const index = Number(el.dataset.index)
    if (!keys.includes(e.key) || Number.isNaN(lane) || Number.isNaN(index)) return
    let li = lane
    let ci = index
    if (e.key === 'ArrowUp') ci = Math.max(0, index - 1)
    if (e.key === 'ArrowDown') ci = index + 1
    if (e.key === 'Home') ci = 0
    if (e.key === 'End') ci = Number.MAX_SAFE_INTEGER
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const dir = e.key === 'ArrowLeft' ? -1 : 1
      do li += dir
      while (li >= 0 && li < shown.length && lanes[shown[li]].length === 0)
      if (li < 0 || li >= shown.length) return
    }
    const cards = lanes[shown[li]]
    ci = Math.min(ci, cards.length - 1)
    e.preventDefault()
    boardRef.current?.querySelector<HTMLElement>(`[data-lane="${li}"][data-index="${ci}"]`)?.focus()
  }

  return (
    <div style={S.column}>
      <ReadOnlyNote />
      <IndexBar statuses={data ? [data.index] : []} busy={busy} onRefresh={() => void manual(false)} onRebuild={() => void manual(true)} />
      <ErrorLine failure={failure} />
      {!data && !failure && <p className="text-sm text-muted">Loading the board…</p>}
      {data && data.tickets.length === 0 && data.index.state !== 'scanning' && (
        <p className="text-sm text-muted">
          No ticket notes in “{workspace.name}” yet. In Kiro Notes, add <code>type: ticket</code>, an <code>id</code>, a{' '}
          <code>status</code> and an <code>order</code> to a note's frontmatter (see README, “Kiro Notes companion”).
        </p>
      )}
      {ticket && (
        <SourcePanel
          source={{ workspaceId: wsId, workspaceName: workspace.name, path: ticket.path, title: ticket.title }}
          onViewNote={props.onViewNote}
          onClose={() => setSelected(null)}
          details={<TicketDetails ticket={ticket} />}
        />
      )}
      {data && data.tickets.length > 0 && (
        <div ref={boardRef} style={S.board} onKeyDown={onKey} aria-label={`Board of ${workspace.name} (read only)`} role="group">
          {shown.map((lane, li) => (
            <section key={lane} aria-label={LANE_LABELS[lane]} style={S.lane}>
              <strong className="text-sm">
                {LANE_LABELS[lane]} ({lanes[lane].length})
              </strong>
              <ul style={S.cards}>
                {lanes[lane].map((t, ci) => (
                  <li key={t.path}>
                    <TicketCard ticket={t} lane={li} index={ci} selected={t.path === selected} onSelect={() => setSelected(t.path)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {data && data.notes.length > 0 && (
        <details>
          <summary className="text-sm">Other notes with metadata problems ({data.notes.length})</summary>
          <ul className="text-sm" style={{ paddingLeft: 18 }}>
            {data.notes.map(n => (
              <li key={n.path}>
                <span style={S.mono}>{n.path}</span>
                <DiagnosticList diagnostics={n.diagnostics} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function TicketCard(props: { ticket: Ticket; lane: number; index: number; selected: boolean; onSelect: () => void }) {
  const { ticket: t } = props
  const label = `${t.title}, ${t.path}${t.diagnostics.length ? `, ${t.diagnostics.length} problem(s)` : ''}`
  return (
    <button
      type="button"
      data-lane={props.lane}
      data-index={props.index}
      aria-label={label}
      aria-pressed={props.selected}
      onClick={props.onSelect}
      style={{ ...S.card, ...(props.selected ? S.selected : {}) }}
    >
      <span className="text-sm" style={{ fontWeight: 600 }}>
        {t.title}
      </span>
      <span className="text-sm text-muted" style={S.mono}>
        {t.path}
      </span>
      <span style={S.row}>
        {t.todos.total > 0 && (
          <span className="text-sm text-muted">
            ☑ {t.todos.done}/{t.todos.total}
          </span>
        )}
        {t.diagnostics.map(d => (
          <span key={d.code} style={S.badge} title={d.message}>
            {d.code.replace(/_/g, ' ')}
          </span>
        ))}
        {t.retained && (
          <span style={S.badge} title="Shown as last indexed">
            last known
          </span>
        )}
      </span>
    </button>
  )
}

function TicketDetails({ ticket }: { ticket: Ticket }) {
  return (
    <div className="text-sm" style={S.column}>
      <span>
        Status: {ticket.status ? STATUS_LABELS[ticket.status] : 'missing or invalid'} · ID:{' '}
        <span style={S.mono}>{ticket.id ?? 'missing or invalid'}</span>
        {ticket.todos.total > 0 && ` · ${ticket.todos.done} of ${ticket.todos.total} checkboxes done`}
      </span>
      {ticket.retained && <span>Shown as last indexed: the latest scan could not read or reach this note.</span>}
      <DiagnosticList diagnostics={ticket.diagnostics} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// TODOs
// ---------------------------------------------------------------------------

export function TodoView(props: {
  api: AppApi
  active: boolean
  onViewNote: (wsId: number, path: string) => void
  onShowWorkspace: (wsId: number) => void
}) {
  const { api } = props
  const [companions, setCompanions] = useState<CompanionWorkspace[] | null>(null)
  const [statusFailure, setStatusFailure] = useState<ApiFailure | null>(null)
  const [scope, setScope] = useState<number | 'all'>('all')
  const [state, setState] = useState<TodoState>('open')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<{ wsId: number; path: string; ordinal: number } | null>(null)

  useEffect(() => {
    if (!props.active) return
    let cancelled = false
    companionStatus(api)
      .then(s => {
        if (cancelled) return
        setCompanions(s.workspaces.filter(w => w.workspace.companion))
        setStatusFailure(s.available ? null : { message: s.error ?? 'The Markdown index is unavailable.' })
      })
      .catch(err => !cancelled && setStatusFailure(toFailure(err)))
    return () => {
      cancelled = true
    }
  }, [api, props.active])
  useEffect(() => {
    if (companions && scope !== 'all' && !companions.some(c => c.workspace.id === scope)) setScope('all')
  }, [companions, scope])

  const wsId = scope === 'all' ? undefined : scope
  const enabled = props.active && !!companions && companions.length > 0
  const { data, failure, busy, manual } = useIndexed<TodoData>(
    enabled,
    `${scope}:${state}`,
    () => loadTodos(api, state, wsId),
    (isManual, rebuild) => requestRefresh(api, { workspaceId: wsId, manual: isManual, rebuild }),
    d => Object.values(d.index).some(i => i.state === 'scanning'),
  )
  const groups = useMemo(() => filterTodos(data?.groups ?? [], search), [data, search])
  const picked = selected && data?.groups.find(g => g.workspaceId === selected.wsId && g.path === selected.path)
  const pickedItem = picked && picked.items.find(i => i.ordinal === selected.ordinal)

  if (statusFailure) return <ErrorLine failure={statusFailure} />
  if (!companions) return <p className="text-sm text-muted">Loading…</p>
  if (companions.length === 0) {
    return (
      <p className="text-sm text-muted">
        No workspace is in Kiro Notes companion mode. In the Notes tab, pick the folder you also attached in Kiro Notes and choose{' '}
        <strong>Use with Kiro Notes…</strong>. Its checkboxes then appear here.
      </p>
    )
  }
  const shownItems = groups.reduce((n, g) => n + g.items.length, 0)
  return (
    <div style={S.column}>
      <ReadOnlyNote />
      <div style={S.row}>
        <label className="text-sm" htmlFor="qz-todo-ws">
          Workspace
        </label>
        <select
          id="qz-todo-ws"
          value={scope}
          onChange={e => setScope(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          style={S.input}
        >
          <option value="all">All companion workspaces</option>
          {companions.map(c => (
            <option key={c.workspace.id} value={c.workspace.id}>
              {c.workspace.name}
            </option>
          ))}
        </select>
        <label className="text-sm" htmlFor="qz-todo-state">
          Show
        </label>
        <select id="qz-todo-state" value={state} onChange={e => setState(e.target.value as TodoState)} style={S.input}>
          <option value="open">Open</option>
          <option value="done">Completed</option>
          <option value="all">All</option>
        </select>
        <input
          aria-label="Filter TODOs"
          placeholder="Filter by text, note or heading"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...S.input, flex: '1 1 200px' }}
        />
      </div>
      <IndexBar
        statuses={data ? Object.values(data.index) : []}
        busy={busy}
        onRefresh={() => void manual(false)}
        onRebuild={() => void manual(true)}
      />
      <ErrorLine failure={failure} />
      {data && (
        <span className="text-sm text-muted">
          {data.counts.open} open · {data.counts.done} completed
          {search.trim() && ` · ${shownItems} matching`}
        </span>
      )}
      {data?.truncated && (
        <div role="note" className="text-sm" style={S.notice}>
          Only the first items are listed. Narrow it down by workspace, state or filter.
        </div>
      )}
      {picked && pickedItem && (
        <SourcePanel
          source={{
            workspaceId: picked.workspaceId,
            workspaceName: picked.workspace,
            path: picked.path,
            title: picked.title,
            heading: pickedItem.heading,
            line: pickedItem.line,
            column: pickedItem.column,
          }}
          onViewNote={props.onViewNote}
          onClose={() => setSelected(null)}
          details={
            <span className="text-sm">
              {pickedItem.checked ? 'Completed' : 'Open'}: “{todoLabel(pickedItem.text)}”
              {picked.ticket && (
                <>
                  {' · '}in a ticket{picked.status ? ` (${STATUS_LABELS[picked.status]})` : ''}.{' '}
                  <button
                    type="button"
                    onClick={() => props.onShowWorkspace(picked.workspaceId)}
                    style={{ background: 'transparent', color: 'inherit', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Show its board
                  </button>
                </>
              )}
            </span>
          }
        />
      )}
      {!data && !failure && <p className="text-sm text-muted">Loading TODOs…</p>}
      {data && groups.length === 0 && (
        <p className="text-sm text-muted">
          {search.trim() ? 'No TODO matches.' : state === 'done' ? 'No completed TODOs.' : state === 'open' ? 'No open TODOs.' : 'No TODOs.'}
        </p>
      )}
      <div style={{ ...S.column, overflowY: 'auto' }}>
        {groups.map(g => (
          <section key={`${g.workspaceId}:${g.path}`} aria-label={`${g.title} (${g.path})`} style={S.info}>
            <div style={S.row}>
              <strong className="text-sm">{g.title}</strong>
              {g.ticket && <span style={{ ...S.badge, borderColor: 'rgba(80,140,255,.7)' }}>ticket{g.status ? ` · ${STATUS_LABELS[g.status]}` : ''}</span>}
              {g.retained && (
                <span style={S.badge} title="Shown as last indexed">
                  last known
                </span>
              )}
              <span className="text-sm text-muted" style={S.mono}>
                {scope === 'all' ? `${g.workspace} › ` : ''}
                {g.path}
              </span>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {g.items.map(item => {
                const isSel = selected?.wsId === g.workspaceId && selected.path === g.path && selected.ordinal === item.ordinal
                return (
                  <li key={item.ordinal} style={{ paddingLeft: item.depth * 18 }}>
                    <button
                      type="button"
                      aria-pressed={isSel}
                      aria-label={`${item.checked ? 'Completed' : 'Open'}: ${todoLabel(item.text)}, line ${item.line}`}
                      onClick={() => setSelected({ wsId: g.workspaceId, path: g.path, ordinal: item.ordinal })}
                      style={{ ...S.todoRow, ...(isSel ? S.selected : {}) }}
                    >
                      <span aria-hidden="true">{item.checked ? '☑' : '☐'}</span>
                      <span className="text-sm" style={{ flex: 1, textDecoration: item.checked ? 'line-through' : undefined }}>
                        {todoLabel(item.text)}
                      </span>
                      <span className="text-sm text-muted">
                        {item.heading ? `${item.heading} · ` : ''}line {item.line}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
