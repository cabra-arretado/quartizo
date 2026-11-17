import type { TodoState } from './companionApi'
import { DEFAULT_NOTE_APPEARANCE, type HeadingColor, type NoteAppearance, headingColor, headingLines } from './noteAppearance'
import { storage } from './ui'

export type Tab = 'tasks' | 'todos' | 'notes' | 'settings'
export type NoteWidth = 'narrow' | 'standard' | 'wide' | 'full'
export type TextSize = 'small' | 'medium' | 'large'

export interface NoteFolderPreferences {
  lastNote: string | null
  expanded: string[]
  limit: number
  pinned: string[]
}

export interface FolderAppearance {
  color: HeadingColor
  emoji: string
}

export interface TodoFilter {
  name: string
  scope: Preferences['todoScope']
  state: TodoState
  search: string
}

export interface Preferences {
  appearance: NoteAppearance
  accent: HeadingColor
  highContrast: boolean
  largerInterfaceText: boolean
  motion: 'system' | 'reduced'
  startOn: 'last' | Tab
  lastTab: Tab
  workspaceId: number | null
  noteView: 'rendered' | 'raw'
  noteWidth: NoteWidth
  noteTextSize: TextSize
  rawTextSize: TextSize
  noteLineHeight: 'compact' | 'normal' | 'relaxed'
  noteFont: 'theme' | 'mono'
  noteFolders: Record<string, NoteFolderPreferences>
  folderAppearance: Record<string, FolderAppearance>
  boardDensity: 'comfortable' | 'compact'
  boardFields: { progress: boolean; path: boolean; badges: boolean }
  hideEmptyLanes: boolean
  laneSort: Record<string, 'manual' | 'title'>
  todoScope: 'all' | 'workspace'
  todoState: TodoState
  todoFilters: TodoFilter[]
}

export const DEFAULT_NOTE_FOLDER: NoteFolderPreferences = { lastNote: null, expanded: [], limit: 500, pinned: [] }
export const DEFAULT_FOLDER_APPEARANCE: FolderAppearance = { color: 'theme', emoji: '' }

export const DEFAULT_PREFERENCES: Preferences = {
  appearance: DEFAULT_NOTE_APPEARANCE,
  accent: 'theme',
  highContrast: false,
  largerInterfaceText: false,
  motion: 'system',
  startOn: 'last',
  lastTab: 'tasks',
  workspaceId: null,
  noteView: 'rendered',
  noteWidth: 'standard',
  noteTextSize: 'medium',
  rawTextSize: 'medium',
  noteLineHeight: 'normal',
  noteFont: 'theme',
  noteFolders: {},
  folderAppearance: {},
  boardDensity: 'comfortable',
  boardFields: { progress: true, path: true, badges: true },
  hideEmptyLanes: false,
  laneSort: {},
  todoScope: 'all',
  todoState: 'open',
  todoFilters: [],
}

export const NOTE_WIDTHS: Record<NoteWidth, string> = {
  narrow: 'Narrow',
  standard: 'Standard',
  wide: 'Wide',
  full: 'Full width',
}

export const TABS = ['tasks', 'todos', 'notes', 'settings'] as const

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function oneOf<T extends string>(value: unknown, choices: readonly T[], fallback: T): T {
  return choices.includes(value as T) ? value as T : fallback
}

function workspaceId(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null
}

function noteAppearance(value: unknown): NoteAppearance {
  const fields = record(value)
  return {
    headingColor: headingColor(fields.headingColor),
    headingLines: headingLines(fields.headingLines),
    lineColor: headingColor(fields.lineColor),
  }
}

function folderMap<T>(value: unknown, parse: (fields: Record<string, unknown>) => T): Record<string, T> {
  return Object.fromEntries(Object.entries(record(value))
    .filter(([key]) => /^[1-9]\d*$/.test(key) && workspaceId(Number(key)) !== null)
    .map(([key, fields]) => [key, parse(record(fields))]))
}

const validPath = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && (value.length <= 1024 || Array.from(value).length <= 1024)
const paths = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter(validPath))] : []
const todoScope = (value: unknown) => oneOf(value, ['all', 'workspace'], 'all')
const todoState = (value: unknown) => oneOf(value, ['open', 'done', 'all'], 'open')

export function folderEmoji(value: string): string {
  return Array.from(value.replace(/[\u0000-\u001f\u007f]/g, '').trim()).slice(0, 8).join('')
}

