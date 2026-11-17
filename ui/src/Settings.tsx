import { type AppApi, useChatLauncher } from '@kirocrew/app-sdk'
import { useEffect, useRef, useState } from 'react'
import {
  addWorkspace,
  type ApiFailure,
  BACKEND_BASE,
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
import { BoardViewSettings } from './Companion'
import { DEFAULT_NOTE_APPEARANCE, headingColor, headingColorCss, headingLines } from './noteAppearance'
import { DEFAULT_FOLDER_APPEARANCE, folderEmoji, NOTE_WIDTHS, type Preferences } from './preferences'
import SettingsColor from './SettingsColor'
import { Dialog, ErrorLine, Icon } from './ui'
import type { PreferenceStatus } from './usePreferences'

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

const SECTIONS = {
  defaults: 'Defaults',
  appearance: 'Appearance',
  notes: 'Notes',
  board: 'Board',
  folders: 'Folders',
} as const

export type SettingsSection = keyof typeof SECTIONS

interface PreferenceControls {
  preferences: Preferences
  onPreferencesChange: (patch: Partial<Preferences>) => void
}

const STATUS: Record<PreferenceStatus, string> = {
  loading: 'Loading preferences…',
  saving: 'Saving…',
  saved: 'Saved',
  local: 'Saved in this browser. Waiting to sync.',
  unavailable: 'Preferences couldn’t be saved.',
}

const TABS = { tasks: 'Tasks', todos: 'TODOs', notes: 'Notes', settings: 'Settings' } as const

export default function Settings({
  api, preferences, onPreferencesChange, status, section, onSectionChange, workspaceId, onWorkspaceChange, onWorkspacesChanged,
}: PreferenceControls & {
  api: AppApi
  status: PreferenceStatus
  section: SettingsSection | null
  onSectionChange: (next: SettingsSection) => void
  workspaceId: number | null
  onWorkspaceChange: (id: number | null) => void
  onWorkspacesChanged: () => void
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null)
  const [loadFailure, setLoadFailure] = useState<ApiFailure | null>(null)
  const [writeBlocked, setWriteBlocked] = useState<ApiFailure | null>(null)
  // Folders whose directory no longer exists on disk. They are easy to miss and otherwise look normal.
  const [missing, setMissing] = useState<ReadonlySet<number>>(new Set())
  const [reload, setReload] = useState(0)
  const selectedSection = section ?? (workspaces?.length ? 'defaults' : 'folders')
  const enabled = workspaces?.filter(w => w.companion) ?? []
  const workspace = enabled.find(w => w.id === workspaceId)
  const changed = () => {
    setReload(n => n + 1)
    onWorkspacesChanged()
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([listWorkspaces(api), companionStatus(api)])
      .then(([value, index]) => {
        if (cancelled) return
        setWorkspaces(value)
        setWriteBlocked(index.writeBlocked ?? null)
        setMissing(new Set(index.workspaces
          .filter(({ index: status }) => typeof status.error === 'object' && status.error?.code === 'root_missing')
          .map(({ workspace }) => workspace.id)))
        setLoadFailure(null)
      })
      .catch(err => !cancelled && setLoadFailure(toFailure(err)))
    return () => { cancelled = true }
  }, [api, reload])

  return (
    <div className="qz-settings">
      <header className="qz-settings-header">
        <h2 className="qz-section-title">Settings</h2>
        <span className="qz-muted qz-settings-saved" role="status">{STATUS[status]}</span>
      </header>
      <nav aria-label="Settings sections" className="qz-settings-nav">
        {(Object.keys(SECTIONS) as SettingsSection[]).map(key => <button key={key} type="button" className="qz-button"
          aria-current={selectedSection === key ? 'true' : undefined}
          onClick={() => onSectionChange(key)}>{SECTIONS[key]}</button>)}
      </nav>
      <ErrorLine failure={loadFailure} />
      <ErrorLine failure={writeBlocked} />

      {selectedSection === 'defaults' && <SettingsPanel title="Defaults">
        <div className="qz-settings-fields">
          <Choice label="Start on" value={preferences.startOn} options={{ last: 'Last used tab', ...TABS }}
            onChange={startOn => onPreferencesChange({ startOn })} />
          <label className="qz-field">Default workspace
            <select className="qz-input" value={preferences.workspaceId && enabled.some(w => w.id === preferences.workspaceId)
              ? String(preferences.workspaceId) : ''} onChange={e => onWorkspaceChange(Number(e.currentTarget.value) || null)}>
              <option value="">First connected folder</option>
              {enabled.map(w => <option key={w.id} value={w.id}>
                {[preferences.folderAppearance[w.id]?.emoji, w.name].filter(Boolean).join(' ')}
              </option>)}
            </select>
          </label>
        </div>
        <p className="qz-muted">Changing the workspace here or in the header remembers that folder for your next visit.</p>
      </SettingsPanel>}

      {selectedSection === 'appearance' && <SettingsPanel title="Appearance">
        <div className="qz-settings-fields">
          <SettingsColor label="Accent color" value={preferences.accent} allowAccent={false} checkContrast
            onChange={accent => onPreferencesChange({ accent })} />
          <div className="qz-stack">
            <label className="qz-settings-check"><input className="qz-settings-toggle" type="checkbox" role="switch" checked={preferences.highContrast}
              onChange={e => onPreferencesChange({ highContrast: e.currentTarget.checked })} />High contrast</label>
            <label className="qz-settings-check"><input className="qz-settings-toggle" type="checkbox" role="switch" checked={preferences.largerInterfaceText}
              onChange={e => onPreferencesChange({ largerInterfaceText: e.currentTarget.checked })} />Larger interface text</label>
            <Choice label="Motion" value={preferences.motion} options={{ system: 'Follow system', reduced: 'Reduce motion' }}
              onChange={motion => onPreferencesChange({ motion })} />
          </div>
        </div>
      </SettingsPanel>}

      {selectedSection === 'notes' && <NotesSettings preferences={preferences} onPreferencesChange={onPreferencesChange} />}

      <div className="qz-stack" hidden={selectedSection !== 'board'}>
        <SettingsPanel title="Board view">
          <BoardViewSettings preferences={preferences} onPreferencesChange={onPreferencesChange} workspace={workspace} />
        </SettingsPanel>
        <SettingsPanel title="Board columns">
          <p className="qz-muted">Customize columns for each enabled folder. Use Save columns to apply your changes.</p>
          {!enabled.length && <button className="qz-button" type="button" onClick={() => onSectionChange('folders')}>Manage folders</button>}
          {enabled.map(w => <section key={w.id} aria-label={w.name} className="qz-settings-board-folder">
            <h4>{w.name}</h4>
            <BoardSettings api={api} workspace={w}
              onSaved={saved => setWorkspaces(items => items?.map(item => item.id === saved.id ? { ...item, ...saved } : item) ?? null)} />
          </section>)}
        </SettingsPanel>
      </div>

      {selectedSection === 'folders' && <div className="qz-settings-grid" data-empty={workspaces?.length === 0 || undefined}>
        {workspaces?.length !== 0 && <section className="qz-settings-folders" aria-labelledby="qz-settings-folders">
          <div className="qz-settings-heading"><h3 id="qz-settings-folders">Connected folders</h3></div>
          {!workspaces && !loadFailure && <p className="qz-muted" role="status">Loading folders…</p>}
          {workspaces?.map(w => (
            <WorkspaceItem key={w.id} api={api} workspace={w} writeBlocked={writeBlocked} missing={missing.has(w.id)} onChanged={changed}
              preferences={preferences} onPreferencesChange={onPreferencesChange} />
          ))}
        </section>}
        <AddFolder api={api} onAdded={w => {
          onWorkspaceChange(w.id)
          changed()
        }} />
        {workspaces?.length === 0 && <SettingsPanel title="Get started">
          <ol className="qz-onboarding">
            <li>Add a folder that contains or will hold Markdown files.</li>
            <li>Open Notes and create your first note.</li>
            <li>Open Tasks and create a ticket or turn an existing note into one.</li>
          </ol>
        </SettingsPanel>}
      </div>}
    </div>
  )
}

function SettingsPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="qz-panel-surface qz-settings-panel" aria-label={title}>
    <div className="qz-settings-heading"><h3>{title}</h3></div>
    {children}
  </section>
}

function Choice<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: Record<T, string>
  onChange: (value: T) => void
}) {
  return <label className="qz-field">{label}
    <select className="qz-input" value={value} onChange={e => onChange(e.currentTarget.value as T)}>
      {Object.entries(options).map(([key, text]) => <option key={key} value={key}>{text as string}</option>)}
    </select>
  </label>
}

function AddFolder({ api, onAdded }: { api: AppApi; onAdded: (w: Workspace) => void }) {
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [validation, setValidation] = useState<{ path: string; failure: ApiFailure | null } | null>(null)
  const { busy, failure, run } = useAction()
  const trimmed = path.trim()
  const absolute = trimmed.startsWith('/')
  const currentCheck = validation?.path === trimmed ? validation : null
  const pathError = trimmed && !absolute ? 'Enter an absolute folder path starting with /.'
    : currentCheck?.failure?.message
  useEffect(() => {
    if (!absolute) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      api.post(`${BACKEND_BASE}/workspaces/validate`, { path: trimmed }, { signal: controller.signal })
        .then(() => {
          if (!controller.signal.aborted) setValidation({ path: trimmed, failure: null })
        })
        .catch(err => {
          if (controller.signal.aborted) return
          const value = toFailure(err)
          if (value.code && value.status && value.status < 500 && value.code !== 'not_found') {
            setValidation({ path: trimmed, failure: value })
          }
        })
    }, 300)
    return () => { clearTimeout(timer); controller.abort() }
  }, [api, absolute, trimmed])

  const add = () => run(async () => {
    const w = await addWorkspace(api, trimmed, name.trim() || undefined)
    setPath('')
    setName('')
    setValidation(null)
    onAdded(w)
  })

  return <form className="qz-panel-surface qz-settings-add" aria-labelledby="qz-settings-add" aria-busy={busy}
    onSubmit={event => {
      event.preventDefault()
      if (absolute && !pathError && !busy) void add()
    }}>
    <div>
      <h3 id="qz-settings-add">Add a folder</h3>
      <p className="qz-muted">Enter the path to a local folder. To use the same files in Kiro Notes, attach it there too.</p>
    </div>
    <div>
      <label className="qz-field">Folder path
        <input className="qz-input" placeholder="/home/you/notes" value={path} disabled={busy}
          aria-invalid={!!pathError} aria-describedby="qz-folder-path-check"
          onChange={e => { setPath(e.target.value); setValidation(null) }} />
      </label>
      <p className="qz-muted" id="qz-folder-path-check" role="status">
        {pathError || (currentCheck ? 'Folder is ready to connect.' : '')}
      </p>
    </div>
    <label className="qz-field">
      <span>Name <span className="qz-muted">(optional)</span></span>
      <input className="qz-input" placeholder="e.g. Project notes" value={name} disabled={busy} onChange={e => setName(e.target.value)} />
    </label>
    <button className="qz-button" data-variant="primary" type="submit" disabled={busy || !absolute || !!pathError}>Add folder</button>
    <ErrorLine failure={failure} />
  </form>
}

