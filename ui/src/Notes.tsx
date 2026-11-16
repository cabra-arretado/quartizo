import type { AppApi } from '@kirocrew/app-sdk'
import { SegmentedControl } from '@kirocrew/app-sdk/ui'
import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  type ApiFailure,
  type BacklinksData,
  type CompanionWorkspace,
  type NoteEntry,
  companionStatus,
  createNote,
  indexWarning,
  listBacklinks,
  listNotes,
  readSource,
  saveNote,
  toFailure,
  withTimeout,
} from './companionApi'
import { renderMarkdownBlocks } from './markdown'
import type { NoteLocation } from './noteNav'
import {
  type NoteDocument, type NoteTree, documentContent, makeNoteTree, noteBlockOffsets, openDocument, setNoteTaskChecked,
} from './notesModel'
import { ErrorLine, Icon, storage, usePageVisible } from './ui'
import { makeWikilinkResolver } from './wikilinks'
import styles from './notes.css?inline'

const POLL_MS = 3000
const LIST_PAGE = 500
const EMPTY_NOTES: NoteEntry[] = []
const VIEW_KEY = 'quartizo-notes-view'
const WIDTH_KEY = 'quartizo-notes-full-width'
type NoteView = 'rendered' | 'raw'

function readPreference(key: string): string | null {
  try { return storage()?.getItem(key) ?? null } catch { return null }
}
function writePreference(key: string, value: string) {
  try { storage()?.setItem(key, value) } catch { /* Storage can be unavailable. */ }
}

function noteKey(note: NoteLocation): string {
  return `${note.workspaceId}:${note.path}`
}

/** Poll the index revision, and fetch the catalog only if that revision changed. */
function useCatalog(api: AppApi, active: boolean, workspaceId: number | null) {
  const visible = usePageVisible()
  const [workspaces, setWorkspaces] = useState<CompanionWorkspace[] | null>(null)
  const [catalog, setCatalog] = useState<{ workspaceId: number; notes: NoteEntry[] } | null>(null)
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    if (!active || !visible) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let listedRevision: string | undefined
    let reported: string | undefined
    const load = async () => {
      try {
        const status = await withTimeout(companionStatus(api))
        if (cancelled) return
        const enabled = status.workspaces.filter(item => item.workspace.companion)
        const nextReported = JSON.stringify(enabled)
        if (reported !== nextReported) {
          setWorkspaces(enabled)
          reported = nextReported
        }
        const selected = enabled.find(item => item.workspace.id === workspaceId) ?? enabled[0]
        if (!status.available) throw new Error(status.error ?? 'The Markdown index is unavailable.')
        if (selected) {
          const revision = `${selected.workspace.id}:${selected.index.indexedAt ?? ''}`
          if (revision !== listedRevision) {
            const result = await withTimeout(listNotes(api, selected.workspace.id))
            if (cancelled) return
            setCatalog({ workspaceId: selected.workspace.id, notes: result.notes })
            listedRevision = revision
          }
        } else {
          setCatalog(null)
        }
        setFailure(null)
      } catch (error) {
        if (!cancelled) setFailure(toFailure(error))
      } finally {
        if (!cancelled) timer = setTimeout(load, POLL_MS)
      }
    }
    void load()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [active, api, reload, visible, workspaceId])

  const current = workspaces?.find(item => item.workspace.id === workspaceId) ?? workspaces?.[0]
  return {
    current,
    failure,
    workspaces,
    notes: current && catalog?.workspaceId === current.workspace.id ? catalog.notes : null,
    refresh: () => setReload(value => value + 1),
    visible,
  }
}

