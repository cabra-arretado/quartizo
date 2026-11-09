# Architecture

```
dashboard page (ui/dist/index.mjs, rendered by the host)
  App.tsx          PageHeader + in-page tabs: Tasks | TODOs | Settings (arrow keys switch)
  Companion.tsx    editable Board of ticket notes and the TODO list; Copy name buttons
  Settings.tsx     add / share / rebuild / remove folders
  companionApi.ts  typed client for the backend, failures, timeouts, lanes, index wording
  noteNav.ts       the Kiro Notes route and a note's name
  ui.tsx           shared styles, ErrorLine, storage
        |
        | same-origin fetch, owner cookie (gateway signs + forwards)
        v
backend (python3 -I backend/server.py: stdlib + ruamel.yaml vendored in backend/_vendor)
  server.py      HMAC + signed principal (owner-session only), routing
  workspace.py   root registry, path validation, fd-based no-follow opens
  companion.py   scan worker + rebuildable ticket/TODO index (generations)
  companion_write.py  shared write lock, exact byte patches, atomic publication, rank journals
  legacy_migration.py preview and snapshot verification, backups, resumable conversion journals
  mdsource.py    one note -> ticket fields, title, checkboxes (Kiro Notes' line rules)
  vendored.py    loads ruamel.yaml from backend/_vendor only
  db.py          sqlite3 registry + companion index + migrations ($KIROCREW_HOME/apps/quartizo/data)
        |
        v
plain .md files in registered folders, shared with Kiro Notes
```

Each view mounts when its tab opens, so it re-reads its data then (Settings
changes show up right away) and polls only while shown.

> **History.** Quartizo started as a notes editor with a database task board,
> a chat tab, a Git view and an agent monitor (M1-M5). Those were removed when
> it became a read-only Kiro Notes companion; the sections below from "Editor"
> to "Agents" describe that removed design and are kept for the record. The
> current design is "Pages and routing" and "Kiro Notes companion". The
> companion's metadata/checkbox writes resume the original release 1 scope;
> they do not restore the removed editor, Git, chat or agent interfaces.

## Pages and routing

`app.json` keeps its single `ui.pages` entry (`/apps/quartizo`). Every
builtin app in 0.10.0rc4 declares exactly one page. Extra pages would each
add a sidebar entry, and the host's handling of sub-routes was not verified.
So Tasks, TODOs and Settings are **in-page tabs** (`role="tablist"`, arrow
keys switch). The only grant is `/apps/quartizo/api`, the app's own backend.

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

## Kiro Notes companion

The first delivery of [the Markdown-ticket plan](markdown-tickets-plan.md),
now the whole app: native Kiro Notes edits a shared folder, Quartizo changes
ticket metadata and TODO markers in those same files. Format contracts:
[phase 1](markdown-tickets-phase1.md).

- **Shared writes.** The original read-only delivery waited for native Notes'
  content-hash conflict guard. With that upstream fix merged, the editable
  companion uses source hashes, exact byte patches, confined file replacement,
  and serialization of its own writes. Native Notes remains an independent
  writer; its unsaved buffers are not accessible to Quartizo. File conflicts
  require a refresh rather than an automatic overwrite. The historical native
  failure is retained in phase 1 evidence.
- **Write service.** `CompanionWriter` serializes Quartizo mutations through
  one reentrant lock. Target hashes are checked before preparing a patch and
  immediately before atomic replacement; moves also recheck destination
  hashes. New files use no-clobber linking. Identity checks scan live files
  across all companion folders, fail closed on incomplete inventories, and
  retain only note metadata rather than the vault's contents. Duplicate lookup
  uses an inventory counter. YAML patches use parser node byte spans, and TODO
  toggles reparse the production native grammar before replacing one byte.
  Folder registration, unsharing and removal use the same lock as writes;
  publication and queued migrations also refresh their scope authorization.
  The production server checks the installed host package version with
  prerelease-aware comparison before enabling writes, independently of the
  gateway's permissive manifest check. Unknown or unfixed versions stay
  browsable with `writeBlocked` surfaced in status and controls.
  Fresh byte hashes can reuse a bounded identity metadata cache or a matching
  current-version index row. Cache misses parse metadata only. A five-second
  cold-inventory budget defers to background indexing before publication.
- **Durable maintenance.** Rank exhaustion is explicit. Column rebalancing
  records each path, identity, before/after hash and proposed rank under
  `data/ticket-maintenance/`. A restart recognizes already-applied hashes.
  Conflicting external edits pause the journal; explicit reconciliation keeps
  the current contents and changes only the planned ordering scalar. The
  journal is removed only after all resulting files are verified.
  Journal paths are reconciled by unique persistent IDs after a rename;
  duplicate identities refuse recovery rather than guessing a file.
- **Legacy migration.** Preview derives a plan hash from full legacy rows.
  A SQLite backup and JSON export precede all note creation. Each old card
  becomes a separate deterministic note preserving its UID, status, relative
  order, description, linked note and session. `data/migration-<uid>.json`
  records planned hashes and verified steps. Legacy rows are never deleted;
  incomplete conversion disables ordinary writes. Retry creates no duplicate
  files, and completed conversion never rewrites a later user edit. Recovery
  journals and backups are application state, separate from `companion_*`.
  Preview uses the same ID resolution as execution so renamed, edited outputs
  expose the required consent. Generated notes consistently use LF and must
  pass production parsing; normalization is disclosed and backups retain the
  original database strings.
- **Per-folder opt-in.** Settings adds a folder already shared (one insert);
  unsharing drops its index, removing forgets it. A folder that still has
  tasks from the removed database board shows their count, and removing it
  deletes them only after that confirmation.
- **Files are authoritative; the index is derived.** `companion.py` scans
  with fd-relative, no-follow opens, reads and hashes every note on every scan
  (timestamps alone miss edits), re-parses only changed hashes, and writes a
  new generation that replaces the active one in one transaction. A failed
  root keeps the previous generation; an incomplete scan or an unreadable note
  keeps last-known rows (`retained`), so nothing is inferred deleted from
  damaged or missing input. Interrupted generations are dropped at startup.
  Dropping every `companion_*` row and rebuilding gives the same results
  (tested).
- **One worker, throttled requests.** A single daemon thread scans one
  workspace at a time; a failure it cannot even record is logged, never fatal.
  The views ask for a rescan when they open and every 30 s while visible;
  automatic requests within 10 s of the last scan are skipped, Refresh and
  Rebuild are not. No filesystem watcher.
- **Parsing.** `mdsource.py` reads frontmatter as YAML nodes (never
  reserialized) with Quartizo's own lenient delimiter rule, which also gives
  the title (first `# ` heading, else the file name). Checkboxes and their
  headings follow Kiro Notes' Preview rules line for line (frontmatter regex,
  `\n` splitting, ``` fences, tables, `- [ ]`/`- [x]`, list rails with tab
  stops), so both list the same TODOs. Unreadable metadata that still says
  `type: ticket` puts the note in the repair lane instead of hiding it.
- **Duplicates** are computed at query time over every companion workspace and
  reported on every copy; nothing is merged.
- **Navigation.** Kiro Notes on 0.10.0rc4 can only be opened as an app
  (`/md-notebook`), so clicking a card or TODO goes there, and every card and
  TODO offers its note's file name to copy. Cards also show that file name
  when their title differs from it.
