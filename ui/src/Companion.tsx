/** Board and TODO views over the Markdown files shared with Kiro Notes. */
import { type AppApi, useNavigate } from '@kirocrew/app-sdk'
import { type CSSProperties, type FormEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AskAgentButton } from './AskAgent'
import {
  type ApiFailure,
  type BoardColumn,
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
  REPAIR_COLUMN,
  loadBoard,
  loadTodos,
  requestRefresh,
  type Ticket,
  type TodoData,
  type TodoState,
  todoLabel,
  toFailure,
  withTimeout,
  type Workspace,
} from './companionApi'
import { KIRO_NOTES_ROUTE, type NoteLocation, noteName } from './noteNav'
import { headingColorCss } from './noteAppearance'
import type { Preferences } from './preferences'
import { Dialog, ErrorLine, Icon, Menu, usePageVisible } from './ui'

/** Visible views poll SQLite results. Only an explicit Refresh requests a full scan. */
export const SCANNING_MS = 1500
export const IDLE_MS = 3000

/** The companion workspaces, read when the view opens (Settings may have changed them). */
function useCompanions(api: AppApi, active: boolean, workspaceId: number | null) {
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
  }, [api, active, workspaceId])
  return { companions, failure }
}

/**
 * Load the index while the view is shown. A failed read keeps the last data.
 */
