import type { AppApi } from '@kirocrew/app-sdk'
import { Btn } from '@kirocrew/app-sdk/ui'
import { type CSSProperties, type KeyboardEvent, type RefObject, type UIEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { storage } from './Chat'
import { type DiffLine, diffStats, type LineKind, parseDiff, visibleRange } from './diffView'
import {
  describeHead,
  type DiffMode,
  fileDiff,
  type FileDiff,
  listRepos,
  registerRepo,
  removeRepo,
  type Repo,
  repoStatus,
  type RepoStatus,
} from './gitApi'
import { diffModes, entryBadge, entryKey, listKey, MODE_LABELS, pickMode, reselect } from './gitList'
import { type ApiFailure, toFailure } from './notesApi'

const REPO_KEY = 'quartizo:repo'
const LINE_HEIGHT = 18
type Load<T> = { status: 'loading' } | { status: 'ready'; value: T } | { status: 'error'; failure: ApiFailure }

const S = {
  column: { display: 'flex', flexDirection: 'column' as const, gap: 8, minHeight: 0, minWidth: 0 },
  row: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const },
  input: { flex: 1, minWidth: 0, padding: '4px 6px', border: '1px solid rgba(128,128,128,.4)', borderRadius: 4, background: 'transparent', color: 'inherit' },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(220px, 320px) minmax(0, 1fr)', gap: 12, minHeight: 0, flex: 1 },
  list: { listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto' as const, flex: 1, border: '1px solid rgba(128,128,128,.25)', borderRadius: 4 },
  item: { padding: '3px 8px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, display: 'flex', gap: 6 },
  badge: { fontFamily: 'ui-monospace, monospace', width: '1.2em', flex: '0 0 auto', textAlign: 'center' as const },
  notice: { padding: 8, borderRadius: 4, border: '1px solid rgba(220,120,0,.6)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  viewer: { flex: 1, minHeight: 300, overflow: 'auto', position: 'relative' as const, border: '1px solid rgba(128,128,128,.25)', borderRadius: 4, fontFamily: 'ui-monospace, monospace', fontSize: 12 },
  line: { height: LINE_HEIGHT, lineHeight: `${LINE_HEIGHT}px`, whiteSpace: 'pre' as const, display: 'flex' },
  lineNo: { flex: '0 0 auto', width: '4.5em', textAlign: 'right' as const, paddingRight: 6, opacity: 0.55, userSelect: 'none' as const },
  toggle: (on: boolean) => ({ padding: '2px 10px', background: on ? 'rgba(80,140,255,.2)' : 'transparent', color: 'inherit', border: '1px solid rgba(128,128,128,.4)', borderRadius: 4, cursor: 'pointer' }),
}

const LINE_STYLE: Record<LineKind, CSSProperties> = {
  file: { fontWeight: 600, background: 'rgba(128,128,128,.15)' },
  meta: { color: 'rgba(128,128,128,1)' },
  binary: { color: 'rgba(220,120,0,1)' },
  hunk: { color: 'rgba(80,140,255,1)', background: 'rgba(80,140,255,.08)' },
  add: { background: 'rgba(40,170,80,.18)' },
  del: { background: 'rgba(220,60,60,.18)' },
  context: {},
  note: { color: 'rgba(128,128,128,1)', fontStyle: 'italic' },
}

function loadRepoId(): number | null {
  try {
    const raw = storage()?.getItem(REPO_KEY)
    return raw && /^[0-9]{1,12}$/.test(raw) ? Number(raw) : null
  } catch {
    return null
  }
}

function saveRepoId(id: number | null): void {
  try {
    if (id === null) storage()?.removeItem(REPO_KEY)
    else storage()?.setItem(REPO_KEY, String(id))
  } catch {
    /* per-viewer convenience only */
  }
}

function ErrorLine({ failure }: { failure: ApiFailure | null }) {
  if (!failure) return null
  return (
    <div role="alert" className="text-sm text-danger" data-code={failure.code}>
      {failure.message}
    </div>
  )
}

/**
 * The Git tab (QTZ-010/011): pick or register a repository, see its changed
 * files, read one file's diff. Read only: nothing here stages, commits or
 * changes anything, and switching repos only changes this tab's own view.
 */
export default function Git(props: { api: AppApi; active: boolean }) {
  const { api } = props
  const [repos, setRepos] = useState<Load<Repo[]>>({ status: 'loading' })
  const [repoId, setRepoId] = useState<number | null>(loadRepoId)

  const reload = useCallback(
    async (selectId?: number | null) => {
      try {
        const list = await listRepos(api)
        setRepos({ status: 'ready', value: list })
        setRepoId(cur => {
          const want = selectId !== undefined ? selectId : cur
          const next = list.find(r => r.id === want)?.id ?? list[0]?.id ?? null
          saveRepoId(next)
          return next
        })
      } catch (err) {
        setRepos({ status: 'error', failure: toFailure(err) })
      }
    },
    [api],
  )
  useEffect(() => {
    void reload()
  }, [reload])

  const list = repos.status === 'ready' ? repos.value : []
  const current = list.find(r => r.id === repoId) ?? null
  const select = (id: number) => {
    setRepoId(id)
    saveRepoId(id)
  }

  return (
    <div style={{ ...S.column, flex: 1 }}>
      <RepoBar api={api} load={repos} current={current} onSelect={select} onChanged={id => void reload(id)} />
      {current ? (
        // Keyed by uid: a different repo starts from a clean view (selection, mode, diff).
        <RepoView key={current.uid} api={api} repo={current} active={props.active} />
      ) : (
        repos.status === 'ready' && (
          <p className="text-sm text-muted">
            Register a Git repository (the folder that contains <code>.git</code>) to see its changes. Read only:
            Quartizo never stages, commits or changes files here.
          </p>
        )
      )}
    </div>
  )
}

function RepoBar(props: {
  api: AppApi
  load: Load<Repo[]>
  current: Repo | null
  onSelect: (id: number) => void
  onChanged: (selectId?: number | null) => void
}) {
  const { api, load, current } = props
  const [adding, setAdding] = useState(false)
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const list = load.status === 'ready' ? load.value : []

  const register = async () => {
    setBusy(true)
    setFailure(null)
    try {
      const repo = await registerRepo(api, path.trim(), name.trim() || undefined)
      setAdding(false)
      setPath('')
      setName('')
      props.onChanged(repo.id)
    } catch (err) {
      setFailure(toFailure(err))
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    if (!current) return
    setBusy(true)
    setFailure(null)
    try {
      await removeRepo(api, current.id)
      setConfirmRemove(false)
      props.onChanged(null)
    } catch (err) {
      setFailure(toFailure(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={S.column}>
      <div style={S.row}>
        <label className="text-sm" htmlFor="qz-repo">
          Repository
        </label>
        {load.status === 'loading' && <span className="text-sm text-muted">Loading…</span>}
        {list.length > 0 && (
          <select
            id="qz-repo"
            value={current?.id ?? ''}
            onChange={e => {
              setConfirmRemove(false)
              props.onSelect(Number(e.target.value))
            }}
            style={{ ...S.input, flex: '0 1 280px' }}
          >
            {list.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
        {current && (
          <span className="text-sm text-muted" title={current.path}>
            {current.path}
          </span>
        )}
        <Btn onClick={() => setAdding(a => !a)} disabled={busy}>
          {adding ? 'Cancel' : 'Add repository'}
        </Btn>
        {current && !confirmRemove && (
          <Btn onClick={() => setConfirmRemove(true)} disabled={busy}>
            Remove…
          </Btn>
        )}
      </div>
      {confirmRemove && current && (
        <div role="alertdialog" aria-label="Remove repository" style={S.notice}>
          <span className="text-sm">
            Stop showing “{current.name}” in Quartizo? The repository and its files are not touched.
          </span>
          <div style={S.row}>
            <Btn onClick={() => void remove()} disabled={busy}>
              Remove repository
            </Btn>
            <Btn onClick={() => setConfirmRemove(false)} disabled={busy}>
              Cancel
            </Btn>
          </div>
        </div>
      )}
      {adding && (
        <div style={S.row}>
          <input
            aria-label="Absolute repository path"
            placeholder="/home/you/project (its top-level folder)"
            value={path}
            onChange={e => setPath(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && path.trim() && void register()}
            style={S.input}
            autoFocus
          />
          <input
            aria-label="Display name (optional)"
            placeholder="Name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ ...S.input, flex: '0 1 160px' }}
          />
          <Btn onClick={register} disabled={busy || !path.trim()}>
            Register
          </Btn>
        </div>
      )}
      {load.status === 'error' && <ErrorLine failure={load.failure} />}
      <ErrorLine failure={failure} />
    </div>
  )
}

function RepoView(props: { api: AppApi; repo: Repo; active: boolean }) {
  const { api, repo } = props
  const [status, setStatus] = useState<Load<RepoStatus>>({ status: 'loading' })
  const [active, setActive] = useState(-1)
  const [mode, setMode] = useState<DiffMode>('worktree')
  const [diff, setDiff] = useState<Load<FileDiff> | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const viewerRef = useRef<HTMLDivElement>(null)
  const statusSeq = useRef(0)
  const diffSeq = useRef(0)
  const selectedKey = useRef<string | null>(null)
  const entries = status.status === 'ready' ? status.value.entries : []
  const entry = active >= 0 ? entries[active] : undefined
  const shownMode = entry ? pickMode(entry, mode) : null

  const refresh = useCallback(async () => {
    const seq = ++statusSeq.current
    try {
      const value = await repoStatus(api, repo.id)
      if (seq !== statusSeq.current) return
      setStatus({ status: 'ready', value })
      setActive(prev => reselect(value.entries, selectedKey.current, prev))
    } catch (err) {
      if (seq === statusSeq.current) setStatus({ status: 'error', failure: toFailure(err) })
    }
  }, [api, repo.id])

  // Load on mount, and again whenever the tab becomes visible (the files may have changed).
  useEffect(() => {
    if (props.active) void refresh()
  }, [props.active, refresh])

  // Load the diff of the selected entry. A newer selection wins (seq).
  useEffect(() => {
    if (!entry || !shownMode) {
      setDiff(null)
      return
    }
    selectedKey.current = entryKey(entry)
    const seq = ++diffSeq.current
    setDiff({ status: 'loading' })
    fileDiff(api, repo.id, entry.path, shownMode, entry.origPath).then(
      value => seq === diffSeq.current && setDiff({ status: 'ready', value }),
      err => seq === diffSeq.current && setDiff({ status: 'error', failure: toFailure(err) }),
    )
    // Refetch when the selected entry (or its letters) or the mode changes, or after a refresh.
  }, [api, repo.id, entry?.path, entry?.origPath, entry?.index, entry?.worktree, shownMode, status]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMode = () => {
    if (!entry) return
    const modes = diffModes(entry)
    if (modes.length < 2) return
    setMode(m => (m === 'worktree' ? 'staged' : 'worktree'))
  }

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const action = listKey(active, e.key, entries.length)
    if (!action) return
    e.preventDefault()
    if (action.type === 'mode') toggleMode()
    else if (action.type === 'open') viewerRef.current?.focus()
    else {
      setActive(action.index)
      listRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[action.index]?.scrollIntoView({ block: 'nearest' })
    }
  }

  const value = status.status === 'ready' ? status.value : null
  return (
    <div style={{ ...S.column, flex: 1 }}>
      <div style={S.row}>
        {value && (
          <span className="text-sm">
            <strong>{describeHead(value.head)}</strong>
            <span className="text-muted">
              {' · '}
              {value.clean
                ? 'clean'
                : [
                    value.counts.staged && `${value.counts.staged} staged`,
                    value.counts.unstaged && `${value.counts.unstaged} unstaged`,
                    value.counts.untracked && `${value.counts.untracked} untracked`,
                    value.counts.conflicted && `${value.counts.conflicted} conflicted`,
                  ]
                    .filter(Boolean)
                    .join(', ')}
            </span>
          </span>
        )}
        <Btn onClick={() => void refresh()}>Refresh</Btn>
      </div>
      {status.status === 'error' && <ErrorLine failure={status.failure} />}
      <div style={S.layout}>
        <div style={S.column}>
          {status.status === 'loading' && <p className="text-sm text-muted">Loading…</p>}
          {value && entries.length === 0 && <p className="text-sm text-muted">No changes.</p>}
          {entries.length > 0 && (
            <ul
              ref={listRef}
              role="listbox"
              aria-label="Changed files (arrows to move, Enter to read the diff, s for staged/unstaged)"
              tabIndex={0}
              onKeyDown={onListKey}
              aria-activedescendant={active >= 0 ? `qz-change-${active}` : undefined}
              style={S.list}
            >
              {entries.map((e, i) => {
                const badge = entryBadge(e)
                return (
                  <li
                    key={entryKey(e)}
                    id={`qz-change-${i}`}
                    role="option"
                    aria-selected={i === active}
                    aria-label={`${e.path}: ${badge.title}`}
                    onClick={() => setActive(i)}
                    title={e.origPath ? `${e.origPath} → ${e.path}` : e.path}
                    style={{ ...S.item, background: i === active ? 'rgba(80,140,255,.15)' : undefined }}
                  >
                    <span style={S.badge} title={badge.title}>
                      {badge.letter}
                    </span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {e.origPath ? `${e.origPath} → ${e.path}` : e.path}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {value?.truncated && <p className="text-sm text-muted">Showing the first {entries.length} changes only.</p>}
        </div>
        <div style={S.column}>
          {entry && (
            <div style={S.row}>
              <span className="text-sm" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {entry.path}
              </span>
              {diffModes(entry).map(m => (
                <button key={m} type="button" aria-pressed={shownMode === m} onClick={() => setMode(m)} style={S.toggle(shownMode === m)}>
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          )}
          {entry && !entry.diffable && (
            <p className="text-sm text-muted">
              {entry.path.endsWith('/')
                ? 'An untracked folder (or a nested repository): its files are not listed.'
                : 'This name cannot be shown as a diff (not UTF-8, or not a path the API accepts).'}
            </p>
          )}
          {diff?.status === 'loading' && <p className="text-sm text-muted">Loading diff…</p>}
          {diff?.status === 'error' && <ErrorLine failure={diff.failure} />}
          {diff?.status === 'ready' && <DiffViewer diff={diff.value} viewerRef={viewerRef} />}
        </div>
      </div>
    </div>
  )
}

function DiffViewer(props: { diff: FileDiff; viewerRef: RefObject<HTMLDivElement> }) {
  const { diff, viewerRef } = props
  const lines = useMemo(() => parseDiff(diff.diff), [diff.diff])
  const stats = useMemo(() => diffStats(lines), [lines])
  const [scrollTop, setScrollTop] = useState(0)
  const [height, setHeight] = useState(600)

  useEffect(() => {
    const el = viewerRef.current
    if (!el) return
    el.scrollTop = 0
    setScrollTop(0)
    setHeight(el.clientHeight || 600)
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setHeight(el.clientHeight || 600))
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewerRef, diff])

  const { start, end } = visibleRange(scrollTop, height, LINE_HEIGHT, lines.length)
  const onScroll = (e: UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop)
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = viewerRef.current
    if (!el) return
    const by = { ArrowDown: LINE_HEIGHT, ArrowUp: -LINE_HEIGHT, PageDown: el.clientHeight - LINE_HEIGHT, PageUp: LINE_HEIGHT - el.clientHeight, ' ': el.clientHeight - LINE_HEIGHT } as Record<string, number>
    if (e.key === 'Home') el.scrollTop = 0
    else if (e.key === 'End') el.scrollTop = el.scrollHeight
    else if (e.key in by) el.scrollTop += by[e.key]
    else return
    e.preventDefault()
  }

  return (
    <>
      <div className="text-sm text-muted" aria-live="polite">
        {diff.binary
          ? 'Binary file: no text diff.'
          : lines.length === 0
            ? 'No differences.'
            : `${diff.untracked ? 'Untracked file. ' : ''}+${stats.added} −${stats.removed}`}
        {diff.truncated && ' · The diff is cut at 512 KiB: open the file elsewhere for the rest.'}
      </div>
      <div
        ref={viewerRef}
        tabIndex={0}
        role="region"
        aria-label={`Diff of ${diff.path}`}
        onScroll={onScroll}
        onKeyDown={onKey}
        style={S.viewer}
      >
        <div style={{ height: lines.length * LINE_HEIGHT, position: 'relative', minWidth: '100%', width: 'max-content' }}>
          <div style={{ position: 'absolute', top: start * LINE_HEIGHT, left: 0, minWidth: '100%' }}>
            {lines.slice(start, end).map((l, i) => (
              <DiffRow key={start + i} line={l} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function DiffRow({ line }: { line: DiffLine }) {
  // Plain text nodes only: the diff is repository content and is never parsed as HTML.
  return (
    <div style={{ ...S.line, ...LINE_STYLE[line.kind] }} data-kind={line.kind}>
      <span style={S.lineNo}>{line.oldNo ?? ''}</span>
      <span style={S.lineNo}>{line.newNo ?? ''}</span>
      <span style={{ paddingRight: 12 }}>{line.text || ' '}</span>
    </div>
  )
}
