# Quartizo

A third-party [KiroCrew](https://github.com/kirodotdev/KiroCrew) App Kit app.
This first slice is the skeleton: one routed page that embeds an
**Quartizo-created chat session** (`ChatEmbed` on a slot the page creates;
it is owned by the dashboard owner, not by the app, see
[compatibility](docs/compatibility.md)) and a tiny Python
backend that verifies the gateway's signed proxy requests.

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
backend/db.py         sqlite3 registry DB with a migrations table
backend/notes.py      .md list/search/read/create/update/rename/delete
ui/                   React + TS + Vite page bundle -> ui/dist/index.mjs
tests/backend/        backend auth unit tests + real HTTP round-trips
tests/integration/    gateway tests (skip unless a gateway is configured)
docs/                 App Kit notes, compatibility matrix, threat model
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

# frontend: slot creation / error logic with the SDK mocked, plus a
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
| `permissions.api: "/apps/quartizo/api"` | The page calls its own backend through the gateway proxy (`/apps/quartizo/api/status`). The SDK client refuses any path not declared; builtin apps declare their own proxy prefix the same way. |
| `backend.signedPrincipal: true` | Not a permission, but security-relevant: the backend receives a signed claim naming the caller kind and refuses requests without one. |
| *not granted:* `permissions.sessionApproval` | It lets an app act on **any** local user session, far beyond the sessions Quartizo creates. Per the gateway source, page requests made with `useAppApi()` carry the dashboard owner's session cookie, not an app token, so Approve/Reject in the embed are decided as the owner and do not need this grant. If a host ever runs the page under an app token, those decisions return 403 `session_approval_not_granted`, which the page reports. Adding the grant later disables the app until the user re-enables it. |
| *not granted:* `/api/upload/file` | Attachments are **unsupported**: without this grant the embed hides its attach control and uploads are refused. |
| *not granted:* `events`, `storage`, `cron`, `network`, `memory`, `mcpTools`, ... | Unused. `ChatEmbed` polls; it does not need WS events. |

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
installs keep `data/` across updates). The DB holds only the registry. Note
content stays in the files.

| Route | Body / result |
|---|---|
| `GET /api/workspaces` | `{workspaces: [{id, name, path}]}` |
| `POST /api/workspaces` | `{path, name?}` -> 201 `{workspace}`. `path` must be absolute and is stored as its realpath. Refused: `/`, your home dir itself, anything overlapping `$KIROCREW_HOME` or another root (409 `root_overlaps`) |
| `GET /api/workspaces/{id}` | `{workspace}` or 404 `workspace_not_found` |
| `DELETE /api/workspaces/{id}` | Forgets the root. Files are never touched |

See [docs/threat-model.md](docs/threat-model.md) for path confinement
(no `..`, no hidden segments, no symlinks followed, fd-relative opens).

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