export default function NotesView({ api, active, request, onSettings }: {
  api: AppApi
  active: boolean
  request: NoteLocation | null
  onSettings: () => void
}) {
  const [workspaceId, setWorkspaceId] = useState<number | null>(null)
  const [selected, setSelected] = useState<NoteLocation | null>(null)
  const [view, setView] = useState<NoteView>(() => readPreference(VIEW_KEY) === 'raw' ? 'raw' : 'rendered')
  const [fullWidth, setFullWidth] = useState(() => readPreference(WIDTH_KEY) === 'true')
  const [newNoteKey, setNewNoteKey] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Map<string, NoteDocument>>(() => new Map())
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(LIST_PAGE)
  const [adding, setAdding] = useState(false)
  const [path, setPath] = useState('')
  const [createFailure, setCreateFailure] = useState<ApiFailure | null>(null)
  const [creating, setCreating] = useState(false)
  const createPending = useRef(false)
  const { workspaces, current, notes, failure, refresh, visible } = useCatalog(api, active, workspaceId)
  const createField = useRef<HTMLInputElement>(null)
  const query = useDeferredValue(search.trim().toLowerCase())
  const matches = useMemo(() => query
    ? (notes ?? EMPTY_NOTES).filter(note => note.title.toLowerCase().includes(query) || note.path.toLowerCase().includes(query))
    : notes ?? EMPTY_NOTES, [notes, query])
  const tree = useMemo(() => makeNoteTree(matches.slice(0, limit)), [matches, limit])

  useEffect(() => {
    if (!request) return
    setWorkspaceId(request.workspaceId)
    setSelected(request)
    setNewNoteKey(null)
    setSearch('')
    setLimit(LIST_PAGE)
    setAdding(false)
  }, [request])
  useEffect(() => {
    if (adding) createField.current?.focus()
  }, [adding])

  if (!workspaces) return failure
    ? <ErrorLine failure={failure} />
    : <p className="qz-empty" role="status">Loading folders…</p>
  if (!current) return (
    <div className="qz-stack">
      <ErrorLine failure={failure} />
      <div className="qz-empty">
        <span className="qz-empty-icon"><Icon name="folder" /></span>
        <h2>Connect a notes folder</h2>
        <p>Add a folder of Markdown files in Settings to browse and edit your notes.</p>
        <button type="button" className="qz-button" data-variant="primary" onClick={onSettings}>Open Settings</button>
      </div>
    </div>
  )

  const wsId = current.workspace.id
  const location = selected?.workspaceId === wsId ? selected : null
  const key = location ? noteKey(location) : ''
  const openNote = (path: string) => { setNewNoteKey(null); setSelected({ workspaceId: wsId, path }) }
  const writeBlocked = current.index.writeBlocked?.message
  const warning = indexWarning(current.index)
  const changeDraft = (next: NoteDocument | null, expected?: NoteDocument | null) => {
    setDrafts(previous => {
      // A request from an editor that was left must not erase a newer draft.
      if (expected !== undefined && (previous.get(key) ?? null) !== expected) return previous
      const updated = new Map(previous)
      if (next) updated.set(key, next)
      else updated.delete(key)
      return updated
    })
  }

  const create = async () => {
    const newPath = path.trim()
    if (!newPath || createPending.current || writeBlocked) return
    createPending.current = true
    setCreating(true)
    setCreateFailure(null)
    try {
      const result = await withTimeout(createNote(api, wsId, newPath))
      setPath('')
      setAdding(false)
      const created = { workspaceId: wsId, path: result.path }
      setNewNoteKey(noteKey(created))
      setSelected(previous => previous === selected ? created : previous)
      refresh()
    } catch (error) {
      setCreateFailure(toFailure(error))
    } finally {
      createPending.current = false
      setCreating(false)
    }
  }

  return (
    <section className="qz-stack" aria-label="Notes">
      <style>{styles}</style>
      <div className="qz-view-heading">
        <div>
          <h2 className="qz-section-title">Notes</h2>
        </div>
        <div className="qz-actions">
          <label className="qz-inline-field">
            <Icon name="folder" />
            <span>Notes folder</span>
            <select className="qz-input" value={wsId} disabled={creating} onChange={event => {
              setWorkspaceId(Number(event.target.value))
              setSelected(null)
              setSearch('')
              setLimit(LIST_PAGE)
              setAdding(false)
            }}>
              {workspaces.map(({ workspace }) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
            </select>
          </label>
          <button type="button" className="qz-button" data-variant="primary" aria-expanded={adding}
            onClick={() => { setAdding(value => !value); setCreateFailure(null) }}
            disabled={creating || !!writeBlocked}><Icon name="plus" />New note</button>
        </div>
      </div>
      <ErrorLine failure={failure} />
      {warning && <div className="qz-notice" role="note">{warning}</div>}
      {adding && (
        <form className="qz-note-create qz-panel-surface" onSubmit={event => { event.preventDefault(); void create() }}>
          <label className="qz-field">Note path
            <input ref={createField} className="qz-input" value={path} placeholder="projects/launch.md"
              disabled={creating} onChange={event => setPath(event.target.value)} required />
          </label>
          <div className="qz-actions">
            <button type="submit" className="qz-button" data-variant="primary" disabled={!path.trim() || creating || !!writeBlocked}>Create note</button>
            <button type="button" className="qz-button" data-variant="quiet" disabled={creating} onClick={() => setAdding(false)}>Cancel</button>
          </div>
          <ErrorLine failure={createFailure} />
        </form>
      )}
      <div className="qz-notes-layout">
        <aside className="qz-note-browser qz-panel-surface" aria-label="Notes browser">
          <label className="qz-field">
            Search notes
            <input type="search" className="qz-input" value={search} placeholder="Title or path"
              onChange={event => { setSearch(event.target.value); setLimit(LIST_PAGE) }} />
          </label>
          {notes === null && !failure && <p role="status" className="qz-muted">Loading notes…</p>}
          {notes !== null && matches.length === 0 && (
            <p className="qz-muted">{query ? 'No notes match your search.' : current.index.state === 'scanning' ? 'Indexing notes…' : 'No notes in this folder yet.'}</p>
          )}
          {matches.length > 0 && <Tree branch={tree} prefix="" selected={location?.path} query={query}
            onOpen={openNote} />}
          {matches.length > limit && <button type="button" className="qz-button" data-variant="quiet"
            onClick={() => setLimit(value => value + LIST_PAGE)}>Show more notes</button>}
        </aside>
        {location ? <NoteEditor key={key} api={api} active={active} location={location}
          draft={drafts.get(key)} onDraft={changeDraft} onSaved={refresh} writeBlocked={!!writeBlocked}
          notes={notes ?? EMPTY_NOTES} onOpen={openNote} loadBacklinks={active && visible}
          indexRevision={current.index.indexedAt} view={newNoteKey === key ? 'raw' : view}
          focusEditor={newNoteKey === key} fullWidth={fullWidth}
          onViewChange={next => { setNewNoteKey(null); setView(next); writePreference(VIEW_KEY, next) }}
          onWidthChange={() => { setFullWidth(!fullWidth); writePreference(WIDTH_KEY, String(!fullWidth)) }} /> : (
          <div className="qz-empty">
            <span className="qz-empty-icon"><Icon name="note" /></span>
            <h3>Open a note</h3>
            <p>Choose one from the folder tree or create a new note.</p>
          </div>
        )}
      </div>
    </section>
  )
}

function Tree({ branch, prefix, selected, query, onOpen }: {
  branch: NoteTree
  prefix: string
  selected: string | undefined
  query: string
  onOpen: (path: string) => void
}) {
  return (
    <ul className="qz-note-tree">
      {[...branch.folders].map(([name, child]) => {
        const directory = `${prefix}${name}/`
        return <li key={directory}>
          <details open={query || selected?.startsWith(directory) ? true : undefined}>
            <summary><Icon name="folder" />{name}</summary>
            <Tree branch={child} prefix={directory} selected={selected} query={query} onOpen={onOpen} />
          </details>
        </li>
      })}
      {branch.notes.map(note => <li key={note.path}>
        <button type="button" aria-current={note.path === selected ? 'true' : undefined} title={note.path}
          onClick={() => onOpen(note.path)}><Icon name="note" />{note.title}</button>
      </li>)}
    </ul>
  )
}

interface BlockEdit {
  start: number
  from: number
  to: number
  original: string
  sourceHash: string
}

function NoteEditor({ api, active, location, draft, onDraft, onSaved, writeBlocked, notes, onOpen, loadBacklinks, indexRevision, view, focusEditor, fullWidth, onViewChange, onWidthChange }: {
  api: AppApi
  active: boolean
  location: NoteLocation
  draft?: NoteDocument
  onDraft: (next: NoteDocument | null, expected?: NoteDocument | null) => void
  onSaved: () => void
  writeBlocked: boolean
  notes: readonly NoteEntry[]
  onOpen: (path: string) => void
  loadBacklinks: boolean
  indexRevision?: number | null
  view: NoteView
  focusEditor: boolean
  fullWidth: boolean
  onViewChange: (view: NoteView) => void
  onWidthChange: () => void
}) {
  const { workspaceId, path } = location
  const [source, setSource] = useState<NoteDocument | null>(null)
  const preview = view === 'rendered'
  const [notice, setNotice] = useState('')
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [backlinks, setBacklinks] = useState<BacklinksData | null>(null)
  const [backlinkFailure, setBacklinkFailure] = useState<ApiFailure | null>(null)
  const [editingBlock, setBlockEdit] = useState<BlockEdit | null>(null)
  const locked = useRef(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<string | null>(null)
  const hasDraft = !!draft
  const doc = draft ?? source
  const text = doc?.text
  const blockEdit = editingBlock?.sourceHash === doc?.source.hash ? editingBlock : null
  const readOnly = loading || pending || writeBlocked || doc?.lineEnding === 'mixed'
  // Keep the block boundaries stable while typing changes its Markdown structure.
  const renderedText = blockEdit?.original ?? text
  const previewEditable = !readOnly && !blockEdit
  const resolveWikilink = useMemo(() => makeWikilinkResolver(notes), [notes])
  const blocks = useMemo(() => preview && renderedText !== undefined
    ? renderMarkdownBlocks(renderedText, resolveWikilink, { editable: previewEditable }) : [],
    [preview, renderedText, resolveWikilink, previewEditable])
  const columnClass = `qz-note-column${fullWidth ? ' qz-note-column-full' : ''}`

  useLayoutEffect(() => {
    const selector = restoreFocus.current
    if (!selector) return
    restoreFocus.current = null
    const target = previewRef.current?.querySelector<HTMLElement>(selector) ?? previewRef.current
    target?.focus({ preventScroll: true })
  }, [blocks])

  useEffect(() => {
    if (!active || hasDraft) return
    let cancelled = false
    setLoading(true)
    setFailure(null)
    withTimeout(readSource(api, workspaceId, path)).then(result => {
      if (cancelled) return
      setSource(openDocument(result))
      setBlockEdit(current => current?.sourceHash === result.hash ? current : null)
    }).catch(error => {
      if (!cancelled) setFailure(toFailure(error))
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; setLoading(false) }
  }, [active, api, hasDraft, path, workspaceId])

  useEffect(() => {
    if (!loadBacklinks || indexRevision == null) return
    let cancelled = false
    withTimeout(listBacklinks(api, workspaceId, path)).then(value => {
      if (cancelled) return
      setBacklinks(value)
      setBacklinkFailure(null)
    }).catch(error => {
      if (cancelled) return
      setBacklinks(null)
      setBacklinkFailure(toFailure(error))
    })
    return () => { cancelled = true }
  }, [api, indexRevision, loadBacklinks, path, workspaceId])

  const save = async () => {
    if (locked.current || !draft || draft.conflict || writeBlocked || draft.lineEnding === 'mixed') return
    locked.current = true
    setBlockEdit(null)
    setPending(true)
    setFailure(null)
    setNotice('')
    const content = documentContent(draft)
    try {
      const result = await withTimeout(saveNote(api, workspaceId, path, content, draft.source.hash))
      setSource(openDocument({ ...result, content }))
      onDraft(null, draft)
      setNotice('Note saved.')
      onSaved()
    } catch (error) {
      const problem = toFailure(error)
      if (problem.code === 'conflict') onDraft({ ...draft, conflict: true }, draft)
      else setFailure(problem)
    } finally {
      locked.current = false
      setPending(false)
    }
  }

  const reload = async () => {
    if (locked.current || (draft && !window.confirm('Replace your unsaved draft with the version on disk?'))) return
    locked.current = true
    setPending(true)
    setFailure(null)
    setNotice('')
    try {
      setSource(openDocument(await withTimeout(readSource(api, workspaceId, path))))
      onDraft(null, draft ?? null)
      setBlockEdit(null)
      setNotice('Note reloaded.')
    } catch (error) {
      setFailure(toFailure(error))
    } finally {
      locked.current = false
      setPending(false)
    }
  }

  const editText = (nextText: string) => {
    if (!doc || readOnly || nextText === doc.text) return
    const next = { ...doc, text: nextText }
    setNotice('')
    onDraft(!next.conflict && documentContent(next) === next.source.content ? null : next)
  }

  const startBlockEdit = (start: number, end: number) => {
    if (readOnly || blockEdit || !doc) return
    const offsets = noteBlockOffsets(doc.text, start, end)
    if (offsets) setBlockEdit({ start, ...offsets, original: doc.text, sourceHash: doc.source.hash })
  }

  const finishBlockEdit = (cancel: boolean) => {
    if (!blockEdit) return
    if (cancel) editText(blockEdit.original)
    restoreFocus.current = `[data-edit-start="${blockEdit.start}"]`
    setBlockEdit(null)
  }

  return (
    <section className="qz-note-editor qz-panel-surface" aria-label="Note editor">
      <div className="qz-toolbar qz-note-toolbar">
        <code className="qz-mono qz-path" title={path}>{path}</code>
        <div className="qz-actions">
          <SegmentedControl segments={[{ key: 'rendered', label: 'Rendered' }, { key: 'raw', label: 'Raw' }]}
            value={view} onChange={next => { setBlockEdit(null); onViewChange(next) }} ariaLabel="Note view" collapse={false} />
          <button type="button" className="qz-button" data-variant="quiet" aria-pressed={fullWidth}
            onClick={onWidthChange}>{fullWidth ? 'Full width' : 'Reading width'}</button>
          <button type="button" className="qz-button" data-variant="quiet" disabled={loading || pending}
            onClick={() => void reload()}>Reload from disk</button>
          <button type="button" className="qz-button" data-variant="primary"
            disabled={!draft || draft.conflict || loading || pending || writeBlocked || draft.lineEnding === 'mixed'}
            onClick={() => void save()}>Save note</button>
        </div>
      </div>
      <ErrorLine failure={failure} />
      {loading && !doc && <p className="qz-muted" role="status">Loading note…</p>}
      {draft?.conflict && <div className="qz-notice" role="alert">
        The note changed on disk. Your draft is still here. Copy or review your changes before reloading from disk.
      </div>}
      {doc?.lineEnding === 'mixed' && <div className="qz-notice" role="note">This note has mixed line endings and opens read-only to preserve them.</div>}
      {doc && (preview
        ? <div ref={previewRef} className={`qz-notes-rendered ${columnClass}`} aria-label="Markdown preview" tabIndex={-1}
          onClick={event => {
            if (!(event.target instanceof Element)) return
            const wikiLink = event.target.closest<HTMLButtonElement>('button.qz-wikilink[data-note-path]')
            const destination = wikiLink?.dataset.notePath
            if (destination && notes.some(note => note.path === destination)) onOpen(destination)
            const checkbox = event.target.closest<HTMLInputElement>('input.qz-note-task-checkbox[data-note-task-line]')
            if (checkbox && previewEditable) {
              const line = Number(checkbox.dataset.noteTaskLine)
              const next = setNoteTaskChecked(doc.text, line, checkbox.checked)
              if (next !== doc.text) {
                restoreFocus.current = `input[data-note-task-line="${line}"]`
                editText(next)
              }
            }
          }}>
          {!blocks.length && <p className="qz-muted">No content yet.</p>}
          {blocks.map(({ html, start, end }, index) => {
            if (blockEdit && start === blockEdit.start) {
              return <div className="qz-note-block-editor" key={index}>
                <textarea aria-label="Block Markdown" className="qz-input qz-note-block-text" autoFocus spellCheck={false}
                  rows={Math.max(2, (end ?? start + 1) - start)} readOnly={readOnly}
                  value={doc.text.slice(blockEdit.from, doc.text.length - (blockEdit.original.length - blockEdit.to))}
                  onChange={event => editText(blockEdit.original.slice(0, blockEdit.from)
                    + event.target.value + blockEdit.original.slice(blockEdit.to))}
                  onKeyDown={event => {
                    if (event.nativeEvent.isComposing) return
                    if (event.key === 'Escape' || (event.key === 'Enter' && (event.metaKey || event.ctrlKey))) {
                      event.preventDefault()
                      event.stopPropagation()
                      finishBlockEdit(event.key === 'Escape')
                    }
                  }} />
                <div className="qz-actions">
                  <button type="button" className="qz-button" onClick={() => finishBlockEdit(false)}>Done</button>
                  <button type="button" className="qz-button" data-variant="quiet" onClick={() => finishBlockEdit(true)}>Cancel</button>
                </div>
              </div>
            }
            const editable = previewEditable && start !== undefined && end !== undefined
            return <div className="qz-note-block" key={index}>
              <div className={editable ? 'qz-note-block-content' : undefined}
                onClick={editable ? event => {
                  if (event.target instanceof Element && !event.target.closest('a, button, input, summary')
                    && !window.getSelection()?.toString()) startBlockEdit(start, end)
                } : undefined}
                dangerouslySetInnerHTML={{ __html: html }} />
              {editable && <button type="button" className="qz-button qz-note-edit-block" data-edit-start={start}
                aria-label={`Edit block at line ${start + 1}`} title="Edit block"
                onClick={() => startBlockEdit(start, end)}><Icon name="edit" /></button>}
            </div>
          })}
        </div>
        : <label className={`qz-field ${columnClass}`}>Note Markdown
          <textarea autoFocus={focusEditor} className="qz-input qz-note-text" spellCheck={false} value={doc.text}
            readOnly={readOnly} onChange={event => editText(event.target.value)} />
        </label>)}
      <span className="qz-muted qz-note-message" role="status">{notice || (draft ? 'Unsaved changes' : '')}</span>
      {doc && (backlinkFailure || !!backlinks?.notes.length) && (
        <section className="qz-note-backlinks" aria-label="Backlinks">
          <h3>Backlinks</h3>
          <ErrorLine failure={backlinkFailure} />
          {backlinks && <ul>
            {backlinks.notes.map(note => <li key={note.path}>
              <button type="button" className="qz-wikilink" title={note.path} onClick={() => onOpen(note.path)}>
                {note.title}
              </button>
            </li>)}
          </ul>}
          {backlinks?.truncated && <p className="qz-muted">Only the first {backlinks.notes.length} backlinks are shown.</p>}
        </section>
      )}
    </section>
  )
}
