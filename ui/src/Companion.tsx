/**
 * Kiro Notes companion views: a read-only Board of ticket notes and a TODO list
 * of Markdown checkboxes, both from the backend's rebuildable index of the
 * shared folders (backend/companion.py).
 *
 * Read only, on purpose (docs/markdown-tickets-plan.md, 2026-10-20 update):
 * native Kiro Notes can silently overwrite external edits that keep the file's
 * timestamp, so nothing here moves a card or checks a box. Native Notes is the
 * editor: clicking a card or TODO opens it (noteNav.ts), and Kiro Notes cannot
 * be told which note, so every item has a button that copies the note's name.
 */
import { type AppApi, useNavigate } from '@kirocrew/app-sdk'
import { Btn } from '@kirocrew/app-sdk/ui'
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type ApiFailure,
  type BoardData,
  companionStatus,
  type CompanionWorkspace,
  describeIndex,
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
  STATUS_LABELS,
  todoLabel,
  toFailure,
  withTimeout,
  type Workspace,
} from './companionApi'
import { KIRO_NOTES_ROUTE, noteName } from './noteNav'
import { ErrorLine, S as UI, storage } from './ui'

/** While a scan runs the views check every SCANNING_MS; otherwise they rescan every IDLE_MS while visible. */
export const SCANNING_MS = 1500
export const IDLE_MS = 30000

const WS_KEY = 'quartizo:workspace'

const S = {
  ...UI,
  board: { display: 'grid', gridAutoFlow: 'column' as const, gridAutoColumns: 'minmax(170px, 1fr)', gap: 8, overflowX: 'auto' as const, minHeight: 0, flex: 1 },
  lane: { display: 'flex', flexDirection: 'column' as const, gap: 6, minHeight: 120, padding: 6, borderRadius: 4, border: '1px solid rgba(128,128,128,.25)' },
  cards: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' as const, gap: 6 },
  card: { display: 'flex', alignItems: 'flex-start', gap: 4, padding: 6, borderRadius: 4, border: '1px solid rgba(128,128,128,.35)' },
  open: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const, gap: 2, padding: 0, background: 'transparent', color: 'inherit', border: 'none', textAlign: 'left' as const, cursor: 'pointer' },
  todoRow: { display: 'flex', gap: 6, alignItems: 'baseline' },
  copy: { flex: 'none', fontSize: 11, padding: '1px 6px', borderRadius: 3, border: '1px solid rgba(128,128,128,.4)', background: 'transparent', color: 'inherit', cursor: 'pointer' },
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

/** The companion workspaces, read when the view opens (Settings may have changed them). */
function useCompanions(api: AppApi) {
  const [companions, setCompanions] = useState<CompanionWorkspace[] | null>(null)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  useEffect(() => {
    let cancelled = false
    companionStatus(api)
      .then(s => {
        if (cancelled) return
        setCompanions(s.workspaces.filter(w => w.workspace.companion))
        setFailure(s.available ? null : { message: s.error ?? 'The Markdown index is unavailable.' })
      })
      .catch(err => !cancelled && setFailure(toFailure(err)))
    return () => {
      cancelled = true
    }
  }, [api])
  return { companions, failure }
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
  rescan: (manual: boolean) => Promise<unknown>,
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
  const scanningRef = useRef(scanning)
  fetchRef.current = fetch
  rescanRef.current = rescan
  scanningRef.current = scanning

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
        if (first || !latest.current || !scanningRef.current(latest.current)) await withTimeout(rescanRef.current(false))
        const value = await withTimeout(fetchRef.current())
        if (cancelled) return
        latest.current = value
        setData(value)
        setFailure(null)
      } catch (err) {
        if (!cancelled) setFailure(toFailure(err))
      }
      first = false
      if (!cancelled) timer = setTimeout(run, latest.current && scanningRef.current(latest.current) ? SCANNING_MS : IDLE_MS)
    }
    void run()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [active, visible, key, tick])

  /** Refresh from the button: never throttled. */
  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      await withTimeout(rescanRef.current(true))
      setFailure(null)
      setTick(n => n + 1)
    } catch (err) {
      setFailure(toFailure(err))
    } finally {
      setBusy(false)
    }
  }, [])
  return { data, failure, busy, refresh }
}