export function normalizePreferences(value: unknown): Preferences {
  const fields = record(value)
  const board = record(fields.boardFields)
  const accent = headingColor(fields.accent)
  return {
    appearance: noteAppearance(fields.appearance),
    accent: accent === 'accent' ? 'theme' : accent,
    highContrast: fields.highContrast === true,
    largerInterfaceText: fields.largerInterfaceText === true,
    motion: oneOf(fields.motion, ['system', 'reduced'], 'system'),
    startOn: oneOf(fields.startOn, ['last', ...TABS], 'last'),
    lastTab: oneOf(fields.lastTab, TABS, 'tasks'),
    workspaceId: workspaceId(fields.workspaceId),
    noteView: oneOf(fields.noteView, ['rendered', 'raw'], 'rendered'),
    noteWidth: oneOf(fields.noteWidth, ['narrow', 'standard', 'wide', 'full'], 'standard'),
    noteTextSize: oneOf(fields.noteTextSize, ['small', 'medium', 'large'], 'medium'),
    rawTextSize: oneOf(fields.rawTextSize, ['small', 'medium', 'large'], 'medium'),
    noteLineHeight: oneOf(fields.noteLineHeight, ['compact', 'normal', 'relaxed'], 'normal'),
    noteFont: oneOf(fields.noteFont, ['theme', 'mono'], 'theme'),
    noteFolders: folderMap(fields.noteFolders, folder => ({
      lastNote: validPath(folder.lastNote) ? folder.lastNote : null,
      expanded: paths(folder.expanded),
      limit: typeof folder.limit === 'number' && Number.isSafeInteger(folder.limit)
        ? Math.min(50000, Math.max(DEFAULT_NOTE_FOLDER.limit, folder.limit)) : DEFAULT_NOTE_FOLDER.limit,
      pinned: paths(folder.pinned),
    })),
    folderAppearance: folderMap(fields.folderAppearance, folder => ({
      color: headingColor(folder.color),
      emoji: typeof folder.emoji === 'string' ? folderEmoji(folder.emoji) : '',
    })),
    boardDensity: oneOf(fields.boardDensity, ['comfortable', 'compact'], 'comfortable'),
    boardFields: { progress: board.progress !== false, path: board.path !== false, badges: board.badges !== false },
    hideEmptyLanes: fields.hideEmptyLanes === true,
    laneSort: Object.fromEntries(Object.entries(record(fields.laneSort))
      .filter(([key]) => /^\d+:[a-z][a-z0-9_]{0,31}$/.test(key))
      .map(([key, sort]) => [key, oneOf(sort, ['manual', 'title'], 'manual')])),
    todoScope: todoScope(fields.todoScope),
    todoState: todoState(fields.todoState),
    todoFilters: Array.isArray(fields.todoFilters) ? fields.todoFilters.flatMap(filter => {
      const entry = record(filter)
      if (typeof entry.name !== 'string' || !entry.name.trim()) return []
      return [{
        name: entry.name.trim().slice(0, 40),
        scope: todoScope(entry.scope),
        state: todoState(entry.state),
        search: typeof entry.search === 'string' ? entry.search.slice(0, 200) : '',
      }]
    }).slice(0, 20) : [],
  }
}

type PreferencePatch = Partial<Preferences>

function readPatch(value: unknown): PreferencePatch {
  const fields = record(value)
  const normalized = normalizePreferences(fields)
  return Object.fromEntries(Object.entries(normalized).filter(([key]) => Object.hasOwn(fields, key)))
}

export interface PreferenceCache {
  values: Preferences
  pending: PreferencePatch
  legacy: PreferencePatch
}

const CACHE_KEY = 'quartizo-preferences-v1'

function readItem(key: string): string | null {
  try { return storage()?.getItem(key) ?? null } catch { return null }
}

function readJson(key: string): unknown {
  try { return JSON.parse(readItem(key) ?? 'null') } catch { return null }
}

export function loadPreferenceCache(): PreferenceCache {
  const cached = readJson(CACHE_KEY)
  if (cached && typeof cached === 'object') {
    const { values, pending, legacy } = record(cached)
    return { values: normalizePreferences(values), pending: readPatch(pending), legacy: readPatch(legacy) }
  }
  const legacy: PreferencePatch = {}
  const appearance = readJson('quartizo-notes-appearance')
  const view = readItem('quartizo-notes-view')
  const width = readItem('quartizo-notes-full-width')
  const previousWorkspace = workspaceId(Number(readItem('quartizo:workspace')))
  if (appearance) legacy.appearance = noteAppearance(appearance)
  if (view === 'raw' || view === 'rendered') legacy.noteView = view
  if (width === 'true' || width === 'false') legacy.noteWidth = width === 'true' ? 'full' : 'standard'
  if (previousWorkspace !== null) legacy.workspaceId = previousWorkspace
  return { values: { ...DEFAULT_PREFERENCES, ...legacy }, pending: {}, legacy }
}

export function savePreferenceCache(cache: PreferenceCache): boolean {
  try {
    const store = storage()
    if (!store) return false
    store.setItem(CACHE_KEY, JSON.stringify(cache))
    return true
  } catch {
    return false
  }
}