const SIZES = { small: 'Small', medium: 'Medium', large: 'Large' } as const

function NotesSettings({ preferences, onPreferencesChange }: PreferenceControls) {
  const { appearance } = preferences
  const edit = (change: Partial<Preferences['appearance']>) => onPreferencesChange({ appearance: { ...appearance, ...change } })
  const isDefault = appearance.headingColor === 'theme' && appearance.headingLines === 'theme' && appearance.lineColor === 'theme'

  return <>
    <SettingsPanel title="Reading and editing">
      <div className="qz-settings-fields">
        <Choice label="Note view" value={preferences.noteView} options={{ rendered: 'Rendered', raw: 'Raw' }}
          onChange={noteView => onPreferencesChange({ noteView })} />
        <Choice label="Reading width" value={preferences.noteWidth} options={NOTE_WIDTHS}
          onChange={noteWidth => onPreferencesChange({ noteWidth })} />
        <Choice label="Reading text size" value={preferences.noteTextSize} options={SIZES}
          onChange={noteTextSize => onPreferencesChange({ noteTextSize })} />
        <Choice label="Raw editor text size" value={preferences.rawTextSize} options={SIZES}
          onChange={rawTextSize => onPreferencesChange({ rawTextSize })} />
        <Choice label="Line spacing" value={preferences.noteLineHeight} options={{ compact: 'Compact', normal: 'Normal', relaxed: 'Relaxed' }}
          onChange={noteLineHeight => onPreferencesChange({ noteLineHeight })} />
        <Choice label="Reading font" value={preferences.noteFont} options={{ theme: 'Theme default', mono: 'Monospace' }}
          onChange={noteFont => onPreferencesChange({ noteFont })} />
      </div>
    </SettingsPanel>
    <section className="qz-panel-surface qz-settings-panel" aria-labelledby="qz-note-appearance">
      <div className="qz-settings-heading">
        <h3 id="qz-note-appearance">Notes appearance</h3>
        <button className="qz-button" type="button" data-variant="quiet" disabled={isDefault}
          onClick={() => onPreferencesChange({ appearance: DEFAULT_NOTE_APPEARANCE })}>Reset defaults</button>
      </div>
      <div className="qz-settings-fields">
        <SettingsColor label="Heading text color" value={appearance.headingColor} checkContrast onChange={headingColor => edit({ headingColor })} />
        <div className="qz-settings-color-mode">
          <label className="qz-field">Heading lines
            <select className="qz-input" value={appearance.headingLines} onChange={e => edit({ headingLines: headingLines(e.currentTarget.value) })}>
              <option value="theme">Theme default</option>
              <option value="all">Under every heading</option>
              <option value="none">None</option>
            </select>
          </label>
          <button className="qz-button" type="button" data-variant="quiet" aria-label="Reset heading lines"
            disabled={appearance.headingLines === 'theme'} onClick={() => edit({ headingLines: 'theme' })}>Reset</button>
        </div>
        <SettingsColor label="Heading line color" value={appearance.lineColor} disabled={appearance.headingLines === 'none'}
          checkContrast onChange={lineColor => edit({ lineColor })} />
      </div>
      <div className="qz-settings-fields">
        {(['Light', 'Dark'] as const).map(theme => <div key={theme} data-preview-theme={theme.toLowerCase()}
          className="qz-note-headings qz-settings-panel-preview" role="group" aria-label={`${theme} background preview`}>
          <span>{theme} background</span>
          <h2>Project notes</h2>
          <h3>Next steps</h3>
          <p>Draft the plan and share it with the team.</p>
        </div>)}
      </div>
    </section>
  </>
}

