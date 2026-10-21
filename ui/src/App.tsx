import { useAppApi } from '@kirocrew/app-sdk'
import { PageHeader } from '@kirocrew/app-sdk/ui'
import { type KeyboardEvent, useCallback, useRef, useState } from 'react'
import Agents, { type AgentsRequest } from './Agents'
import Chat from './Chat'
import { TicketBoard, TodoView } from './Companion'
import Git, { type GitRequest } from './Git'
import Notes, { type NotesRequest, type NotesState } from './Notes'
import type { Workspace } from './notesApi'
import Tasks, { type TaskFocus } from './Tasks'

type Tab = 'notes' | 'tasks' | 'todos' | 'agents' | 'git' | 'chat'
const TABS: { id: Tab; label: string }[] = [
  { id: 'notes', label: 'Notes' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'todos', label: 'TODOs' },
  { id: 'agents', label: 'Agents' },
  { id: 'git', label: 'Git' },
  { id: 'chat', label: 'Chat' },
]
const TAB_LABEL = Object.fromEntries(TABS.map(t => [t.id, t.label])) as Record<Tab, string>

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
  const [tasksOpened, setTasksOpened] = useState(false)
  const [todosOpened, setTodosOpened] = useState(false)
  const [gitOpened, setGitOpened] = useState(false)
  const [agentsOpened, setAgentsOpened] = useState(false)
  // Cross-tab links (task -> session -> subagent -> repo) push the tab they came from, so "Back" returns there.
  // Clicking a tab directly starts over.
  const [trail, setTrail] = useState<Tab[]>([])
  const [agentsRequest, setAgentsRequest] = useState<AgentsRequest | null>(null)
  const [gitRequest, setGitRequest] = useState<GitRequest | null>(null)
  const [taskFocus, setTaskFocus] = useState<TaskFocus | null>(null)
  // Tasks follow the workspace selected in Notes (one project = one workspace).
  const [notesState, setNotesState] = useState<NotesState>({ workspace: null, note: null })
  const [request, setRequest] = useState<NotesRequest | null>(null)
  const notesDirty = useRef(false)
  const confirmLeave = useCallback(
    () => !notesDirty.current || window.confirm('Discard unsaved changes to the open note?'),
    [],
  )

  const show = (t: Tab) => {
    setTab(t)
    if (t === 'chat') setChatOpened(true)
    if (t === 'tasks') setTasksOpened(true)
    if (t === 'todos') setTodosOpened(true)
    if (t === 'git') setGitOpened(true)
    if (t === 'agents') setAgentsOpened(true)
  }
  const select = (t: Tab) => {
    setTrail([])
    show(t)
  }
  /** Follow a cross-tab link, remembering where it came from. */
  const go = (t: Tab) => {
    if (t !== tab) setTrail(tr => [...tr, tab].slice(-8))
    show(t)
  }
  const back = () => {
    const prev = trail[trail.length - 1]
    if (!prev) return
    setTrail(trail.slice(0, -1))
    show(prev)
  }
  const toNotes = (wsId: number, extra: { path?: string; chat?: boolean }) => {
    setRequest(r => ({ seq: (r?.seq ?? 0) + 1, wsId, ...extra }))
    select('notes')
  }
  const showAgents = (slotKey: string) => {
    setAgentsRequest(r => ({ seq: (r?.seq ?? 0) + 1, slotKey }))
    go('agents')
  }
  const openTask = (wsId: number, taskUid: string) => {
    // Notes owns the workspace selection (Tasks follows it): ask it to switch, without leaving this flow.
    if (notesState.workspace?.id !== wsId) setRequest(r => ({ seq: (r?.seq ?? 0) + 1, wsId }))
    setTaskFocus(f => ({ seq: (f?.seq ?? 0) + 1, wsId, taskUid }))
    go('tasks')
  }
  const openRepo = (repoId: number) => {
    setGitRequest(r => ({ seq: (r?.seq ?? 0) + 1, repoId }))
    go('git')
  }
  const workspace: Workspace | null = notesState.workspace
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
        {trail.length > 0 && (
          <div>
            <button
              type="button"
              onClick={back}
              className="text-sm"
              style={{ background: 'transparent', color: 'inherit', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              ← Back to {TAB_LABEL[trail[trail.length - 1]]}
            </button>
          </div>
        )}
        <div
          id="qz-panel-notes"
          role="tabpanel"
          aria-labelledby="qz-tab-notes"
          hidden={tab !== 'notes'}
          // `hidden` alone loses to a display utility class, so set display here.
          style={{ display: tab === 'notes' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          <Notes api={api} dirtyRef={notesDirty} request={request} onState={setNotesState} />
        </div>
        <div
          id="qz-panel-tasks"
          role="tabpanel"
          aria-labelledby="qz-tab-tasks"
          hidden={tab !== 'tasks'}
          style={{ display: tab === 'tasks' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          {/* A Kiro Notes companion workspace gets the read-only board of its ticket notes; others keep the database board. */}
          {tasksOpened && workspace?.companion && (
            <TicketBoard
              key={workspace.id}
              api={api}
              workspace={workspace}
              active={tab === 'tasks'}
              onViewNote={(wsId, path) => toNotes(wsId, { path })}
            />
          )}
          {tasksOpened && !workspace?.companion && (
            <Tasks
              api={api}
              workspace={workspace}
              currentNote={notesState.note}
              active={tab === 'tasks'}
              onOpenNote={(wsId, path) => toNotes(wsId, { path })}
              onShowChat={wsId => toNotes(wsId, { chat: true })}
              onShowAgents={showAgents}
              focus={taskFocus}
              confirmLeave={confirmLeave}
            />
          )}
        </div>
        <div
          id="qz-panel-todos"
          role="tabpanel"
          aria-labelledby="qz-tab-todos"
          hidden={tab !== 'todos'}
          style={{ display: tab === 'todos' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          {/* Checkboxes of every Kiro Notes companion folder, read only; polls only while shown. */}
          {todosOpened && (
            <TodoView
              api={api}
              active={tab === 'todos'}
              onViewNote={(wsId, path) => toNotes(wsId, { path })}
              onShowWorkspace={wsId => {
                if (notesState.workspace?.id !== wsId) setRequest(r => ({ seq: (r?.seq ?? 0) + 1, wsId }))
                go('tasks')
              }}
            />
          )}
        </div>
        <div
          id="qz-panel-agents"
          role="tabpanel"
          aria-labelledby="qz-tab-agents"
          hidden={tab !== 'agents'}
          style={{ display: tab === 'agents' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          {/* Agent monitoring (QTZ-012): read only; polls only while this tab is shown. */}
          {agentsOpened && (
            <Agents
              api={api}
              active={tab === 'agents'}
              request={agentsRequest}
              onOpenTask={openTask}
              onOpenRepo={openRepo}
              confirmLeave={confirmLeave}
            />
          )}
        </div>
        <div
          id="qz-panel-git"
          role="tabpanel"
          aria-labelledby="qz-tab-git"
          hidden={tab !== 'git'}
          style={{ display: tab === 'git' ? 'flex' : 'none', flexDirection: 'column', flex: 1, minHeight: 0 }}
        >
          {/* Read-only Git (QTZ-010/011). Its repo selection is its own: it changes nothing in Notes, Tasks or Chat. */}
          {gitOpened && <Git api={api} active={tab === 'git'} request={gitRequest} />}
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
