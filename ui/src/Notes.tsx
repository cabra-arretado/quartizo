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
  toFailure,
  withTimeout,
} from './companionApi'
import { renderMarkdownBlocks } from './markdown'
import type { NoteLocation } from './noteNav'
import {
  type NoteDocument, type NoteTree, makeNoteTree, noteBlockOffsets, openDocument, setNoteTaskChecked,
} from './notesModel'
import { ErrorLine, Icon, storage, usePageVisible } from './ui'
import { type NoteEdits, noteKey, useNoteEdits } from './useNoteEdits'
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
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(LIST_PAGE)
  const [adding, setAdding] = useState(false)
  const [path, setPath] = useState('')
  const [createFailure, setCreateFailure] = useState<ApiFailure | null>(null)
  const [creating, setCreating] = useState(false)
  const createPending = useRef(false)
  const { workspaces, current, notes, failure, refresh, visible } = useCatalog(api, active, workspaceId)
  const { edits, edit, loaded, save } = useNoteEdits(api, refresh)
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
    <section className="qz-stack qz-notes-view" aria-label="Notes">
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
          edits={edits.get(key)} onDraft={(next, expected) => edit(key, next, expected)} onLoaded={saved => loaded(key, saved)}
          onSave={() => { if (!writeBlocked) void save(location) }} writeBlocked={!!writeBlocked}
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
            <summary title={name}>
              <span className="qz-note-tree-arrow"><Icon name="down" /></span>
              <Icon name="folder" />
              <span className="qz-note-tree-name">{name}</span>
            </summary>
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
  end: number
  from: number
  to: number
  original: string
}

