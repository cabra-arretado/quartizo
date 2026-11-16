import type { AppApi } from '@kirocrew/app-sdk'
import { useRef, useState } from 'react'
import { type ApiFailure, saveNote, toFailure, withTimeout } from './companionApi'
import type { NoteLocation } from './noteNav'
import { type NoteDocument, documentContent, openDocument } from './notesModel'

export interface NoteEdits {
  draft?: NoteDocument
  saved?: NoteDocument
  saving?: boolean
  didSave?: boolean
  failure?: ApiFailure
}

function dirty(draft: NoteDocument | undefined) {
  return draft && (draft.conflict || documentContent(draft) !== draft.source.content) ? draft : undefined
}

export function noteKey(note: NoteLocation): string {
  return `${note.workspaceId}:${note.path}`
}

export function useNoteEdits(api: AppApi, onSaved: () => void) {
  const [edits, setEdits] = useState(() => new Map<string, NoteEdits>())
  const latest = useRef(edits)
  const saves = useRef(new Map<string, { next?: NoteDocument }>())

  function update(key: string, change: (current: NoteEdits) => NoteEdits) {
    const next = new Map(latest.current)
    next.set(key, change(next.get(key) ?? {}))
    latest.current = next
    setEdits(next)
  }

  function edit(key: string, next: NoteDocument | null, expected?: NoteDocument | null) {
    // An earlier reload may finish after navigating away and editing the note again.
    if (expected !== undefined && (latest.current.get(key)?.draft ?? null) !== expected) return
    update(key, current => {
      const base = current.draft ?? current.saved
      const draft = next && base ? { ...next, source: base.source, conflict: base.conflict } : next ?? undefined
      return { ...current, draft: current.saving ? draft : dirty(draft), didSave: false, failure: next ? current.failure : undefined }
    })
  }

  function loaded(key: string, saved: NoteDocument | undefined) {
    if (saved && latest.current.get(key)?.saved === saved) {
      update(key, current => ({ ...current, saved: undefined }))
    }
  }

  async function save(location: NoteLocation) {
    const key = noteKey(location)
    const draft = latest.current.get(key)?.draft
    if (!draft || draft.conflict || draft.lineEnding === 'mixed') return
    const running = saves.current.get(key)
    if (running) {
      running.next = draft
      return
    }

    // Keep writes per file serialized across navigation. Each request captures
    // the text at the save gesture, independently of subsequent typing.
    const queue: { next?: NoteDocument } = { next: draft }
    saves.current.set(key, queue)
    update(key, current => ({ ...current, saving: true, didSave: false, failure: undefined }))
    try {
      let snapshot: NoteDocument | undefined
      while ((snapshot = queue.next)) {
        queue.next = undefined
        const content = documentContent(snapshot)
        if (content === snapshot.source.content) continue
        const result = await withTimeout(saveNote(api, location.workspaceId, location.path, content, snapshot.source.hash))
        const saved = openDocument({ ...result, content })
        // The next write must use the hash returned by the preceding write.
        const queued = saves.current.get(key)?.next
        if (queued) queue.next = { ...queued, source: saved.source }
        update(key, current => ({
          ...current,
          saved,
          draft: dirty(current.draft && { ...current.draft, source: saved.source }),
          didSave: true,
        }))
        onSaved()
      }
    } catch (error) {
      const failure = toFailure(error)
      update(key, current => failure.code === 'conflict' && current.draft
        ? { ...current, draft: { ...current.draft, conflict: true } }
        : { ...current, failure })
    } finally {
      saves.current.delete(key)
      update(key, current => ({ ...current, saving: false, draft: dirty(current.draft) }))
    }
  }

  return { edits, edit, loaded, save }
}
