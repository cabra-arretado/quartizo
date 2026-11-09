/** Board and TODO views over the Markdown files shared with Kiro Notes. */
import { type AppApi, useNavigate } from '@kirocrew/app-sdk'
import { Btn } from '@kirocrew/app-sdk/ui'
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  type ApiFailure,
  type BoardData,
  companionStatus,
  createTicket,
  demoteTicket,
  moveTicket,
  mutationProblem,
  planMove,
  promoteNote,
  readSource,
  rebalanceTickets,
  STATUSES,
  type SourceNote,
  type TaskStatus,
  type TodoGroup,
  type TodoItem,
  toggleTodo,
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
  fileName: { fontFamily: 'ui-monospace, monospace', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: '100%' },
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
function useCompanions(api: AppApi, active = true) {
  const [companions, setCompanions] = useState<CompanionWorkspace[] | null>(null)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  useEffect(() => {
    if (!active) return
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
  }, [api, active])
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
        setBusy(false)
      } catch (err) {
        if (!cancelled) { setFailure(toFailure(err)); setBusy(false) }
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
  const reload = useCallback(() => {
    latest.current = null
    // Keep the current cards mounted while their new snapshot loads, so a
    // successful edit does not flash an empty board or drop keyboard focus.
    setBusy(true)
    setTick(n => n + 1)
  }, [])
  return { data, failure, busy, refresh, reload }
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

/** The file name Kiro Notes lists the note under, when the title shown differs from it. */
function FileName({ path, title }: { path: string; title: string }) {
  const name = noteName(path)
  if (name === title) return null
  return (
    <span className="text-sm text-muted" title={name} style={S.fileName}>
      {name}
    </span>
  )
}

function NoCompanions() {
  return <p className="text-sm text-muted">No folder is shared with Kiro Notes yet. Add one in Settings.</p>
}

// ---------------------------------------------------------------------------
// Tasks: the board of one companion workspace
// ---------------------------------------------------------------------------

export function TasksView(props: { api: AppApi; active?: boolean }) {
  const active = props.active ?? true
  const { companions, failure } = useCompanions(props.api, active)
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

  if (failure && !companions) return <ErrorLine failure={failure} />
  if (!companions) return <p className="text-sm text-muted">Loading…</p>
  if (!current) return <NoCompanions />
  return (
    <div style={{ ...S.column, flex: 1 }}>
      <ErrorLine failure={failure} />
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
      {companions.map(({ workspace }) => <div key={workspace.uid} hidden={workspace.id !== current.id}
        style={{ display: workspace.id === current.id ? 'flex' : 'none', flex: 1, minHeight: 0 }}>
        <TicketBoard api={props.api} workspace={workspace} active={active && workspace.id === current.id} />
      </div>)}
    </div>
  )
}

/** One write at a time. A failed action keeps the source data and every form draft. */
function useMutation(onChanged: () => void) {
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const mounted = useRef(true)
  const locked = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    if (locked.current) return false
    locked.current = true
    setPending(true)
    setFailure(null)
    try {
      await withTimeout(action())
      if (mounted.current) onChanged()
      return true
    } catch (err) {
      if (mounted.current) {
        const problem = toFailure(err)
        if (problem.status === 409) problem.message += ' Refresh to review the current file, then retry your change.'
        if (problem.message.includes('timed out') || !problem.status) problem.message += ' The result may be unknown; refresh and check the file before retrying.'
        setFailure(problem)
      }
      return false
    } finally {
      locked.current = false
      if (mounted.current) setPending(false)
    }
  }
  return { pending, failure, run }
}

