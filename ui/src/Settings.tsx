/**
 * Settings: the folders Quartizo reads. A folder added here is shared with
 * Kiro Notes right away (companion mode), since the board and the TODO list
 * only show companion folders. Nothing here changes a file.
 */
import type { AppApi } from '@kirocrew/app-sdk'
import { Btn } from '@kirocrew/app-sdk/ui'
import { useEffect, useState } from 'react'
import { requestRefresh, setCompanion } from './companionApi'
import { type ApiFailure, listWorkspaces, registerWorkspace, toFailure, type Workspace } from './notesApi'
import { removeWorkspace, toTaskFailure } from './tasksApi'

const S = {
  column: { display: 'flex', flexDirection: 'column' as const, gap: 8, minWidth: 0 },
  row: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const },
  input: { flex: 1, minWidth: 0, padding: '4px 6px', border: '1px solid rgba(128,128,128,.4)', borderRadius: 4, background: 'transparent', color: 'inherit' },
  item: { padding: 8, borderRadius: 4, border: '1px solid rgba(128,128,128,.35)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  notice: { padding: 8, borderRadius: 4, border: '1px solid rgba(220,120,0,.6)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  mono: { fontFamily: 'ui-monospace, monospace', fontSize: 12, wordBreak: 'break-all' as const },
}

export default function Settings(props: { api: AppApi; active: boolean }) {
  const { api } = props
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const [reload, setReload] = useState(0)
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!props.active) return
    let cancelled = false
    listWorkspaces(api)
      .then(value => !cancelled && setWorkspaces(value))
      .catch(err => !cancelled && setFailure(toFailure(err)))
    return () => {
      cancelled = true
    }
  }, [api, props.active, reload])

  const add = async () => {
    setBusy(true)
    setFailure(null)
    try {
      const ws = await registerWorkspace(api, path.trim(), name.trim() || undefined)
      await setCompanion(api, ws.id, true)
      setPath('')
      setName('')
      setReload(n => n + 1)
    } catch (err) {
      setFailure(toFailure(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={S.column}>
      <strong className="text-sm">Folders</strong>
      {!workspaces && !failure && <p className="text-sm text-muted">Loading…</p>}
      {workspaces?.length === 0 && <p className="text-sm text-muted">No folder yet. Add the folder you also attached in Kiro Notes.</p>}
      {workspaces?.map(w => (
        <WorkspaceItem key={w.id} api={api} workspace={w} onChanged={() => setReload(n => n + 1)} />
      ))}
      <div style={S.row}>
        <input
          aria-label="Absolute folder path"
          placeholder="/home/you/notes"
          value={path}
          onChange={e => setPath(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && path.trim() && void add()}
          style={S.input}
        />
        <input aria-label="Name (optional)" placeholder="Name (optional)" value={name} onChange={e => setName(e.target.value)} style={{ ...S.input, flex: '0 1 180px' }} />
        <Btn onClick={() => void add()} disabled={busy || !path.trim()}>
          Add folder
        </Btn>
      </div>
      {failure && (
        <div role="alert" className="text-sm text-danger" data-code={failure.code}>
          {failure.message}
        </div>
      )}
    </div>
  )
}

function WorkspaceItem(props: { api: AppApi; workspace: Workspace; onChanged: () => void }) {
  const { api, workspace: w } = props
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  // Set when the backend refused the removal because the workspace still has database tasks.
  const [taskCount, setTaskCount] = useState<number | null>(null)

  const run = async (action: () => Promise<unknown>, done?: string) => {
    setBusy(true)
    setFailure(null)
    setMessage(null)
    try {
      await action()
      if (done) setMessage(done)
      return true
    } catch (err) {
      setFailure(toFailure(err))
      return false
    } finally {
      setBusy(false)
    }
  }

  const remove = async (deleteTasks = false) => {
    setBusy(true)
    setFailure(null)
    try {
      await removeWorkspace(api, w.id, deleteTasks)
      props.onChanged()
    } catch (err) {
      const f = toTaskFailure(err)
      if (f.code === 'project_has_tasks' && !deleteTasks) setTaskCount(f.taskCount ?? 0)
      else setFailure(f)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label={w.name} style={S.item}>
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
          <Btn onClick={() => void run(() => requestRefresh(api, { workspaceId: w.id, manual: true, rebuild: true }), 'Rebuilding the index…')} disabled={busy}>
            Rebuild index
          </Btn>
        )}
        {!confirmRemove && (
          <Btn onClick={() => setConfirmRemove(true)} disabled={busy}>
            Remove…
          </Btn>
        )}
      </div>
      {confirmRemove && (
        <div role="alertdialog" aria-label="Remove folder" style={S.notice}>
          <span className="text-sm">
            {taskCount === null
              ? `Stop showing “${w.name}” in Quartizo? The folder and its files are not touched.`
              : `“${w.name}” still has ${taskCount} task(s) in Quartizo's own database. Removing it also deletes them.`}
          </span>
          <div style={S.row}>
            <Btn onClick={() => void remove(taskCount !== null)} disabled={busy}>
              {taskCount === null ? 'Remove' : `Remove and delete ${taskCount} task(s)`}
            </Btn>
            <Btn
              onClick={() => {
                setConfirmRemove(false)
                setTaskCount(null)
              }}
              disabled={busy}
            >
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
      {failure && (
        <div role="alert" className="text-sm text-danger" data-code={failure.code}>
          {failure.message}
        </div>
      )}
    </section>
  )
}
