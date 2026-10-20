# Architecture (M1-M5)

```
dashboard page (ui/dist/index.mjs, rendered by the host)
  App.tsx        PageHeader + in-page tabs: Notes | Tasks | Agents | Git | Chat; cross-tab links + Back trail
  Notes.tsx      workspace picker/registration, note list + search, editor, preview
  Tasks.tsx      Kanban board of the selected workspace, task details, links (M3)
  tasksApi.ts    typed client for .../workspaces/{id}/tasks
  board.ts       column grouping, move/reindex mirror, keyboard moves, drop index
  taskContext.ts bounded task context block for an agent prompt
  Agents.tsx     read-only session / tool / subagent monitor, bounded polling (M5)
  agentsModel.ts     slot rows, visibility classification, status, transcript summary, links
  freshness.ts   poll cadence, backoff, stale-since, restart detection
  Git.tsx        repo picker/registration, changed-files list, virtualized diff viewer (M4)
  gitApi.ts      typed client for .../repos (ids, a path and a mode only)
  gitList.ts     entry badges, diff modes, changed-files keyboard handling
  diffView.ts    unified diff -> classified lines, virtual-list window
  Chat.tsx       the QTZ-003 ChatEmbed session (mounted on first visit, then kept)
  notesApi.ts    typed client for /apps/quartizo/api/workspaces/... (useAppApi)
  editorDoc.ts   open-note state: dirty, save base hash, 409 conflict rules
  lineEndings.ts LF editor text <-> the file's own line endings
  markdown.ts    untrusted Markdown -> sanitized HTML
  listNav.ts     keyboard navigation for the note list
        |
        | same-origin fetch, owner cookie (gateway signs + forwards)
        v
backend (python3 -I backend/server.py, stdlib only)
  server.py      HMAC + signed principal (owner-session only), routing
  workspace.py   root registry, path validation, fd-based no-follow opens
  notes.py       list/search, read, atomic create/update/rename, trash-delete
  tasks.py       task CRUD, ordered moves, version checks, JSON import/export (M3)
  gitrepo.py     repo registry, hardened git runner, status/diff parsing (M4)
  db.py          sqlite3 registry + tasks + repos + migrations ($KIROCREW_HOME/apps/quartizo/data)
        |
        v
plain .md files in the registered folders (readable by Obsidian or any editor)
registered Git repositories, read through `git` (never written)
```

Testable logic lives in the plain `.ts` modules and has vitest suites. The
`.tsx` components only wire state to elements.

## Pages and routing

`app.json` keeps its single `ui.pages` entry (`/apps/quartizo`). Every
builtin app in 0.10.0rc4 declares exactly one page. Extra pages would each
add a sidebar entry, and the host's handling of sub-routes was not verified.
So Notes, Tasks and Chat are **in-page tabs** (`role="tablist"`, arrow keys switch).
No manifest change and no new permission was needed: the notes routes sit
under the already-granted `/apps/quartizo/api`.

## Editor: plain `<textarea>` (not CodeMirror 6)

Only the host's eight import-map modules are external (`HOST_MODULES` in
`ui/vite.config.ts`). Anything else we import is bundled into
`ui/dist/index.mjs`.

| | `<textarea>` | CodeMirror 6 |
|---|---|---|
| Bundle cost | 0 | Measured with esbuild (minified): `codemirror` 6.0.2 `basicSetup` + `@codemirror/lang-markdown` = **613 KB, 208 KB gzip**. A hand-trimmed setup is smaller but still several hundred KB. For scale, the whole M1 bundle with markdown-it is 173 KB (60 KB gzip) |
| Host sharing | n/a | Not in the import map, so every app that uses it ships its own copy |
| Line endings | Normalizes to LF (HTML "API value") | Also normalizes by default (`lineSeparator`) |
| IME, spellcheck, a11y, undo | Native | Good, but its own implementation |
| Markdown highlighting, folding, vim keys | No | Yes |

**Choice: `<textarea>`.** M1 needs correct editing of real files more than
rich editing. CodeMirror would more than quadruple the bundle for syntax
highlighting, and it would not fix the line-ending problem either. Line
endings are handled explicitly instead (`lineEndings.ts`): LF and CRLF files
are edited as LF and written back in their own style, so an edit round-trips
byte for byte. A file that **mixes** styles (or uses lone `\r`) cannot
survive any normalizing editor, so it opens read-only with a notice.
Revisit if highlighting becomes a requirement; the editor is one element in
`NoteEditor`.

## Markdown preview

