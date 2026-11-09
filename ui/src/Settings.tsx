/**
 * Settings: the folders Quartizo reads. A folder added here is shared with
 * Kiro Notes right away (companion mode), since the board and the TODO list
 * only show companion folders. Legacy conversion is an explicit, backed-up action.
 */
import type { AppApi } from '@kirocrew/app-sdk'
import { Btn } from '@kirocrew/app-sdk/ui'
import { useEffect, useState } from 'react'
import {
  addWorkspace,
  type ApiFailure,
  companionStatus,
  listWorkspaces,
  exportLegacyTasks,
  migrateTasks,
  previewMigration,
  type MigrationPreview,
  type MigrationResult,
  removeWorkspace,
  requestRefresh,
  setCompanion,
  toFailure,
  type Workspace,
} from './companionApi'
import { ErrorLine, S } from './ui'

const grow = { ...S.input, flex: 1, minWidth: 0 }

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
    <div style={S.column}>
      <strong className="text-sm">Folders</strong>
      <ErrorLine failure={loadFailure} />
      <ErrorLine failure={writeBlocked} />
      {!workspaces && !loadFailure && <p className="text-sm text-muted">Loading…</p>}
      {workspaces?.length === 0 && <p className="text-sm text-muted">No folder yet. Add the folder you also attached in Kiro Notes.</p>}
      {workspaces?.map(w => (
        <WorkspaceItem key={w.id} api={api} workspace={w} writeBlocked={writeBlocked} onChanged={() => setReload(n => n + 1)} />
      ))}
      <div style={S.row}>
        <input
          aria-label="Absolute folder path"
          placeholder="/home/you/notes"
          value={path}
          onChange={e => setPath(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && path.trim() && !busy && void add()}
          style={grow}
        />
        <input aria-label="Name (optional)" placeholder="Name (optional)" value={name} onChange={e => setName(e.target.value)} style={{ ...grow, flex: '0 1 180px' }} />
        <Btn onClick={() => void add()} disabled={busy || !path.trim()}>
          Add folder
        </Btn>
      </div>
      <ErrorLine failure={failure} />
    </div>
  )
}

function WorkspaceItem(props: { api: AppApi; workspace: Workspace; writeBlocked: ApiFailure | null; onChanged: () => void }) {
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
    <section aria-label={w.name} style={S.box}>
      <div style={S.row}>
        <strong className="text-sm">{w.name}</strong>
        <span className="text-sm text-muted" style={S.mono}>
          {w.path}
        </span>
      </div>
      <div style={S.row}>
        <label className="text-sm" style={S.row}>
          <input
            type="checkbox"
            checked={!!w.companion}
            disabled={busy}
            onChange={() => void run(() => setCompanion(api, w.id, !w.companion)).then(ok => ok && props.onChanged())}
          />
          Shared with Kiro Notes
        </label>
        <span style={{ flex: 1 }} />
        {w.companion && (
          <Btn
            onClick={() =>
              void run(() => requestRefresh(api, { workspaceId: w.id, manual: true, rebuild: true })).then(
                ok => ok && setMessage('Rebuild requested.'),
              )
            }
            disabled={busy}
          >
            Rebuild index
          </Btn>
        )}
        {!confirmRemove && (
          <Btn onClick={() => setConfirmRemove(true)} disabled={busy}>
            Remove…
          </Btn>
        )}
      </div>
      {!!w.oldTasks && <LegacyMigration api={api} workspace={w} writeBlocked={props.writeBlocked} onChanged={props.onChanged} />}
      {confirmRemove && (
        <div role="alertdialog" aria-label="Remove folder" style={S.notice}>
          <span className="text-sm">
            Stop showing “{w.name}” in Quartizo? The folder and its files are not touched.
            {!!w.oldTasks &&
              ` It still has ${w.oldTasks} task(s) from Quartizo's old task board, which no view shows any more: removing the folder deletes them.`}
          </span>
          <div style={S.row}>
            <Btn
              onClick={() => void run(() => removeWorkspace(api, w.id, !!w.oldTasks)).then(ok => ok && props.onChanged())}
              disabled={busy}
            >
              {w.oldTasks ? `Remove and delete ${w.oldTasks} task(s)` : 'Remove'}
            </Btn>
            <Btn onClick={() => setConfirmRemove(false)} disabled={busy}>
              Cancel
            </Btn>
          </div>
        </div>
      )}
      {message && (
        <span className="text-sm text-muted" role="status">
          {message}
        </span>
      )}
      <ErrorLine failure={failure} />
    </section>
  )
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
  return <section style={S.box} aria-label={`Old tasks in ${workspace.name}`}>
    <span className="text-sm">{workspace.oldTasks} old database task(s) are preserved. Convert them to Markdown ticket notes to show them on the board.</span>
    <div style={S.row}>
      <Btn disabled={busy} onClick={() => void run(exportTasks)}>Export old tasks</Btn>
      <Btn disabled={busy || !workspace.companion} onClick={() => void run(async () => { setPreview(await previewMigration(api, workspace.id)); setResult(null); setAcceptCurrent(false) })}>Preview migration</Btn>
    </div>
    {exported && <span className="text-sm" role="status">Export downloaded.</span>}
    {preview && <div role="alertdialog" aria-label="Confirm old task migration" style={S.notice}>
      <strong className="text-sm">Create {preview.tasks.filter(task => !task.migrated).length} ticket note(s)</strong>
      <span className="text-sm">A backup is saved before writing. Existing database tasks remain preserved; no existing note is overwritten.</span>
      {preview.warnings.map((warning, i) => <span key={i} className="text-sm">{warning}</span>)}
      <ul style={{ maxHeight: 200, overflowY: 'auto' }}>
        {preview.tasks.map(task => <li key={task.uid} className="text-sm">
          {task.title} → <code>{task.path}</code> ({task.status}){task.migrated && ' · already migrated'}
          {task.noteRef && <span> · linked note: {task.noteRef}</span>}
          {task.slotId && <span> · session: {task.slotId}</span>}
        </li>)}
      </ul>
      {preview.tasks.some(task => task.changed) && !preview.complete && <label className="text-sm">
        <input type="checkbox" checked={acceptCurrent} onChange={e => setAcceptCurrent(e.target.checked)} disabled={busy} />
        I reviewed the changed converted notes; keep their latest contents when resuming
      </label>}
      <div style={S.row}>
        <Btn disabled={busy || !!writeBlocked || preview.complete || !preview.tasks.length} onClick={() => void run(migrate)}>{preview.backup ? 'Resume and verify migration' : 'Back up and migrate'}</Btn>
        <Btn disabled={busy} onClick={() => setPreview(null)}>Cancel</Btn>
      </div>
    </div>}
    {result && <div style={S.notice} role="status">
      <span className="text-sm">{result.migrated.length} ticket note(s) migrated. {result.complete ? 'Migration verified.' : `${result.remaining} task(s) remain; preview again to continue.`}</span>
      <span className="text-sm" style={S.mono}>Backup: {result.backup.directory}</span>
    </div>}
    <ErrorLine failure={failure} />
  </section>
}
