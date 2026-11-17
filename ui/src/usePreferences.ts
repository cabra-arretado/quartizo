import type { AppApi } from '@kirocrew/app-sdk'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BACKEND_BASE, withTimeout } from './companionApi'
import { loadPreferenceCache, normalizePreferences, type PreferenceCache, type Preferences, savePreferenceCache } from './preferences'

export type PreferenceStatus = 'loading' | 'saving' | 'saved' | 'local' | 'unavailable'

const path = `${BACKEND_BASE}/preferences`
const requestTimeout = 5000
const retryDelay = 30000

type ServerResponse = { preferences: unknown }

function mergeChanges<T extends Partial<Preferences>>(base: T, patch: Partial<Preferences>): T {
  return {
    ...base,
    ...patch,
    ...(patch.noteFolders && { noteFolders: { ...base.noteFolders, ...patch.noteFolders } }),
    ...(patch.folderAppearance && { folderAppearance: { ...base.folderAppearance, ...patch.folderAppearance } }),
    ...(patch.laneSort && { laneSort: { ...base.laneSort, ...patch.laneSort } }),
  }
}

function changedEntries<T>(previous: Record<string, T> | undefined, next: Record<string, T>): Record<string, T> | undefined {
  const entries = Object.entries(next).filter(([key, value]) => previous?.[key] !== value)
  return entries.length ? Object.fromEntries(entries) : undefined
}

function changedFields(previous: Partial<Preferences>, patch: Partial<Preferences>): Partial<Preferences> {
  const { noteFolders, folderAppearance, laneSort, ...fields } = patch
  const changes: Partial<Preferences> = Object.fromEntries(Object.entries(fields)
    .filter(([key, value]) => previous[key as keyof Preferences] !== value))
  const notes = noteFolders && changedEntries(previous.noteFolders, noteFolders)
  const folders = folderAppearance && changedEntries(previous.folderAppearance, folderAppearance)
  const lanes = laneSort && changedEntries(previous.laneSort, laneSort)
  if (notes) changes.noteFolders = notes
  if (folders) changes.folderAppearance = folders
  if (lanes) changes.laneSort = lanes
  return changes
}

/** Remembered as a side effect of navigating, not a setting the user changed: saving it shows no status. */
const quietFields: ReadonlySet<string> = new Set<keyof Preferences>(['lastTab'])

export function usePreferences(api: AppApi) {
  const [cache, setCache] = useState(loadPreferenceCache)
  const current = useRef(cache)
  const wake = useRef<() => void>()
  const [status, setStatus] = useState<PreferenceStatus>('loading')
  const [ready, setReady] = useState(false)

  const publish = useCallback((next: PreferenceCache) => {
    current.current = next
    setCache(next)
    return savePreferenceCache(next)
  }, [])

  const update = useCallback((patch: Partial<Preferences>) => {
    const latest = current.current
    const changes = changedFields(latest.values, patch)
    if (!Object.keys(changes).length) return
    publish({ ...latest, values: mergeChanges(latest.values, changes), pending: mergeChanges(latest.pending, changes) })
    wake.current?.()
  }, [publish])

  useEffect(() => {
    let cancelled = false
    let busy = false
    let hydrated = false
    let retry: ReturnType<typeof setTimeout> | undefined
    const requestInit = () => ({ signal: AbortSignal.timeout(requestTimeout) })

    const sync = async () => {
      if (cancelled || busy) return
      clearTimeout(retry)
      busy = true
      try {
        if (!hydrated) {
          const { legacy } = current.current
          const response = await withTimeout(Object.keys(legacy).length
            ? api.patch<ServerResponse>(path, { changes: legacy, onlyIfMissing: true }, requestInit())
            : api.get<ServerResponse>(path, requestInit()), requestTimeout)
          if (cancelled) return
          const { pending } = current.current
          publish({ values: mergeChanges(normalizePreferences(response.preferences), pending), pending, legacy: {} })
          hydrated = true
        }
        while (Object.keys(current.current.pending).length) {
          const sent = current.current.pending
          if (Object.keys(sent).some(field => !quietFields.has(field))) setStatus('saving')
          const response = await withTimeout(api.patch<ServerResponse>(path, { changes: sent }, requestInit()), requestTimeout)
          if (cancelled) return
          // Keep edits made while the request was in flight, including changes to a field it sent.
          const pending = changedFields(sent, current.current.pending)
          publish({ values: mergeChanges(normalizePreferences(response.preferences), pending), pending, legacy: {} })
        }
        setStatus('saved')
      } catch {
        if (cancelled) return
        setStatus(savePreferenceCache(current.current) ? 'local' : 'unavailable')
        retry = setTimeout(() => void sync(), retryDelay)
      } finally {
        busy = false
        if (!cancelled) setReady(true)
      }
    }
    wake.current = () => void sync()
    void sync()
    return () => {
      cancelled = true
      clearTimeout(retry)
      wake.current = undefined
    }
  }, [api, publish])

  return { preferences: cache.values, status, ready, update }
}