`markdown-it` 15.0.2 (its prebuilt minified ESM build, `markdown-it/browser`),
configured for untrusted input. See [threat-model.md](threat-model.md) §3. It
was chosen over `marked` + DOMPurify because sanitization happens while the
HTML is generated (html disabled, URL allowlist), not by cleaning HTML after
the fact. It runs without a DOM, so the XSS tests run in plain Node.

## Conflict UX

Every save sends the hash of the content last read or saved. On 409 the
editor keeps the user's text and shows a notice with three choices:

- **Reload from disk**: discard mine and load the current file.
- **Keep editing**: hide the notice. The base hash is unchanged, so the next
  save conflicts again.
- **Overwrite with my version…**: an explicit decision that only *arms* the
  next Save with the hash now on disk (or re-creates a deleted note).

Nothing is ever overwritten automatically (`editorDoc.ts`, tested).
Delete asks for confirmation inline, and a rename onto an existing note asks
again before sending `overwrite` + `confirm`.

## Projects and tasks (M3)

**Decision: one project is one registered workspace**, keyed by the
workspace `uid` (`tasks.project_id = workspaces.uid`, a foreign key).

- It is the simplest model that matches what already exists. A workspace is
  already the unit of confinement (note paths are relative to it), of the
  chat session (`quartizo-w<uid>-…`, M2) and of the UI selection. A task's
  `note_ref` and `slot_id` only make sense inside one workspace, and with
  this model they can be validated against it.
- The `uid`, not the numeric id, is the key for the same reason as the M2
  chat: it is random and never reused, so a later registration can never
  inherit the tasks of an earlier one.
- No extra registry, no project CRUD and no project picker. Several projects
  per workspace, or a project that spans folders, can be added later as a
  `projects` table whose default row per workspace keeps today's ids.
- Removing a workspace would orphan its tasks, so the FK cascades and the
  backend refuses the removal (409 `project_has_tasks`) unless the caller
  asks to delete the tasks too. The UI says how many and offers an export
  first.

**Storage.** `db.py` migration 3 adds `tasks` with a `CHECK` on `status` and
an index on `(project_id, status, sort_order)`. Every write is one `BEGIN
IMMEDIATE` transaction (`db.transaction`), so the version check, the write
and any reindex happen under the write lock. `sort_order` is an integer
index, rewritten densely (0..n-1) for the source and target columns in the
move's transaction. Fractional keys would avoid touching siblings, but a
column holds at most a few hundred cards, a dense reindex is a handful of
`UPDATE`s, and integers never run out of precision. Siblings that are only
reindexed keep their `version`, so an open edit of a neighbour does not
conflict.

**Concurrency.** `version` (an integer bumped by each write), not
`updated_at`: a millisecond clock can repeat, and the client never has to
compare times. A stale update, move or delete gets 409 `stale` with the
current task.

**Status vs runtime state.** `status` is set only by the user, through
`/move`. The backend has no chat client at all, so it cannot infer or store
a runtime state; the UI shows a linked session's state read-only next to
the human status.

## Board UI (M3)

- **Tabs.** Tasks sits between Notes and Chat on the same page, mounted on
  first visit and then kept (hidden) like Chat. It shows the board of the
  workspace selected in Notes, so there is one selection on the page. App
  relays two things: Notes reports its workspace and open note
  (`NotesState`), and Tasks sends Notes a one-shot request (`NotesRequest`,
  by `seq`) to select a workspace and open a note or the chat column. A
  switch asks first when the open note has unsaved edits.
- **Drag and drop: native HTML5**, no library. A drag carries the task uid
  under a private MIME type (`application/x-quartizo-task`), so drops from
  elsewhere are ignored. The drop index comes from the card midpoints
  (`board.dropIndex`). A DnD library (not measured here; dnd-kit and similar add
  tens of KB) would add touch and animation, but nothing the board needs, and
  it would ship inside our bundle, since the host import map does not have
  one. The bundle is now 225 KB (74 KB gzip).
- **Keyboard.** Each card has ← ↑ ↓ → buttons with labels such as
  "Move “x” to Ready" (`board.moveLabel`). Impossible moves are disabled.
  Focus returns to the same button on the moved card.
- **Optimistic moves.** `board.applyMove` mirrors the backend reindex
  exactly. The board updates at once, then takes the server's list. On a
  failure it reverts, and on 409 `stale` it reloads and says so.
- **Edits.** The detail form edits title and description against the
  version it was loaded from. A newer version with the same title and
  description (a move, a link change) is adopted silently. Anything else
  is a real conflict, handled like the note editor (Reload, Keep editing,
  Overwrite…). Link and unlink are immediate PATCHes on the live version.