function useIndexed<T>(
  api: AppApi,
  active: boolean,
  key: string,
  workspaceId: number | undefined,
  fetch: () => Promise<T>,
  rescan: () => Promise<unknown>,
  withStatus: (data: T, statuses: Record<string, IndexStatus>) => T,
) {
  const visible = usePageVisible()
  const [snapshot, setSnapshot] = useState<{ key: string; data: T } | null>(null)
  const data = snapshot?.key === key ? snapshot.data : null
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const [tick, setTick] = useState(0)
  const [busy, setBusy] = useState(false)
  const fetchRef = useRef(fetch)
  const rescanRef = useRef(rescan)
  const withStatusRef = useRef(withStatus)
  fetchRef.current = fetch
  rescanRef.current = rescan
  withStatusRef.current = withStatus

  useEffect(() => {
    setSnapshot(null)
    setFailure(null)
  }, [key])

  useEffect(() => {
    if (!active || !visible) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let revision: string | undefined
    let reported: string | undefined
    const run = async () => {
      let scanning = false
      try {
        const status = await withTimeout(companionStatus(api))
        if (cancelled) return
        if (!status.available) throw new Error(status.error ?? 'The Markdown index is unavailable.')
        const enabled = status.workspaces.filter(({ workspace }) => workspace.companion)
        const entries = enabled.filter(({ workspace }) => workspaceId === undefined || workspace.id === workspaceId)
        const indexes = Object.fromEntries(entries.map(({ workspace, index }) => [workspace.id, index]))
        scanning = entries.some(({ index }) => index.state === 'scanning')
        // Board diagnostics can change when a duplicate ID appears in a different vault.
        const nextRevision = JSON.stringify(enabled.map(({ workspace, index }) => [workspace.id, workspace.columnsVersion, index.indexedAt]))
        const nextReported = JSON.stringify(indexes)
        if (revision !== nextRevision) {
          const value = await withTimeout(fetchRef.current())
          if (cancelled) return
          setSnapshot({ key, data: value })
          revision = nextRevision
          reported = undefined
        } else if (reported !== nextReported) {
          const apply = withStatusRef.current
          setSnapshot(previous => previous?.key === key ? { key, data: apply(previous.data, indexes) } : previous)
          reported = nextReported
        }
        setFailure(null)
        setBusy(false)
      } catch (err) {
        if (!cancelled) { setFailure(toFailure(err)); setBusy(false) }
      }
      if (!cancelled) timer = setTimeout(run, scanning ? SCANNING_MS : IDLE_MS)
    }
    void run()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [active, api, visible, key, tick, workspaceId])

  /** Refresh from the button: never throttled. */
  const refresh = useCallback(async () => {
    setBusy(true)
    try {
      await withTimeout(rescanRef.current())
      setFailure(null)
      setTick(n => n + 1)
    } catch (err) {
      setFailure(toFailure(err))
    } finally {
      setBusy(false)
    }
  }, [])
  const reload = useCallback(() => {
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

function IndexWarnings({ statuses, names, onSettings }: { statuses: IndexStatus[]; names?: (string | undefined)[]; onSettings?: () => void }) {
  // Name the folder: "the workspace root no longer exists" alone doesn't say which one to fix.
  const warnings = new Set(statuses.map((status, i) => {
    const warning = indexWarning(status)
    return warning && names?.[i] ? `${names[i]}: ${warning}` : warning
  }).filter(Boolean))
  // A failed scan usually means the folder moved or was deleted. Settings is where to fix that.
  const folderProblem = statuses.some(s => s.state === 'stale' || s.state === 'error')
  return (
    <>
      {[...warnings].map(w => <div key={w} role="note" className="qz-notice qz-notice-action">
        <span>{w}</span>
        {folderProblem && onSettings && <button type="button" className="qz-button" onClick={onSettings}>Check folders in Settings</button>}
      </div>)}
    </>
  )
}

/** A short confirmation that clears itself, so a successful action is visible but never lingers. */
function useNotice() {
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timer)
  }, [notice])
  return [notice, setNotice] as const
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
      <h2>Get started with Quartizo</h2>
      <ol className="qz-start-checklist">
        <li>Add a folder of Markdown files in Settings.</li>
        <li>Create a note in Notes.</li>
        <li>Create a ticket or turn your note into one in Tasks.</li>
      </ol>
      <button type="button" className="qz-button" data-variant="primary" onClick={onSettings}>Open Settings</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tasks: the board of one companion workspace
// ---------------------------------------------------------------------------

type PreferenceControls = {
  preferences: Preferences
  onPreferencesChange: (patch: Partial<Preferences>) => void
}

type CompanionViewProps = PreferenceControls & {
  api: AppApi
  active?: boolean
  workspaceId: number | null
  onSettings: () => void
  onOpenNote: (note: NoteLocation) => void
}

export function TasksView(props: CompanionViewProps & { onBoardSettings?: () => void }) {
  const active = props.active ?? true
  const { companions, failure } = useCompanions(props.api, active, props.workspaceId)
  const current = companions?.find(c => c.workspace.id === props.workspaceId)?.workspace

  if (failure && !companions) return <ErrorLine failure={failure} />
  if (!companions) return <p className="qz-muted qz-loading" role="status">Loading folders…</p>
  return (
    <div className="qz-stack">
      <ErrorLine failure={failure} />
      <div className="qz-view-heading">
        <div>
          <h2 className="qz-section-title">Tasks</h2>
          <p className="qz-section-description">Plan and track tickets stored in your notes.</p>
        </div>
      </div>
      {companions.length === 0 && <NoCompanions onSettings={props.onSettings} />}
      {companions.length > 0 && !current && !failure && <p className="qz-muted qz-loading" role="status">Loading the selected folder…</p>}
      {companions.map(({ workspace }) => <div key={workspace.uid} hidden={workspace.id !== current?.id}>
        <TicketBoard api={props.api} workspace={workspace} active={active && workspace.id === current?.id}
          preferences={props.preferences} onPreferencesChange={props.onPreferencesChange}
          onSettings={props.onBoardSettings ?? props.onSettings} onOpenNote={props.onOpenNote} />
      </div>)}
    </div>
  )
}

const CARD_FIELDS = [
  ['progress', 'Checklist progress'],
  ['path', 'Note path'],
  ['badges', 'Ticket badges'],
] as const

export function BoardViewSettings({ preferences, onPreferencesChange, workspace }: PreferenceControls & { workspace?: Workspace }) {
  return (
    <div className="qz-board-view-settings">
      <label className="qz-field">Card density
        <select className="qz-input" value={preferences.boardDensity} onChange={e => onPreferencesChange({ boardDensity: e.target.value === 'compact' ? 'compact' : 'comfortable' })}>
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
      </label>
      <fieldset className="qz-board-setting-group">
        <legend>Show on cards</legend>
        {CARD_FIELDS.map(([field, label]) => <label className="qz-check-label" key={field}>
          <input type="checkbox" checked={preferences.boardFields[field]} onChange={e => onPreferencesChange({ boardFields: { ...preferences.boardFields, [field]: e.target.checked } })} />
          {label}
        </label>)}
      </fieldset>
      <label className="qz-check-label">
        <input type="checkbox" checked={preferences.hideEmptyLanes} onChange={e => onPreferencesChange({ hideEmptyLanes: e.target.checked })} />Hide empty columns
      </label>
      {workspace && <fieldset className="qz-board-setting-group qz-board-order-group">
        <legend>Column order in {workspace.name}</legend>
        <div className="qz-board-order-fields">
          {workspace.columns.map(column => {
            const key = `${workspace.id}:${column.id}`
            return <label className="qz-field" key={column.id}>{column.label} order
              <select className="qz-input" value={preferences.laneSort[key] ?? 'manual'} onChange={e => {
                onPreferencesChange({ laneSort: { [key]: e.target.value === 'title' ? 'title' : 'manual' } })
              }}>
                <option value="manual">Manual</option>
                <option value="title">Title (A–Z)</option>
              </select>
            </label>
          })}
        </div>
        <p className="qz-muted">Select Manual to rearrange cards within a column.</p>
      </fieldset>}
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
  const clear = useCallback(() => setFailure(null), [])
  return { pending, failure, run, clear }
}

const titleOrder = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })

function laneColorStyle(color: string | undefined): CSSProperties | undefined {
  return color ? { '--qz-status': color } as CSSProperties : undefined
}

function FolderLabel({ name, appearance }: { name: string; appearance?: Preferences['folderAppearance'][string] }) {
  const color = appearance && headingColorCss(appearance.color)
  return <span className="qz-folder-label" style={color ? { '--qz-folder-label-color': color } as CSSProperties : undefined}>
    {color && <span className="qz-folder-label-dot" aria-hidden="true" />}
    {appearance?.emoji && <span aria-hidden="true">{appearance.emoji}</span>}
    {name}
  </span>
}

function TicketBoard(props: Omit<CompanionViewProps, 'workspaceId' | 'active'> & { workspace: Workspace; active: boolean }) {
  const { api, workspace, active, preferences } = props
  const wsId = workspace.id
  const navigate = useNavigate()
  const { data, failure, busy, refresh, reload } = useIndexed<BoardData>(
    api, active, String(wsId), wsId, () => loadBoard(api, wsId),
    () => requestRefresh(api, { workspaceId: wsId, manual: true }),
    (data, statuses) => ({ ...data, index: statuses[String(wsId)] ?? data.index }),
  )
  const action = useMutation(reload)
  const [notice, setNotice] = useNotice()
  const columns = data?.workspace.columns ?? workspace.columns
  const { laneSort, hideEmptyLanes } = preferences
  const lanes = useMemo(() => {
    const result = groupLanes(columns, data?.tickets ?? [])
    for (const column of columns) {
      if (laneSort[`${wsId}:${column.id}`] === 'title') result[column.id].sort((a, b) => titleOrder.compare(a.title, b.title))
    }
    return result
  }, [columns, data, laneSort, wsId])
  const [showView, setShowView] = useState(false)
  const viewButton = useRef<HTMLButtonElement>(null)
  const [showEmpty, setShowEmpty] = useState(false)
  useEffect(() => { setShowEmpty(false) }, [hideEmptyLanes])
  const emptyCount = columns.filter(column => lanes[column.id].length === 0).length
  const shown = [
    ...columns.filter(column => !hideEmptyLanes || showEmpty || lanes[column.id].length > 0),
    ...(lanes.repair.length > 0 ? [REPAIR_COLUMN] : []),
  ]
  const boardRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<Ticket | null>(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  const hasBoard = !!data && shown.length > 0
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const measure = () => {
      const start = Math.abs(el.scrollLeft) > 1
      const end = el.scrollWidth - el.clientWidth - Math.abs(el.scrollLeft) > 1
      setEdges(previous => previous.start === start && previous.end === end ? previous : { start, end })
    }
    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    observer?.observe(el)
    return () => { el.removeEventListener('scroll', measure); observer?.disconnect() }
  }, [hasBoard, shown.length])
  const [dropTarget, setDropTarget] = useState<{ lane: TaskStatus; before?: string } | null>(null)
  const [confirmDemote, setConfirmDemote] = useState<Ticket | null>(null)
  const [form, setForm] = useState<'create' | 'promote' | null>(null)
  const firstField = useRef<HTMLInputElement>(null)
  useEffect(() => { if (form) firstField.current?.focus() }, [form])
  const [formPending, setFormPending] = useState(false)
  const blocked = !active || !!failure || busy || action.pending || formPending || !!mutationProblem(data?.index)
  const [selectedMaintenance, setMaintenanceStatus] = useState<TaskStatus>('')
  const maintenanceStatus = columns.find(c => c.id === selectedMaintenance)?.id ?? data?.index.maintenance?.[0] ?? columns[0].id
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
    const sorted = laneSort[`${wsId}:${status}`] === 'title'
    if (sorted && ticket.lane === status) return
    void action.run(() => moveTicket(api, wsId, planMove(data.tickets, ticket, status, sorted ? undefined : position)))
      .then(ok => {
        if (!ok) return
        setFocusPath(ticket.path)
        const label = columns.find(c => c.id === status)?.label ?? status
        setNotice(ticket.lane === status ? `Reordered “${ticket.title}”.` : `Moved “${ticket.title}” to ${label}.`)
      })
  }
  // A new action starts from a clean slate: an earlier failure must not outlive a later success.
  const formChanged = (message: string) => () => { action.clear(); setNotice(message); setForm(null); reload() }
  const allowDrop = (event: React.DragEvent, status: TaskStatus) => {
    const ticket = dragging.current
    if (blocked || !ticket || status === 'repair') return
    if (ticket.lane === status && laneSort[`${wsId}:${status}`] === 'title') return
    event.preventDefault()
    event.stopPropagation()
    const before = (event.target as Element).closest('li[data-ticket-path]')?.getAttribute('data-ticket-path') ?? undefined
    setDropTarget(previous => previous?.lane === status && previous.before === before ? previous : { lane: status, before })
  }
  const drop = (event: React.DragEvent, status: TaskStatus, before?: Ticket) => {
    event.preventDefault()
    event.stopPropagation()
    const ticket = dragging.current
    dragging.current = null
    setDropTarget(null)
    if (!ticket || before?.path === ticket.path) return
    const position = before && laneSort[`${wsId}:${status}`] !== 'title'
      ? lanes[status].filter(t => t.path !== ticket.path).findIndex(t => t.path === before.path)
      : undefined
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
      while (li >= 0 && li < shown.length && lanes[shown[li].id].length === 0)
      if (li < 0 || li >= shown.length) return
    }
    ci = Math.min(ci, lanes[shown[li].id].length - 1)
    e.preventDefault()
    boardRef.current?.querySelector<HTMLElement>(`[data-lane="${li}"][data-index="${ci}"]`)?.focus()
  }

  return (
    <div className="qz-stack">
      <div className="qz-toolbar">
        <div className="qz-actions">
          <button type="button" className="qz-button" data-variant="primary" aria-expanded={form === 'create'}
            onClick={() => { setShowView(false); setForm(form === 'create' ? null : 'create') }} disabled={action.pending || formPending}><Icon name="plus" />New ticket</button>
          <button type="button" className="qz-button" aria-expanded={form === 'promote'}
            onClick={() => { setShowView(false); setForm(form === 'promote' ? null : 'promote') }} disabled={action.pending || formPending}><Icon name="note" />Use existing note</button>
        </div>
        <div className="qz-actions">
          <button ref={viewButton} type="button" className="qz-button" data-variant="quiet" aria-expanded={showView} aria-controls={`qz-board-view-${wsId}`}
            onClick={() => { setForm(null); setShowView(value => !value) }}
            onKeyDown={e => { if (e.key === 'Escape' && showView) { e.stopPropagation(); setShowView(false) } }}><Icon name="settings" />View</button>
          <Menu label="More actions">{close => <>
            <button type="button" className="qz-button" data-variant="quiet" onClick={() => { close(); props.onSettings() }}>Customize columns</button>
            <button type="button" className="qz-button" data-variant="quiet" disabled={blocked}
              onClick={() => { close(); setShowMaintenance(true) }}>Rebalance…</button>
            <button type="button" className="qz-button" data-variant="quiet" onClick={() => { close(); navigate(KIRO_NOTES_ROUTE) }}><Icon name="external" />Open Kiro Notes</button>
            <AskAgentButton workspace={data?.workspace ?? workspace} variant="quiet" onOpen={close} />
          </>}</Menu>
        </div>
      </div>
      <section id={`qz-board-view-${wsId}`} className="qz-panel-surface qz-board-view-panel" aria-label="Board view settings" hidden={!showView}
        onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setShowView(false); viewButton.current?.focus() } }}>
        <BoardViewSettings preferences={preferences} onPreferencesChange={props.onPreferencesChange} workspace={data?.workspace ?? workspace} />
      </section>
      {(['create', 'promote'] as const).map(mode => <div key={mode} hidden={form !== mode}>
        <TicketForm mode={mode} api={api} workspace={workspace} columns={columns} firstField={form === mode ? firstField : undefined} disabled={!active || !!failure || busy || action.pending || !!mutationProblem(data?.index)} maintenance={data?.index.maintenance ?? []} onBusy={setFormPending} onChanged={formChanged(mode === 'create' ? 'Ticket created. It is in the first column.' : 'Note added to the board.')} onClose={() => setForm(null)} onMaintenanceNeeded={needMaintenance} />
      </div>)}
      <div className="qz-toolbar qz-board-meta">
        {data && <span className="qz-result-count">{data.tickets.length} {data.tickets.length === 1 ? 'ticket' : 'tickets'}</span>}
        <div className="qz-actions">
          {data && hideEmptyLanes && emptyCount > 0 && <button type="button" className="qz-button" data-variant="quiet" aria-expanded={showEmpty}
            onClick={() => setShowEmpty(value => !value)}>{showEmpty ? 'Hide empty columns' : `Show empty columns (${emptyCount})`}</button>}
          <IndexStatusLine statuses={indexes} />
          <button type="button" className="qz-button" data-variant="quiet" onClick={() => void refresh()} disabled={busy || action.pending}><Icon name="refresh" />Refresh</button>
        </div>
      </div>
      <IndexWarnings statuses={indexes} names={[workspace.name]} onSettings={props.onSettings} />
      <ErrorLine failure={failure} />
      <ErrorLine failure={action.failure} />
      {notice && !action.failure && <p className="qz-success" role="status"><Icon name="check" />{notice}</p>}
      {mutationProblem(data?.index) && data && <div role="note" className="qz-notice">{mutationProblem(data.index)}</div>}
      {showMaintenance || action.failure?.code === 'rank_exhausted' || action.failure?.code === 'maintenance_pending' || data?.index.maintenance?.length ? (
        <div className="qz-notice qz-stack">
          <p>Rebalance a column to restore space between card positions. Progress is saved if interrupted.</p>
          <div className="qz-actions">
            <select className="qz-input" aria-label="Column to rebalance" value={maintenanceStatus} onChange={e => setMaintenanceStatus(e.target.value)}>
              {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <button type="button" className="qz-button" onClick={() => setConfirmMaintenance(true)} disabled={!active || action.pending || !!data?.index.writeBlocked}>Review column…</button>
          </div>
          {confirmMaintenance && <Dialog label="Rebalance column" className="qz-stack" onCancel={() => setConfirmMaintenance(false)}>
            <p>Update ordering in each note of this column? Other editors may see progress before all files finish.</p>
            {!!data?.index.maintenance?.includes(maintenanceStatus) && <label className="qz-check-label">
              <input type="checkbox" checked={reconcileMaintenance} onChange={e => setReconcileMaintenance(e.target.checked)} disabled={action.pending} />
              Keep the latest note contents and resume ordering after an external edit
            </label>}
            <div className="qz-actions">
              <button type="button" className="qz-button" disabled={!active || action.pending || !!data?.index.writeBlocked} onClick={() => void action.run(() => rebalanceTickets(api, wsId, maintenanceStatus, reconcileMaintenance)).then(ok => { if (ok) { setConfirmMaintenance(false); setReconcileMaintenance(false) } })}>Rebalance column</button>
              <button type="button" className="qz-button" data-variant="quiet" disabled={action.pending} onClick={() => setConfirmMaintenance(false)}>Cancel</button>
            </div>
          </Dialog>}
        </div>
      ) : null}
      {confirmDemote && <Dialog label="Remove ticket" className="qz-notice qz-stack" onCancel={() => setConfirmDemote(null)}>
        <p>Remove “{confirmDemote.title}” from the board? Its note and TODOs will remain.</p>
        <div className="qz-actions">
          <button type="button" className="qz-button qz-destructive" disabled={action.pending}
            onClick={() => { const ticket = confirmDemote; setConfirmDemote(null); void action.run(() => demoteTicket(api, wsId, ticket)).then(ok => { if (ok) setNotice(`Removed “${ticket.title}” from the board. The note is untouched.`) }) }}>Remove ticket</button>
          <button type="button" className="qz-button" data-variant="quiet" onClick={() => setConfirmDemote(null)}>Cancel</button>
        </div>
      </Dialog>}
      {!data && !failure && <p className="qz-muted qz-loading" role="status">Loading the board…</p>}
      {data && data.tickets.length === 0 && data.index.state !== 'scanning' && <div className="qz-empty">
        <span className="qz-empty-icon"><Icon name="board" /></span>
        <h3>No tickets in “{workspace.name}” yet</h3>
        <p>Create a ticket, or turn an existing note into one.</p>
        <div className="qz-actions">
          <button type="button" className="qz-button" data-variant="primary" disabled={action.pending || formPending} onClick={() => setForm('create')}><Icon name="plus" />New ticket</button>
          <button type="button" className="qz-button" disabled={action.pending || formPending} onClick={() => setForm('promote')}><Icon name="note" />Use existing note</button>
        </div>
      </div>}
      {data && shown.length > 0 && <p className="qz-muted qz-board-hint">Tip: focus a card title, then use the arrow keys to move between cards. Scroll sideways for more columns.</p>}
      {data && shown.length > 0 && (
        <div className="qz-board-wrap" data-more-start={edges.start || undefined} data-more-end={edges.end || undefined}>
        <div ref={boardRef} className="qz-board" data-density={preferences.boardDensity} tabIndex={0} onKeyDown={onKey} aria-label={`Board of ${workspace.name}`} role="group">
          {shown.map(({ id: lane, label, color }, li) => (
            <section key={lane} aria-label={label} className="qz-lane" data-lane-status={lane} style={laneColorStyle(color)}
              data-drop-target={dropTarget?.lane === lane || undefined}
              onDragOver={e => allowDrop(e, lane)}
              onDragLeave={e => {
                if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))) {
                  setDropTarget(previous => previous?.lane === lane ? null : previous)
                }
              }}
              onDrop={e => { if (lane !== 'repair') drop(e, lane) }}>
              <h3 className="qz-lane-heading"><span className="qz-dot" aria-hidden="true" />{label}<span className="qz-count">{lanes[lane].length}</span></h3>
              {lane === 'repair' && <p className="qz-lane-help qz-muted">Choose a column for tickets with an old status. Open a note to fix other ticket details.</p>}
              {lanes[lane].length === 0 && <p className="qz-lane-empty">No tickets</p>}
              <ul className="qz-cards">
                {lanes[lane].map((t, ci) => (
                  <li key={t.path} data-ticket-path={t.path} data-drop-before={dropTarget?.lane === lane && dropTarget.before === t.path || undefined}
                    draggable={!blocked && !mutationProblem(data.index, t)}
                    onDragStart={e => { dragging.current = t; e.dataTransfer.setData('text/plain', t.path); e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => { dragging.current = null; setDropTarget(null) }}
                    onDrop={e => { if (lane !== 'repair') drop(e, lane, t) }}>
                    <TicketCard ticket={t} lane={li} index={ci} columns={columns} onOpen={() => props.onOpenNote({ workspaceId: wsId, path: t.path })}
                      disabled={blocked || !!mutationProblem(data.index, t)} maintenance={data.index.maintenance ?? []}
                      canReorder={laneSort[`${wsId}:${lane}`] !== 'title'} fields={preferences.boardFields}
                      folder={workspace.name} folderAppearance={preferences.folderAppearance[String(wsId)]}
                      onMove={(status, position) => move(t, status, position)}
                      onDemote={() => setConfirmDemote(t)}
                      count={lanes[lane].length} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        </div>
      )}
    </div>
  )
}

/** `Fix login!` becomes `tickets/fix-login.md`. An empty slug leaves the path blank. */
function ticketPath(title: string): string {
  const slug = title.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '')
  return slug ? `tickets/${slug}.md` : ''
}

function TicketForm(props: { mode: 'create' | 'promote'; api: AppApi; workspace: Workspace; columns: BoardColumn[]; firstField?: React.Ref<HTMLInputElement>; disabled: boolean; maintenance: TaskStatus[]; onBusy: (busy: boolean) => void; onChanged: () => void; onClose: () => void; onMaintenanceNeeded: (status: TaskStatus) => void }) {
  const [path, setPath] = useState('')
  // Until the user types a path themselves, it follows the title.
  const [pathEdited, setPathEdited] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedStatus, setStatus] = useState<TaskStatus>('')
  const status = (props.columns.find(c => c.id === selectedStatus) ?? props.columns[0]).id
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
  const columnBusy = props.maintenance.includes(status)
  useEffect(() => {
    if (action.failure?.code === 'rank_exhausted' || action.failure?.code === 'maintenance_pending') {
      props.onMaintenanceNeeded(status)
    }
  }, [action.failure, props.onMaintenanceNeeded, status])
  const discard = () => {
    previewVersion.current++
    setPreviewBusy(false)
    setPath(''); setPathEdited(false); setTitle(''); setBody(''); setSource(null); setPreviewFailure(null)
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
      : promoteNote(props.api, props.workspace.id, source!, status))
    if (ok && mounted.current) {
      setPath(''); setPathEdited(false); setTitle(''); setBody(''); setSource(null)
      props.onClose()
    }
  }
  const creating = props.mode === 'create'
  const label = creating ? 'New ticket' : 'Use existing note'
  const canSubmit = !blocked && !columnBusy && !!path.trim() && (creating ? !!title.trim() : !!source)
  const missing = creating
    ? (!title.trim() ? 'Enter a title' : !path.trim() ? 'Enter a note path' : '')
    : (!path.trim() ? 'Enter the note’s path' : !source ? 'Preview the note first' : '')
  return <section className="qz-panel-surface qz-ticket-form" aria-label={label}>
    <h3>{label}</h3>
    <form className="qz-stack" onSubmit={e => { e.preventDefault(); if (canSubmit) void submit() }}>
      {creating && <label className="qz-field">Title
        <input className="qz-input" ref={props.firstField} placeholder="Fix login" value={title} disabled={action.pending}
          onChange={e => { setTitle(e.target.value); if (!pathEdited) setPath(ticketPath(e.target.value)) }} />
      </label>}
      <label className="qz-field">Note path in {props.workspace.name}
        <input className="qz-input" ref={creating ? undefined : props.firstField} placeholder="tickets/fix-login.md" value={path} disabled={action.pending}
          onChange={e => { previewVersion.current++; setPreviewBusy(false); setPath(e.target.value); setPathEdited(!!e.target.value); setSource(null) }} />
        {creating && !pathEdited && !!path && <span className="qz-muted qz-field-hint">Suggested from the title. Edit it to choose another location.</span>}
      </label>
      {creating ?
        <label className="qz-field"><span>Description <span className="qz-muted">· Optional Markdown</span></span>
          <textarea className="qz-input" placeholder="What needs to happen?" value={body} disabled={action.pending} onChange={e => setBody(e.target.value)} rows={4} />
        </label>
      : <>
        <div className="qz-actions"><button type="button" className="qz-button" disabled={blocked || !path.trim()} onClick={() => void preview()}>Preview note</button></div>
        {source && <><pre className="qz-mono qz-note-preview">{source.content}</pre>
          <p className="qz-muted">The note’s content and existing properties are preserved.</p></>}
      </>}
      {(creating || source) && <label className="qz-field">Initial status
        <select className="qz-input" value={status} disabled={action.pending} onChange={e => setStatus(e.target.value)}>
          {props.columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </label>}
      {columnBusy && <span className="qz-notice">Resume ordering maintenance for this column before adding a ticket.</span>}
      <ErrorLine failure={previewFailure} /><ErrorLine failure={action.failure} />
      <div className="qz-actions">
        <button type="submit" className="qz-button" data-variant="primary" disabled={!canSubmit}>{creating ? 'Create ticket' : 'Add to board'}</button>
        <button type="button" className="qz-button" data-variant="quiet" disabled={action.pending} onClick={discard}>Cancel</button>
        {!canSubmit && missing && <span className="qz-muted qz-form-hint">{missing} to continue.</span>}
      </div>
    </form>
  </section>
}

function TicketCard(props: {
  ticket: Ticket
  lane: number
  index: number
  count: number
  columns: BoardColumn[]
  folder: string
  folderAppearance?: Preferences['folderAppearance'][string]
  fields: Preferences['boardFields']
  canReorder: boolean
  disabled: boolean
  maintenance: TaskStatus[]
  onOpen: () => void
  onMove: (status: TaskStatus, position?: number) => void
  onDemote: () => void
}) {
  const { ticket: t, fields, folderAppearance } = props
  const status = t.lane === 'repair' ? '' : t.lane
  const showFolder = folderAppearance && (folderAppearance.emoji || folderAppearance.color !== 'theme')
  const actions = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const outside = (event: MouseEvent) => {
      const details = actions.current
      if (details?.open && !(event.target instanceof Node && details.contains(event.target))) details.open = false
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])
  return <article className="qz-ticket">
    <div className="qz-ticket-content">
      <button type="button" className="qz-note-link" data-lane={props.lane} data-index={props.index} data-note-path={t.path} aria-label={`Open note: ${t.title}`} onClick={props.onOpen}>
        {t.title}<Icon name="external" />
      </button>
      {fields.path && <span className="qz-mono qz-path" title={t.path}>{t.path}</span>}
      {fields.progress && t.todos.total > 0 && <div className="qz-ticket-progress">
        <progress value={t.todos.done} max={t.todos.total} aria-label={`Checklist progress for ${t.title}`} />
        <span title="Completed TODOs">{t.todos.done}/{t.todos.total}</span>
      </div>}
      {fields.badges && (showFolder || t.diagnostics.length > 0) && <div className="qz-actions qz-ticket-badges">
        {showFolder && <FolderLabel name={props.folder} appearance={folderAppearance} />}
        {t.diagnostics.map(d => <span key={d.code} className="qz-badge" title={d.message}>{d.code.replace(/_/g, ' ')}</span>)}
      </div>}
    </div>
    <div className="qz-ticket-footer">
      <div className="qz-ticket-status">
        <select className="qz-input" aria-label={`Move ${t.title} to column`} title="Move to column" value={status} disabled={props.disabled}
          onChange={e => props.onMove(e.target.value)}>
          {!status && <option value="" disabled>{t.status ? `No column for ${t.status}` : 'Needs repair'}</option>}
          {props.columns.map(c => <option key={c.id} value={c.id} disabled={props.maintenance.includes(c.id)}>{c.label}</option>)}
        </select>
      </div>
      <details ref={actions} className="qz-ticket-actions" onKeyDown={event => {
        if (event.key !== 'Escape' || !actions.current?.open) return
        event.stopPropagation()
        actions.current.open = false
        actions.current.querySelector('summary')?.focus()
      }}>
        <summary className="qz-button qz-icon-button" data-variant="quiet" aria-label={`Actions for ${t.title}`} title="Ticket actions"><Icon name="more" /></summary>
        <div className="qz-ticket-action-list">
          <CopyName path={t.path} />
          {props.canReorder && <>
            <button type="button" className="qz-button" data-variant="quiet" aria-label={`Move ${t.title} up`} disabled={props.disabled || props.index === 0 || !status} onClick={() => props.onMove(status, props.index - 1)}><Icon name="up" />Move up</button>
            <button type="button" className="qz-button" data-variant="quiet" aria-label={`Move ${t.title} down`} disabled={props.disabled || props.index >= props.count - 1 || !status} onClick={() => props.onMove(status, props.index + 1)}><Icon name="down" />Move down</button>
          </>}
          <button type="button" className="qz-button qz-destructive" data-variant="quiet" aria-label={`Remove ${t.title} from board`} disabled={props.disabled} onClick={props.onDemote}><Icon name="minus" />Remove ticket…</button>
        </div>
      </details>
    </div>
  </article>
}

