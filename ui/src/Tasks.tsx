import { type AppApi, useChatLauncher, useNavigate } from '@kirocrew/app-sdk'
import { Btn } from '@kirocrew/app-sdk/ui'
import { type DragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyMove,
  type Columns,
  type Direction,
  dropIndex,
  groupColumns,
  isNoop,
  keyboardMove,
  moveLabel,
  type MoveTarget,
} from './board'
import { storage, useSlotStatus } from './Chat'
import { renderMarkdown } from './markdown'
import type { Workspace } from './notesApi'
import { isWorkspaceUid, loadWorkspaceSlot, transcriptPath } from './slots'
import { formatTaskContext, type TaskContext, taskDraft } from './taskContext'
import {
  checkTitle,
  createTask,
  deleteTask,
  descriptionTooLarge,
  DESCRIPTION_MAX_BYTES,
  exportTasks,
  IMPORT_MAX_BYTES,
  importTasks,
  isLinkableSlot,
  isNoteRef,
  listTasks,
  moveTask,
  STATUS_LABELS,
  STATUSES,
  type Task,
  type TaskEdit,
  type TaskFailure,
  type TaskStatus,
  toTaskFailure,
  updateTask,
} from './tasksApi'

const DRAG_TYPE = 'application/x-quartizo-task'

const S = {
  column: { display: 'flex', flexDirection: 'column' as const, gap: 8, minHeight: 0, minWidth: 0 },
  row: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const },
  input: { flex: 1, minWidth: 0, padding: '4px 6px', border: '1px solid rgba(128,128,128,.4)', borderRadius: 4, background: 'transparent', color: 'inherit' },
  board: { display: 'grid', gridTemplateColumns: `repeat(${STATUSES.length}, minmax(160px, 1fr))`, gap: 8, overflowX: 'auto' as const, minHeight: 0, flex: 1 },
  lane: { display: 'flex', flexDirection: 'column' as const, gap: 6, minHeight: 120, padding: 6, borderRadius: 4, border: '1px solid rgba(128,128,128,.25)' },
  cards: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' as const, gap: 6, flex: 1, minHeight: 40 },
  card: { padding: 6, borderRadius: 4, border: '1px solid rgba(128,128,128,.35)', display: 'flex', flexDirection: 'column' as const, gap: 4, cursor: 'grab' },
  plain: { background: 'transparent', color: 'inherit', border: 'none', cursor: 'pointer', padding: '0 4px', textAlign: 'left' as const },
  notice: { padding: 8, borderRadius: 4, border: '1px solid rgba(220,120,0,.6)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  panel: { padding: 8, borderRadius: 4, border: '1px solid rgba(80,140,255,.5)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  textarea: { minHeight: 180, width: '100%', resize: 'vertical' as const, fontFamily: 'ui-monospace, monospace', fontSize: 13, padding: 8, border: '1px solid rgba(128,128,128,.4)', borderRadius: 4, background: 'transparent', color: 'inherit' },
  preview: { minHeight: 120, maxHeight: 360, overflowY: 'auto' as const, padding: '4px 12px', border: '1px solid rgba(128,128,128,.25)', borderRadius: 4 },
  pre: { margin: 0, maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const, fontSize: 12, fontFamily: 'ui-monospace, monospace', padding: 6, border: '1px solid rgba(128,128,128,.25)', borderRadius: 4 },
}

const ARROWS: Record<Direction, string> = { left: '←', up: '↑', down: '↓', right: '→' }

function ErrorLine({ failure }: { failure: { message: string; code?: string } | null }) {
  if (!failure) return null
  return (
    <div role="alert" className="text-sm text-danger" data-code={failure.code}>
      {failure.message}
    </div>
  )
}

export interface TasksProps {
  api: AppApi
  /** The workspace selected in the Notes tab (one project = one workspace). */
  workspace: Workspace | null
  /** The note open in the Notes tab, for "Link current note". */
  currentNote: { wsId: number; path: string } | null
  active: boolean
  onOpenNote: (wsId: number, path: string) => void
  onShowChat: (wsId: number) => void
  /** Asks before leaving the page when the Notes tab has unsaved edits. */
  confirmLeave: () => boolean
  /** Shows a linked session in the Agents tab (M5). */
  onShowAgents?: (slotKey: string) => void
  /** One-shot request (by seq) to open a task's details, e.g. from the Agents tab. */
  focus?: TaskFocus | null
}