- **Agent prompt.** `taskContext.formatTaskContext` builds the block:
  header, framing line, a description fence it cannot close, a hard 8 KB
  cap with the cut stated. It reuses `context.ts` helpers. The block is
  shown first. *Open in full chat as draft* calls
  `openChat({slotKey?, message, autoSend: false})`. The session is the
  task's linked session, else the workspace chat, else a new chat. The
  board has no other path to the chat API, and a move calls only
  `POST .../move` (tested).

## Git, read only (M4)

**Repos are their own registry** (`repos`, migration 4), not a property of
a notes workspace. A notes workspace is a folder of `.md` files that
Quartizo writes; a repo is a folder Quartizo only reads through `git`.
Coupling them would force one to be the other (a vault that is not a repo,
a repo that has no notes). Same id/uid scheme as workspaces.

**Overlap decisions.**

| Case | Decision | Why |
|---|---|---|
| Repo overlaps the KiroCrew home or the data dir | Refused | Same as workspaces: secrets and agent state |
| Same path (or same inode) twice | Refused, 409 `repo_exists` | One registration per repo |
| A notes workspace inside a repo, a repo inside a workspace, or one folder as both | **Allowed** | Read-only Git cannot alias or clobber a note write. The note confinement (hidden segments, no `.git` access) is unchanged |
| A nested repo or a submodule inside a registered repo | **Allowed**, as a separate registration | They are separate repositories. The outer repo's status shows a nested repo as an untracked `dir/` and a submodule as one entry, and descends into neither |
| A subfolder of a repo | Refused, 400 `not_repo_toplevel` | Status and paths are relative to the top level |
| A bare repo, or the `.git` folder itself | Refused | No work tree |

**Layouts.** Linked worktrees (`.git` is a `gitdir:` file) and submodule
checkouts can be registered; `info.gitDir` says which. A `.git` symlink is
refused. Submodules are shown, not descended into
(`--ignore-submodules=dirty`): a changed submodule commit appears as one
entry (`submoduleCommitChanged`) and its diff is `Subproject commit …`;
changes inside the submodule's own work tree are not looked at, because
that would run git there. Ignored files are not listed
(`--ignored=no`), and an ignored path cannot be diffed (404). Untracked
folders are listed as `dir/` (`--untracked-files=normal`), not expanded.
Renames come from `--find-renames` for staged changes (index vs HEAD); a
work tree rename that is not staged shows as a deletion plus an untracked
file, which is what git itself reports.

**Status is parsed in the backend** (porcelain v2, `-z`), so the page gets
structured entries and never parses git output. Names that are not UTF-8
are shown lossy and marked `diffable: false`.

**Diffs** use plumbing (`diff-files -p`, `diff-index --cached -p -M`), which
reads none of git's diff UI config. Before the first commit, staged diffs
are against the empty tree. Untracked files have no git diff, so the
backend reads them itself (fd-relative, no symlink followed, 8 MiB cap) and
builds an all-added diff; a symlink shows its target string.

**Diff viewer.** Lines are classified by `diffView.parseDiff` (headers only
outside hunks, combined diffs from conflicts included) and rendered as
React text nodes with add/remove backgrounds. The viewer is a fixed-height
virtual list (`visibleRange`, 18 px rows), so a 512 KiB diff (about 30 000
lines) keeps a few dozen rows in the DOM; parsing it takes a few
milliseconds (tested under 500 ms in Node). Long lines scroll sideways
(`white-space: pre`), no wrapping, so row heights stay fixed.

**No stage, commit or task-branch link** in M4. `branch_ref` on tasks was
not added: the task schema, import format and board UI would all need it,
which is more than "cheap"; the repo `uid` is ready to key it later.

## Agents, read only (M5)

See [m5.md](m5.md) for the gateway routes and the permission decision.

- **Source of truth is the gateway's own list and transcript.** The tab
  derives nothing the gateway does not say: `running` / `stopping` are its
  flags, `error` is a trailing error row, a tool is `ended` only when the
  row says so, and a silent session is `idle`, never "done".
- **Polling, not events.** The 0.10.0rc4 host relays only `mc:app:slots` to
  pages, so that hint just triggers an earlier poll. One `GET /api/chat/slots`
  every 5 s while visible; transcript reads (`limit=50`) only for the
  selected and the 12 most recent Quartizo sessions whose list fingerprint
  changed. Backoff and staleness rules live in `freshness.ts` (tested).
- **Visibility classes.** Quartizo-created sessions are the names the page
  generates; anything else the owner's list returns is shown read-only and
  never read in detail.
- **Cross-tab navigation.** App keeps one-shot requests (`AgentsRequest`,
  `TaskFocus`, `GitRequest`, by `seq`) and a short trail of tabs for "Back".
  Notes still owns the workspace selection; opening a task in another
  workspace asks Notes to switch first.
