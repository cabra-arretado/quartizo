import { useAppApi } from '@kirocrew/app-sdk'
import { type CSSProperties, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { TasksView, TodoView } from './Companion'
import NotesView from './Notes'
import Settings, { type SettingsSection } from './Settings'
import { listWorkspaces, type Workspace, withTimeout } from './companionApi'
import { accentForeground, headingColorCss } from './noteAppearance'
import type { NoteLocation } from './noteNav'
import type { Tab } from './preferences'
import { usePreferences } from './usePreferences'
import { Icon, type IconName } from './ui'
import styles from './quartizo.css?inline'
import companionStyles from './companion.css?inline'

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'tasks', label: 'Tasks', icon: 'board' },
  { id: 'todos', label: 'TODOs', icon: 'checklist' },
  { id: 'notes', label: 'Notes', icon: 'note' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

const textSize = { small: '14px', medium: '16px', large: '19px' }
const lineHeight = { compact: 1.45, normal: 1.65, relaxed: 1.9 }

interface ReturnLocation {
  tab: 'tasks' | 'todos'
  workspaceId: number | null
}

// The host mounts the default export on one manifest page with the App SDK provider.
export default function Quartizo() {
  const api = useAppApi()
  const { preferences, status, ready, update } = usePreferences(api)
  const [activeTab, setActiveTab] = useState<Tab | null>(null)
  const [section, setSection] = useState<SettingsSection | null>(null)
  const [noteRequest, setNoteRequest] = useState<NoteLocation | null>(null)
  const [returnLocation, setReturnLocation] = useState<ReturnLocation | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[] | null>(null)
  const [workspaceReload, setWorkspaceReload] = useState(0)
  const tabs = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let busy = false
    let retry: ReturnType<typeof setTimeout> | undefined
    const load = async () => {
      if (cancelled || busy) return
      busy = true
      clearTimeout(retry)
      try {
        const value = await withTimeout(listWorkspaces(api))
        if (!cancelled) setWorkspaces(value)
      } catch {
        if (!cancelled) retry = setTimeout(() => void load(), 3000)
      } finally {
        busy = false
      }
    }
    void load()
    window.addEventListener('focus', load)
    return () => {
      cancelled = true
      clearTimeout(retry)
      window.removeEventListener('focus', load)
    }
  }, [api, workspaceReload])

  const tab = activeTab ?? (preferences.startOn === 'last' ? preferences.lastTab : preferences.startOn)
  const enabled = workspaces?.filter(w => w.companion) ?? []
  const current = enabled.find(w => w.id === preferences.workspaceId) ?? enabled[0]
  // Deep links can target a note in another folder without replacing the user's usual folder.
  const workspace = tab === 'notes' && noteRequest ? enabled.find(w => w.id === noteRequest.workspaceId) ?? current : current
  const folder = workspace ? preferences.folderAppearance[workspace.id] : undefined
  const workspaceId = workspace?.id ?? null
  const appearance = preferences.appearance
  const appStyle = {
    '--qz-accent-override': headingColorCss(preferences.accent),
    '--qz-accent-foreground': accentForeground(preferences.accent),
    '--qz-note-heading-color': headingColorCss(appearance.headingColor),
    '--qz-note-line-color': headingColorCss(appearance.lineColor),
    '--qz-note-text-size': textSize[preferences.noteTextSize],
    '--qz-note-raw-size': textSize[preferences.rawTextSize],
    '--qz-note-line-height': lineHeight[preferences.noteLineHeight],
    '--qz-note-font': preferences.noteFont === 'mono' ? 'var(--mono, ui-monospace, monospace)' : undefined,
  } as CSSProperties

  const selectTab = (next: Tab) => {
    setActiveTab(next)
    if (next !== 'notes') {
      setNoteRequest(null)
      setReturnLocation(null)
    }
    update({ lastTab: next })
  }

  const focusTab = (next: Tab) => tabs.current?.querySelector<HTMLElement>(`#qz-tab-${next}`)?.focus()
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const i = TABS.findIndex(t => t.id === tab)
    const next = e.key === 'Home' ? TABS[0] : e.key === 'End' ? TABS[TABS.length - 1]
      : TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    selectTab(next.id)
    focusTab(next.id)
  }
  const openSettings = (target: SettingsSection) => {
    setSection(target)
    selectTab('settings')
    focusTab('settings')
  }
  const openNote = (note: NoteLocation) => {
    if (tab === 'tasks' || tab === 'todos') setReturnLocation({ tab, workspaceId: preferences.workspaceId })
    setNoteRequest(note)
    selectTab('notes')
    focusTab('notes')
  }
  const goBack = () => {
    if (!returnLocation) return
    update({ workspaceId: returnLocation.workspaceId })
    selectTab(returnLocation.tab)
    focusTab(returnLocation.tab)
  }
  const changeWorkspace = (id: number | null) => {
    setNoteRequest(null)
    update({ workspaceId: id })
  }
  const openFolders = () => openSettings('folders')

  return (
    <div className="qz-app" data-note-heading-lines={appearance.headingLines} style={appStyle}
      data-contrast={preferences.highContrast ? 'high' : undefined} data-motion={preferences.motion}
      data-interface-text={preferences.largerInterfaceText ? 'large' : undefined}
      data-accent={preferences.accent !== 'theme' ? 'custom' : undefined}>
      <style>{styles}</style>
      <style>{companionStyles}</style>
      <header className="qz-header">
        <div className="qz-brand">
          <span className="qz-mark"><Icon name="gem" /></span>
          <h1>Quartizo</h1>
        </div>
        <div className="qz-tabs" ref={tabs} role="tablist" aria-label="Quartizo" onKeyDown={onTabKey}>
          {TABS.map(t => (
            <button key={t.id} id={`qz-tab-${t.id}`} type="button" role="tab"
              aria-selected={tab === t.id} aria-controls="qz-panel" tabIndex={tab === t.id ? 0 : -1}
              onClick={() => selectTab(t.id)}>
              <Icon name={t.icon} />
              {t.label}
            </button>
          ))}
        </div>
        <label className="qz-workspace qz-inline-field">
          {folder?.color && folder.color !== 'theme' && <span aria-hidden="true" className="qz-folder-dot"
            style={{ backgroundColor: headingColorCss(folder.color) }} />}
          <span>Workspace</span>
          <select className="qz-input" value={workspaceId ?? ''} disabled={!enabled.length || !ready}
            onChange={e => changeWorkspace(Number(e.currentTarget.value))}>
            {!workspace && <option value="">{workspaces === null ? 'Loading folders…' : 'No folders connected'}</option>}
            {enabled.map(w => {
              const emoji = preferences.folderAppearance[w.id]?.emoji
              return <option key={w.id} value={w.id}>{emoji ? `${emoji} ${w.name}` : w.name}</option>
            })}
          </select>
        </label>
      </header>
      <div className="qz-content" id="qz-panel" role="tabpanel" aria-labelledby={`qz-tab-${tab}`}>
        {status === 'unavailable' && <p className="qz-notice qz-preference-notice" role="status">
          Quartizo can’t save preferences. Changes are kept until you close or reload this page.
        </p>}
        {!ready ? <p className="qz-muted" role="status">Loading preferences…</p> : <>
          {/* Inactive views pause polling and keep drafts and in-flight writes mounted. */}
          <div hidden={tab !== 'tasks'}>
            <TasksView api={api} active={tab === 'tasks'} workspaceId={current?.id ?? null} preferences={preferences}
              onPreferencesChange={update} onSettings={openFolders} onBoardSettings={() => openSettings('board')} onOpenNote={openNote} />
          </div>
          <div hidden={tab !== 'todos'}>
            <TodoView api={api} active={tab === 'todos'} workspaceId={current?.id ?? null} preferences={preferences}
              onPreferencesChange={update} onSettings={openFolders} onOpenNote={openNote} />
          </div>
          <div className="qz-notes-tab" hidden={tab !== 'notes'}>
            {returnLocation && <button className="qz-button qz-return" type="button" data-variant="quiet" onClick={goBack}>
              <Icon name="back" />{returnLocation.tab === 'tasks' ? 'Back to board' : 'Back to TODOs'}
            </button>}
            <NotesView api={api} active={tab === 'notes'} workspaceId={workspaceId} request={noteRequest}
              preferences={preferences} onPreferencesChange={update} onSettings={openFolders} />
          </div>
          {tab === 'settings' && <Settings api={api} preferences={preferences} onPreferencesChange={update}
            status={status} section={section} onSectionChange={setSection} workspaceId={workspaceId}
            onWorkspaceChange={changeWorkspace} onWorkspacesChanged={() => setWorkspaceReload(n => n + 1)} />}
        </>}
      </div>
    </div>
  )
}