function IndexBar(props: { statuses: IndexStatus[]; busy: boolean; onRefresh: () => void }) {
  const now = Date.now()
  const lines = props.statuses.map(s => describeIndex(s, now)).filter(Boolean)
  const warnings = props.statuses.map(s => indexWarning(s)).filter((w): w is string => !!w)
  return (
    <>
      <div style={S.row}>
        <span className="text-sm text-muted" role="status" aria-live="polite">
          {lines.join(' · ')}
        </span>
        <Btn onClick={props.onRefresh} disabled={props.busy}>
          Refresh
        </Btn>
      </div>
      {warnings.map(w => (
        <div key={w} role="note" className="text-sm" style={S.notice}>
          {w}
        </div>
      ))}
    </>
  )
}

/** Copies the note's name, to find it in Kiro Notes. */
function CopyName({ path }: { path: string }) {
  const name = noteName(path)
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  useEffect(() => {
    if (state === 'idle') return
    const t = setTimeout(() => setState('idle'), 1500)
    return () => clearTimeout(t)
  }, [state])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(name)
      setState('copied')
    } catch {
      setState('failed')
    }
  }
  return (
    <button type="button" onClick={() => void copy()} aria-label={`Copy note name “${name}”`} title={name} style={S.copy}>
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Failed' : 'Copy name'}
    </button>
  )
}

function NoCompanions() {
  return <p className="text-sm text-muted">No folder is shared with Kiro Notes yet. Add one in Settings.</p>
}

// ---------------------------------------------------------------------------
// Tasks: the board of one companion workspace
// ---------------------------------------------------------------------------

