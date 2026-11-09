/** Board and TODO views over the Markdown files shared with Kiro Notes. */
import { type AppApi, useNavigate } from '@kirocrew/app-sdk'
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
import { ErrorLine, Icon, storage } from './ui'

/** While a scan runs the views check every SCANNING_MS; otherwise they rescan every IDLE_MS while visible. */
export const SCANNING_MS = 1500
export const IDLE_MS = 30000

const WS_KEY = 'quartizo:workspace'

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

function IndexStatusLine({ statuses }: { statuses: IndexStatus[] }) {
  const now = Date.now()
  const lines = statuses.map(s => describeIndex(s, now)).filter(Boolean)
  return <span className="qz-index" role="status">
    {lines.length > 0 && <><span className="qz-dot" data-attention={statuses.some(s => s.state === 'scanning' || !!indexWarning(s))} />{lines.join(' · ')}</>}
  </span>
}

function IndexWarnings({ statuses }: { statuses: IndexStatus[] }) {
  const warnings = new Set(statuses.map(indexWarning).filter(Boolean))
  return (
    <>
      {[...warnings].map(w => <div key={w} role="note" className="qz-notice">{w}</div>)}
    </>
  )
}

/** Copies the note's name, to find it in Kiro Notes. */
function CopyName({ path, compact = false }: { path: string; compact?: boolean }) {
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
    <>
      <button type="button" className={`qz-button${compact ? ' qz-icon-button' : ''}`} data-variant="quiet"
        onClick={() => void copy()} aria-label={`Copy note name “${name}”`} title={`Copy note name “${name}”`}>
        <Icon name={state === 'copied' ? 'check' : 'copy'} />
        {(!compact || state !== 'idle') && (state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy name')}
      </button>
      <span className="qz-visually-hidden" role="status">{state === 'copied' ? 'Note name copied.' : state === 'failed' ? 'Could not copy note name.' : ''}</span>
    </>
  )
}

function NoCompanions({ onSettings }: { onSettings: () => void }) {
  return (
    <div className="qz-empty">
      <span className="qz-empty-icon"><Icon name="folder" /></span>
      <h2>Connect a notes folder</h2>
      <p>Share a folder from Kiro Notes to see its tickets and TODOs here.</p>
      <button type="button" className="qz-button" data-variant="primary" onClick={onSettings}>Open Settings</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tasks: the board of one companion workspace
// ---------------------------------------------------------------------------

export function TasksView(props: { api: AppApi; active?: boolean; onSettings: () => void }) {
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
  if (!companions) return <p className="qz-empty" role="status">Loading workspaces…</p>
  if (!current) return <NoCompanions onSettings={props.onSettings} />
  return (
    <div className="qz-stack">
      <ErrorLine failure={failure} />
      <div className="qz-view-heading">
        <div>
          <h2 className="qz-section-title">Task board</h2>
          <p className="qz-section-description">Plan and track tickets stored in Kiro Notes.</p>
        </div>
        <label className="qz-inline-field">
          <Icon name="folder" />
          <span>Workspace</span>
          <select className="qz-input" value={current.id} onChange={e => setWsId(Number(e.target.value))}>
            {companions.map(c => (
              <option key={c.workspace.id} value={c.workspace.id}>
                {c.workspace.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {companions.map(({ workspace }) => <div key={workspace.uid} hidden={workspace.id !== current.id}>
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
  const firstField = useRef<HTMLInputElement>(null)
  useEffect(() => { if (form) firstField.current?.focus() }, [form])
  const [formPending, setFormPending] = useState(false)
  const blocked = !active || !!failure || busy || action.pending || formPending || !!mutationProblem(data?.index)
  const [maintenanceStatus, setMaintenanceStatus] = useState<TaskStatus>('backlog')
  const [confirmMaintenance, setConfirmMaintenance] = useState(false)
  const [reconcileMaintenance, setReconcileMaintenance] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const indexes = data ? [data.index] : []
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
    <div className="qz-stack">
      <div className="qz-toolbar">
        <div className="qz-actions">
          <button type="button" className="qz-button" data-variant="primary" aria-expanded={form === 'create'}
            onClick={() => setForm(form === 'create' ? null : 'create')} disabled={action.pending || formPending}><Icon name="plus" />New ticket</button>
          <button type="button" className="qz-button" aria-expanded={form === 'promote'}
            onClick={() => setForm(form === 'promote' ? null : 'promote')} disabled={action.pending || formPending}><Icon name="note" />Use existing note</button>
        </div>
        <div className="qz-actions">
          <button type="button" className="qz-button" data-variant="quiet" aria-expanded={showMaintenance}
            onClick={() => setShowMaintenance(value => !value)} disabled={blocked}>Rebalance…</button>
          <button type="button" className="qz-button" data-variant="quiet" onClick={() => navigate(KIRO_NOTES_ROUTE)}><Icon name="external" />Open Kiro Notes</button>
        </div>
      </div>
      {(['create', 'promote'] as const).map(mode => <div key={mode} hidden={form !== mode}>
        <TicketForm mode={mode} api={api} workspace={workspace} firstField={form === mode ? firstField : undefined} disabled={!active || !!failure || busy || action.pending || !!mutationProblem(data?.index)} maintenance={data?.index.maintenance ?? []} onBusy={setFormPending} onChanged={reload} onClose={() => setForm(null)} onMaintenanceNeeded={needMaintenance} />
      </div>)}
      <div className="qz-toolbar qz-board-meta">
        {data && <span className="qz-result-count">{data.tickets.length} {data.tickets.length === 1 ? 'ticket' : 'tickets'}</span>}
        <div className="qz-actions">
          <IndexStatusLine statuses={indexes} />
          <button type="button" className="qz-button" data-variant="quiet" onClick={() => void refresh()} disabled={busy || action.pending}><Icon name="refresh" />Refresh</button>
        </div>
      </div>
      <IndexWarnings statuses={indexes} />
      <ErrorLine failure={failure} />
      <ErrorLine failure={action.failure} />
      {mutationProblem(data?.index) && data && <div role="note" className="qz-notice">{mutationProblem(data.index)}</div>}
      {showMaintenance || action.failure?.code === 'rank_exhausted' || action.failure?.code === 'maintenance_pending' || data?.index.maintenance?.length ? (
        <div className="qz-notice qz-stack">
          <p>Rebalance a column to restore space between card positions. Progress is saved if interrupted.</p>
          <div className="qz-actions">
            <select className="qz-input" aria-label="Column to rebalance" value={maintenanceStatus} onChange={e => setMaintenanceStatus(e.target.value as TaskStatus)}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <button type="button" className="qz-button" onClick={() => setConfirmMaintenance(true)} disabled={!active || action.pending || !!data?.index.writeBlocked}>Review column…</button>
          </div>
          {confirmMaintenance && <div className="qz-stack" role="alertdialog" aria-label="Rebalance column">
            <p>Update ordering in each note of this column? Other editors may see progress before all files finish.</p>
            {!!data?.index.maintenance?.includes(maintenanceStatus) && <label className="qz-check-label">
              <input type="checkbox" checked={reconcileMaintenance} onChange={e => setReconcileMaintenance(e.target.checked)} disabled={action.pending} />
              Keep the latest note contents and resume ordering after an external edit
            </label>}
            <div className="qz-actions">
              <button type="button" className="qz-button" disabled={!active || action.pending || !!data?.index.writeBlocked} onClick={() => void action.run(() => rebalanceTickets(api, wsId, maintenanceStatus, reconcileMaintenance)).then(ok => { if (ok) { setConfirmMaintenance(false); setReconcileMaintenance(false) } })}>Rebalance column</button>
              <button type="button" className="qz-button" data-variant="quiet" disabled={action.pending} onClick={() => setConfirmMaintenance(false)}>Cancel</button>
            </div>
          </div>}
        </div>
      ) : null}
      {!data && !failure && <p className="qz-empty" role="status">Loading the board…</p>}
      {data && data.tickets.length === 0 && data.index.state !== 'scanning' && <p className="qz-notice" data-variant="neutral">No tickets in “{workspace.name}” yet. Create a ticket or use an existing note.</p>}
      {data && (
        <div ref={boardRef} className="qz-board" tabIndex={0} onKeyDown={onKey} aria-label={`Board of ${workspace.name}`} role="group">
          {shown.map((lane, li) => (
            <section key={lane} aria-label={LANE_LABELS[lane]} className="qz-lane" data-lane-status={lane}
              onDragOver={e => { if (!blocked && lane !== 'repair') e.preventDefault() }}
              onDrop={e => { if (lane !== 'repair') drop(e, lane) }}>
              <h3 className="qz-lane-heading"><span className="qz-dot" />{LANE_LABELS[lane]}<span className="qz-count">{lanes[lane].length}</span></h3>
              {lanes[lane].length === 0 && <p className="qz-lane-empty">No tickets</p>}
              <ul className="qz-cards">
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

function TicketForm(props: { mode: 'create' | 'promote'; api: AppApi; workspace: Workspace; firstField?: React.Ref<HTMLInputElement>; disabled: boolean; maintenance: TaskStatus[]; onBusy: (busy: boolean) => void; onChanged: () => void; onClose: () => void; onMaintenanceNeeded: (status: TaskStatus) => void }) {
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
  const creating = props.mode === 'create'
  const label = creating ? 'New ticket' : 'Use existing note'
  const canSubmit = !blocked && !columnBusy && !!path.trim() && (creating ? !!title.trim() : !!source)
  return <section className="qz-panel-surface qz-ticket-form" aria-label={label}>
    <h3>{label}</h3>
    <form className="qz-stack" onSubmit={e => { e.preventDefault(); if (canSubmit) void submit() }}>
      {creating && <label className="qz-field">Title
        <input className="qz-input" ref={props.firstField} aria-label="Ticket title" placeholder="Fix login" value={title} disabled={action.pending} onChange={e => setTitle(e.target.value)} />
      </label>}
      <label className="qz-field">Note path in {props.workspace.name}
        <input className="qz-input" ref={creating ? undefined : props.firstField} aria-label="Ticket note path" placeholder="tickets/fix-login.md" value={path} disabled={action.pending}
          onChange={e => { previewVersion.current++; setPreviewBusy(false); setPath(e.target.value); setSource(null) }} />
      </label>
      {creating ? <>
        <label className="qz-field"><span>Description <span className="qz-muted">· Optional Markdown</span></span>
          <textarea className="qz-input" aria-label="Ticket description" placeholder="What needs to happen?" value={body} disabled={action.pending} onChange={e => setBody(e.target.value)} rows={4} />
        </label>
        <label className="qz-field">Initial status
          <select className="qz-input" value={status} disabled={action.pending} onChange={e => setStatus(e.target.value as TaskStatus)}>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </label>
      </> : <>
        <div className="qz-actions"><button type="button" className="qz-button" disabled={blocked || !path.trim()} onClick={() => void preview()}>Preview note</button></div>
        {source && <><pre className="qz-mono qz-note-preview">{source.content}</pre>
          <p className="qz-muted">The note will appear in Backlog. Its content and existing properties are preserved.</p></>}
      </>}
      {columnBusy && <span className="qz-notice">Resume ordering maintenance for this column before adding a ticket.</span>}
      <ErrorLine failure={previewFailure} /><ErrorLine failure={action.failure} />
      <div className="qz-actions">
        <button type="submit" className="qz-button" data-variant="primary" disabled={!canSubmit}>{creating ? 'Create ticket' : 'Make ticket'}</button>
        <button type="button" className="qz-button" data-variant="quiet" disabled={action.pending} onClick={discard}>Cancel</button>
      </div>
    </form>
  </section>
}

function TicketCard(props: { ticket: Ticket; lane: number; index: number; onOpen: () => void; disabled: boolean; onMove: (status: TaskStatus, position?: number) => void; onDemote: () => void; maintenance: TaskStatus[]; count: number }) {
  const { ticket: t } = props
  return <article className="qz-ticket">
    <div className="qz-ticket-content">
      <button type="button" className="qz-note-link" data-lane={props.lane} data-index={props.index} data-note-path={t.path} aria-label={`Open Kiro Notes: ${t.title}`} onClick={props.onOpen}>
        {t.title}<Icon name="external" />
      </button>
      <span className="qz-mono qz-path" title={t.path}>{t.path}</span>
      {t.todos.total > 0 && <div className="qz-ticket-progress">
        <progress value={t.todos.done} max={t.todos.total} aria-label={`Checklist progress for ${t.title}`} />
        <span title="Completed TODOs">{t.todos.done}/{t.todos.total}</span>
      </div>}
      {t.diagnostics.length > 0 && <div className="qz-actions">{t.diagnostics.map(d => <span key={d.code} className="qz-badge" title={d.message}>{d.code.replace(/_/g, ' ')}</span>)}</div>}
    </div>
    <div className="qz-ticket-footer">
      <div className="qz-ticket-status">
        <select className="qz-input" aria-label={`Move ${t.title} to column`} title="Move to column" value={t.status ?? ''} disabled={props.disabled}
          onChange={e => props.onMove(e.target.value as TaskStatus)}>
          {!t.status && <option value="">Needs repair</option>}
          {STATUSES.map(s => <option key={s} value={s} disabled={props.maintenance.includes(s)}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      <details className="qz-ticket-actions">
        <summary className="qz-button qz-icon-button" data-variant="quiet" aria-label={`Actions for ${t.title}`} title="Ticket actions"><Icon name="more" /></summary>
        <div className="qz-ticket-action-list">
          <CopyName path={t.path} />
          <button type="button" className="qz-button" data-variant="quiet" aria-label={`Move ${t.title} up`} disabled={props.disabled || props.index === 0 || !t.status} onClick={() => t.status && props.onMove(t.status, props.index - 1)}><Icon name="up" />Move up</button>
          <button type="button" className="qz-button" data-variant="quiet" aria-label={`Move ${t.title} down`} disabled={props.disabled || props.index >= props.count - 1 || !t.status} onClick={() => t.status && props.onMove(t.status, props.index + 1)}><Icon name="down" />Move down</button>
          <button type="button" className="qz-button qz-destructive" data-variant="quiet" aria-label={`Remove ${t.title} from board`} disabled={props.disabled} onClick={props.onDemote}><Icon name="minus" />Remove ticket…</button>
        </div>
      </details>
    </div>
  </article>
}

// ---------------------------------------------------------------------------
// TODOs
// ---------------------------------------------------------------------------

export function TodoView(props: { api: AppApi; onSettings: () => void }) {
  const { api } = props
  const navigate = useNavigate()
  const { companions, failure: statusFailure } = useCompanions(api)
  const [scope, setScope] = useState<number | 'all'>('all')
  const [state, setState] = useState<TodoState>('open')
  const [search, setSearch] = useState('')
  const searchField = useRef<HTMLInputElement>(null)

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
  const itemCount = groups.reduce((total, group) => total + group.items.length, 0)
  const indexes = data ? Object.values(data.index) : []
  const action = useMutation(reload)
  const toggle = (group: TodoGroup, item: TodoItem, checked: boolean) => {
    if (action.pending || failure || busy || mutationProblem(data?.index[String(group.workspaceId)], group) || item.markerStart === undefined) return
    void action.run(() => toggleTodo(api, group, item, checked))
  }

  if (statusFailure) return <ErrorLine failure={statusFailure} />
  if (!companions) return <p className="qz-empty" role="status">Loading workspaces…</p>
  if (companions.length === 0) return <NoCompanions onSettings={props.onSettings} />
  return (
    <div className="qz-stack qz-todos">
      <div className="qz-view-heading">
        <div>
          <h2 className="qz-section-title">Note checklists</h2>
          <p className="qz-section-description">Find and complete Markdown TODOs across your shared folders.</p>
        </div>
        <button type="button" className="qz-button" data-variant="quiet" onClick={() => navigate(KIRO_NOTES_ROUTE)}><Icon name="external" />Open Kiro Notes</button>
      </div>
      <div className="qz-todo-filters qz-panel-surface">
        <label className="qz-field">Search
          <span className="qz-search">
            <Icon name="search" />
            <input className="qz-input" ref={searchField} type="search" aria-label="Filter TODOs" placeholder="Search tasks or notes…" value={search} onChange={e => setSearch(e.target.value)} />
          </span>
        </label>
        {companions.length > 1 && (
          <label className="qz-field">Workspace
            <select className="qz-input" value={scope} onChange={e => setScope(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
              <option value="all">All workspaces</option>
              {companions.map(c => <option key={c.workspace.id} value={c.workspace.id}>{c.workspace.name}</option>)}
            </select>
          </label>
        )}
        <label className="qz-field">Show
          <select className="qz-input" value={state} onChange={e => setState(e.target.value as TodoState)}>
            <option value="open">Open</option>
            <option value="done">Completed</option>
            <option value="all">All</option>
          </select>
        </label>
      </div>
      <div className="qz-toolbar qz-board-meta">
        {data && <span className="qz-result-count" role="status">{itemCount} {itemCount === 1 ? 'item' : 'items'} in {groups.length} {groups.length === 1 ? 'note' : 'notes'}</span>}
        <div className="qz-actions">
          <IndexStatusLine statuses={indexes} />
          <button type="button" className="qz-button" data-variant="quiet" onClick={() => void refresh()} disabled={busy || action.pending}><Icon name="refresh" />Refresh</button>
        </div>
      </div>
      <IndexWarnings statuses={indexes} />
      <ErrorLine failure={failure} />
      <ErrorLine failure={action.failure} />
      {data?.truncated && (
        <div role="note" className="qz-notice">
          Only the first items are listed. Narrow the list by workspace or completion status.
        </div>
      )}
      {!data && !failure && <p className="qz-empty" role="status">Loading TODOs…</p>}
      {data && groups.length === 0 && <div className="qz-empty">
        <span className="qz-empty-icon"><Icon name={search.trim() ? 'search' : 'checklist'} /></span>
        <h3>{search.trim() ? 'No matching TODOs' : 'No TODOs to show'}</h3>
        <p>{search.trim() ? 'Try a different search or clear the filter.' : 'Choose a different workspace or completion status to see more.'}</p>
        {search.trim() && <button type="button" className="qz-button" onClick={() => { setSearch(''); searchField.current?.focus() }}>Clear search</button>}
      </div>}
      <div className="qz-stack">
        {groups.map(g => (
          <section key={`${g.workspaceId}:${g.path}`} aria-label={g.title} className="qz-todo-note qz-panel-surface">
            <header className="qz-todo-header">
              <span className="qz-note-icon"><Icon name="note" /></span>
              <div className="qz-todo-identity">
                <h3>{g.title}{g.ticket && g.status && <span className="qz-status-pill" data-lane-status={g.status}><span className="qz-dot" />{STATUS_LABELS[g.status]}</span>}</h3>
                <p className="qz-todo-meta"><span>{g.workspace}</span><span aria-hidden="true">/</span><span className="qz-mono qz-path" title={g.path}>{g.path}</span></p>
              </div>
              <CopyName path={g.path} compact />
            </header>
            <ul className="qz-todo-list">
              {g.items.map(item => (
                <li key={item.ordinal} className="qz-todo-row" data-checked={item.checked} style={{ paddingInlineStart: `${Math.min(item.depth, 4) * 0.8}rem` }}>
                  <label className="qz-todo-check">
                    <input type="checkbox" aria-label={`Complete ${todoLabel(item.text)}`} checked={item.checked}
                      disabled={action.pending || !!failure || busy || !!mutationProblem(data?.index[String(g.workspaceId)], g) || item.markerStart === undefined}
                      onChange={e => toggle(g, item, e.target.checked)} />
                    <span>{todoLabel(item.text)}</span>
                  </label>
                  <button
                    type="button"
                    title={`Open Kiro Notes · ${g.path}:${item.line}:${item.column}${item.heading ? ` · ${item.heading}` : ''}`}
                    aria-label={`Open Kiro Notes: ${todoLabel(item.text)}`}
                    onClick={() => navigate(KIRO_NOTES_ROUTE)}
                    className="qz-button qz-icon-button" data-variant="quiet"
                  ><Icon name="external" /></button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
