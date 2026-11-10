# Quartizo

A third-party [KiroCrew](https://github.com/kirodotdev/KiroCrew) App Kit app:
an editable task companion to native **Kiro Notes**. You keep writing in Kiro
Notes; Quartizo shares the same folder and provides

- **Tasks**: a Kanban board whose card moves update the ticket notes;
- **TODOs**: checkboxes grouped by note, with completion saved in the source;
- **Settings** manages connected folders and opens notes requests in KiroCrew chat.

Use a card title or the arrow beside a TODO to open Kiro Notes. Copy the note
name from the card’s actions or the checklist header and paste it into Kiro
Notes’ search to find the file. Ticket metadata and checkbox completion live
in your Markdown files. SQLite holds a rebuildable index of that data.

A Python backend (standard library, plus ruamel.yaml vendored in
`backend/_vendor/`) verifies the gateway's signed proxy requests and keeps a
rebuildable index of the folders, reading them through fd-relative, symlink-
refusing opens confined to the registered roots.

Written against KiroCrew `main` @ `f62ab4fdb2bb0e492cd99325c596ec9e738abb70`
(after release v0.9.0) and checked against an installed **kirocrew 0.10.0rc4**
gateway for the original read-only release. Shared editing needs the native
Notes content-hash save guard from
[KiroCrew PR #22790](https://github.com/kirodotdev/KiroCrew/pull/22790), merged
November 4. See [docs/compatibility.md](docs/compatibility.md) for historical
measurements and the [current plan](docs/markdown-tickets-plan.md) for shared
editing acceptance checks.

**License: MIT.** See [LICENSE](LICENSE). Bundled third-party code is listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Layout

```
app.json              manifest (name, ui page, backend, permissions)
assets/icon.png       512x512 opaque placeholder (same as `kirocrew app init`)
backend/server.py     HTTP backend (stdlib): auth, routing
backend/workspace.py  folder registry + fd-based path confinement
backend/db.py         sqlite3 DB (registry + index) with a migrations table
backend/companion.py  bounded scan and the rebuildable ticket/TODO index
backend/companion_write.py  source-preserving ticket/TODO writes and durable ordering maintenance
backend/legacy_migration.py preview, backups and resumable old-card conversion
backend/mdsource.py   parsing of one note: ticket frontmatter, title, checkboxes
backend/vendored.py   loads the vendored parser (pinned version, from _vendor only)
backend/_vendor/      ruamel.yaml copied from its hash-pinned wheel
scripts/              vendor_parsers.py: re-create backend/_vendor from its pin
spikes/               phase 1 format experiment (not imported by the app)
ui/                   React + TS + Vite page bundle -> ui/dist/index.mjs
                      App.tsx (tabs), Companion.tsx (Tasks, TODOs), Settings.tsx,
                      companionApi.ts (backend client + pure rules), noteNav.ts, ui.tsx
tests/backend/        backend unit tests + real HTTP round-trips
tests/integration/    gateway tests (skip unless a gateway is configured)
docs/                 compatibility, architecture, threat model, dependencies, CHANGELOG
Makefile, ruff.toml, .github/workflows/ci.yml        quality gates
```

## Requirements

- Node 22.12+ and npm (to build the UI; CI uses 22).
- Python 3.10+ (nothing to install; CI tests 3.12 and 3.13).
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
kirocrew gateway                                       # in its own terminal
kirocrew app install /absolute/path/to/quartizo        # copies + registers
kirocrew config get agent.apps_trusted                 # see what is already trusted
kirocrew config set agent.apps_trusted '["quartizo"]'  # replaces the list: include existing entries
kirocrew app enable quartizo
```

Third-party apps must be trusted before they can be enabled or run a backend
(also in Dashboard -> Settings -> Security -> Third-party apps; there is no
`kirocrew app trust` command on 0.10.0rc4). Open the app at `/apps/quartizo`
in the dashboard (`kirocrew token` prints the URL).

**Update:** rebuild if the UI changed, then Library -> Quartizo -> **Sync app
from its source directory** (or **Update** in the App Store), and refresh the
page. **Measured on 0.10.0rc4: `kirocrew app uninstall quartizo` keeps your
data but clears the trust**, so after a reinstall set `agent.apps_trusted` and
enable the app again. Back up `quartizo.sqlite3` before upgrading: migrations
are forward-only.

**Dev mode** (UI hot reload): `kirocrew app dev quartizo`, then
`cd ui && npx vite build --watch`; `kirocrew app dev quartizo --off` to stop.
Outside the install root the gateway asks the operator to run it with
`--confirm-out-of-install-root` in their own terminal.

**Data** lives in `$KIROCREW_HOME/apps/quartizo/data/` (default
`~/.kiro/crew/apps/quartizo/data/`): `quartizo.sqlite3` holds the folder
registry, derived index, and application migration/maintenance records. Your
notes remain in the registered folders. Back up application data before
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

1. Attach a folder in Kiro Notes (**Attach a folder**). In Quartizo's
   **Settings**, add the same folder's absolute path. It is registered and
   shared with Kiro Notes in one step; nothing on disk changes.
2. A **ticket** is a note whose frontmatter has `type: ticket`, plus `id` (a
   UUID, or a 32-hex legacy UID), `status` (`backlog`, `ready`, `in_progress`,
   `review`, `done`) and `order` (32 lowercase hex characters, quoted). Its
   title is its first `# ` heading, or its file name:

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

   The full format contract is in
   [docs/markdown-tickets-phase1.md](docs/markdown-tickets-phase1.md).
3. **Tasks** shows the tickets by status, sorted by `order` (then `id`).
   Tickets with missing or invalid fields, or metadata Quartizo cannot read
   safely (invalid YAML, duplicate keys, anchors), go to a **Needs repair**
   lane; the badge says why. Two notes with the same `id` are both shown and
   both flagged, never merged. Arrow keys move between cards.
   **New ticket** creates a Markdown note; **Use existing note** previews a
   note before adding ticket properties. Change the status selector, drag a
   card into a column or before another card, or choose **Move up** or
   **Move down** from the card’s actions. **Remove ticket…** in the same
   menu removes ticket properties and keeps the note and TODOs.
   Native Notes remains the editor for its title and body.
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
5. The views rescan when they open, every 30 s while shown, and on
   **Refresh**; **Rebuild index** in Settings re-parses everything. Every scan
   reads and hashes every note, so an edit that kept the file's timestamp is
   still seen. An incomplete scan or an unreadable note is called out, and such
   notes keep their last known state instead of disappearing.
6. Unticking **Shared with Kiro Notes** drops the folder's index; **Remove**
   forgets the folder. Nothing on disk changes either way. A folder that still
   has tasks from Quartizo's old database board says how many, and removing it
   deletes them only once you confirm.

### Working with a Bot or agent

In **Settings**, expand **Work with a Bot or agent** under your connected
notes folder and choose **Open in KiroCrew chat**. In the chat composer, pick
a Bot or agent, add your request to the draft, and send it. The draft includes
the folder path, board column IDs, and instructions for creating and updating
notes, tickets, and TODOs. The selected agent needs read and write access to
the connected folder through KiroCrew. If the chat needs a project directory,
choose the connected folder in the composer’s project picker. Use **Copy
agent prompt** to bring the same instructions to an existing conversation.

If a Bot is missing from the chat picker, enable
[`dashboard.crewmates_in_agent_picker`](https://github.com/kirodotdev/KiroCrew/blob/main/src/kiro_crew/docs/configuration.md#dashboard)
in KiroCrew and reload the dashboard.

**Shared editing.** Use native Notes with the content-hash save fix. The old
0.10.0rc4 timestamp-only guard could silently overwrite companion changes
([historical evidence](docs/markdown-tickets-phase1.md#native-notes-verification)).
Quartizo write requests carry the hash of the note shown in the view; an
external edit requires refreshing before retrying. Malformed metadata,
duplicate ticket IDs, and mixed line endings stay visible with diagnostics
and refuse mutation until repaired. Moving a card changes ticket metadata;
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
- Bodies over 64 KiB get 413 before they are read.
- Errors are JSON `{"error": "<message>", "code": "<stable code>", ...}`; an
  unexpected error is a 500 `internal`, never a dropped connection.

| Route | Body / result |
|---|---|
| `GET /api/status` | app, version and the verified caller `{kind, ownerId}` |
| `GET /api/workspaces` | `{workspaces: [{id, uid, name, path, companion, oldTasks}]}`. `id` is never reused; `uid` is 32 random hex chars per registration; `oldTasks` counts tasks left from the removed database board |
| `POST /api/workspaces` | `{path, name?, companion?}` -> 201 `{workspace}`. `path` must be absolute and is stored as its realpath. Refused: `/`, your home dir itself, `/proc` `/sys` `/dev`, anything overlapping `$KIROCREW_HOME` or another root (409 `root_overlaps`), a folder you do not own or that others can write. `companion: true` also shares it with Kiro Notes (same insert) and queues a scan; a non-boolean is 400 `bad_companion` |
| `GET /api/workspaces/{id}` | `{workspace}` or 404 `workspace_not_found` |
| `DELETE /api/workspaces/{id}[?deleteOldTasks=1]` | Forgets the folder and its index, and stops a running scan. Files are never touched. A folder with old database tasks is refused with 409 `has_old_tasks` (`taskCount`) unless `deleteOldTasks=1`, which deletes them in the same transaction |
| `PUT /api/workspaces/{id}/companion` | `{enabled: true\|false}` -> `{workspace, index}`. On: queues a scan. Off: drops the derived index. 400 `bad_companion` |
| `GET /api/companion` | `{available, error, workspaces: [{workspace, index}]}`. `available` is false (with `error`) when the vendored parser could not be loaded |
| `POST /api/companion/refresh` | `{workspaceId?, rebuild?, manual?}` -> 202 `{requested, skipped}`. Without `workspaceId`: every companion folder. Automatic requests within 10 s of the last scan are skipped; `manual` or `rebuild` are not. `rebuild` re-parses every note |
| `GET /api/workspaces/{id}/board` | `{workspace, index, tickets, notes}`. A ticket is `{path, title, id, status, order, lane, todos: {total, done}, diagnostics, retained, hash, mtimeMs}`; `lane` is its status, or `repair`. 409 `not_companion`, 503 `parsers_unavailable` |
| `GET /api/companion/todos?workspace=&state=` | `{groups: [{workspaceId, workspace, path, title, ticket, ticketId, status, hash, retained, diagnostics, items}], counts: {open, done}, truncated, index}`. An item is `{ordinal, markerStart, line, column, checked, text, depth, heading}` (`markerStart` is a UTF-8 byte offset; line and column are one-based). `state` is `open` (default), `done` or `all` |
| `GET /api/workspaces/{id}/source?path=` | `{path, hash, content}` for an addressable UTF-8 note in a companion folder; used for explicit promotion preview |
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