function NoteEditor({ api, active, location, edits, onDraft, onLoaded, onSave, writeBlocked, notes, onOpen, loadBacklinks, indexRevision, view, focusEditor, fullWidth, onViewChange, onWidthChange }: {
  api: AppApi
  active: boolean
  location: NoteLocation
  edits?: NoteEdits
  onDraft: (next: NoteDocument | null, expected?: NoteDocument | null) => void
  onLoaded: (saved: NoteDocument | undefined) => void
  onSave: () => void
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
  const { draft, saved, saving } = edits ?? {}
  const [source, setSource] = useState<NoteDocument | null>(null)
  const preview = view === 'rendered'
  const [notice, setNotice] = useState('')
  const [failure, setFailure] = useState<ApiFailure | null>(null)
  const [loading, setLoading] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [backlinks, setBacklinks] = useState<BacklinksData | null>(null)
  const [backlinkFailure, setBacklinkFailure] = useState<ApiFailure | null>(null)
  const [blockEdit, setBlockEdit] = useState<BlockEdit | null>(null)
  const wasActive = useRef(false)
  const reloadButton = useRef<HTMLButtonElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef<string | null>(null)
  const hasDraft = !!draft
  const doc = draft ?? saved ?? source
  const text = doc?.text
  const readOnly = loading || reloading || writeBlocked || doc?.lineEnding === 'mixed'
  const blockText = blockEdit && text !== undefined
    ? text.slice(blockEdit.from, text.length - (blockEdit.original.length - blockEdit.to)) : ''
  // Keep the block boundaries stable while typing changes its Markdown structure.
  const renderedText = blockEdit?.original ?? text
  const previewEditable = !readOnly && !blockEdit
  const resolveWikilink = useMemo(() => makeWikilinkResolver(notes), [notes])
  const blocks = useMemo(() => preview && renderedText !== undefined
    ? renderMarkdownBlocks(renderedText, resolveWikilink, { editable: !readOnly }) : [],
    [preview, renderedText, resolveWikilink, readOnly])
  const columnClass = `qz-note-column${fullWidth ? ' qz-note-column-full' : ''}`

  useLayoutEffect(() => {
    const selector = restoreFocus.current
    if (!selector) return
    restoreFocus.current = null
    const target = previewRef.current?.querySelector<HTMLElement>(selector) ?? previewRef.current
    target?.focus({ preventScroll: true })
  }, [blocks])

  useEffect(() => {
    const opening = active && !wasActive.current
    wasActive.current = active
    if (!active || hasDraft || saving) return
    if (saved && !opening && source) {
      setSource(saved)
      onLoaded(saved)
      return
    }
    let cancelled = false
    setLoading(true)
    setFailure(null)
    withTimeout(readSource(api, workspaceId, path)).then(result => {
      if (cancelled) return
      setSource(openDocument(result))
      onLoaded(saved)
      if (doc?.source.hash !== result.hash) setBlockEdit(null)
    }).catch(error => {
      if (!cancelled) setFailure(toFailure(error))
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true; setLoading(false) }
  }, [active, api, hasDraft, path, saving, workspaceId])

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

  const reload = async () => {
    if (loading || saving || reloading || (draft && !window.confirm('Replace your unsaved draft with the version on disk?'))) return
    setReloading(true)
    setFailure(null)
    setNotice('')
    try {
      setSource(openDocument(await withTimeout(readSource(api, workspaceId, path))))
      onDraft(null, draft ?? null)
      onLoaded(saved)
      setBlockEdit(null)
      setNotice('Note reloaded.')
    } catch (error) {
      setFailure(toFailure(error))
    } finally {
      setReloading(false)
    }
  }

  const editText = (nextText: string) => {
    if (!doc || readOnly || nextText === doc.text) return
    setNotice('')
    onDraft({ ...doc, text: nextText })
  }

  const startBlockEdit = (start: number, end: number) => {
    if (readOnly || blockEdit || !doc) return
    const offsets = noteBlockOffsets(doc.text, start, end)
    if (offsets) setBlockEdit({ start, end, ...offsets, original: doc.text })
  }

  const finishBlockEdit = (cancel: boolean, focus = true) => {
    if (!blockEdit) return
    if (cancel) editText(blockEdit.original)
    else if (!readOnly) onSave()
    if (focus) restoreFocus.current = `[data-edit-start="${blockEdit.start}"]`
    setBlockEdit(null)
  }

  return (
    <section className="qz-note-editor qz-panel-surface" aria-label="Note editor">
      <div className="qz-toolbar qz-note-toolbar">
        <code className="qz-mono qz-path" title={path}>{path}</code>
        <div className="qz-actions">
          <SegmentedControl segments={[{ key: 'rendered', label: 'Rendered' }, { key: 'raw', label: 'Raw' }]}
            value={view} onChange={next => {
              if (blockEdit) finishBlockEdit(false, false)
              else if (!readOnly) onSave()
              onViewChange(next)
            }} ariaLabel="Note view" collapse={false} />
          <button type="button" className="qz-button" data-variant="quiet" aria-pressed={fullWidth}
            onClick={onWidthChange}>{fullWidth ? 'Full width' : 'Reading width'}</button>
          <button ref={reloadButton} type="button" className="qz-button" data-variant="quiet"
            disabled={loading || saving || reloading} onMouseDown={event => event.preventDefault()}
            onClick={() => void reload()}>Reload from disk</button>
          <button type="button" className="qz-button" data-variant="primary"
            disabled={!draft || draft.conflict || readOnly}
            onClick={() => { if (blockEdit) finishBlockEdit(false); else onSave() }}>Save note</button>
        </div>
      </div>
      <ErrorLine failure={failure ?? edits?.failure ?? null} />
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
            if (checkbox && !readOnly) {
              let line = Number(checkbox.dataset.noteTaskLine)
              if (blockEdit && line >= blockEdit.end) {
                line += blockText.split('\n').length - (blockEdit.end - blockEdit.start)
              }
              const next = setNoteTaskChecked(doc.text, line, checkbox.checked)
              if (next !== doc.text) {
                restoreFocus.current = `input[data-note-task-line="${line}"]`
                setBlockEdit(null)
                editText(next)
                onSave()
              }
            }
          }}>
          {!blocks.length && <p className="qz-muted">No content yet.</p>}
          {blocks.map(({ html, start, end }, index) => {
            if (blockEdit && start === blockEdit.start) {
              return <div className="qz-note-block-editor" key={index} onBlur={event => {
                const target = event.relatedTarget
                if (target === reloadButton.current || (target instanceof Node && event.currentTarget.contains(target))) return
                finishBlockEdit(false, false)
              }}>
                <textarea aria-label="Block Markdown" className="qz-input qz-note-block-text" autoFocus spellCheck={false}
                  rows={Math.max(2, (end ?? start + 1) - start)} readOnly={readOnly}
                  value={blockText}
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
                  <button type="button" className="qz-button" onMouseDown={event => event.preventDefault()}
                    onClick={() => finishBlockEdit(false)}>Done</button>
                  <button type="button" className="qz-button" data-variant="quiet" onMouseDown={event => event.preventDefault()}
                    onClick={() => finishBlockEdit(true)}>Cancel</button>
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
        : <label className={`qz-field qz-note-source ${columnClass}`}>Note Markdown
          <textarea autoFocus={focusEditor} className="qz-input qz-note-text" spellCheck={false} value={doc.text}
            readOnly={readOnly} onChange={event => editText(event.target.value)}
            onBlur={event => { if (!readOnly && event.relatedTarget !== reloadButton.current) onSave() }} />
        </label>)}
      <span className="qz-muted qz-note-message" role="status">
        {saving ? 'Saving note…' : draft ? 'Unsaved changes' : notice || (edits?.didSave ? 'Note saved.' : '')}
      </span>
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
