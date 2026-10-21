import { useAppApi } from '@kirocrew/app-sdk'
import { PageHeader } from '@kirocrew/app-sdk/ui'
import { type KeyboardEvent, useState } from 'react'
import { TasksView, TodoView } from './Companion'
import Settings from './Settings'

type Tab = 'tasks' | 'todos' | 'settings'
const TABS: { id: Tab; label: string }[] = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'todos', label: 'TODOs' },
  { id: 'settings', label: 'Settings' },
]

// Default export is what the host renders (AppHost lazy-imports ui.entry and
// mounts its default export inside its AppApiProvider + QueryClient).
// One manifest page (`ui.pages`), with in-page tabs: no extra routes or nav
// entries to declare, and no new permissions.
export default function Quartizo() {
  const api = useAppApi()
  const [tab, setTab] = useState<Tab>('tasks')
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const i = TABS.findIndex(t => t.id === tab)
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    setTab(next.id)
    document.getElementById(`qz-tab-${next.id}`)?.focus()
  }

  return (
    <>
      <PageHeader title="Quartizo" subtitle="Kiro Notes board and TODOs" />
      <div className="px-6 pb-8 flex-1 min-h-0 flex flex-col gap-3">
        <div role="tablist" aria-label="Quartizo" onKeyDown={onTabKey} style={{ display: 'flex', gap: 4 }}>
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
              style={{
                padding: '4px 12px',
                background: 'transparent',
                color: 'inherit',
                border: 'none',
                borderBottom: tab === t.id ? '2px solid currentColor' : '2px solid transparent',
                fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* One view at a time: each re-reads its data when shown, so Settings changes show up right away. */}
        <div
          id="qz-panel"
          role="tabpanel"
          aria-labelledby={`qz-tab-${tab}`}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          {tab === 'tasks' && <TasksView api={api} active />}
          {tab === 'todos' && <TodoView api={api} active />}
          {tab === 'settings' && <Settings api={api} active />}
        </div>
      </div>
    </>
  )
}
