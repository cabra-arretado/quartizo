import { useAppApi } from '@kirocrew/app-sdk'
import { type KeyboardEvent, useRef, useState } from 'react'
import { TasksView, TodoView } from './Companion'
import Settings from './Settings'
import { Icon, type IconName } from './ui'
import styles from './quartizo.css?inline'

type Tab = 'tasks' | 'todos' | 'settings'
const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'tasks', label: 'Tasks', icon: 'board' },
  { id: 'todos', label: 'TODOs', icon: 'checklist' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

// Default export is what the host renders (AppHost lazy-imports ui.entry and
// mounts its default export inside its AppApiProvider + QueryClient).
// One manifest page (`ui.pages`), with in-page tabs: no extra routes or nav
// entries to declare, and no new permissions.
export default function Quartizo() {
  const api = useAppApi()
  const [tab, setTab] = useState<Tab>('tasks')
  const tabs = useRef<HTMLDivElement>(null)
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
    e.preventDefault()
    const i = TABS.findIndex(t => t.id === tab)
    const next = e.key === 'Home' ? TABS[0] : e.key === 'End' ? TABS[TABS.length - 1]
      : TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    setTab(next.id)
    e.currentTarget.querySelector<HTMLElement>(`#qz-tab-${next.id}`)?.focus()
  }
  const openSettings = () => {
    setTab('settings')
    tabs.current?.querySelector<HTMLElement>('#qz-tab-settings')?.focus()
  }

  return (
    <div className="qz-app">
      {/* The host loads a single ES module through the manifest. */}
      <style>{styles}</style>
      <header className="qz-header">
        <div className="qz-brand">
          <span className="qz-mark"><Icon name="gem" /></span>
          <div>
            <h1>Quartizo</h1>
            <p>Kiro Notes companion</p>
          </div>
        </div>
        <div className="qz-tabs" ref={tabs} role="tablist" aria-label="Quartizo" onKeyDown={onTabKey}>
          {TABS.map(t => (
            <button
              key={t.id}
              id={`qz-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls="qz-panel"
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
            >
              <Icon name={t.icon} />
              {t.label}
            </button>
          ))}
        </div>
      </header>
      <div className="qz-content" id="qz-panel" role="tabpanel" aria-labelledby={`qz-tab-${tab}`}>
        {/* Inactive boards pause polling and keep drafts and in-flight writes mounted. */}
        <div hidden={tab !== 'tasks'}>
          <TasksView api={api} active={tab === 'tasks'} onSettings={openSettings} />
        </div>
        {tab === 'todos' && <TodoView api={api} onSettings={openSettings} />}
        {tab === 'settings' && <Settings api={api} />}
      </div>
    </div>
  )
}