export function TasksView(props: { api: AppApi }) {
  const { companions, failure } = useCompanions(props.api)
  const [wsId, setWsId] = useState<number | null>(() => {
    const v = Number(storage()?.getItem(WS_KEY))
    return Number.isInteger(v) && v > 0 ? v : null
  })
  const current = companions?.find(c => c.workspace.id === wsId)?.workspace ?? companions?.[0]?.workspace ?? null
  useEffect(() => {
    try {
      if (current) storage()?.setItem(WS_KEY, String(current.id))
    } catch {
      /* not remembered */
    }
  }, [current])

  if (failure) return <ErrorLine failure={failure} />
  if (!companions) return <p className="text-sm text-muted">Loading…</p>
  if (!current) return <NoCompanions />
  return (
    <div style={{ ...S.column, flex: 1 }}>
      {companions.length > 1 && (
        <div style={S.row}>
          <label className="text-sm" htmlFor="qz-board-ws">
            Workspace
          </label>
          <select id="qz-board-ws" value={current.id} onChange={e => setWsId(Number(e.target.value))} style={S.input}>
            {companions.map(c => (
              <option key={c.workspace.id} value={c.workspace.id}>
                {c.workspace.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <TicketBoard key={current.id} api={props.api} workspace={current} />
    </div>
  )
}

function TicketBoard(props: { api: AppApi; workspace: Workspace }) {
  const { api, workspace } = props
  const wsId = workspace.id
  const navigate = useNavigate()
  const { data, failure, busy, refresh } = useIndexed<BoardData>(
    true,
    String(wsId),
    () => loadBoard(api, wsId),
    manual => requestRefresh(api, { workspaceId: wsId, manual }),
    d => d.index.state === 'scanning',
  )
  const lanes = useMemo(() => groupLanes(data?.tickets ?? []), [data])
  const shown = LANES.filter(l => l !== 'repair' || lanes.repair.length > 0)
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
    <div style={{ ...S.column, flex: 1 }}>
      <IndexBar statuses={data ? [data.index] : []} busy={busy} onRefresh={() => void refresh()} />
      <ErrorLine failure={failure} />
      {!data && !failure && <p className="text-sm text-muted">Loading the board…</p>}
      {data && data.tickets.length === 0 && data.index.state !== 'scanning' && (
        <p className="text-sm text-muted">
          No ticket notes in “{workspace.name}” yet. In Kiro Notes, give a note <code>type: ticket</code>, an <code>id</code>, a{' '}
          <code>status</code> and an <code>order</code> in its frontmatter.
        </p>
      )}
      {data && data.tickets.length > 0 && (
        <div ref={boardRef} style={S.board} onKeyDown={onKey} aria-label={`Board of ${workspace.name}`} role="group">
          {shown.map((lane, li) => (
            <section key={lane} aria-label={LANE_LABELS[lane]} style={S.lane}>
              <strong className="text-sm">
                {LANE_LABELS[lane]} ({lanes[lane].length})
              </strong>
              <ul style={S.cards}>
                {lanes[lane].map((t, ci) => (
                  <li key={t.path}>
                    <TicketCard ticket={t} lane={li} index={ci} onOpen={() => navigate(KIRO_NOTES_ROUTE)} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function TicketCard(props: { ticket: Ticket; lane: number; index: number; onOpen: () => void }) {
  const { ticket: t } = props
  return (
    <div style={S.card}>
      <button
        type="button"
        data-lane={props.lane}
        data-index={props.index}
        aria-label={`Open Kiro Notes: ${t.title}`}
        onClick={props.onOpen}
        style={S.open}
      >
        <span className="text-sm" style={{ fontWeight: 600 }}>
          {t.title}
        </span>
        {(t.todos.total > 0 || t.diagnostics.length > 0) && (
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
          </span>
        )}
      </button>
      <CopyName path={t.path} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// TODOs
// ---------------------------------------------------------------------------

export function TodoView(props: { api: AppApi }) {
  const { api } = props
  const navigate = useNavigate()
  const { companions, failure: statusFailure } = useCompanions(api)
  const [scope, setScope] = useState<number | 'all'>('all')
  const [state, setState] = useState<TodoState>('open')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (companions && scope !== 'all' && !companions.some(c => c.workspace.id === scope)) setScope('all')
  }, [companions, scope])

  const wsId = scope === 'all' ? undefined : scope
  const enabled = !!companions && companions.length > 0
  const { data, failure, busy, refresh } = useIndexed<TodoData>(
    enabled,
    `${scope}:${state}`,
    () => loadTodos(api, state, wsId),
    manual => requestRefresh(api, { workspaceId: wsId, manual }),
    d => Object.values(d.index).some(i => i.state === 'scanning'),
  )
  const groups = useMemo(() => filterTodos(data?.groups ?? [], search), [data, search])

  if (statusFailure) return <ErrorLine failure={statusFailure} />
  if (!companions) return <p className="text-sm text-muted">Loading…</p>
  if (companions.length === 0) return <NoCompanions />
  return (
    <div style={{ ...S.column, flex: 1 }}>
      <div style={S.row}>
        {companions.length > 1 && (
          <select
            aria-label="Workspace"
            value={scope}
            onChange={e => setScope(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            style={S.input}
          >
            <option value="all">All workspaces</option>
            {companions.map(c => (
              <option key={c.workspace.id} value={c.workspace.id}>
                {c.workspace.name}
              </option>
            ))}
          </select>
        )}
        <select aria-label="Show" value={state} onChange={e => setState(e.target.value as TodoState)} style={S.input}>
          <option value="open">Open</option>
          <option value="done">Completed</option>
          <option value="all">All</option>
        </select>
        <input
          aria-label="Filter TODOs"
          placeholder="Filter"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...S.input, flex: '1 1 200px' }}
        />
      </div>
      <IndexBar statuses={data ? Object.values(data.index) : []} busy={busy} onRefresh={() => void refresh()} />
      <ErrorLine failure={failure} />
      {data?.truncated && (
        <div role="note" className="text-sm" style={S.notice}>
          Only the first items are listed. Narrow it down by workspace, state or filter.
        </div>
      )}
      {!data && !failure && <p className="text-sm text-muted">Loading TODOs…</p>}
      {data && groups.length === 0 && <p className="text-sm text-muted">{search.trim() ? 'No TODO matches.' : 'No TODOs.'}</p>}
      <div style={{ ...S.column, overflowY: 'auto' }}>
        {groups.map(g => (
          <section key={`${g.workspaceId}:${g.path}`} aria-label={g.title} style={S.box}>
            <strong className="text-sm">
              {g.title}
              {g.ticket && g.status && <span className="text-muted" style={{ fontWeight: 400 }}>{` · ${STATUS_LABELS[g.status]}`}</span>}
            </strong>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {g.items.map(item => (
                <li key={item.ordinal} style={{ ...S.todoRow, paddingLeft: item.depth * 18 }}>
                  <button
                    type="button"
                    aria-label={`Open Kiro Notes: ${todoLabel(item.text)}`}
                    onClick={() => navigate(KIRO_NOTES_ROUTE)}
                    style={{ ...S.open, flexDirection: 'row', gap: 6 }}
                  >
                    <span aria-hidden="true">{item.checked ? '☑' : '☐'}</span>
                    <span className="text-sm" style={{ textDecoration: item.checked ? 'line-through' : undefined }}>
                      {todoLabel(item.text)}
                    </span>
                  </button>
                  <CopyName path={g.path} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