function TicketBoard(props: { api: AppApi; workspace: Workspace; active: boolean }) {
  const { api, workspace, active } = props
  const wsId = workspace.id
  const navigate = useNavigate()
  const { data, failure, busy, refresh, reload } = useIndexed<BoardData>(
    active, String(wsId), () => loadBoard(api, wsId),
    manual => requestRefresh(api, { workspaceId: wsId, manual }), d => d.index.state === 'scanning',
  )
  const action = useMutation(reload)
  const lanes = useMemo(() => groupLanes(data?.tickets ?? []), [data])
  const shown = LANES.filter(l => l !== 'repair' || lanes.repair.length > 0)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<Ticket | null>(null)
  const [form, setForm] = useState<'create' | 'promote' | null>(null)
  const [formPending, setFormPending] = useState(false)
  const blocked = !active || !!failure || busy || action.pending || formPending || !!mutationProblem(data?.index)
  const [maintenanceStatus, setMaintenanceStatus] = useState<TaskStatus>('backlog')
  const [confirmMaintenance, setConfirmMaintenance] = useState(false)
  const [reconcileMaintenance, setReconcileMaintenance] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const needMaintenance = useCallback((status: TaskStatus) => {
    setMaintenanceStatus(status)
    setShowMaintenance(true)
  }, [])
  const [focusPath, setFocusPath] = useState<string | null>(null)
  useEffect(() => {
    if (!focusPath || blocked || !data) return
    const target = Array.from(boardRef.current?.querySelectorAll<HTMLButtonElement>('[data-note-path]') ?? [])
      .find(button => button.dataset.notePath === focusPath)
    target?.focus()
    setFocusPath(null)
  }, [focusPath, blocked, data])

  const move = (ticket: Ticket, status: TaskStatus, position?: number) => {
    if (blocked || mutationProblem(data?.index, ticket) || !data || data.index.maintenance?.includes(status)) return
    void action.run(() => moveTicket(api, wsId, planMove(data.tickets, ticket, status, position)))
      .then(ok => { if (ok) setFocusPath(ticket.path) })
  }
  const drop = (event: React.DragEvent, status: TaskStatus, before?: Ticket) => {
    event.preventDefault()
    event.stopPropagation()
    const ticket = dragging.current
    dragging.current = null
    if (!ticket || before?.path === ticket.path) return
    const rest = lanes[status].filter(t => t.path !== ticket.path)
    const position = before ? rest.findIndex(t => t.path === before.path) : undefined
    if (position !== undefined && position < 0) return
    move(ticket, status, position)
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
    const el = e.target as HTMLElement
    if (!el.hasAttribute('data-lane')) return
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
    ci = Math.min(ci, lanes[shown[li]].length - 1)
    e.preventDefault()
    boardRef.current?.querySelector<HTMLElement>(`[data-lane="${li}"][data-index="${ci}"]`)?.focus()
  }

  return (
    <div style={{ ...S.column, flex: 1 }}>
      <div style={S.row}>
        <Btn onClick={() => setForm(form === 'create' ? null : 'create')} disabled={action.pending || formPending}>New ticket</Btn>
        <Btn onClick={() => setForm(form === 'promote' ? null : 'promote')} disabled={action.pending || formPending}>Use existing note</Btn>
        <Btn onClick={() => setShowMaintenance(value => !value)} disabled={blocked}>Rebalance…</Btn>
        <Btn onClick={() => navigate(KIRO_NOTES_ROUTE)}>Open Kiro Notes</Btn>
      </div>
      {(['create', 'promote'] as const).map(mode => <div key={mode} hidden={form !== mode} style={{ display: form === mode ? 'block' : 'none' }}>
        <TicketForm mode={mode} api={api} workspace={workspace} disabled={!active || !!failure || busy || action.pending || !!mutationProblem(data?.index)} maintenance={data?.index.maintenance ?? []} onBusy={setFormPending} onChanged={reload} onClose={() => setForm(null)} onMaintenanceNeeded={needMaintenance} />
      </div>)}
      <IndexBar statuses={data ? [data.index] : []} busy={busy || action.pending} onRefresh={() => void refresh()} />
      <ErrorLine failure={failure} />
      <ErrorLine failure={action.failure} />
      {mutationProblem(data?.index) && data && <div role="note" className="text-sm">{mutationProblem(data.index)}</div>}
      {showMaintenance || action.failure?.code === 'rank_exhausted' || action.failure?.code === 'maintenance_pending' || data?.index.maintenance?.length ? (
        <div style={S.notice}>
          <span className="text-sm">Rebalance a column to restore space between card positions. Progress is saved if interrupted.</span>
          <div style={S.row}>
            <select aria-label="Column to rebalance" value={maintenanceStatus} onChange={e => setMaintenanceStatus(e.target.value as TaskStatus)} style={S.input}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <Btn onClick={() => setConfirmMaintenance(true)} disabled={!active || action.pending || !!data?.index.writeBlocked}>Review column…</Btn>
          </div>
          {confirmMaintenance && <div role="alertdialog" aria-label="Rebalance column">
            <p className="text-sm">Update ordering in each note of this column? Other editors may see progress before all files finish.</p>
            {!!data?.index.maintenance?.includes(maintenanceStatus) && <label className="text-sm">
              <input type="checkbox" checked={reconcileMaintenance} onChange={e => setReconcileMaintenance(e.target.checked)} disabled={action.pending} />
              Keep the latest note contents and resume ordering after an external edit
            </label>}
            <Btn disabled={!active || action.pending || !!data?.index.writeBlocked} onClick={() => void action.run(() => rebalanceTickets(api, wsId, maintenanceStatus, reconcileMaintenance)).then(ok => { if (ok) { setConfirmMaintenance(false); setReconcileMaintenance(false) } })}>Rebalance column</Btn>
            <Btn disabled={action.pending} onClick={() => setConfirmMaintenance(false)}>Cancel</Btn>
          </div>}
        </div>
      ) : null}
      {!data && !failure && <p className="text-sm text-muted">Loading the board…</p>}
      {data && data.tickets.length === 0 && data.index.state !== 'scanning' && <p className="text-sm text-muted">No tickets in “{workspace.name}” yet. Create a ticket or use an existing note.</p>}
      {data && (
        <div ref={boardRef} style={S.board} onKeyDown={onKey} aria-label={`Board of ${workspace.name}`} role="group">
          {shown.map((lane, li) => (
            <section key={lane} aria-label={LANE_LABELS[lane]} style={S.lane}
              onDragOver={e => { if (!blocked && lane !== 'repair') e.preventDefault() }}
              onDrop={e => { if (lane !== 'repair') drop(e, lane) }}>
              <strong className="text-sm">{LANE_LABELS[lane]} ({lanes[lane].length})</strong>
              <ul style={S.cards}>
                {lanes[lane].map((t, ci) => (
                  <li key={t.path} draggable={!blocked && !mutationProblem(data.index, t)}
                    onDragStart={e => { dragging.current = t; e.dataTransfer.setData('text/plain', t.path); e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => { dragging.current = null }}
                    onDragOver={e => { if (!blocked && lane !== 'repair') e.preventDefault() }}
                    onDrop={e => { if (lane !== 'repair') drop(e, lane, t) }}>
                    <TicketCard ticket={t} lane={li} index={ci} onOpen={() => navigate(KIRO_NOTES_ROUTE)}
                      disabled={blocked || !!mutationProblem(data.index, t)} maintenance={data.index.maintenance ?? []}
                      onMove={(status, position) => move(t, status, position)}
                      onDemote={() => {
                        if (window.confirm(`Remove “${t.title}” from the board? Its note and TODOs will remain.`)) void action.run(() => demoteTicket(api, wsId, t))
                      }}
                      count={lanes[lane].length} />
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

function TicketForm(props: { mode: 'create' | 'promote'; api: AppApi; workspace: Workspace; disabled: boolean; maintenance: TaskStatus[]; onBusy: (busy: boolean) => void; onChanged: () => void; onClose: () => void; onMaintenanceNeeded: (status: TaskStatus) => void }) {
  const [path, setPath] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<TaskStatus>('backlog')
  const [source, setSource] = useState<SourceNote | null>(null)
  const [previewFailure, setPreviewFailure] = useState<ApiFailure | null>(null)
  const [previewBusy, setPreviewBusy] = useState(false)
  const previewVersion = useRef(0)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; previewVersion.current++ }
  }, [])
  const action = useMutation(props.onChanged)
  useEffect(() => { props.onBusy(action.pending); return () => props.onBusy(false) }, [action.pending, props.onBusy])
  const blocked = props.disabled || action.pending || previewBusy
  const columnBusy = props.maintenance.includes(props.mode === 'promote' ? 'backlog' : status)
  useEffect(() => {
    if (action.failure?.code === 'rank_exhausted' || action.failure?.code === 'maintenance_pending') {
      props.onMaintenanceNeeded(props.mode === 'promote' ? 'backlog' : status)
    }
  }, [action.failure, props.mode, props.onMaintenanceNeeded, status])
  const discard = () => {
    setPath(''); setTitle(''); setBody(''); setSource(null); setPreviewFailure(null)
    props.onClose()
  }
  const notePath = path.trim().endsWith('.md') ? path.trim() : `${path.trim()}.md`
  const preview = async () => {
    const version = ++previewVersion.current
    setPreviewBusy(true)
    setPreviewFailure(null)
    setSource(null)
    try {
      const value = await withTimeout(readSource(props.api, props.workspace.id, notePath))
      if (mounted.current && version === previewVersion.current) setSource(value)
    } catch (err) {
      if (mounted.current && version === previewVersion.current) setPreviewFailure(toFailure(err))
    } finally {
      if (mounted.current && version === previewVersion.current) setPreviewBusy(false)
    }
  }
  const submit = async () => {
    const ok = await action.run(() => props.mode === 'create'
      ? createTicket(props.api, props.workspace.id, { path: notePath, title: title.trim(), body, status })
      : promoteNote(props.api, props.workspace.id, source!))
    if (ok && mounted.current) {
      setPath(''); setTitle(''); setBody(''); setSource(null)
      props.onClose()
    }
  }
  return <section style={S.box} aria-label={props.mode === 'create' ? 'New ticket' : 'Use existing note'}>
    <label className="text-sm">Note path in {props.workspace.name}
      <input aria-label="Ticket note path" placeholder="tickets/fix-login.md" value={path} disabled={action.pending}
        onChange={e => { previewVersion.current++; setPreviewBusy(false); setPath(e.target.value); setSource(null) }} style={{ ...S.input, marginLeft: 6 }} />
    </label>
    {props.mode === 'create' ? <>
      <input aria-label="Ticket title" placeholder="Ticket title" value={title} disabled={action.pending} onChange={e => setTitle(e.target.value)} style={S.input} />
      <textarea aria-label="Ticket description" placeholder="Description (Markdown)" value={body} disabled={action.pending} onChange={e => setBody(e.target.value)} rows={4} style={S.input} />
      <select aria-label="Initial status" value={status} disabled={action.pending} onChange={e => setStatus(e.target.value as TaskStatus)} style={S.input}>
        {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
      </select>
    </> : <>
      <Btn disabled={blocked || !path.trim()} onClick={() => void preview()}>Preview note</Btn>
      {source && <><pre style={{ ...S.mono, maxHeight: 180, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{source.content}</pre>
        <p className="text-sm">Add ticket fields with Backlog status. Existing note content and unrelated properties are preserved.</p></>}
    </>}
    {columnBusy && <span className="text-sm">Resume ordering maintenance for this column before adding a ticket.</span>}
    <ErrorLine failure={previewFailure} /><ErrorLine failure={action.failure} />
    <div style={S.row}>
      <Btn disabled={blocked || columnBusy || !path.trim() || (props.mode === 'create' ? !title.trim() : !source)} onClick={() => void submit()}>{props.mode === 'create' ? 'Create ticket' : 'Make ticket'}</Btn>
      <Btn disabled={action.pending} onClick={discard}>Cancel</Btn>
    </div>
  </section>
}

function TicketCard(props: { ticket: Ticket; lane: number; index: number; onOpen: () => void; disabled: boolean; onMove: (status: TaskStatus, position?: number) => void; onDemote: () => void; maintenance: TaskStatus[]; count: number }) {
  const { ticket: t } = props
  return <div style={{ ...S.card, flexDirection: 'column' }}>
    <div style={{ ...S.row, width: '100%', alignItems: 'flex-start' }}>
      <button type="button" data-lane={props.lane} data-index={props.index} data-note-path={t.path} aria-label={`Open Kiro Notes: ${t.title}`} onClick={props.onOpen} style={S.open}>
        <span className="text-sm" style={{ fontWeight: 600 }}>{t.title}</span>
        <FileName path={t.path} title={t.title} />
        <span className="text-sm text-muted" style={{ overflowWrap: 'anywhere' }}>{t.path}</span>
        {t.todos.total > 0 && <span className="text-sm text-muted">☑ {t.todos.done}/{t.todos.total}</span>}
        {t.diagnostics.map(d => <span key={d.code} style={S.badge} title={d.message}>{d.code.replace(/_/g, ' ')}</span>)}
      </button>
      <CopyName path={t.path} />
    </div>
    <div style={S.row}>
      <select aria-label={`Move ${t.title} to column`} value={t.status ?? ''} disabled={props.disabled} style={S.input}
        onChange={e => props.onMove(e.target.value as TaskStatus)}>
        {!t.status && <option value="">Needs repair</option>}
        {STATUSES.map(s => <option key={s} value={s} disabled={props.maintenance.includes(s)}>{STATUS_LABELS[s]}</option>)}
      </select>
      <button type="button" aria-label={`Move ${t.title} up`} disabled={props.disabled || props.index === 0 || !t.status} onClick={() => t.status && props.onMove(t.status, props.index - 1)} style={S.copy}>↑</button>
      <button type="button" aria-label={`Remove ${t.title} from board`} disabled={props.disabled} onClick={props.onDemote} style={S.copy}>Remove ticket…</button>
      <button type="button" aria-label={`Move ${t.title} down`} disabled={props.disabled || props.index >= props.count - 1 || !t.status} onClick={() => t.status && props.onMove(t.status, props.index + 1)} style={S.copy}>↓</button>
    </div>
  </div>
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
  const { data, failure, busy, refresh, reload } = useIndexed<TodoData>(
    enabled,
    `${scope}:${state}`,
    () => loadTodos(api, state, wsId),
    manual => requestRefresh(api, { workspaceId: wsId, manual }),
    d => Object.values(d.index).some(i => i.state === 'scanning'),
  )
  const groups = useMemo(() => filterTodos(data?.groups ?? [], search), [data, search])
  const action = useMutation(reload)
  const toggle = (group: TodoGroup, item: TodoItem, checked: boolean) => {
    if (action.pending || failure || busy || mutationProblem(data?.index[String(group.workspaceId)], group) || item.markerStart === undefined) return
    void action.run(() => toggleTodo(api, group, item, checked))
  }

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
      <IndexBar statuses={data ? Object.values(data.index) : []} busy={busy || action.pending} onRefresh={() => void refresh()} />
      <ErrorLine failure={failure} />
      <ErrorLine failure={action.failure} />
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
            <FileName path={g.path} title={g.title} />
            <span className="text-sm text-muted" style={S.mono}>{g.workspace} · {g.path}</span>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {g.items.map(item => (
                <li key={item.ordinal} style={{ ...S.todoRow, paddingLeft: item.depth * 18 }}>
                  <input type="checkbox" aria-label={`Complete ${todoLabel(item.text)}`} checked={item.checked}
                    disabled={action.pending || !!failure || busy || !!mutationProblem(data?.index[String(g.workspaceId)], g) || item.markerStart === undefined}
                    onChange={e => toggle(g, item, e.target.checked)} />
                  <button
                    type="button"
                    title={`${g.path}:${item.line}:${item.column}${item.heading ? ` · ${item.heading}` : ''}`}
                    aria-label={`Open Kiro Notes: ${todoLabel(item.text)}`}
                    onClick={() => navigate(KIRO_NOTES_ROUTE)}
                    style={{ ...S.open, flexDirection: 'row', gap: 6 }}
                  >
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
