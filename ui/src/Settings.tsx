/** Settings for connected Markdown folders, their board preferences, and legacy task migration. */
import { type AppApi, useChatLauncher } from '@kirocrew/app-sdk'
import { useEffect, useRef, useState } from 'react'
import {
  addWorkspace,
  type ApiFailure,
  type BoardColumn,
  companionStatus,
  listWorkspaces,
  exportLegacyTasks,
  migrateTasks,
  previewMigration,
  type MigrationPreview,
  type MigrationResult,
  removeWorkspace,
  requestRefresh,
  saveColumns,
  setCompanion,
  toFailure,
  type Workspace,
} from './companionApi'
import { agentPrompt } from './agentPrompt'
import { ErrorLine, Icon } from './ui'
import styles from './settings.css?inline'

/** Busy flag and last failure around one action at a time. */
function useAction() {
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const run = async (action: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true)
    setFailure(null)
    try {
      await action()
      return true
    } catch (err) {
      setFailure(toFailure(err))
      return false
    } finally {
      setBusy(false)
    }
  }
  return { busy, failure, run }
}

export default function Settings(props: { api: AppApi }) {
  const { api } = props
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null)
  const [loadFailure, setLoadFailure] = useState<ApiFailure | null>(null)
  const [writeBlocked, setWriteBlocked] = useState<ApiFailure | null>(null)
  const [reload, setReload] = useState(0)
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const { busy, failure, run } = useAction()

  useEffect(() => {
    let cancelled = false
    Promise.all([listWorkspaces(api), companionStatus(api)])
      .then(([value, status]) => {
        if (cancelled) return
        setWorkspaces(value)
        setWriteBlocked(status.writeBlocked ?? null)
        setLoadFailure(null)
      })
      .catch(err => !cancelled && setLoadFailure(toFailure(err)))
    return () => {
      cancelled = true
    }
  }, [api, reload])

  const add = async () => {
    if (await run(() => addWorkspace(api, path.trim(), name.trim() || undefined))) {
      setPath('')
      setName('')
      setReload(n => n + 1)
    }
  }

  return (
    <div className="qz-settings">
      <style>{styles}</style>
      <header>
        <h2 className="qz-section-title">Settings</h2>
        <p className="qz-section-description">Manage connected folders and board columns, or start a notes request in KiroCrew.</p>
      </header>
      <ErrorLine failure={loadFailure} />
      <ErrorLine failure={writeBlocked} />
      <div className="qz-settings-grid">
        <section className="qz-settings-folders" aria-labelledby="qz-settings-folders">
          <div className="qz-settings-heading">
            <h3 id="qz-settings-folders">Connected folders</h3>
            {workspaces && <span className="qz-settings-count">{workspaces.length}</span>}
          </div>
          {!workspaces && !loadFailure && <p className="qz-muted" role="status">Loading folders…</p>}
          {workspaces?.length === 0 && <p className="qz-empty">Add a folder to see its notes, tickets, and TODOs.</p>}
          {workspaces?.map(w => (
            <WorkspaceItem key={w.id} api={api} workspace={w} writeBlocked={writeBlocked} onChanged={() => setReload(n => n + 1)}
              onColumnsSaved={saved => setWorkspaces(items => items?.map(item => item.id === saved.id ? { ...item, ...saved } : item) ?? null)} />
          ))}
        </section>
        <form
          className="qz-panel-surface qz-settings-add"
          aria-labelledby="qz-settings-add"
          aria-busy={busy}
          onSubmit={event => {
            event.preventDefault()
            if (path.trim() && !busy) void add()
          }}
        >
          <div>
            <h3 id="qz-settings-add">Add a folder</h3>
            <p className="qz-muted">Use any local folder of Markdown files. To use the same files in Kiro Notes, attach the folder there separately.</p>
          </div>
          <label className="qz-field">
            Absolute folder path
            <input className="qz-input" placeholder="/home/you/notes" value={path} onChange={e => setPath(e.target.value)} />
          </label>
          <label className="qz-field">
            <span>Name <span className="qz-muted">(optional)</span></span>
            <input className="qz-input" placeholder="e.g. Project notes" value={name} onChange={e => setName(e.target.value)} />
          </label>
          <button className="qz-button" data-variant="primary" type="submit" disabled={busy || !path.trim()}>Add folder</button>
          <ErrorLine failure={failure} />
        </form>
      </div>
    </div>
  )
}