function WorkspaceItem(props: PreferenceControls & {
  api: AppApi
  workspace: Workspace
  writeBlocked: ApiFailure | null
  missing: boolean
  onChanged: () => void
}) {
  const { api, workspace: w, preferences, onPreferencesChange } = props
  const appearance = preferences.folderAppearance[w.id] ?? DEFAULT_FOLDER_APPEARANCE
  const personalize = (change: Partial<typeof appearance>) => {
    onPreferencesChange({ folderAppearance: { [w.id]: { ...appearance, ...change } } })
  }
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
        <span className="qz-settings-folder-icon" aria-hidden="true" style={{ color: headingColorCss(appearance.color) }}>
          {appearance.emoji || <Icon name="folder" />}
        </span>
        <div>
          <h4>{w.name}</h4>
          <code className="qz-mono qz-muted">{w.path}</code>
        </div>
      </div>
      {props.missing && <div role="alert" className="qz-notice qz-error qz-settings-missing">
        <strong>This folder is missing.</strong> {w.path} no longer exists on disk. Restore or reconnect it, or remove it here.
        {w.companion && ' Turn off “Include in Tasks, Notes, and TODOs” to hide it from the other views.'}
      </div>}
      <div className="qz-settings-folder-controls">
        <label className="qz-settings-check">
          <input
            className="qz-settings-toggle"
            type="checkbox"
            role="switch"
            checked={!!w.companion}
            disabled={busy}
            onChange={() => void run(() => setCompanion(api, w.id, !w.companion)).then(ok => ok && props.onChanged())}
          />
          Include in Tasks, Notes, and TODOs
        </label>
        <div className="qz-settings-actions">
          {!confirmRemove && (
            <button className="qz-button" data-variant="quiet" type="button" onClick={() => setConfirmRemove(true)} disabled={busy}>
              Remove…
            </button>
          )}
        </div>
      </div>
      <div className="qz-settings-fields">
        <label className="qz-field">Folder emoji
          <input className="qz-input" placeholder="Optional" value={appearance.emoji} maxLength={16}
            onChange={e => personalize({ emoji: folderEmoji(e.currentTarget.value) })} />
        </label>
        <SettingsColor label="Folder color" value={appearance.color} onChange={color => personalize({ color })} />
      </div>
      <details className="qz-settings-disclosure">
        <summary>Advanced</summary>
        <div className="qz-stack">
          {w.companion && <div className="qz-stack">
            <p className="qz-muted">Rescan all notes if Tasks, Notes, or TODOs is missing recent changes.</p>
            <div><button className="qz-button" data-variant="quiet" type="button" disabled={busy}
              onClick={() => void run(() => requestRefresh(api, { workspaceId: w.id, manual: true, rebuild: true }))
                .then(ok => ok && setMessage('Folder rescan requested.'))}>Rescan folder</button></div>
          </div>}
          <AgentPrompt workspace={w} />
          {!!w.oldTasks && <LegacyMigration api={api} workspace={w} writeBlocked={props.writeBlocked} onChanged={props.onChanged} />}
        </div>
      </details>
      {confirmRemove && (
        <Dialog label="Remove folder" className="qz-notice qz-settings-notice" onCancel={() => setConfirmRemove(false)}>
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
        </Dialog>
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
    <>
      <div className="qz-stack">
        <p className="qz-muted">The first column is the default for new tickets.</p>
        <ul className="qz-column-list">
          {columns.map((column, index) => <li className="qz-column-row" key={column.id}>
            <label className="qz-field">
              <span className="qz-mono">{column.id}</span>
              <input className="qz-input" aria-label={`Name for ${column.id}`} value={column.label} maxLength={40} disabled={busy}
                onChange={e => edit(columns.map(c => c.id === column.id ? { ...c, label: e.target.value } : c))} />
            </label>
            <SettingsColor label={`Color for ${column.id}`} value={headingColor(column.color)} allowAccent={false}
              disabled={busy} onChange={color => edit(columns.map(c => {
                if (c.id !== column.id) return c
                return color === 'theme' ? { id: c.id, label: c.label } : { ...c, color }
              }))} />
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
          <div className="qz-stack">
            <label className="qz-field">New status value
              <input className="qz-input qz-mono" value={statusId} maxLength={32} disabled={busy}
                aria-describedby={`qz-column-id-${workspace.id}`} onChange={e => setNewId(e.target.value)} />
            </label>
            <p className="qz-muted" id={`qz-column-id-${workspace.id}`}>
              The status value is saved as “status:” in your Markdown notes. Quartizo suggests it from the name. Use lowercase letters, digits and underscores, starting with a letter.
            </p>
          </div>
          <button className="qz-button" type="submit" disabled={busy || !canAdd}>Add column</button>
        </form>}
        {removed && <p className="qz-notice">Tickets in removed columns move to Needs repair. Move those tickets to an active column or restore the old status ID.</p>}
        <div className="qz-settings-actions">
          <button className="qz-button" data-variant="primary" type="button" disabled={busy || !changed || columns.some(c => !c.label.trim())} onClick={() => void save()}>Save columns</button>
          {changed && <button className="qz-button" data-variant="quiet" type="button" disabled={busy} onClick={() => { setDraft(null); setMessage('') }}>Discard changes</button>}
          <span className="qz-muted" role="status">{message}</span>
        </div>
        <ErrorLine failure={failure} />
      </div>
    </>
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
    </details> : <p className="qz-muted">Enable this folder to ask a Bot about its notes and tickets.</p>}
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
    {preview && <Dialog label="Confirm old task migration" className="qz-notice qz-settings-notice" onCancel={() => setPreview(null)}>
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
    </Dialog>}
    {result && <div className="qz-settings-notice qz-settings-result" role="status">
      <p>{result.migrated.length} ticket note(s) migrated. {result.complete ? 'Migration verified.' : `${result.remaining} task(s) remain; preview again to continue.`}</p>
      <code className="qz-mono qz-muted">Backup: {result.backup.directory}</code>
    </div>}
    <ErrorLine failure={failure} />
  </section>
}
