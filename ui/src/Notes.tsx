import type { AppApi } from '@kirocrew/app-sdk'
import { Btn } from '@kirocrew/app-sdk/ui'
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  acceptOverwrite,
  canEdit,
  conflicted,
  contentToSave,
  dismissConflict,
  editText,
  type EditorDoc,
  isDirty,
  openDoc,
  saved,
} from './editorDoc'
import { nextIndex } from './listNav'
import { renderMarkdown } from './markdown'
import {
  type ApiFailure,
  createNote,
  deleteNote,
  dirname,
  listNotes,
  listWorkspaces,
  type NoteList,
  normalizeNotePath,
  readNote,
  registerWorkspace,
  renameNote,
  saveNote,
  toFailure,
  unregisterWorkspace,
  type Workspace,
} from './notesApi'

const WS_KEY = 'quartizo:workspace'
type ViewMode = 'edit' | 'split' | 'preview'
type Load<T> = { status: 'loading' } | { status: 'ready'; value: T } | { status: 'error'; failure: ApiFailure }

const S = {
  layout: { display: 'grid', gridTemplateColumns: 'minmax(220px, 300px) 1fr', gap: 12, minHeight: 0, flex: 1 },
  column: { display: 'flex', flexDirection: 'column' as const, gap: 8, minHeight: 0, minWidth: 0 },
  row: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const },
  input: { flex: 1, minWidth: 0, padding: '4px 6px', border: '1px solid rgba(128,128,128,.4)', borderRadius: 4, background: 'transparent', color: 'inherit' },
  list: { listStyle: 'none', margin: 0, padding: 0, overflowY: 'auto' as const, flex: 1, border: '1px solid rgba(128,128,128,.25)', borderRadius: 4 },
  item: { padding: '4px 8px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  textarea: { flex: 1, minHeight: 300, width: '100%', resize: 'none' as const, fontFamily: 'ui-monospace, monospace', fontSize: 13, padding: 8, border: '1px solid rgba(128,128,128,.4)', borderRadius: 4, background: 'transparent', color: 'inherit', tabSize: 4 },
  preview: { flex: 1, minHeight: 300, overflowY: 'auto' as const, padding: '4px 12px', border: '1px solid rgba(128,128,128,.25)', borderRadius: 4 },
  notice: { padding: 8, borderRadius: 4, border: '1px solid rgba(220,120,0,.6)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
}

function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function loadWsId(): number | null {
  try {
    const v = Number(storage()?.getItem(WS_KEY))
    return Number.isInteger(v) && v > 0 ? v : null
  } catch {
    return null
  }
}

function saveWsId(id: number | null): void {
  try {
    if (id) storage()?.setItem(WS_KEY, String(id))
    else storage()?.removeItem(WS_KEY)
  } catch {
    /* not remembered */
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

export default function Notes({ api }: { api: AppApi }) {
  const [workspaces, setWorkspaces] = useState<Load<Workspace[]>>({ status: 'loading' })
  const [wsId, setWsId] = useState<number | null>(loadWsId)
  const [reloadWs, setReloadWs] = useState(0)
  // Set by the open workspace view; checked before switching workspaces.
  const dirtyRef = useRef(false)
  const confirmLeave = () => !dirtyRef.current || window.confirm('Discard unsaved changes to the open note?')

  useEffect(() => {
    let cancelled = false
    listWorkspaces(api)
      .then(value => {
        if (cancelled) return
        setWorkspaces({ status: 'ready', value })
        setWsId(cur => (cur && value.some(w => w.id === cur) ? cur : (value[0]?.id ?? null)))
      })
      .catch(err => !cancelled && setWorkspaces({ status: 'error', failure: toFailure(err) }))
    return () => {
      cancelled = true
    }
  }, [api, reloadWs])

  useEffect(() => saveWsId(wsId), [wsId])

  const list = workspaces.status === 'ready' ? workspaces.value : []
  const current = list.find(w => w.id === wsId) ?? null

  return (
    <div style={S.column}>
      <WorkspaceBar
        api={api}
        load={workspaces}
        current={current}
        onSelect={id => confirmLeave() && setWsId(id)}
        onChanged={id => {
          if (id !== undefined) setWsId(id)
          setReloadWs(n => n + 1)
        }}
      />
      {current ? (
        <WorkspaceView key={current.id} api={api} workspace={current} dirtyRef={dirtyRef} />
      ) : (
        workspaces.status === 'ready' && (
          <p className="text-sm text-muted">
            No workspace yet. Register a folder of Markdown files (for example an Obsidian vault) to start.
          </p>
        )
      )}
    </div>
  )
}

function WorkspaceBar(props: {
  api: AppApi
  load: Load<Workspace[]>
  current: Workspace | null
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
      const ws = await registerWorkspace(api, path.trim(), name.trim() || undefined)
      setAdding(false)
      setPath('')
      setName('')
      props.onChanged(ws.id)
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
      await unregisterWorkspace(api, current.id)
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
        <label className="text-sm" htmlFor="qz-ws">
          Workspace
        </label>
        {load.status === 'loading' && <span className="text-sm text-muted">Loading…</span>}
        {list.length > 0 && (
          <select
            id="qz-ws"
            value={current?.id ?? ''}
            onChange={e => props.onSelect(Number(e.target.value))}
            style={{ ...S.input, flex: '0 1 280px' }}
          >
            {list.map(w => (
              <option key={w.id} value={w.id}>
                {w.name}
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
          {adding ? 'Cancel' : 'Add workspace'}
        </Btn>
        {current && !confirmRemove && (
          <Btn onClick={() => setConfirmRemove(true)} disabled={busy}>
            Remove…
          </Btn>
        )}
      </div>
      {confirmRemove && current && (
        <div role="alertdialog" aria-label="Remove workspace" style={S.notice}>
          <span className="text-sm">
            Stop showing “{current.name}” in Quartizo? The folder and its files are not touched.
          </span>
          <div style={S.row}>
            <Btn onClick={remove} disabled={busy}>
              Remove workspace
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
            aria-label="Absolute folder path"
            placeholder="/home/you/notes"
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

function WorkspaceView(props: { api: AppApi; workspace: Workspace; dirtyRef: { current: boolean } }) {
  const { api, workspace, dirtyRef } = props
  const wsId = workspace.id
  const [q, setQ] = useState('')
  const [searchContent, setSearchContent] = useState(false)
  const [notes, setNotes] = useState<Load<NoteList>>({ status: 'loading' })
  const [refresh, setRefresh] = useState(0)
  const [active, setActive] = useState(-1)
  const [doc, setDoc] = useState<EditorDoc | null>(null)
  const [docLoad, setDocLoad] = useState<{ path: string; failure?: ApiFailure } | null>(null)
  const [newName, setNewName] = useState<string | null>(null)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const openSeq = useRef(0)
  const dirty = doc !== null && isDirty(doc)

  useEffect(() => {
    dirtyRef.current = dirty
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, dirtyRef])
  useEffect(() => () => void (dirtyRef.current = false), [dirtyRef])

  useEffect(() => setActive(-1), [q, searchContent])

  useEffect(() => {
    let cancelled = false
    const t = setTimeout(
      () => {
        setNotes(n => (n.status === 'ready' ? n : { status: 'loading' }))
        listNotes(api, wsId, q, searchContent)
          .then(value => !cancelled && setNotes({ status: 'ready', value }))
          .catch(err => !cancelled && setNotes({ status: 'error', failure: toFailure(err) }))
      },
      q ? 250 : 0,
    )
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [api, wsId, q, searchContent, refresh])

  const files = notes.status === 'ready' ? notes.value.files : []
  const reloadList = useCallback(() => setRefresh(n => n + 1), [])

  const confirmDiscard = useCallback(
    () => !doc || !isDirty(doc) || window.confirm(`Discard unsaved changes to ${doc.path}?`),
    [doc],
  )

  const open = useCallback(
    async (path: string, opts: { force?: boolean } = {}) => {
      if (!opts.force && !confirmDiscard()) return
      const seq = ++openSeq.current // only the latest open may land
      setDocLoad({ path })
      setFailure(null)
      try {
        const note = await readNote(api, wsId, path)
        if (seq !== openSeq.current) return
        setDoc(openDoc(note))
        setDocLoad(null)
      } catch (err) {
        if (seq !== openSeq.current) return
        setDoc(null)
        setDocLoad({ path, failure: toFailure(err) })
      }
    },
    [api, wsId, confirmDiscard],
  )

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'Enter' && active >= 0 && files[active]) {
      e.preventDefault()
      void open(files[active].path)
      return
    }
    const next = nextIndex(active, e.key, files.length)
    if (next === null) return
    e.preventDefault()
    setActive(next)
    listRef.current?.querySelectorAll<HTMLElement>('[role="option"]')[next]?.scrollIntoView({ block: 'nearest' })
  }

  const create = async () => {
    const parsed = normalizeNotePath(newName ?? '')
    if ('error' in parsed) {
      setFailure({ message: parsed.error })
      return
    }
    if (!confirmDiscard()) return
    try {
      await createNote(api, wsId, parsed.path, '')
      setNewName(null)
      reloadList()
      await open(parsed.path, { force: true })
    } catch (err) {
      setFailure(toFailure(err))
    }
  }

  const openPath = doc?.path ?? docLoad?.path

  return (
    <div style={S.layout}>
      <div style={S.column}>
        <input
          type="search"
          aria-label="Search notes"
          placeholder="Search notes…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive(0)
              listRef.current?.focus()
            }
          }}
          style={{ ...S.input, flex: '0 0 auto' }}
        />
        <div style={S.row}>
          <label className="text-sm">
            <input type="checkbox" checked={searchContent} onChange={e => setSearchContent(e.target.checked)} />{' '}
            Search contents
          </label>
          <Btn onClick={reloadList}>Refresh</Btn>
          <Btn onClick={() => setNewName(n => (n === null ? '' : null))}>{newName === null ? 'New note' : 'Cancel'}</Btn>
        </div>
        {newName !== null && (
          <div style={S.row}>
            <input
              aria-label="New note path"
              placeholder="folder/name.md"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Escape') setNewName(null)
                if (e.key === 'Enter') void create()
              }}
              style={S.input}
              autoFocus
            />
            <Btn onClick={create}>Create</Btn>
          </div>
        )}
        <ErrorLine failure={failure} />
        {notes.status === 'loading' && <p className="text-sm text-muted">Loading notes…</p>}
        {notes.status === 'error' && <ErrorLine failure={notes.failure} />}
        {notes.status === 'ready' && files.length === 0 && (
          <p className="text-sm text-muted">{q ? 'No notes match.' : 'No .md files in this workspace yet.'}</p>
        )}
        {files.length > 0 && (
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Notes"
            tabIndex={0}
            onKeyDown={onListKey}
            aria-activedescendant={active >= 0 ? `qz-note-${active}` : undefined}
            style={S.list}
          >
            {files.map((f, i) => (
              <li
                key={f.path}
                id={`qz-note-${i}`}
                role="option"
                aria-selected={f.path === openPath}
                onClick={() => {
                  setActive(i)
                  void open(f.path)
                }}
                title={f.path}
                style={{
                  ...S.item,
                  outline: i === active ? '1px solid rgba(80,140,255,.8)' : undefined,
                  background: f.path === openPath ? 'rgba(80,140,255,.15)' : undefined,
                }}
              >
                <span>{f.path.slice(dirname(f.path).length ? dirname(f.path).length + 1 : 0)}</span>
                {dirname(f.path) && <span className="text-sm text-muted"> — {dirname(f.path)}</span>}
                {f.snippet && (
                  <div className="text-sm text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.snippet}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {notes.status === 'ready' && notes.value.truncated && (
          <p className="text-sm text-muted">Showing a partial list (limits reached). Narrow the search.</p>
        )}
      </div>
      <div style={S.column}>
        {doc ? (
          <NoteEditor
            key={doc.path}
            api={api}
            wsId={wsId}
            doc={doc}
            setDoc={setDoc}
            onReload={() => void open(doc.path, { force: true })}
            onMoved={path => {
              reloadList()
              if (path) void open(path, { force: true })
              else setDoc(null)
            }}
            onSaved={reloadList}
          />
        ) : docLoad ? (
          docLoad.failure ? (
            <ErrorLine failure={docLoad.failure} />
          ) : (
            <p className="text-sm text-muted">Opening {docLoad.path}…</p>
          )
        ) : (
          <p className="text-sm text-muted">Select a note, or create one. Use ↑/↓ and Enter in the list.</p>
        )}
      </div>
    </div>
  )
}

function NoteEditor(props: {
  api: AppApi
  wsId: number
  doc: EditorDoc
  setDoc: (fn: (d: EditorDoc | null) => EditorDoc | null) => void
  onReload: () => void
  onMoved: (newPath: string | null) => void
  onSaved: () => void
}) {
  const { api, wsId, doc, setDoc } = props
  const [mode, setMode] = useState<ViewMode>('split')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [renameTo, setRenameTo] = useState<string | null>(null)
  const [renameExists, setRenameExists] = useState(false)
  const dirty = isDirty(doc)
  const editable = canEdit(doc)
  const html = useMemo(() => (mode === 'edit' ? '' : renderMarkdown(doc.text)), [doc.text, mode])

  const save = async () => {
    if (busy || !editable || doc.conflict) return
    const content = contentToSave(doc)
    setBusy(true)
    setFailure(null)
    try {
      const meta =
        doc.hash === null
          ? await createNote(api, wsId, doc.path, content)
          : await saveNote(api, wsId, doc.path, content, doc.hash)
      setDoc(d => (d && d.path === doc.path ? saved(d, content, meta) : d))
      props.onSaved()
    } catch (err) {
      const f = toFailure(err)
      if (f.code === 'conflict') setDoc(d => (d ? conflicted(d, f.currentHash ?? null) : d))
      else setFailure(f)
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setFailure(null)
    try {
      await deleteNote(api, wsId, doc.path, doc.hash ?? undefined)
      setConfirmDelete(false)
      props.onMoved(null)
    } catch (err) {
      const f = toFailure(err)
      setConfirmDelete(false)
      if (f.code === 'conflict') setDoc(d => (d ? conflicted(d, f.currentHash ?? null) : d))
      else setFailure(f)
    } finally {
      setBusy(false)
    }
  }

  const rename = async (overwrite: boolean) => {
    const parsed = normalizeNotePath(renameTo ?? '')
    if ('error' in parsed) {
      setFailure({ message: parsed.error })
      return
    }
    if (dirty) {
      setFailure({ message: 'Save or discard your changes before renaming.' })
      return
    }
    setBusy(true)
    setFailure(null)
    try {
      const res = await renameNote(api, wsId, doc.path, parsed.path, { expectedHash: doc.hash ?? undefined, overwrite })
      setRenameTo(null)
      setRenameExists(false)
      props.onMoved(res.path)
    } catch (err) {
      const f = toFailure(err)
      if (f.code === 'exists' && !overwrite) setRenameExists(true)
      else if (f.code === 'conflict') setDoc(d => (d ? conflicted(d, f.currentHash ?? null) : d))
      else setFailure(f)
    } finally {
      setBusy(false)
    }
  }

  const onEditorKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault()
      void save()
    }
  }

  return (
    <>
      <div style={S.row}>
        <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.path}>
          {doc.path}
        </strong>
        <span className="text-sm text-muted" aria-live="polite">
          {busy ? 'Working…' : doc.conflict ? 'Conflict' : dirty ? 'Unsaved changes' : 'Saved'}
        </span>
        <span style={{ flex: 1 }} />
        <div role="group" aria-label="View" style={S.row}>
          {(['edit', 'split', 'preview'] as const).map(m => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              style={{ fontWeight: mode === m ? 600 : 400, background: 'transparent', color: 'inherit', border: 'none', cursor: 'pointer' }}
            >
              {m === 'edit' ? 'Edit' : m === 'split' ? 'Split' : 'Preview'}
            </button>
          ))}
        </div>
        <Btn onClick={save} disabled={busy || !dirty || !editable || !!doc.conflict}>
          Save
        </Btn>
        <Btn onClick={() => setRenameTo(r => (r === null ? doc.path : null))} disabled={busy}>
          Rename
        </Btn>
        <Btn onClick={() => setConfirmDelete(true)} disabled={busy || confirmDelete}>
          Delete…
        </Btn>
      </div>

      {!editable && (
        <p className="text-sm text-muted">
          This note mixes line-ending styles. Editing would normalize them, so it is read-only in Quartizo.
        </p>
      )}

      {doc.conflict && (
        <div role="alert" style={S.notice}>
          <span className="text-sm">
            {doc.conflict.currentHash === null
              ? 'This note was deleted on disk since you opened it.'
              : 'This note changed on disk since you opened it. Your changes were not saved.'}
          </span>
          <div style={S.row}>
            <Btn onClick={props.onReload} disabled={busy}>
              Reload from disk (discard mine)
            </Btn>
            <Btn onClick={() => setDoc(d => (d ? dismissConflict(d) : d))} disabled={busy}>
              Keep editing
            </Btn>
            <Btn onClick={() => setDoc(d => (d ? acceptOverwrite(d) : d))} disabled={busy}>
              {doc.conflict.currentHash === null ? 'Re-create with my version…' : 'Overwrite with my version…'}
            </Btn>
          </div>
          <span className="text-sm text-muted">
            “Keep editing” leaves the file alone; saving will warn again. The last button only arms the next Save.
          </span>
        </div>
      )}

      {confirmDelete && (
        <div role="alertdialog" aria-label="Delete note" style={S.notice}>
          <span className="text-sm">
            Move <strong>{doc.path}</strong> to the workspace’s <code>.trash</code> folder?
            {dirty && ' Your unsaved changes will be lost.'}
          </span>
          <div style={S.row}>
            <Btn onClick={remove} disabled={busy}>
              Move to trash
            </Btn>
            <Btn onClick={() => setConfirmDelete(false)} disabled={busy}>
              Cancel
            </Btn>
          </div>
        </div>
      )}

      {renameTo !== null && (
        <div style={S.row}>
          <input
            aria-label="New path"
            value={renameTo}
            onChange={e => {
              setRenameTo(e.target.value)
              setRenameExists(false)
            }}
            onKeyDown={e => {
              if (e.key === 'Escape') setRenameTo(null)
              if (e.key === 'Enter' && !renameExists) void rename(false)
            }}
            style={S.input}
            autoFocus
          />
          {renameExists ? (
            <>
              <span className="text-sm text-danger">A note with that name exists.</span>
              <Btn onClick={() => void rename(true)} disabled={busy}>
                Replace it (old one to .trash)
              </Btn>
            </>
          ) : (
            <Btn onClick={() => void rename(false)} disabled={busy}>
              Rename
            </Btn>
          )}
        </div>
      )}

      <ErrorLine failure={failure} />

      <div style={{ ...S.row, flex: 1, alignItems: 'stretch', flexWrap: 'nowrap', minHeight: 0 }}>
        {mode !== 'preview' && (
          <textarea
            aria-label={`Edit ${doc.path}`}
            value={doc.text}
            readOnly={!editable}
            spellCheck
            onChange={e => {
              const text = e.target.value
              setDoc(d => (d ? editText(d, text) : d))
            }}
            onKeyDown={onEditorKey}
            style={S.textarea}
          />
        )}
        {mode !== 'edit' && (
          // Sanitized: markdown-it with html disabled and a URL allowlist (src/markdown.ts).
          <div className="qz-preview" aria-label="Preview" style={S.preview} dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
    </>
  )
}