function WorkspaceItem(props: { api: AppApi; workspace: Workspace; writeBlocked: ApiFailure | null; onChanged: () => void; onColumnsSaved: (workspace: Workspace) => void }) {
  const { api, workspace: w } = props
  const { busy, failure, run } = useAction()
  const [message, setMessage] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 3000)
    return () => clearTimeout(t)
  }, [message])

  return (
    <section aria-label={w.name} className="qz-panel-surface qz-settings-folder">
      <div className="qz-settings-folder-identity">
        <span className="qz-settings-folder-icon"><Icon name="folder" /></span>
        <div>
          <h4>{w.name}</h4>
          <code className="qz-mono qz-muted">{w.path}</code>
        </div>
      </div>
      <div className="qz-settings-folder-controls">
        <label className="qz-settings-check">
          <input
            className="qz-settings-toggle"
            type="checkbox"
            checked={!!w.companion}
            disabled={busy}
            onChange={() => void run(() => setCompanion(api, w.id, !w.companion)).then(ok => ok && props.onChanged())}
          />
          Show in Quartizo
        </label>
        <div className="qz-settings-actions">
          {w.companion && (
            <button
              className="qz-button"
              data-variant="quiet"
              type="button"
              onClick={() =>
                void run(() => requestRefresh(api, { workspaceId: w.id, manual: true, rebuild: true })).then(
                  ok => ok && setMessage('Rebuild requested.'),
                )
              }
              disabled={busy}
            >
              Rebuild index
            </button>
          )}
          {!confirmRemove && (
            <button className="qz-button" data-variant="quiet" type="button" onClick={() => setConfirmRemove(true)} disabled={busy}>
              Remove…
            </button>
          )}
        </div>
      </div>
      {w.companion && <BoardSettings api={api} workspace={w} onSaved={props.onColumnsSaved} />}
      <AgentPrompt workspace={w} />
      {!!w.oldTasks && <LegacyMigration api={api} workspace={w} writeBlocked={props.writeBlocked} onChanged={props.onChanged} />}
      {confirmRemove && (
        <div role="alertdialog" aria-label="Remove folder" className="qz-notice qz-settings-notice">
          <p>
            Stop showing “{w.name}” in Quartizo? Your folder and files stay on disk.
            {!!w.oldTasks &&
              ` Removing this folder also deletes its ${w.oldTasks} saved task(s) from the old Quartizo board.`}
          </p>
          <div className="qz-settings-actions">
            <button
              className="qz-button"
              data-destructive
              type="button"
              onClick={() => void run(() => removeWorkspace(api, w.id, !!w.oldTasks)).then(ok => ok && props.onChanged())}
              disabled={busy}
            >
              {w.oldTasks ? `Remove and delete ${w.oldTasks} task(s)` : 'Remove'}
            </button>
            <button className="qz-button" data-variant="quiet" type="button" onClick={() => setConfirmRemove(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {message && (
        <span className="qz-muted" role="status">
          {message}
        </span>
      )}
      <ErrorLine failure={failure} />
    </section>
  )
}

function BoardSettings({ api, workspace, onSaved }: { api: AppApi; workspace: Workspace; onSaved: (workspace: Workspace) => void }) {
  const [draft, setDraft] = useState<{ columns: BoardColumn[]; version: number } | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [newId, setNewId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const { busy, failure, run } = useAction()
  const columns = draft?.columns ?? workspace.columns
  const statusId = newId ?? newLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32)
  const canAdd = columns.length < 20 && !!newLabel.trim() && /^[a-z][a-z0-9_]{0,31}$/.test(statusId) && statusId !== 'repair' && !columns.some(c => c.id === statusId)
  const removed = workspace.columns.some(saved => !columns.some(c => c.id === saved.id))
  const edit = (next: BoardColumn[]) => {
    setDraft({ columns: next, version: draft?.version ?? workspace.columnsVersion })
    setMessage('')
  }
  const reorder = (index: number, direction: number) => {
    const next = [...columns]
    const [column] = next.splice(index, 1)
    next.splice(index + direction, 0, column)
    edit(next)
  }
  const save = () => run(async () => {
    if (!draft) return
    const saved = await saveColumns(api, workspace.id, columns, draft.version)
    onSaved(saved)
    setDraft(null)
    setMessage('Board columns saved.')
  })
  const changed = JSON.stringify(columns) !== JSON.stringify(workspace.columns)
  return <>
    <details className="qz-settings-disclosure">
      <summary>Board columns</summary>
      <div className="qz-stack">
        <p className="qz-muted">Rename, reorder, add, or remove columns for this folder. The first column is the default for new tickets.</p>
        <ul className="qz-column-list">
          {columns.map((column, index) => <li className="qz-column-row" key={column.id}>
            <label className="qz-field">
              <span className="qz-mono">{column.id}</span>
              <input className="qz-input" aria-label={`Name for ${column.id}`} value={column.label} maxLength={40} disabled={busy}
                onChange={e => edit(columns.map(c => c.id === column.id ? { ...c, label: e.target.value } : c))} />
            </label>
            <div className="qz-settings-actions">
              <button className="qz-button" type="button" aria-label={`Move column ${column.id} up`} disabled={busy || index === 0} onClick={() => reorder(index, -1)}><Icon name="up" /></button>
              <button className="qz-button" type="button" aria-label={`Move column ${column.id} down`} disabled={busy || index === columns.length - 1} onClick={() => reorder(index, 1)}><Icon name="down" /></button>
              <button className="qz-button" type="button" aria-label={`Remove column ${column.id}`} disabled={busy || columns.length === 1} onClick={() => edit(columns.filter(c => c.id !== column.id))}>Remove</button>
            </div>
          </li>)}
        </ul>
        {columns.length < 20 && <form className="qz-column-row" onSubmit={e => {
          e.preventDefault()
          if (busy || !canAdd) return
          edit([...columns, { id: statusId, label: newLabel.trim() }])
          setNewLabel('')
          setNewId(null)
        }}>
          <label className="qz-field">New column name
            <input className="qz-input" value={newLabel} maxLength={40} disabled={busy} onChange={e => setNewLabel(e.target.value)} />
          </label>
          <label className="qz-field">New status ID
            <input className="qz-input qz-mono" value={statusId} maxLength={32} disabled={busy} onChange={e => setNewId(e.target.value)} />
          </label>
          <button className="qz-button" type="submit" disabled={busy || !canAdd}>Add column</button>
        </form>}
        <p className="qz-muted">Status IDs are saved in notes. Use a unique ID starting with a lowercase letter, followed by lowercase letters, digits, or underscores.</p>
        {removed && <p className="qz-notice">Tickets in removed columns will appear in Needs repair until you move them or restore the column with the same status ID.</p>}
        <div className="qz-settings-actions">
          <button className="qz-button" data-variant="primary" type="button" disabled={busy || !changed || columns.some(c => !c.label.trim())} onClick={() => void save()}>Save columns</button>
          {changed && <button className="qz-button" data-variant="quiet" type="button" disabled={busy} onClick={() => { setDraft(null); setMessage('') }}>Discard changes</button>}
          <span className="qz-muted" role="status">{message}</span>
        </div>
        <ErrorLine failure={failure} />
      </div>
    </details>
  </>
}

function AgentPrompt({ workspace }: { workspace: Workspace }) {
  const { openChat } = useChatLauncher()
  const prompt = agentPrompt(workspace.path, workspace.columns)
  const field = useRef<HTMLTextAreaElement>(null)
  const [message, setMessage] = useState('')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setMessage('Agent prompt copied.')
    } catch {
      field.current?.focus()
      field.current?.select()
      setMessage('Copy the selected text to use the prompt.')
    }
  }
  return <div className="qz-stack">
    <div className="qz-settings-actions">
      <button type="button" className="qz-button" data-variant="primary" disabled={!workspace.companion}
        onClick={() => openChat({ message: prompt, autoSend: false })}>
        <Icon name="external" />Ask a Bot or agent
      </button>
    </div>
    {workspace.companion ? <details className="qz-settings-disclosure">
      <summary>Agent instructions</summary>
      <div className="qz-stack">
        <p className="qz-muted">Pick a Bot or agent in the KiroCrew chat composer, then add your request and send it. The agent needs access to this folder.</p>
        <textarea ref={field} className="qz-input qz-mono qz-agent-prompt" aria-label="Agent prompt" value={prompt} rows={8} readOnly />
        <div className="qz-settings-actions">
          <button type="button" className="qz-button" onClick={() => void copy()}><Icon name="copy" />Copy agent prompt</button>
          <span className="qz-muted" role="status">{message}</span>
        </div>
      </div>
    </details> : <p className="qz-muted">Turn on Show in Quartizo to ask a Bot about this folder.</p>}
  </div>
}


/** Explicit preview, preservation copy, and confirmation before converting old cards to files. */
function LegacyMigration({ api, workspace, writeBlocked, onChanged }: { api: AppApi; workspace: Workspace; writeBlocked: ApiFailure | null; onChanged: () => void }) {
  const [preview, setPreview] = useState<MigrationPreview | null>(null)
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [exported, setExported] = useState(false)
  const [acceptCurrent, setAcceptCurrent] = useState(false)
  const { busy, failure, run } = useAction()
  const exportTasks = async () => {
    const value = await exportLegacyTasks(api, workspace.id)
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `quartizo-old-tasks-${workspace.id}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setExported(true)
  }
  const migrate = async () => {
    if (!preview) return
    const value = await migrateTasks(api, workspace.id, preview.planHash, acceptCurrent)
    setResult(value)
    setPreview(null)
    onChanged()
  }
  return <section className="qz-settings-migration" aria-label={`Old tasks in ${workspace.name}`}>
    <strong>Old task migration</strong>
    <p className="qz-muted">
      Convert {workspace.oldTasks} saved {workspace.oldTasks === 1 ? 'task' : 'tasks'} from the old board into Markdown ticket notes.
    </p>
    <div className="qz-settings-actions">
      <button className="qz-button" data-variant="quiet" type="button" disabled={busy} onClick={() => void run(exportTasks)}>Export old tasks</button>
      <button className="qz-button" type="button" disabled={busy || !workspace.companion} onClick={() => void run(async () => { setPreview(await previewMigration(api, workspace.id)); setResult(null); setAcceptCurrent(false) })}>Preview migration</button>
    </div>
    {exported && <span className="qz-muted" role="status">Export downloaded.</span>}
    {preview && <div role="alertdialog" aria-label="Confirm old task migration" className="qz-notice qz-settings-notice">
      <strong>Create {preview.tasks.filter(task => !task.migrated).length} ticket note(s)</strong>
      <p>Quartizo backs up the database tasks before writing each ticket to a new file.</p>
      {preview.warnings.map((warning, i) => <p key={i}>{warning}</p>)}
      <ul className="qz-settings-migration-files">
        {preview.tasks.map(task => <li key={task.uid}>
          {task.title} → <code>{task.path}</code> ({task.status}){task.migrated && ' · already migrated'}
          {task.noteRef && <span> · linked note: {task.noteRef}</span>}
          {task.slotId && <span> · session: {task.slotId}</span>}
        </li>)}
      </ul>
      {preview.tasks.some(task => task.changed) && !preview.complete && <label className="qz-settings-check">
        <input type="checkbox" checked={acceptCurrent} onChange={e => setAcceptCurrent(e.target.checked)} disabled={busy} />
        I reviewed the changed converted notes; keep their latest contents when resuming
      </label>}
      <div className="qz-settings-actions">
        <button className="qz-button" data-variant="primary" type="button" disabled={busy || !!writeBlocked || preview.complete || !preview.tasks.length} onClick={() => void run(migrate)}>{preview.backup ? 'Resume and verify migration' : 'Back up and migrate'}</button>
        <button className="qz-button" data-variant="quiet" type="button" disabled={busy} onClick={() => setPreview(null)}>Cancel</button>
      </div>
    </div>}
    {result && <div className="qz-settings-notice qz-settings-result" role="status">
      <p>{result.migrated.length} ticket note(s) migrated. {result.complete ? 'Migration verified.' : `${result.remaining} task(s) remain; preview again to continue.`}</p>
      <code className="qz-mono qz-muted">Backup: {result.backup.directory}</code>
    </div>}
    <ErrorLine failure={failure} />
  </section>
}
