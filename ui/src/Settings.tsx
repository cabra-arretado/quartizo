/**
 * Settings: the folders Quartizo reads. A folder added here is shared with
 * Kiro Notes right away (companion mode), since the board and the TODO list
 * only show companion folders. Nothing here changes a file.
 */
import type { AppApi } from '@kirocrew/app-sdk'
import { Btn } from '@kirocrew/app-sdk/ui'
import { useEffect, useState } from 'react'
import {
  addWorkspace,
  type ApiFailure,
  listWorkspaces,
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
  const [reload, setReload] = useState(0)
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const { busy, failure, run } = useAction()

  useEffect(() => {
    let cancelled = false
    listWorkspaces(api)
      .then(value => {
        if (cancelled) return
        setWorkspaces(value)
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
      {!workspaces && !loadFailure && <p className="text-sm text-muted">Loading…</p>}
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

function WorkspaceItem(props: { api: AppApi; workspace: Workspace; onChanged: () => void }) {
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
