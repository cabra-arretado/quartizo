import { useAppApi } from '@kirocrew/app-sdk'
import { PageHeader } from '@kirocrew/app-sdk/ui'
import { type KeyboardEvent, useState } from 'react'
import Chat from './Chat'
import Notes from './Notes'

type Tab = 'notes' | 'chat'
const TABS: { id: Tab; label: string }[] = [
  { id: 'notes', label: 'Notes' },
  { id: 'chat', label: 'Chat' },
]

// Default export is what the host renders (AppHost lazy-imports ui.entry and
// mounts its default export inside its AppApiProvider + QueryClient).
// One manifest page (`ui.pages`), with in-page tabs: no extra routes or nav
// entries to declare, and no new permissions.
export default function Quartizo() {
  const api = useAppApi()
  const [tab, setTab] = useState<Tab>('notes')
  // The chat mounts on first visit and then stays mounted (hidden), so
  // switching tabs neither reopens the slot nor drops a draft.
  const [chatOpened, setChatOpened] = useState(false)

  const select = (t: Tab) => {
    setTab(t)
    if (t === 'chat') setChatOpened(true)
  }
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const i = TABS.findIndex(t => t.id === tab)
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    select(next.id)
    document.getElementById(`qz-tab-${next.id}`)?.focus()
  }

  return (
    <>
      <PageHeader title="Quartizo" subtitle="Markdown workspace" />
      <div className="px-6 pb-8 flex-1 min-h-0 flex flex-col gap-3">
        <div role="tablist" aria-label="Quartizo" onKeyDown={onTabKey} style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              id={`qz-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`qz-panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => select(t.id)}
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
        <div
          id="qz-panel-notes"
          role="tabpanel"
          aria-labelledby="qz-tab-notes"
          hidden={tab !== 'notes'}
          // `hidden` alone loses to a display utility class, so set display here.
          style={{ display: tab === 'notes' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <Notes api={api} />
        </div>
        <div
          id="qz-panel-chat"
          role="tabpanel"
          aria-labelledby="qz-tab-chat"
          hidden={tab !== 'chat'}
          // `hidden` alone loses to a display utility class, so set display here.
          style={{ display: tab === 'chat' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          {chatOpened && <Chat api={api} />}
        </div>
      </div>
    </>
  )
}
