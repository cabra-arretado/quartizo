# Quartizo

A third-party [KiroCrew](https://github.com/kirodotdev/KiroCrew) App Kit app:
a read-only companion to native **Kiro Notes**. You keep writing in Kiro
Notes; Quartizo reads the same folder and shows

- **Tasks**: a Kanban board of the folder's ticket notes, by status;
- **TODOs**: every checkbox Kiro Notes shows, grouped by note;
- **Settings**: the folders Quartizo reads.

Clicking a card or a TODO opens Kiro Notes. Kiro Notes cannot be told which
note to open, so every card and TODO has a **Copy name** button: paste the
name into Kiro Notes' search. Quartizo never writes a note.

A Python backend (standard library, plus ruamel.yaml vendored in
`backend/_vendor/`) verifies the gateway's signed proxy requests and keeps a
rebuildable index of the folders, reading them through fd-relative, symlink-
refusing opens confined to the registered roots.

Written against KiroCrew `main` @ `f62ab4fdb2bb0e492cd99325c596ec9e738abb70`
(after release v0.9.0) and checked against an installed **kirocrew 0.10.0rc4**
gateway. See [docs/compatibility.md](docs/compatibility.md) for what was
measured and what is not verified.

**License: MIT.** See [LICENSE](LICENSE). Bundled third-party code is listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Layout

```
app.json              manifest (name, ui page, backend, permissions)
assets/icon.png       512x512 opaque placeholder (same as `kirocrew app init`)
backend/server.py     HTTP backend (stdlib): auth, routing
backend/workspace.py  folder registry + fd-based path confinement
backend/db.py         sqlite3 DB (registry + index) with a migrations table
backend/companion.py  read-only scan and the rebuildable ticket/TODO index
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
Makefile, pyproject.toml, .github/workflows/ci.yml   quality gates
```

## Requirements

- Node 22.12+ and npm (to build the UI; CI uses 22).
- Python 3.10+ (nothing to install; CI tests 3.12 and 3.13).
- macOS or Linux. Windows is unsupported.
- A running KiroCrew gateway to actually use the app (not needed for tests).

## Build, lint, test

```bash
cd ui && npm ci && cd ..   # once
make check                 # lint + test + test-formats + dist-check: what CI runs
make lint                  # ruff check . and tsc --noEmit (strict)
make test                  # backend unittest, then `npm test` (builds, then vitest)
make build                 # rebuild ui/dist/index.mjs
```

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
registry and the derived index. Your notes are never there and Quartizo never
writes to your folders; deleting the data directory only forgets registrations.

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
4. **TODOs** lists exactly the checkboxes Kiro Notes shows, grouped by note,
   open ones by default. Like Kiro Notes, Quartizo drops a frontmatter block
   that starts the file, splits the rest on `\n`, skips ```` ``` ```` fences
   and tables (a header and a matching delimiter row, then every non-blank
   line with a pipe), then takes lines `- [ ] text` / `- [x] text` (a `-`
   bullet, lower-case `x`, any indentation). So `*`/`+`/numbered items, `[X]`,
   quoted items, `~~~` fences, table rows and CRLF lines are not checkboxes,
   while an indented line is one. A card or group whose title differs from the
   file name also shows the file name, which is what Kiro Notes lists.
5. The views rescan when they open, every 30 s while shown, and on
   **Refresh**; **Rebuild index** in Settings re-parses everything. Every scan
   reads and hashes every note, so an edit that kept the file's timestamp is
   still seen. An incomplete scan or an unreadable note is called out, and such
   notes keep their last known state instead of disappearing.
6. Unticking **Shared with Kiro Notes** drops the folder's index; **Remove**
   forgets the folder. Nothing on disk changes either way. A folder that still
   has tasks from Quartizo's old database board says how many, and removing it
   deletes them only once you confirm.

**Why read only.** Native Kiro Notes (checked on 0.10.0rc4) guards its saves by
timestamp only: an external edit that keeps the file's modification time can
be silently overwritten by its autosave
([evidence](docs/markdown-tickets-phase1.md#native-notes-verification)). So
Quartizo does not write to these folders at all: no moving cards, no checking
boxes.

Limits: 200,000 directory entries, 50,000 notes, 32 folder levels, 2 MiB per
note, 2,000 checkboxes per note; the TODO list returns at most 5,000 items.
Hidden folders (`.trash`, `.obsidian`, `.git`) and symlinks are skipped.

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
| `GET /api/companion/todos?workspace=&state=` | `{groups: [{workspaceId, workspace, path, title, ticket, ticketId, status, hash, retained, items}], counts: {open, done}, truncated, index}`. An item is `{ordinal, line, column, checked, text, depth, heading}` (one-based line and column). `state` is `open` (default), `done` or `all` |

`index` is `{state, queued, progress, indexedAt, complete, files, retained,
error}`: `state` is `off`, `unavailable`, `unindexed`, `scanning`, `ready`,
`stale` (the last scan failed; the previous one is shown) or `error`. The files
are authoritative: deleting every `companion_*` row and rescanning gives the
same results. Diagnostic codes are in
[docs/markdown-tickets-phase1.md](docs/markdown-tickets-phase1.md).

See [docs/threat-model.md](docs/threat-model.md) for path confinement (no `..`,
no hidden segments, no symlinks followed, fd-relative opens).