export interface TaskFocus {
  seq: number
  wsId: number
  taskUid: string
}

/** The Kanban board of the current workspace's project (QTZ-009). */
export default function Tasks(props: TasksProps) {
  // Survives the per-workspace remount, so a focus request is applied once.
  const focusHandled = useRef(0)
  if (!props.workspace) {
    return <p className="text-sm text-muted">Select or register a workspace in the Notes tab. Each workspace has its own board.</p>
  }
  return <BoardView key={props.workspace.id} {...props} workspace={props.workspace} focusHandled={focusHandled} />
}

type ImportAsk = { data: unknown; kind: 'replace'; count: number } | { data: unknown; kind: 'copies'; replace: boolean }

function BoardView(props: TasksProps & { workspace: Workspace; focusHandled: { current: number } }) {
  const { api, workspace } = props
  const wsId = workspace.id
  const [tasks, setTasks] = useState<Task[] | null>(null)
  const [loadFailure, setLoadFailure] = useState<TaskFailure | null>(null)
  const [failure, setFailure] = useState<TaskFailure | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newStatus, setNewStatus] = useState<TaskStatus>('backlog')
  const [moving, setMoving] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dropLane, setDropLane] = useState<TaskStatus | null>(null)
  const [importAsk, setImportAsk] = useState<ImportAsk | null>(null)
  const [busy, setBusy] = useState(false)
  const pendingFocus = useRef<{ uid: string; dir: Direction } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const detailDirty = useRef(false)

  useEffect(() => {
    let cancelled = false
    listTasks(api, wsId)
      .then(board => {
        if (cancelled) return
        setTasks(board.tasks)
        setLoadFailure(null)
      })
      .catch(err => !cancelled && setLoadFailure(toTaskFailure(err)))
    return () => {
      cancelled = true
    }
  }, [api, wsId, refresh])
  const reload = useCallback(() => setRefresh(n => n + 1), [])

  // A focus request for this workspace opens that task once the board has loaded.
  useEffect(() => {
    const f = props.focus
    if (!f || f.wsId !== wsId || !tasks || f.seq <= props.focusHandled.current) return
    props.focusHandled.current = f.seq
    if (tasks.some(t => t.uid === f.taskUid)) setSelected(f.taskUid)
    else setNotice('That task is no longer on this board.')
  }, [props.focus, tasks, wsId]) // eslint-disable-line react-hooks/exhaustive-deps

  const cols: Columns = useMemo(() => groupColumns(tasks ?? []), [tasks])
  const selectedTask = tasks?.find(t => t.uid === selected) ?? null

  // Keep keyboard focus on the moved card after a keyboard move.
  useEffect(() => {
    const p = pendingFocus.current
    if (!p) return
    pendingFocus.current = null
    const card = document.querySelector<HTMLElement>(`[data-qz-task="${p.uid}"]`)
    const btn = card?.querySelector<HTMLButtonElement>(`[data-qz-move="${p.dir}"]`)
    ;(btn && !btn.disabled ? btn : card?.querySelector<HTMLElement>('[data-qz-open]'))?.focus()
  }, [tasks])

  const replaceTask = useCallback((task: Task) => {
    setTasks(ts => (ts ? ts.map(t => (t.uid === task.uid ? task : t)) : ts))
  }, [])

  /** Moves a card. Only POST .../move is called: a move never starts, sends or launches anything. */
  const move = async (task: Task, target: MoveTarget, focusDir?: Direction) => {
    if (!tasks || moving || isNoop(cols, task.uid, target)) return
    const before = tasks
    setFailure(null)
    setNotice(null)
    setMoving(true)
    if (focusDir) pendingFocus.current = { uid: task.uid, dir: focusDir }
    setTasks(applyMove(tasks, task.uid, target))
    try {
      const res = await moveTask(api, wsId, task, target.status, target.index)
      if (focusDir) pendingFocus.current = { uid: task.uid, dir: focusDir }
      setTasks(res.tasks)
    } catch (err) {
      const f = toTaskFailure(err)
      setTasks(before)
      if (f.code === 'stale') {
        setFailure({ ...f, message: `“${task.title}” was changed elsewhere since the board loaded, so it was not moved. The board has been reloaded; try again.` })
        reload()
      } else setFailure(f)
    } finally {
      setMoving(false)
    }
  }

  const create = async () => {
    const parsed = checkTitle(newTitle)
    if ('error' in parsed) {
      setFailure({ message: parsed.error })
      return
    }
    setBusy(true)
    setFailure(null)
    try {
      const task = await createTask(api, wsId, { title: parsed.title, status: newStatus })
      setTasks(ts => [...(ts ?? []), task])
      setNewTitle('')
      setSelected(task.uid)
    } catch (err) {
      setFailure(toTaskFailure(err))
    } finally {
      setBusy(false)
    }
  }

  const doExport = async () => {
    setFailure(null)
    try {
      const data = await exportTasks(api, wsId)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quartizo-tasks-${workspace.name.replace(/[^\w.-]+/g, '_').slice(0, 60) || 'workspace'}.json`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setFailure(toTaskFailure(err))
    }
  }

  const runImport = async (data: unknown, opts: { replace?: boolean; newUids?: boolean }) => {
    setBusy(true)
    setFailure(null)
    setNotice(null)
    try {
      const res = await importTasks(api, wsId, data, opts)
      setImportAsk(null)
      setTasks(res.tasks)
      setSelected(null)
      setNotice(`Imported ${res.imported} task(s)${res.replaced ? `, replacing ${res.replaced}` : ''}.`)
    } catch (err) {
      const f = toTaskFailure(err)
      if (f.code === 'project_not_empty' && !opts.replace) setImportAsk({ data, kind: 'replace', count: f.taskCount ?? 0 })
      else if (f.code === 'uid_conflict' && !opts.newUids) setImportAsk({ data, kind: 'copies', replace: !!opts.replace })
      else {
        setImportAsk(null)
        setFailure(f)
      }
    } finally {
      setBusy(false)
    }
  }

  const onFile = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = ''
    if (!file) return
    if (file.size > IMPORT_MAX_BYTES) {
      setFailure({ message: `Import files are limited to ${IMPORT_MAX_BYTES / 1024 / 1024} MiB.` })
      return
    }
    let data: unknown
    try {
      data = JSON.parse(await file.text())
    } catch {
      setFailure({ message: 'That file is not JSON. Import a file made by “Export”.' })
      return
    }
    await runImport(data, {})
  }

  const onDrop = (status: TaskStatus) => (e: DragEvent<HTMLUListElement>) => {
    setDropLane(null)
    const uid = e.dataTransfer.getData(DRAG_TYPE)
    const task = tasks?.find(t => t.uid === uid)
    if (!task) return
    e.preventDefault()
    const mids = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-qz-task]'))
      .filter(el => el.dataset.qzTask !== uid)
      .map(el => {
        const r = el.getBoundingClientRect()
        return r.top + r.height / 2
      })
    void move(task, { status, index: dropIndex(e.clientY, mids) })
  }

  const confirmLeave = () =>
    props.confirmLeave() && (!detailDirty.current || window.confirm('Discard unsaved changes to the open task?'))

  if (loadFailure && !tasks) return <ErrorLine failure={loadFailure} />
  if (!tasks) return <p className="text-sm text-muted">Loading tasks…</p>

  return (
    <div style={{ ...S.column, flex: 1 }}>
      <div style={S.row}>
        <span className="text-sm text-muted">
          Project: <strong>{workspace.name}</strong> (the workspace selected in Notes) · {tasks.length} task(s)
        </span>
        <span style={{ flex: 1 }} />
        <Btn onClick={reload}>Refresh</Btn>
        <Btn onClick={doExport}>Export JSON</Btn>
        <Btn onClick={() => fileRef.current?.click()} disabled={busy}>
          Import JSON…
        </Btn>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          aria-label="Import tasks from a JSON file"
          style={{ display: 'none' }}
          onChange={e => void onFile(e.target.files?.[0])}
        />
      </div>
      <div style={S.row}>
        <input
          aria-label="New task title"
          placeholder="New task title"
          value={newTitle}
          maxLength={400}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && newTitle.trim() && void create()}
          style={S.input}
        />
        <select aria-label="Column for the new task" value={newStatus} onChange={e => setNewStatus(e.target.value as TaskStatus)} style={{ ...S.input, flex: '0 0 auto' }}>
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Btn onClick={create} disabled={busy || !newTitle.trim()}>
          Add task
        </Btn>
      </div>

      {importAsk && (
        <div role="alertdialog" aria-label="Import confirmation" style={S.notice}>
          <span className="text-sm">
            {importAsk.kind === 'replace'
              ? `This workspace already has ${importAsk.count} task(s). Replace all of them with the tasks in the file? This cannot be undone; export first if unsure.`
              : 'Some tasks in the file already exist in another workspace. Import them as copies with new ids?'}
          </span>
          <div style={S.row}>
            <Btn
              onClick={() =>
                void runImport(importAsk.data, importAsk.kind === 'replace' ? { replace: true } : { replace: importAsk.replace, newUids: true })
              }
              disabled={busy}
            >
              {importAsk.kind === 'replace' ? `Replace ${importAsk.count} task(s)` : 'Import as copies'}
            </Btn>
            <Btn onClick={() => setImportAsk(null)} disabled={busy}>
              Cancel
            </Btn>
          </div>
        </div>
      )}
      <ErrorLine failure={failure} />
      {loadFailure && <ErrorLine failure={loadFailure} />}
      {notice && (
        <div role="status" className="text-sm text-muted">
          {notice}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedTask ? 'minmax(0, 1fr) minmax(320px, 36%)' : 'minmax(0, 1fr)', gap: 12, flex: 1, minHeight: 0 }}>
        <div style={S.board} role="group" aria-label="Task board">
          {STATUSES.map(status => (
            <section
              key={status}
              aria-label={`${STATUS_LABELS[status]} (${cols[status].length})`}
              style={{ ...S.lane, outline: dropLane === status ? '2px dashed rgba(80,140,255,.8)' : undefined }}
            >
              <strong className="text-sm">
                {STATUS_LABELS[status]} <span className="text-muted">{cols[status].length}</span>
              </strong>
              <ul
                style={S.cards}
                onDragOver={e => {
                  if (!dragging || !e.dataTransfer.types.includes(DRAG_TYPE)) return
                  e.preventDefault()
                  e.dataTransfer.dropEffect = 'move'
                  if (dropLane !== status) setDropLane(status)
                }}
                onDragLeave={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropLane(null)
                }}
                onDrop={onDrop(status)}
              >
                {cols[status].map(task => (
                  <Card
                    key={task.uid}
                    task={task}
                    cols={cols}
                    selected={task.uid === selected}
                    dragging={task.uid === dragging}
                    disabled={moving}
                    onSelect={() => setSelected(s => (s === task.uid ? null : task.uid))}
                    onMove={(target, dir) => void move(task, target, dir)}
                    onDragStart={e => {
                      e.dataTransfer.setData(DRAG_TYPE, task.uid)
                      e.dataTransfer.effectAllowed = 'move'
                      setDragging(task.uid)
                    }}
                    onDragEnd={() => {
                      setDragging(null)
                      setDropLane(null)
                    }}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
        {selectedTask && (
          <TaskDetail
            key={selectedTask.uid}
            {...props}
            task={selectedTask}
            dirtyRef={detailDirty}
            confirmLeave={confirmLeave}
            onChanged={replaceTask}
            onStale={() => reload()}
            onDeleted={() => {
              setSelected(null)
              setTasks(ts => (ts ? ts.filter(t => t.uid !== selectedTask.uid) : ts))
              reload()
            }}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
      <p className="text-sm text-muted">
        Drag cards between columns, or use the arrow buttons on a card. Moving a card only changes its column and
        position; it never starts or messages an agent.
      </p>
    </div>
  )
}

function Card(props: {
  task: Task
  cols: Columns
  selected: boolean
  dragging: boolean
  disabled: boolean
  onSelect: () => void
  onMove: (target: MoveTarget, dir: Direction) => void
  onDragStart: (e: DragEvent<HTMLLIElement>) => void
  onDragEnd: () => void
}) {
  const { task, cols } = props
  const dirs: Direction[] = ['left', 'up', 'down', 'right']
  return (
    <li
      data-qz-task={task.uid}
      draggable={!props.disabled}
      onDragStart={props.onDragStart}
      onDragEnd={props.onDragEnd}
      style={{
        ...S.card,
        opacity: props.dragging ? 0.5 : 1,
        background: props.selected ? 'rgba(80,140,255,.15)' : undefined,
      }}
    >
      <button
        type="button"
        data-qz-open
        aria-expanded={props.selected}
        onClick={props.onSelect}
        style={{ ...S.plain, fontWeight: 600, overflowWrap: 'anywhere' }}
        title="Open task details"
      >
        {task.title}
      </button>
      <div style={{ ...S.row, justifyContent: 'space-between' }}>
        <span className="text-sm text-muted">
          {task.note_ref && <span title={`Note: ${task.note_ref}`}>note </span>}
          {task.slot_id && <span title={`Chat: ${task.slot_id}`}>chat</span>}
        </span>
        <span role="group" aria-label={`Move “${task.title}”`} style={{ display: 'flex', gap: 2 }}>
          {dirs.map(dir => {
            const label = moveLabel(cols, task, dir, STATUS_LABELS)
            return (
              <button
                key={dir}
                type="button"
                data-qz-move={dir}
                aria-label={label ?? `Cannot move “${task.title}” ${dir}`}
                title={label ?? undefined}
                disabled={!label || props.disabled}
                onClick={() => {
                  const t = keyboardMove(cols, task.uid, dir)
                  if (t) props.onMove(t, dir)
                }}
                style={{ ...S.plain, padding: '0 3px', opacity: label ? 1 : 0.3 }}
              >
                {ARROWS[dir]}
              </button>
            )
          })}
        </span>
      </div>
    </li>
  )
}

/** Fields the detail form edits. Links (note, chat) are separate, immediate actions. */
function sameContent(a: Pick<Task, 'title' | 'description_markdown'>, b: Pick<Task, 'title' | 'description_markdown'>) {
  return a.title === b.title && a.description_markdown === b.description_markdown
}

function TaskDetail(props: TasksProps & {
  workspace: Workspace
  task: Task
  dirtyRef: { current: boolean }
  onChanged: (task: Task) => void
  onStale: () => void
  onDeleted: () => void
  onClose: () => void
}) {
  const { api, workspace, task } = props
  const wsId = workspace.id
  const navigate = useNavigate()
  const { openChat } = useChatLauncher()
  // The task as the form was loaded from (its version is what a save sends).
  const [base, setBase] = useState<Task>(task)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description_markdown)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<TaskFailure | null>(null)
  const [conflict, setConflict] = useState<Task | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [prompt, setPrompt] = useState<TaskContext | null>(null)
  const dirty = title !== base.title || description !== base.description_markdown
  const linkedSlot = isLinkableSlot(task.slot_id, workspace.uid) ? task.slot_id : null
  // Runtime state of the linked session: shown read-only, never written into `status`.
  const live = useSlotStatus(api, linkedSlot, props.active)
  const workspaceSlot = isWorkspaceUid(workspace.uid) ? loadWorkspaceSlot(storage(), workspace.uid) : null
  const html = useMemo(() => (mode === 'preview' ? renderMarkdown(description) : ''), [description, mode])

  useEffect(() => {
    props.dirtyRef.current = dirty
  }, [dirty, props.dirtyRef])
  useEffect(() => () => void (props.dirtyRef.current = false), [props.dirtyRef])

  // A newer version whose title/description match what the form was loaded
  // from (a move, a link change) is not a conflict: rebase on it silently.
  useEffect(() => {
    if (task.version !== base.version && sameContent(task, base)) setBase(task)
  }, [task]) // eslint-disable-line react-hooks/exhaustive-deps

  // Any change to the task drops a prepared prompt: it must show what is current.
  useEffect(() => setPrompt(null), [task.version])

  const fail = (err: unknown) => {
    const f = toTaskFailure(err)
    if (f.code === 'stale') {
      setConflict(f.current ?? null)
      props.onStale()
    } else setFailure(f)
  }

  const save = async () => {
    const parsed = checkTitle(title)
    if ('error' in parsed) return setFailure({ message: parsed.error })
    if (descriptionTooLarge(description)) return setFailure({ message: `Descriptions are limited to ${DESCRIPTION_MAX_BYTES / 1024} KiB.` })
    setBusy(true)
    setFailure(null)
    try {
      const updated = await updateTask(api, wsId, base, { title: parsed.title, description_markdown: description })
      setBase(updated)
      setTitle(updated.title)
      setDescription(updated.description_markdown)
      setConflict(null)
      props.onChanged(updated)
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  /** Link / unlink actions: immediate, against the live version. */
  const link = async (edit: TaskEdit) => {
    setBusy(true)
    setFailure(null)
    try {
      props.onChanged(await updateTask(api, wsId, task, edit))
    } catch (err) {
      const f = toTaskFailure(err)
      if (f.code === 'stale') {
        setFailure({ ...f, message: 'The task changed elsewhere; the board was reloaded. Try again.' })
        props.onStale()
      } else setFailure(f)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setFailure(null)
    try {
      await deleteTask(api, wsId, task)
      props.dirtyRef.current = false
      props.onDeleted()
    } catch (err) {
      setConfirmDelete(false)
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  const preparePrompt = () =>
    setPrompt(formatTaskContext({ task, workspaceName: workspace.name, sessionState: linkedSlot ? live.status : null }))

  /** Explicit user action only: hands the previewed block to the chat page as an unsent draft. */
  const openDraft = (ctx: TaskContext) => {
    if (!props.confirmLeave()) return
    const slotKey = linkedSlot ?? workspaceSlot ?? undefined
    openChat({ ...(slotKey ? { slotKey } : {}), message: taskDraft(ctx), autoSend: false })
  }

  const currentNote = props.currentNote && props.currentNote.wsId === wsId && isNoteRef(props.currentNote.path) ? props.currentNote.path : null

  return (
    <aside aria-label={`Task ${task.title}`} style={{ ...S.column, overflowY: 'auto' }}>
      <div style={S.row}>
        <strong style={{ flex: 1, overflowWrap: 'anywhere' }}>{task.title}</strong>
        <Btn onClick={() => (!dirty || window.confirm('Discard unsaved changes to this task?')) && props.onClose()}>Close</Btn>
      </div>
      <p className="text-sm text-muted" style={{ margin: 0 }}>
        Status: <strong>{STATUS_LABELS[task.status]}</strong> (set by you; move the card to change it)
        {linkedSlot && (
          <>
            {' '}
            · Agent session: {live.failure ? live.failure.kind : (live.status ?? '…')} (read-only, from the chat session)
          </>
        )}
      </p>

      {conflict && (
        <div role="alert" style={S.notice}>
          <span className="text-sm">This task was changed elsewhere since you opened it. Your edits were not saved.</span>
          <div style={S.row}>
            <Btn
              onClick={() => {
                setBase(conflict)
                setTitle(conflict.title)
                setDescription(conflict.description_markdown)
                setConflict(null)
              }}
              disabled={busy}
            >
              Reload (discard mine)
            </Btn>
            <Btn onClick={() => setConflict(null)} disabled={busy}>
              Keep editing
            </Btn>
            <Btn
              onClick={() => {
                setBase(conflict)
                setConflict(null)
              }}
              disabled={busy}
            >
              Overwrite with my version…
            </Btn>
          </div>
          <span className="text-sm text-muted">The last button only arms the next Save.</span>
        </div>
      )}

      <label className="text-sm" htmlFor={`qz-task-title-${task.uid}`}>
        Title
      </label>
      <input
        id={`qz-task-title-${task.uid}`}
        value={title}
        maxLength={400}
        onChange={e => setTitle(e.target.value)}
        style={{ ...S.input, flex: '0 0 auto' }}
      />
      <div style={S.row}>
        <span className="text-sm">Description (Markdown)</span>
        <span style={{ flex: 1 }} />
        <div role="group" aria-label="Description view" style={S.row}>
          {(['edit', 'preview'] as const).map(m => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} style={{ ...S.plain, fontWeight: mode === m ? 600 : 400 }}>
              {m === 'edit' ? 'Edit' : 'Preview'}
            </button>
          ))}
        </div>
      </div>
      {mode === 'edit' ? (
        <textarea
          aria-label="Task description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          onKeyDown={e => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
              e.preventDefault()
              void save()
            }
          }}
          style={S.textarea}
        />
      ) : (
        // Sanitized: markdown-it with html disabled and a URL allowlist (src/markdown.ts).
        <div className="qz-preview" aria-label="Description preview" style={S.preview} dangerouslySetInnerHTML={{ __html: html }} />
      )}
      <div style={S.row}>
        <Btn onClick={save} disabled={busy || !dirty || !!conflict}>
          Save
        </Btn>
        <span className="text-sm text-muted" aria-live="polite">
          {busy ? 'Working…' : conflict ? 'Conflict' : dirty ? 'Unsaved changes' : 'Saved'}
        </span>
      </div>
      <ErrorLine failure={failure} />

      <section aria-label="Links" style={S.panel}>
        <strong className="text-sm">Note</strong>
        {task.note_ref ? (
          <div style={S.row}>
            <span className="text-sm" style={{ overflowWrap: 'anywhere' }}>{task.note_ref}</span>
            <Btn onClick={() => props.onOpenNote(wsId, task.note_ref!)}>Open in Notes</Btn>
            <Btn onClick={() => void link({ note_ref: null })} disabled={busy}>
              Unlink
            </Btn>
          </div>
        ) : (
          <span className="text-sm text-muted">No note linked.</span>
        )}
        <div style={S.row}>
          <Btn onClick={() => currentNote && void link({ note_ref: currentNote })} disabled={busy || !currentNote || currentNote === task.note_ref}>
            Link current note
          </Btn>
          <span className="text-sm text-muted">{currentNote ? currentNote : 'Open a note in the Notes tab first.'}</span>
        </div>

        <strong className="text-sm">Agent session</strong>
        {task.slot_id ? (
          <div style={S.row}>
            <span className="text-sm" style={{ overflowWrap: 'anywhere' }}>{task.slot_id}</span>
            {linkedSlot && (
              <a
                href={transcriptPath(linkedSlot)}
                onClick={e => {
                  e.preventDefault()
                  if (props.confirmLeave()) navigate(transcriptPath(linkedSlot))
                }}
              >
                Open transcript in KiroCrew chat
              </a>
            )}
            {linkedSlot && linkedSlot === workspaceSlot && <Btn onClick={() => props.onShowChat(wsId)}>Show in Notes chat column</Btn>}
            {linkedSlot && props.onShowAgents && <Btn onClick={() => props.onShowAgents?.(linkedSlot)}>Show in Agents</Btn>}
            <Btn onClick={() => void link({ slot_id: null })} disabled={busy}>
              Unlink
            </Btn>
          </div>
        ) : (
          <span className="text-sm text-muted">No session linked.</span>
        )}
        <div style={S.row}>
          <Btn onClick={() => workspaceSlot && void link({ slot_id: workspaceSlot })} disabled={busy || !workspaceSlot || workspaceSlot === task.slot_id}>
            Link this workspace chat
          </Btn>
          {!workspaceSlot && <span className="text-sm text-muted">Open the chat column in the Notes tab first.</span>}
        </div>
      </section>

      <section aria-label="Agent prompt" style={S.panel}>
        <div style={S.row}>
          <strong className="text-sm">Agent prompt</strong>
          <span style={{ flex: 1 }} />
          <Btn onClick={preparePrompt}>{prompt ? 'Rebuild preview' : 'Prepare agent prompt…'}</Btn>
        </div>
        {prompt && (
          <>
            <span className="text-sm text-muted">
              Exactly this block goes into the chat draft ({prompt.bytes} bytes
              {prompt.truncated ? `, description truncated to ${prompt.truncated.keptBytes} of ${prompt.truncated.descriptionBytes} bytes` : ''}
              ). It uses the saved task{dirty ? '; your unsaved edits are not included' : ''}. Nothing is sent: you review and send it in
              the chat.
            </span>
            <pre style={S.pre} data-testid="qz-task-context">
              {prompt.block}
            </pre>
            <div style={S.row}>
              <Btn onClick={() => openDraft(prompt)}>
                {linkedSlot ?? workspaceSlot ? 'Open in full chat as draft' : 'Open in a new chat as draft'}
              </Btn>
              <Btn onClick={() => setPrompt(null)}>Discard</Btn>
            </div>
          </>
        )}
      </section>

      {confirmDelete ? (
        <div role="alertdialog" aria-label="Delete task" style={S.notice}>
          <span className="text-sm">
            Delete <strong>{task.title}</strong>? This cannot be undone (export first to keep a copy). Linked notes and chats are not
            touched.
          </span>
          <div style={S.row}>
            <Btn onClick={remove} disabled={busy}>
              Delete task
            </Btn>
            <Btn onClick={() => setConfirmDelete(false)} disabled={busy}>
              Cancel
            </Btn>
          </div>
        </div>
      ) : (
        <div style={S.row}>
          <Btn onClick={() => setConfirmDelete(true)} disabled={busy}>
            Delete…
          </Btn>
        </div>
      )}
    </aside>
  )
}
