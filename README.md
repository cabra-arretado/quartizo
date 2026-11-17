# Quartizo

Quartizo is a [KiroCrew](https://github.com/kirodotdev/KiroCrew) App Kit app for
Markdown notes and tasks in local folders.

- **Notes** browses folders, searches by title or path, and edits Markdown with a preview.
- **Tasks** organizes ticket notes on a Kanban board. Moving a card updates its note.
- **TODOs** groups checkboxes by note and saves completion in the source file.
- **Settings** manages connected folders and board columns and opens notes requests in KiroCrew chat.

Click a card title or the arrow beside a TODO to open that file in Quartizo's
Notes tab. All three tabs use the same Markdown files and share a rebuildable
SQLite index. The backend verifies signed gateway requests and confines file
access to the registered roots. Native Kiro Notes can attach the same folder.
See the [compatibility results](docs/compatibility.md) for tested host versions.

**License: MIT.** See [LICENSE](LICENSE). Bundled third-party code is listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Layout

```
app.json              manifest (name, ui page, backend, permissions)
ui/quartizo-icon.svg  Quartizo's app catalog and sidebar icon
backend/server.py     HTTP backend (stdlib): auth, routing
backend/workspace.py  folder registry + fd-based path confinement
backend/db.py         sqlite3 DB (registry + index) with a migrations table
backend/companion.py  rebuildable index for notes, tickets and TODOs
backend/note_watcher.py  filesystem event adapter
backend/companion_write.py  shared note writer, metadata patches and ordering maintenance
backend/legacy_migration.py preview, backups and resumable old-card conversion
backend/mdsource.py   parsing of one note: ticket frontmatter, title, checkboxes
backend/vendored.py   loads the vendored parser (pinned version, from _vendor only)
backend/_vendor/      ruamel.yaml copied from its hash-pinned wheel
scripts/              vendor_parsers.py: re-create backend/_vendor from its pin
spikes/               phase 1 format experiment (not imported by the app)
ui/                   React + TS + Vite page bundle -> ui/dist/index.mjs
                      App.tsx (tabs), Notes.tsx, Companion.tsx (Tasks, TODOs), Settings.tsx,
                      companionApi.ts (backend client + pure rules), noteNav.ts, ui.tsx
tests/backend/        backend unit tests + real HTTP round-trips
tests/integration/    gateway tests (skip unless a gateway is configured)
docs/                 compatibility, architecture, threat model, dependencies, CHANGELOG
Makefile, ruff.toml, .github/workflows/ci.yml        quality gates
```

## Requirements

- Node 22.12+ and npm (to build the UI; CI uses 22).
- Python 3.10+ (CI tests 3.12 and 3.13). KiroCrew provisions the native file
  watcher and Markdown parser for backlinks from `requirements.txt`.
- macOS or Linux. Windows is unsupported.
- KiroCrew **0.12.0 stable or newer**, with the Notes content-hash save guard
  (not needed for repository tests). The manifest declares `minKiroCrewVersion`.
  Reload native Notes after upgrading so its editor sends the new hash token.
  The backend separately checks its installed KiroCrew package version,
  including prereleases: `0.12.0rc6` and unknown versions keep browsing
  available but refuse file writes; `0.12.0rc7` and newer pass this check.

## Build, lint, test

```bash
cd ui && npm ci && cd ..   # once
python3 -m pip install -r requirements.txt  # runtime dependencies for local tests
make check                 # lint + test + test-formats + dist-check: what CI runs
make lint                  # ruff check . and tsc --noEmit (strict)
make test                  # backend unittest, then `npm test` (builds, then vitest)
make build                 # rebuild ui/dist/index.mjs
make test-browser PYTHON=.venv/bin/python  # real signed backend + disposable-vault browser regressions
```

See [browser test setup](ui/test/browser/README.md) for the Chromium install
and interpreter options. CI runs these regressions on Linux with Python 3.12.

React and the SDK are **not bundled**: they are Rollup externals that the host
resolves through its import map (`HOST_MODULES` in `ui/vite.config.ts`).
`@kirocrew/app-sdk` is not an npm package; its types live in
`ui/src/kirocrew-sdk.d.ts`. Commit `ui/dist/index.mjs`: installs copy the tree
and the gateway serves the built bundle; `dist-check` fails when it is stale.
`make lint` needs `ruff` on PATH (or `make RUFF="uvx ruff"`).

Gateway integration tests (`tests/integration/`) **skip** unless you point them
at a real gateway. They check that the gateway signs proxied requests and that
the backend refuses an unsigned one:

```bash
KIROCREW_GATEWAY_URL=http://127.0.0.1:5476 \
KIROCREW_APP_SECRET_FILE=$HOME/.kiro/crew/apps/quartizo/.app_secret \
KIROCREW_BACKEND_URL=http://127.0.0.1:<backend port> \
python3 -m unittest tests.integration.test_gateway -v
```

## Install into KiroCrew

In KiroCrew **Apps → Discover → Sources**, choose **Add registry** and use
these values:

| Field | Value |
| --- | --- |
| Display name | Quartizo |
| Repo | `https://github.com/cabra-arretado/quartizo` |
| Branch | `main` |

Open the Quartizo listing and click **Install**. If KiroCrew prompts for
execution trust, grant it for Quartizo. Enable the app and open it from the
sidebar. The registry follows `main`, and the app ships with a prebuilt UI.

### Install from a local checkout

```bash
kirocrew config get agent.apps_trusted
kirocrew config get agent.apps_trusted_local
# Include any existing entries when setting either list.
kirocrew config set agent.apps_trusted '["quartizo"]'
kirocrew config set agent.apps_trusted_local '["quartizo"]'
kirocrew app install /absolute/path/to/quartizo
kirocrew app enable quartizo
kirocrew gateway
```

KiroCrew 0.12.0 requires an explicit local-source trust grant for a fresh
local-folder install. The App Store prompts for repository-specific trust
when installing from the registry. Open the app at `/apps/quartizo` in the
dashboard (`kirocrew token` prints the URL).

**Update:** rebuild if the UI changed, then Library -> Quartizo -> **Sync app
from its source directory** (or **Update** in the App Store), and refresh the
page. **Measured on 0.10.0rc4: `kirocrew app uninstall quartizo` keeps your
data but clears the trust**, so check the trust grant after a reinstall.
Back up `quartizo.sqlite3` before upgrading: migrations
are forward-only.

**Dev mode** (UI hot reload): `kirocrew app dev quartizo`, then
`cd ui && npx vite build --watch`; `kirocrew app dev quartizo --off` to stop.
Outside the install root the gateway asks the operator to run it with
`--confirm-out-of-install-root` in their own terminal.

**Data** lives in `$KIROCREW_HOME/apps/quartizo/data/` (default
`~/.kiro/crew/apps/quartizo/data/`): `quartizo.sqlite3` holds the folder
registry, board column settings, derived index, and application
migration/maintenance records. Your notes remain in the registered folders.
Back up application data before
upgrades or legacy-card conversion; deleting only the derived index is safe,
while deleting the data directory also loses registrations and audit state.

## Permissions

`app.json` requests one API grant: `/apps/quartizo/api`, so the page can call
its own backend through the gateway proxy. `backend.signedPrincipal: true` makes
the gateway send a signed claim naming the caller, and the backend refuses
requests without one. Nothing else is requested (no chat, events, storage,
network, sessionApproval or uploads). Earlier versions also asked for
`/api/chat`; updating from one drops that grant.

## Using it

1. In **Settings**, add the absolute path of a local Markdown folder. Open
   **Notes** to browse its subfolders, search by title or path, edit Markdown,
   or create a file at a path such as `Projects/launch.md`. If you also use
   native Kiro Notes, attach the same folder there separately.

   Existing notes open in **Rendered** view by default. Click a block to edit
   it in place, or choose **Raw** to edit the whole file. Edits save when you
   leave the editor. Checking or unchecking a task saves immediately.
   Use **Settings → Notes appearance** to change heading colors and rules for
   rendered notes in this browser.

   In **Rendered** view, `[[Launch]]` opens a note with a unique matching title or,
   if no title matches, a unique filename stem. Use `[[Projects/launch.md]]`
   to specify a path from the folder root, and `[[Projects/launch|Launch plan]]`
   to show an alias. Links resolve within the selected folder without regard
   to case. Unresolved or ambiguous links stay as text. **Backlinks** lists
   other saved notes in that folder that link to the open note.
2. A **ticket** is a note whose frontmatter has `type: ticket`, plus `id` (a
   UUID, or a 32-hex legacy UID), `status` (a configured column's ID) and
   `order` (32 lowercase hex characters, quoted). The default column IDs are
   `backlog`, `ready`, `in_progress`, `review`, and `done`. The ticket title
   comes from its first `# ` heading or its file name.

   ```markdown
   ---
   id: 8423e295-12ce-4b61-a281-d719c1fa86f6
   type: ticket
   status: ready
   order: "7fffffffffffffffffffffffffffffff"
   ---

   # Fix login timeout

   - [ ] Reproduce the timeout
   ```

   The [phase 1 format contract](docs/markdown-tickets-phase1.md) describes
   the original format and rank rules.
3. **Tasks** shows the tickets by status, sorted by `order` (then `id`).
   Tickets without a configured status go to **Needs repair**. Diagnostic
   badges explain metadata problems such as invalid YAML or duplicate ticket
   IDs. Two notes with the same `id` are shown separately. Arrow keys move
   between cards.
   **New ticket** creates a Markdown note; **Use existing note** previews a
   note before adding ticket properties. Change the status selector, drag a
   card into a column or before another card, or choose **Move up** or
   **Move down** from the card’s actions. **Remove ticket…** in the same
   menu removes ticket properties and keeps the note and TODOs.
   Open the card in **Notes** to edit its title and body.
4. **TODOs** lists exactly the checkboxes Kiro Notes shows, grouped by note,
   open ones by default. Like Kiro Notes, Quartizo drops a frontmatter block
   that starts the file, splits the rest on `\n`, skips ```` ``` ```` fences
   and tables (a header and a matching delimiter row, then every non-blank
   line with a pipe), then takes lines `- [ ] text` / `- [x] text` (a `-`
   bullet, lower-case `x`, any indentation). So `*`/`+`/numbered items, `[X]`,
   quoted items, `~~~` fences, table rows and CRLF lines are not checkboxes,
   while an indented line is one. Each ticket card and checklist shows the
   Markdown path below the note title.
   Check or uncheck an item here to update that exact source marker.
5. The backend batches filesystem changes and updates the affected notes.
   Periodic reconciliation reads and hashes each note to catch missed changes.
   **Refresh** runs reconciliation immediately. **Rebuild index** also re-parses
   every note. An incomplete scan or an unreadable note preserves last-known
   state and shows a warning.
6. Turning off **Show in Quartizo** drops the folder's index. **Remove**
   forgets the folder. Nothing on disk changes either way. A folder that still
   has tasks from Quartizo's old database board says how many, and removing it
   deletes them only once you confirm.

### Board columns and working with an agent

In **Settings**, expand **Board columns** under a connected folder. Rename,
reorder, add, or remove columns and choose **Save columns**. The first column
is the default when you create a ticket or use an existing note. A rename
keeps the status ID stored in Markdown. If you remove a column, its tickets
appear in **Needs repair**. Move them to a configured column or add a column
with the same status ID to restore them to the board. Custom status IDs start
with a lowercase letter, use lowercase letters, digits, and underscores, and
are at most 32 characters. Quote them in Markdown frontmatter.

Under the same folder, choose **Ask a Bot or agent**. In the KiroCrew chat
composer, pick a Bot or agent, add your request to
the draft, and send it. The draft includes the folder path, saved column IDs,
and instructions for creating and updating notes, tickets, and TODOs. The
selected agent needs read and write access to the connected folder through
KiroCrew. If the chat needs a project directory, choose the connected folder
in the composer’s project picker. Use **Copy agent prompt** to bring the same
instructions to an existing conversation.

If a Bot is missing from the chat picker, enable
[`dashboard.crewmates_in_agent_picker`](https://github.com/kirodotdev/KiroCrew/blob/main/src/kiro_crew/docs/configuration.md#dashboard)
in KiroCrew and reload the dashboard.

**Shared editing.** Use native Notes with the content-hash save fix. The old
0.10.0rc4 timestamp-only guard could silently overwrite companion changes
([historical evidence](docs/markdown-tickets-phase1.md#native-notes-verification)).
Quartizo write requests carry the hash of the note shown in the view. The
Notes editor keeps your draft when it detects an external edit. Board and TODO
controls display metadata problems and refuse ambiguous writes. Moving a card changes ticket metadata;
checking a TODO changes only its source marker. Neither operation changes
the other's state.

Limits: 200,000 directory entries, 50,000 notes, 32 folder levels, 2 MiB per
note, 2,000 checkboxes per note; the TODO list returns at most 5,000 items.
Hidden folders (`.trash`, `.obsidian`, `.git`) and symlinks are skipped.

### Legacy cards and ordering recovery

In **Settings**, a folder with old database cards offers **Export old tasks**
and **Preview migration**. The preview lists each new path, status and existing
note/session links. **Back up and migrate** creates a database backup and JSON
export under the app's data directory before writing any ticket notes.
Each card gets its own `Quartizo tickets/<legacy-uid>.md`; linked notes stay
untouched. Legacy database rows remain preserved.
Newly generated notes use LF throughout, including converted descriptions;
the preview names any line-ending normalization, and the original database
strings and backup remain unchanged. Generated notes must pass production
parsing before conversion can be verified.

Migration progress is saved in `migration-<workspace-uid>.json`, outside the
derived index. After an interruption, preview again and choose **Resume and
verify migration**. Existing files are never overwritten. Newer edits to an
already-converted note pause verification; review them in Notes, then explicitly
choose to keep their latest contents when resuming. An identity collision must
be repaired before proceeding. Edits to the workspace remain paused until the
conversion is verified. The backup location is shown after completion.

If repeated insertions exhaust the 128-bit ordering gap, **Rebalance…** updates
one column with progress saved under `ticket-maintenance/`. Resume it after an
interruption; an external edit stops it. The confirmation can explicitly keep
the latest note contents and continue changing only ordering. This is a series
of individual file writes; other editors can see intermediate progress.
Maintenance remains available directly in Tasks, including when a creation or
promotion runs out of rank space. Recovery follows persistent ticket IDs after
external renames and refuses ambiguous duplicate IDs.

New-ticket drafts stay in memory per workspace across tab and form-mode
changes. **Cancel** clears that form's draft; reloading the whole browser page
still discards in-memory drafts. A self-drop never changes card ordering.

Keep the application data directory when rebuilding the index: it contains
registrations, backups and recovery journals. For a downgrade to the old
database-board application, restore its pre-migration application backup with
the app stopped. Preserve the converted notes and any later edits separately;
Quartizo never deletes them as an automatic rollback.

## Backend contract

- `GET /health` is unsigned (the gateway probes it directly) -> `{"status":"ok"}`.
- Every other request must carry a valid `X-KiroCrew-Proxy` HMAC **and** a valid
  `X-KiroCrew-Principal` claim, or it gets 401. No secret in the environment:
  503 for everything except `/health`.
- **Every route is dashboard-owner only**: any other principal gets 403
  `owner_session_required`.
- Request bodies are capped at 64 KiB, except note creation and saves. Those
  allow up to 2 MiB of UTF-8 note text plus JSON encoding overhead.
- Errors are JSON `{"error": "<message>", "code": "<stable code>", ...}`; an
  unexpected error is a 500 `internal`, never a dropped connection.

| Route | Body / result |
|---|---|
| `GET /api/status` | app, version and the verified caller `{kind, ownerId}` |
| `GET /api/workspaces` | `{workspaces: [{id, uid, name, path, companion, oldTasks}]}`. `id` is never reused; `uid` is 32 random hex chars per registration; `oldTasks` counts tasks left from the removed database board |
| `POST /api/workspaces` | `{path, name?, companion?}` -> 201 `{workspace}`. `path` must be absolute and is stored as its realpath. Refused: `/`, your home dir itself, `/proc` `/sys` `/dev`, anything overlapping `$KIROCREW_HOME` or another root (409 `root_overlaps`), a folder you do not own or that others can write. `companion: true` includes the folder in Quartizo and queues indexing. A non-boolean is 400 `bad_companion` |
| `GET /api/workspaces/{id}` | `{workspace}` or 404 `workspace_not_found` |
| `DELETE /api/workspaces/{id}[?deleteOldTasks=1]` | Forgets the folder and its index, and stops a running scan. Files are never touched. A folder with old database tasks is refused with 409 `has_old_tasks` (`taskCount`) unless `deleteOldTasks=1`, which deletes them in the same transaction |
| `PUT /api/workspaces/{id}/companion` | `{enabled: true\|false}` -> `{workspace, index}`. On: queues a scan. Off: drops the derived index. 400 `bad_companion` |
| `GET /api/companion` | `{available, error, workspaces: [{workspace, index}]}`. `available` is false (with `error`) when the vendored parser could not be loaded |
| `POST /api/companion/refresh` | `{workspaceId?, rebuild?, manual?}` -> 202 `{requested, skipped}`. Without `workspaceId`: every companion folder. Automatic requests within 10 s of the last scan are skipped; `manual` or `rebuild` are not. `rebuild` re-parses every note |
| `GET /api/workspaces/{id}/board` | `{workspace, index, tickets, notes}`. A ticket is `{path, title, id, status, order, lane, todos: {total, done}, diagnostics, retained, hash, mtimeMs}`; `lane` is its status, or `repair`. 409 `not_companion`, 503 `parsers_unavailable` |
| `GET /api/companion/todos?workspace=&state=` | `{groups: [{workspaceId, workspace, path, title, ticket, ticketId, status, hash, retained, diagnostics, items}], counts: {open, done}, truncated, index}`. An item is `{ordinal, markerStart, line, column, checked, text, depth, heading}` (`markerStart` is a UTF-8 byte offset; line and column are one-based). `state` is `open` (default), `done` or `all` |
| `GET /api/workspaces/{id}/notes` | `{notes: [{path, title}], index}` for the active index |
| `GET /api/workspaces/{id}/backlinks?path=` | `{notes: [{path, title}], truncated}` for up to 200 other notes whose wikilinks resolve to the given path |
| `POST /api/workspaces/{id}/notes` | `{path, content?}` -> 201 `{path, hash}`. Creates a Markdown file and missing parent folders |
| `GET /api/workspaces/{id}/source?path=` | `{path, hash, content}` for an addressable UTF-8 note |
| `PUT /api/workspaces/{id}/source` | `{path, content, expectedHash}` -> `{path, hash}`. Saves Markdown if its source hash still matches |
| `POST /api/workspaces/{id}/tickets` | `{path, title, body?, status?}` creates a ticket with a new UUID and appended rank; existing files are never replaced |
| `POST /api/workspaces/{id}/tickets/promote` | `{path, expectedHash}` adds ticket fields; pre-existing reserved properties refuse promotion |
| `POST /api/workspaces/{id}/tickets/demote` | `{path, expectedHash}` removes ticket fields, preserving the file and body |
| `POST /api/workspaces/{id}/tickets/move` | `{path, expectedHash, status, before?: {path, hash}, after?: {path, hash}}`; `before` is the preceding destination neighbor, `after` the following one. Both omitted appends. Neighbor hashes and adjacency are checked |
| `POST /api/workspaces/{id}/todos/toggle` | `{path, expectedHash, markerStart, line, column, checked}` validates the parsed marker and changes one byte; repeated target state is idempotent |
| `POST /api/workspaces/{id}/tickets/rebalance` | `{status, reconcile?: boolean}` runs/resumes durable column maintenance. Explicit `reconcile: true` preserves newer note contents while applying the planned ranks |
| `GET /api/workspaces/{id}/legacy-tasks` | Full preserved legacy-card JSON export |
| `GET /api/workspaces/{id}/migration` | `{workspace, planHash, tasks, warnings, backupRequired, complete, backup}`; each planned task includes destination, order and relationships |
| `POST /api/workspaces/{id}/migration` | `{planHash, confirm: true, acceptCurrent?: boolean}` backs up and resumes conversion; returns `{backup: {directory, database, export}, migrated, remaining, complete}` |

`index` is `{state, queued, progress, indexedAt, complete, files, retained,
error, maintenance, migrationPending, writeBlocked}`: `state` is `off`, `unavailable`, `unindexed`, `scanning`, `ready`,
`stale` (the last scan failed; the previous one is shown) or `error`. The files
are authoritative: deleting every `companion_*` row and rescanning gives the
same results. Diagnostic codes are in
[docs/markdown-tickets-phase1.md](docs/markdown-tickets-phase1.md).

See [docs/threat-model.md](docs/threat-model.md) for path confinement (no `..`,
no hidden segments, no symlinks followed, fd-relative opens).

`writeBlocked` is null or `{code, message}` and is also returned by
`GET /api/companion`. A failed native-version prerequisite disables mutation
controls and the backend refuses file writes with `host_upgrade_required`.
Registry sharing/removal and mutation publication use the same lock. Identity
inventories still read and hash live files, but reuse metadata for unchanged
hashes; cold inventory work exceeding five seconds queues a background scan
and returns `index_not_ready` without publishing a file.
