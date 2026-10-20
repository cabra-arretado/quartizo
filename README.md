# Quartizo

A third-party [KiroCrew](https://github.com/kirodotdev/KiroCrew) App Kit app.
It is an Obsidian-like workspace of real `.md` files. You register folders
(for example an existing Obsidian vault), then browse, search, edit and
preview their notes from the dashboard. The files stay plain Markdown on
disk. The page also has a **Chat** tab with a Quartizo-created chat session
(`ChatEmbed` on a slot the page creates; it is owned by the dashboard owner,
not by the app, see [compatibility](docs/compatibility.md)). A stdlib Python
backend verifies the gateway's signed proxy requests and does all file
access, confined to the registered folders.

Scope so far: workspaces and notes (M1), note context to the workspace chat
(M2, [docs/m2.md](docs/m2.md)), per-workspace task metadata with a Kanban
board (M3, QTZ-008/009; see [Tasks](#tasks-projects) below), and a
**read-only** Git view of registered repositories (M4, QTZ-010/011; see
[Git](#git-read-only) below). Quartizo never stages, commits or writes to a
repository.

Written against KiroCrew `main` @ `f62ab4fdb2bb0e492cd99325c596ec9e738abb70`
(after release v0.9.0) and checked against an installed **kirocrew 0.10.0rc4**
gateway. See [docs/compatibility.md](docs/compatibility.md) for what was
measured and what is not verified.

**License: TBD.** No license has been chosen yet; there is intentionally no
`LICENSE` file.

## Layout

```
app.json              manifest (name, ui page, backend, permissions)
assets/icon.png       512x512 opaque placeholder (same as `kirocrew app init`)
backend/server.py     stdlib-only HTTP backend: auth, routing
backend/workspace.py  workspace root registry + fd-based path confinement
backend/db.py         sqlite3 DB (registry + tasks) with a migrations table
backend/notes.py      .md list/search/read/create/update/rename/delete
backend/tasks.py      task CRUD, ordered moves, JSON import/export (M3)
backend/gitrepo.py    repo registry + hardened read-only git: status, diff (M4)
ui/                   React + TS + Vite page bundle -> ui/dist/index.mjs
                      (src/*.ts: tested logic; src/*.tsx: components)
tests/backend/        backend auth unit tests + real HTTP round-trips
tests/integration/    gateway tests (skip unless a gateway is configured)
docs/                 App Kit notes, compatibility, architecture, threat model
```

## Requirements

- Node 22.12+ (24 LTS recommended upstream; developed on Node 26) and npm.
- Python 3.10+ (stdlib only; the backend has no dependencies).
- A running KiroCrew gateway to actually use the app (not needed for tests).

## Build the UI

```bash
cd ui
npm install
npm run typecheck     # tsc --noEmit
npm run build         # -> ui/dist/index.mjs
```

React, the SDK and friends are **not bundled**: they are Rollup externals that
the host resolves through its import map (`HOST_MODULES` in
`ui/vite.config.ts`). `@kirocrew/app-sdk` is not an npm package; its types live
in `ui/src/kirocrew-sdk.d.ts`.

Commit `ui/dist/index.mjs`: installs copy the tree and the gateway serves the
built bundle.

## Run the tests

```bash
# backend: auth acceptance/refusal + real HTTP round-trips (no dependencies)
python3 -m unittest discover -s tests -t . -v

# frontend: notes, tasks and git clients, editor/conflict state, line endings,
# Markdown XSS, list navigation, board ordering and keyboard moves, note and
# task context formatting, diff line classification, changed-files keys,
# slot logic with the SDK mocked, plus a
# bundle-imports check (that one skips until `npm run build` has run)
cd ui && npm test
```

`npm test` builds the bundle first; the bundle check fails if
`ui/dist/index.mjs` is missing.

Gateway integration tests (`tests/integration/`) are part of the first
command and **skip** unless you point them at a real gateway. The
owner-cookie tests check what the shipped page actually gets. The app-token
tests are contract tests for a future backend-mediated path and do not reflect
the shipped UI.

```bash
KIROCREW_GATEWAY_URL=http://127.0.0.1:5476 \
KIROCREW_APP_SECRET_FILE=$HOME/.kiro/crew/apps/quartizo/.app_secret \
python3 -m unittest tests.integration.test_gateway -v
# optional:
#   KIROCREW_OWNER_TOKEN=<your dashboard session token>   (owner-cookie tests;
#       export it yourself, the tests never read it from disk)
#   KIROCREW_BACKEND_URL=http://127.0.0.1:<backend port>  (direct unsigned hit)
#   KIROCREW_FOREIGN_SLOT=<a slot quartizo does not own>
```

The tests exchange the app's own secret for fresh app tokens
(`POST /api/apps/quartizo/token`) and never print them.

## Install into KiroCrew

```bash
kirocrew gateway                                       # in its own terminal
cd ui && npm install && npm run build && cd ..
kirocrew app install /absolute/path/to/quartizo        # copies + registers
```

Third-party apps must be **trusted** before they can be enabled or run a
backend: Dashboard -> Settings -> Security -> Third-party apps, and trust
`quartizo` (stored as the JSON array `agent.apps_trusted`, e.g. `["quartizo"]`).
No `kirocrew app trust` command exists (checked on 0.10.0rc4). Until trusted,
`kirocrew app install` registers the app but warns "registration blocked by
execution policy", and `kirocrew app enable quartizo` is refused.

```bash
kirocrew app enable quartizo
kirocrew app info quartizo
```

The enable/consent dialog lists the permissions below. Open the app at
`/apps/quartizo` in the dashboard (`kirocrew token` prints the URL).

### Dev mode (UI hot reload)

```bash
kirocrew app dev quartizo          # symlinks the installed ui/ dir to this repo's ui/
cd ui && npx vite build --watch    # rebuild on save; the page reloads on app_reload
kirocrew app dev quartizo --off
```

If this repo lives outside the install root, the gateway requires the operator
to run `kirocrew app dev quartizo --confirm-out-of-install-root` in their own
terminal (agent shells are refused). Backend changes need the app disabled and
re-enabled (unverified: whether dev mode restarts the backend is unspecified
upstream). Without dev mode:
rebuild, then press **Update** in the App Store, then refresh.

## Permissions (and why)

| Grant | Why |
|---|---|
| `permissions.api: "/api/chat"` | `ChatEmbed` reads `GET /api/chat/slots/{slot}`, stops via `/api/chat/slots/{slot}/stop`, approves via `/api/chat/slots/{slot}/approve`; the page creates its slot with `POST /api/chat/slots` and sends with `POST /api/chat`. The matcher grants the prefix and its `/` children, so this one entry covers all of them. |
| `permissions.api: "/apps/quartizo/api"` | The page calls its own backend through the gateway proxy (`/apps/quartizo/api/status`, `/workspaces/...`). The notes feature needs no other grant. The SDK client refuses any path not declared; builtin apps declare their own proxy prefix the same way. |
| `backend.signedPrincipal: true` | Not a permission, but security-relevant: the backend receives a signed claim naming the caller kind and refuses requests without one. |
| *M3: no change* | The task routes sit under the already granted `/apps/quartizo/api`. The board's transcript link, status poll and `openChat` draft use the same `/api/chat` grant and host hooks as M2. `app.json` is unchanged |
| *M4: no change* | The Git routes sit under the already granted `/apps/quartizo/api`; `app.json` is unchanged. The backend runs the host's `git` binary itself (no App Kit permission covers or restricts that) |
| *not granted:* `permissions.sessionApproval` | It lets an app act on **any** local user session, far beyond the sessions Quartizo creates. Per the gateway source, page requests made with `useAppApi()` carry the dashboard owner's session cookie, not an app token, so Approve/Reject in the embed are decided as the owner and do not need this grant. If a host ever runs the page under an app token, those decisions return 403 `session_approval_not_granted`, which the page reports. Adding the grant later disables the app until the user re-enables it. |
| *not granted:* `/api/upload/file` | Attachments are **unsupported**: without this grant the embed hides its attach control and uploads are refused. |
| *not granted:* `events`, `storage`, `cron`, `network`, `memory`, `mcpTools`, ... | Unused. `ChatEmbed` polls; it does not need WS events. |

## Using the board (Tasks tab)

The **Tasks** tab shows the board of the workspace selected in **Notes** (one
project per workspace). Columns: Backlog, Ready, In Progress, Review, Done.

1. **Add task** creates a card (title plus column). Click a card's title to
   open its details: edit the title and the Markdown description (Edit /
   Preview, sanitized like notes), **Save** (Ctrl/Cmd+S), **Delete…** asks
   first.
2. **Move** a card by dragging it (native HTML5 drag and drop), or with its
   ← ↑ ↓ → buttons (each has an aria label such as "Move “x” to Ready";
   focus stays on the card). A move only changes the column and position.
   It never starts, messages or stops an agent.
3. **Links.** *Link current note* stores the note open in Notes;
   *Open in Notes* opens it there (through the notes API). *Link this
   workspace chat* stores the workspace's chat session (open the Notes chat
   column once first). A linked session gets *Open transcript in KiroCrew
   chat* and, for the workspace chat, *Show in Notes chat column*. Its state
   (idle / running / …) is shown read-only and never changes the card's
   column.
4. **Agent prompt.** *Prepare agent prompt…* shows the exact task context
   block (bounded to 8 KB). *Open in full chat as draft* hands it to
   KiroCrew's chat page with `autoSend: false`: you review and send it there.
5. If the task changed elsewhere (another tab), Save is refused and a notice
   offers **Reload**, **Keep editing** or **Overwrite with my version…**. A
   stale move is refused and the board reloads.
6. **Export JSON** / **Import JSON…**. Importing into a board that has tasks
   asks before replacing them; tasks that exist in another workspace can be
   imported as copies.

Removing a workspace that has tasks asks again and deletes its tasks too.
Export first to keep them.

## Using Git (Git tab)

1. **Add repository**: enter the absolute path of a repository's top-level
   folder (the one containing `.git`). A linked worktree or a submodule
   checkout can be registered too. Several repositories can be registered;
   the picker switches between them. Switching only changes this tab's
   view: nothing global (no workspace, chat or agent working directory)
   changes.
2. The header shows the branch (or `detached at …`), its upstream with
   ahead/behind counts, and how many files are staged, unstaged, untracked
   or conflicted. **Refresh** reloads (the tab also reloads when you come
   back to it).
3. The changed-files list: arrow keys / Home / End / PageUp / PageDown move
   and show that file's diff, **Enter** moves focus into the diff, **s**
   switches **Unstaged** (work tree vs index) and **Staged** (index vs
   HEAD) when a file has both. In the diff, arrows / PageUp / PageDown /
   Home / End scroll.
4. Diffs over 512 KiB are cut (it says so), binary files are marked, and
   files over 8 MiB are not diffed. Untracked files show as all-added;
   ignored files are not listed.
5. **Remove…** forgets the repository in Quartizo. Nothing on disk changes.

## Using the notes

1. Open the app, **Notes** tab, then **Add workspace**. Enter an absolute folder
   path (not `/` and not your home directory itself; a folder inside it).
2. Pick a note in the list (arrow keys + Enter work) or **New note**
   (`folder/name`; `.md` is added). Search filters by path. Tick
   **Search contents** to search inside notes too.
3. Edit in the textarea. **Ctrl/Cmd+S** saves. **Edit / Split / Preview**
   switches the view. The preview is sanitized (no raw HTML, no scripts, no
   images loaded, only http(s)/mailto links).
4. If the file changed on disk since you opened it, Save is refused and a
   notice offers **Reload from disk**, **Keep editing** or **Overwrite with my
   version…** (explicit, never automatic).
5. **Delete…** asks first, then moves the note to `<workspace>/.trash/`.

Notes that mix line-ending styles open read-only: a textarea would normalize
them. See [docs/architecture.md](docs/architecture.md) for the editor
choice.

## Backend contract

- `GET /health` is unsigned (the gateway probes it directly) -> `{"status":"ok"}`.
- Every other request must carry a valid `X-KiroCrew-Proxy` HMAC **and** a
  valid `X-KiroCrew-Principal` claim. Otherwise: 401. No secret in the
  environment: 503 for everything except `/health`.
- **Every route is dashboard-owner only**: a principal other than
  `owner-session` gets 403 `owner_session_required`.
- `GET /api/status` (reached as `/apps/quartizo/api/status`) -> app, version and
  the verified caller `{kind, ownerId}`.
- Errors are JSON `{"error": "<message>", "code": "<stable code>", ...}`.

### Workspaces

A workspace is a folder of plain `.md` files that the owner explicitly
registers. Registry data lives in `quartizo.sqlite3` in the app data dir,
`$KIROCREW_HOME/apps/quartizo/data/` (default `~/.kiro/crew/apps/quartizo/data/`;
installs keep `data/` across updates). The DB holds the registry and task
metadata (M3). Note content stays in the files.

| Route | Body / result |
|---|---|
| `GET /api/workspaces` | `{workspaces: [{id, uid, name, path}]}`. `id` is never reused (AUTOINCREMENT); `uid` is 32 random hex chars per registration, used by the UI to key per-workspace state |
| `POST /api/workspaces` | `{path, name?}` -> 201 `{workspace}`. `path` must be absolute and is stored as its realpath. Refused: `/`, your home dir itself, anything overlapping `$KIROCREW_HOME` or another root (409 `root_overlaps`) |
| `GET /api/workspaces/{id}` | `{workspace}` or 404 `workspace_not_found` |
| `DELETE /api/workspaces/{id}[?deleteTasks=1]` | Forgets the root. Files are never touched. A workspace that still has tasks is refused with 409 `project_has_tasks` (`taskCount`) unless `deleteTasks=1`, which deletes its tasks in the same transaction |

See [docs/threat-model.md](docs/threat-model.md) for path confinement
(no `..`, no hidden segments, no symlinks followed, fd-relative opens).

### Git (read only)

Registered repos live in the same DB (migration 4, table `repos`). The page
sends only a repo id, a path and a mode: every git argv is built in
`backend/gitrepo.py` from fixed lists. See
[threat-model §5](docs/threat-model.md#5-git-read-only-m4) for how git is run.

| Route | Body / result |
|---|---|
| `GET /api/repos` | `{repos: [{id, uid, name, path}]}` (no git call) |
| `POST /api/repos` | `{path, name?}` -> 201 `{repo}`. The workspace root policy (absolute, realpath, not `/`, not `$HOME` itself, not `/proc` `/sys` `/dev`, not overlapping `$KIROCREW_HOME` or the data dir, owned by you, not group/world-writable), plus: `.git` must be a directory or `gitdir:` file (not a symlink) and `git rev-parse --show-toplevel` must be the path itself. 400 `not_a_repo` / `not_repo_toplevel`, 409 `repo_exists` (same path or inode) |
| `GET /api/repos/{id}` | `{repo}` or 404 `repo_not_found` |
| `DELETE /api/repos/{id}` | Forgets the repo. Nothing on disk is touched |
| `GET /api/repos/{id}/info` | `{repo, head, counts, clean, gitDir, shallow}`. `head` is `{oid, branch, detached, unborn, upstream, ahead, behind}`; `counts` is `{staged, unstaged, untracked, conflicted}`; `gitDir` is `directory`, `linked-worktree` or `gitfile` (submodule or separate git dir) |
| `GET /api/repos/{id}/status` | `{repo, head, counts, clean, entries, truncated}` from `git status --porcelain=v2 -z --branch --untracked-files=normal`. An entry is `{path, origPath, kind, index, worktree, staged, unstaged, submodule, submoduleCommitChanged, score, diffable}`; `kind` is `changed`, `renamed`, `copied`, `unmerged` or `untracked`. At most 5000 entries; output over 4 MiB is 413 `status_too_large` |
| `GET /api/repos/{id}/diff?path=&mode=&orig=` | `{path, mode, origPath, diff, binary, truncated, untracked}`. `mode` is `worktree` (work tree vs index, `git diff-files`) or `staged` (index vs HEAD, or vs the empty tree before the first commit, `git diff-index --cached`). `orig` (staged only) pairs a rename. `diff` is at most 512 KiB, cut at a line (`truncated`). 413 `file_too_large` over 8 MiB on either side. An untracked, not ignored file is shown as all-added (read by Quartizo, fd-relative, no symlink followed); anything else that is not in the index is 404 `not_changed` |

`path` / `orig` follow the note path rules (relative, `/`-separated, no
`..`, `.`, empty segments, backslash or control characters), except that
dot segments such as `.gitignore` are allowed and any `.git` segment (any
case) is refused. They reach git only as `-- :(literal)<path>`. Git
failures answer 504 `git_timeout` (10 s), 503 `git_unavailable` /
`git_too_old` (git 2.38+ is needed), 409 `not_a_repo` / `root_changed` /
`git_link_refused` / `too_many_filters`, or 500 `git_failed`, never with
git's stderr.

### Notes

Paths are relative to the workspace root, `/`-separated, and must end in
`.md`. Query values are percent-decoded once (encode with
`encodeURIComponent`; a raw `+` would decode to a space). `hash` is the hex
SHA-256 of the file's bytes. `content` is the file's exact UTF-8 text, BOM and
line endings included. Files that are not valid UTF-8 are refused (415
`not_utf8`) and never rewritten.

| Route (under `/api/workspaces/{id}`) | Body / result |
|---|---|
| `GET /notes?q=&content=1` | `{files: [{path, size, mtimeMs, match?, snippet?}], truncated}`. Without `q`: every `.md`. With `q`: a case-insensitive substring of the path, plus file contents when `content=1`. Bounded to 2000 results, depth 12, 20000 scanned entries, 64 MiB / 5 s of content search. Hidden entries and symlinks are skipped |
| `GET /note?path=` | `{path, content, hash, size, mtimeMs}`. 413 over 2 MiB |
| `POST /note` | `{path, content}` -> 201 `{path, hash, size, mtimeMs}`. Creates missing folders; 409 `exists` instead of overwriting |
| `PUT /note` | `{path, content, expectedHash}` -> `{path, hash, size, mtimeMs}`. 409 `conflict` with `currentHash` (null if deleted) / `currentMtimeMs` when the file changed since it was read |
| `POST /rename` | `{from, to, expectedHash?, overwrite?, confirm?}` -> `{path, trashed}`. An existing `to` is 409 `exists` unless **both** `overwrite: true` and `confirm: true`; then the displaced note goes to `.trash` first |
| `POST /delete` | `{path, confirm: true, expectedHash?}` -> `{trashed}`. Without `confirm: true`: 400 `confirm_required` |

**Writes** are atomic: a temp file in the same folder, `fsync`, then
`os.replace` (update) or `link` (create, rename and trash, which fail instead
of clobbering), then `fsync` of the folder. An update keeps the file's mode.
Notes are capped at 2 MiB on read and on write.

**Delete never unlinks.** It moves the note to `<workspace>/.trash/<same
relative path>`, the folder Obsidian uses for its own trash, adding ` 1`,
` 2`... on a name collision. Restore or empty `.trash` with any file manager;
the API cannot reach it (hidden segment).

**Conflicts.** The hash decides, not the mtime: mtime can have coarse
granularity and changes without a content change. `mtimeMs` is returned for
display. The current hash is re-checked after the temp file is written and
right before the replace, so an external edit is never silently overwritten.
A residual window of microseconds between that check and `os.replace` remains
(see the threat model).
- Binds `127.0.0.1:$PORT` only and never logs headers, the query string or the
  secret.

### Tasks (projects)

**One project is one registered workspace**, identified by the workspace
`uid`; see [architecture](docs/architecture.md#projects-and-tasks-m3) for why.
Tasks live in the same SQLite DB (migration 3). Nothing about a task is
written to the workspace folder.

A task is `{id, uid, project_id, title, description_markdown, status, order,
version, note_ref, slot_id, created_at, updated_at}`:

| Field | Rules |
|---|---|
| `id` / `uid` | integer, never reused / 32 random hex chars |
| `project_id` | the workspace `uid` |
| `title` | 1..200 characters after trimming, one line, no control characters |
| `description_markdown` | at most 64 KiB of UTF-8 (413 `description_too_large`), no NUL. Rendered with the same sanitizer as notes |
| `status` | `backlog`, `ready`, `in_progress`, `review` or `done`. Human-assigned only; changed only through `/move` |
| `order` | dense 0..n-1 inside one column, rewritten by moves in the same transaction |
| `version` | starts at 1, bumped by every write to the task: the concurrency token |
| `note_ref` | optional workspace-relative `.md` path, validated with the notes path rules. Never opened by the task code; the UI opens it through `GET .../note` |
| `slot_id` | optional Quartizo chat session name (`isSlotName` rules). A workspace session must be this workspace's. A label only: the backend never calls the chat API |
| `created_at` / `updated_at` | Unix milliseconds |

| Route (under `/api/workspaces/{id}`) | Body / result |
|---|---|
| `GET /tasks` | `{project: {id, workspaceId, name}, statuses, tasks}`, ordered by column then `order` |
| `POST /tasks` | `{title, description_markdown?, status?, note_ref?, slot_id?}` -> 201 `{task}`, appended to its column. At most 2000 tasks per project (409 `too_many_tasks`) |
| `GET /tasks/{taskId}` | `{task}` or 404 `task_not_found` (also for a task of another project) |
| `PATCH /tasks/{taskId}` | `{expectedVersion, title?, description_markdown?, note_ref?, slot_id?}` -> `{task}`. `status`, `order` and any other key: 400 `bad_field` |
| `POST /tasks/{taskId}/move` | `{expectedVersion, status, index}` -> `{task, moved, tasks}`. `index` is the position in the target column (clamped). Only the moved task's `version` / `updated_at` change |
| `POST /tasks/{taskId}/delete` | `{expectedVersion, confirm: true}` -> `{ok}`. Without `confirm: true`: 400 `confirm_required` |
| `GET /tasks/export` | `{format: "quartizo.tasks", version: 1, exported_at, project: {id, name}, tasks: [...]}` |
| `POST /tasks/import` | `{data: <export>, replace?, confirm?, newUids?}` -> `{imported, replaced, tasks}` |

**Stale writes.** Update, move and delete need the `version` last read. If
the task changed since, the answer is 409 `stale` with `currentVersion` and
the current `task`, and nothing is written.

**Import** is validated completely before anything is written, then applied
in one transaction (all or nothing). Every field and every key is checked
(unknown keys are refused). Limits: 4 MiB request body, 2000 tasks. A
project that already has tasks is refused with 409 `project_not_empty`
unless `replace: true` **and** `confirm: true`; then its tasks are replaced
in the same transaction. A `uid` used by a task of another project is
refused with 409 `uid_conflict` unless `newUids: true` (import as copies).
A `slot_id` naming another workspace's session is refused, so a copy into
another workspace needs those links removed from the file first.