// ---------------------------------------------------------------------------
// TODOs
// ---------------------------------------------------------------------------

const MAX_SAVED_FILTERS = 20
const MAX_FILTER_NAME = 40
const MAX_FILTER_SEARCH = 200

export function TodoView(props: CompanionViewProps) {
  const { api, preferences, onPreferencesChange, workspaceId, active = true } = props
  const navigate = useNavigate()
  const { companions, failure: statusFailure } = useCompanions(api, active, workspaceId)
  const { todoScope: scope, todoState: state, todoFilters } = preferences
  const [search, setSearch] = useState('')
  const searchField = useRef<HTMLInputElement>(null)
  const [selectedFilter, setSelectedFilter] = useState('')
  const [filterName, setFilterName] = useState('')
  const matchingName = todoFilters.find(filter => filter.name.toLocaleLowerCase() === filterName.trim().toLocaleLowerCase())
  const canSaveFilter = !!filterName.trim() && (todoFilters.length < MAX_SAVED_FILTERS || !!matchingName)
  const selected = todoFilters.find(filter => filter.name === selectedFilter)
  const appliedFilter = selected?.scope === scope && selected?.state === state && selected?.search === search ? selected.name : ''

  const applyFilter = (name: string) => {
    const filter = todoFilters.find(filter => filter.name === name)
    setSelectedFilter(name)
    if (filter) {
      onPreferencesChange({ todoScope: filter.scope, todoState: filter.state })
      setSearch(filter.search)
    }
  }
  const saveFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSaveFilter) return
    const filter = { name: matchingName?.name ?? filterName.trim(), scope, state, search }
    onPreferencesChange({ todoFilters: matchingName
      ? todoFilters.map(previous => previous === matchingName ? filter : previous)
      : [...todoFilters, filter] })
    setSelectedFilter(filter.name)
    setFilterName('')
  }
  const removeFilter = () => {
    onPreferencesChange({ todoFilters: todoFilters.filter(filter => filter.name !== appliedFilter) })
    setSelectedFilter('')
  }

  const currentFolder = companions?.find(item => item.workspace.id === workspaceId)?.workspace.name
  const wsId = scope === 'workspace' ? workspaceId ?? undefined : undefined
  const enabled = active && !!companions?.length && (scope === 'all' || wsId !== undefined)
  const { data, failure, busy, refresh, reload } = useIndexed<TodoData>(
    api, enabled,
    `${scope}:${wsId ?? ''}:${state}`,
    wsId,
    () => loadTodos(api, state, wsId),
    () => requestRefresh(api, { workspaceId: wsId, manual: true }),
    (data, index) => ({ ...data, index }),
  )
  const groups = useMemo(() => filterTodos(data?.groups ?? [], search), [data, search])
  const itemCount = groups.reduce((total, group) => total + group.items.length, 0)
  const indexEntries = data ? Object.entries(data.index) : []
  const indexes = indexEntries.map(([, index]) => index)
  const indexNames = indexEntries.map(([id]) => companions?.find(item => String(item.workspace.id) === id)?.workspace.name)
  const action = useMutation(reload)
  // Only the row being saved looks disabled, so the rest of the list doesn't flicker.
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const rowKey = (group: TodoGroup, item: TodoItem) => `${group.workspaceId}:${group.path}:${item.ordinal}`
  const toggle = (group: TodoGroup, item: TodoItem, checked: boolean) => {
    if (!active || action.pending || failure || busy || mutationProblem(data?.index[String(group.workspaceId)], group) || item.markerStart === undefined) return
    setSavingKey(rowKey(group, item))
    void action.run(() => toggleTodo(api, group, item, checked)).finally(() => setSavingKey(null))
  }

  if (statusFailure) return <ErrorLine failure={statusFailure} />
  if (!companions) return <p className="qz-muted qz-loading" role="status">Loading folders…</p>
  if (companions.length === 0) return <NoCompanions onSettings={props.onSettings} />
  return (
    <div className="qz-stack qz-todos">
      <div className="qz-view-heading">
        <div>
          <h2 className="qz-section-title">TODOs</h2>
          <p className="qz-section-description">Find and complete Markdown TODOs across your shared folders.</p>
        </div>
        <button type="button" className="qz-button" data-variant="quiet" onClick={() => navigate(KIRO_NOTES_ROUTE)}><Icon name="external" />Open Kiro Notes</button>
      </div>
      <div className="qz-todo-filters qz-panel-surface">
        <label className="qz-field">Search
          <span className="qz-search">
            <Icon name="search" />
            <input className="qz-input" ref={searchField} type="search" placeholder="Search tasks or notes…"
              value={search} maxLength={MAX_FILTER_SEARCH} onChange={e => setSearch(e.target.value)} />
          </span>
        </label>
        <label className="qz-field">Folder scope
          <select className="qz-input" value={scope} onChange={e => onPreferencesChange({ todoScope: e.target.value === 'workspace' ? 'workspace' : 'all' })}>
            <option value="all">All folders</option>
            <option value="workspace">{currentFolder ? `Current folder (${currentFolder})` : 'Current folder'}</option>
          </select>
        </label>
        <label className="qz-field">Show
          <select className="qz-input" value={state} onChange={e => onPreferencesChange({ todoState: e.target.value as TodoState })}>
            <option value="open">Open</option>
            <option value="done">Completed</option>
            <option value="all">All</option>
          </select>
        </label>
        <details className="qz-todo-saved-filters">
          <summary className="qz-button" data-variant="quiet">Saved filters</summary>
          <div className="qz-todo-saved-controls">
            {todoFilters.length > 0 && <div className="qz-todo-saved-row">
              <label className="qz-field">Saved filter
                <select className="qz-input" value={appliedFilter} onChange={e => applyFilter(e.target.value)}>
                  <option value="" disabled>Choose a filter</option>
                  {todoFilters.map(filter => <option value={filter.name} key={filter.name}>{filter.name}</option>)}
                </select>
              </label>
              <button type="button" className="qz-button" data-variant="quiet" disabled={!appliedFilter} onClick={removeFilter}>Remove saved filter</button>
            </div>}
            <form className="qz-todo-saved-row" onSubmit={saveFilter}>
              <label className="qz-field">Filter name
                <input className="qz-input" value={filterName} maxLength={MAX_FILTER_NAME} onChange={e => setFilterName(e.target.value)} />
              </label>
              <button className="qz-button" type="submit" disabled={!canSaveFilter}>{matchingName ? 'Update saved filter' : 'Save current filter'}</button>
              {todoFilters.length >= MAX_SAVED_FILTERS && !matchingName && <p className="qz-muted">Remove a saved filter to add another.</p>}
            </form>
          </div>
        </details>
      </div>
      <div className="qz-toolbar qz-board-meta">
        {data && <span className="qz-result-count" role="status">{itemCount} {itemCount === 1 ? 'item' : 'items'} in {groups.length} {groups.length === 1 ? 'note' : 'notes'}</span>}
        <div className="qz-actions">
          <IndexStatusLine statuses={indexes} />
          <button type="button" className="qz-button" data-variant="quiet" onClick={() => void refresh()} disabled={busy || action.pending}><Icon name="refresh" />Refresh</button>
        </div>
      </div>
      <IndexWarnings statuses={indexes} names={indexNames} onSettings={props.onSettings} />
      <ErrorLine failure={failure} />
      <ErrorLine failure={action.failure} />
      {data?.truncated && (
        <div role="note" className="qz-notice">
          Only the first items are listed. Narrow the list by folder or completion status.
        </div>
      )}
      {!data && !failure && <p className="qz-muted qz-loading" role="status">Loading TODOs…</p>}
      {data && groups.length === 0 && <div className="qz-empty">
        <span className="qz-empty-icon"><Icon name={search.trim() ? 'search' : 'checklist'} /></span>
        <h3>{search.trim() ? 'No matching TODOs' : 'No TODOs to show'}</h3>
        <p>{search.trim() ? 'Try a different search or clear the filter.' : 'Choose a different folder or completion status to see more.'}</p>
        {search.trim() && <button type="button" className="qz-button" onClick={() => { setSearch(''); searchField.current?.focus() }}>Clear search</button>}
      </div>}
      <div className="qz-stack">
        {groups.map(g => (
          <section key={`${g.workspaceId}:${g.path}`} aria-label={g.title} className="qz-todo-note qz-panel-surface">
            <header className="qz-todo-header">
              <span className="qz-note-icon"><Icon name="note" /></span>
              <div className="qz-todo-identity">
                <h3>{g.title}{g.ticket && g.status && <span className="qz-status-pill" data-lane-status={g.status}><span className="qz-dot" aria-hidden="true" />{g.statusLabel ?? g.status}</span>}</h3>
                <p className="qz-todo-meta">
                  <FolderLabel name={g.workspace} appearance={preferences.folderAppearance[String(g.workspaceId)]} />
                  <span aria-hidden="true">/</span><span className="qz-mono qz-path" title={g.path}>{g.path}</span>
                </p>
              </div>
              <CopyName path={g.path} compact />
            </header>
            <ul className="qz-todo-list">
              {g.items.map(item => (
                <li key={item.ordinal} className="qz-todo-row" data-checked={item.checked} style={{ paddingInlineStart: `${Math.min(item.depth, 4) * 0.8}rem` }}>
                  <label className="qz-todo-check">
                    <input type="checkbox" aria-label={`Complete ${todoLabel(item.text)}`} checked={item.checked}
                      disabled={savingKey === rowKey(g, item) || !!failure || !!mutationProblem(data?.index[String(g.workspaceId)], g) || item.markerStart === undefined}
                      aria-busy={savingKey === rowKey(g, item) || undefined}
                      onChange={e => toggle(g, item, e.target.checked)} />
                    <span>{todoLabel(item.text)}{item.heading && <span className="qz-todo-heading"> · {item.heading}</span>}</span>
                  </label>
                  <button
                    type="button"
                    title={`Open note · ${g.path}:${item.line}:${item.column}${item.heading ? ` · ${item.heading}` : ''}`}
                    aria-label={`Open note: ${todoLabel(item.text)}`}
                    onClick={() => props.onOpenNote({ workspaceId: g.workspaceId, path: g.path })}
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
