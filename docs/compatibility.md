# Compatibility

## Pinned upstream

- Written against `kirodotdev/KiroCrew` commit
  `f62ab4fdb2bb0e492cd99325c596ec9e738abb70` (`main`, 2026-10-20; newer than
  release `v0.9.0`). Upstream facts below were first read there.
- **Checked against: `kirocrew 0.10.0rc4`**, installed as a wheel into
  `~/.kiro/crew-venv` (wheel sha256 `cfc024eccf59c1aa3e9cbf0e403d94d65100795afb69f5958644c642c7c5c1f8`).
  The wheel carries no git commit. Its bundled website reports
  `buildId: 1.0.0-e9bfada` (`static/dist/build-id.json`), so the website was
  probably built from short SHA `e9bfada`; that is not confirmed as the
  package commit.
- `app.json` sets no `minKiroCrewVersion`. 0.10.0rc4 is the only version run;
  set it once a final release is verified.

## Drift check against 0.10.0rc4 (2026-10-20)

Compared the installed package source and bundled host assets with every
assumption Quartizo makes. **No drift found; no code change was needed.**

| Assumption | 0.10.0rc4 source | Result |
|---|---|---|
| `X-KiroCrew-Proxy` format, signed target `/api/<path>[?raw-query]` | `apps/proxy_auth.py`, `apps/routes.py::handle_app_api_proxy` (`raw_path_qs`) | Same. Also cross-checked: headers made by the installed `sign_proxy_principal_claim` and the installed signing formula verify in `backend/server.py` |
| `X-KiroCrew-Principal` claim, kinds, domain tag, replay rules | `apps/proxy_auth.py`, `routes.py::_proxy_principal` | Same |
| Manifest: `ui.entry`, `ui.pages[]`, `backend.{entryPoint,port,healthCheck,signedPrincipal}`, `permissions.api` | `apps/manifest.py` | Same; `kirocrew app install` accepted `app.json` |
| Host import map (`HOST_MODULES`) | `static/dist/index.html` importmap | Identical 8 specifiers |
| SDK exports used (`useAppApi`, `ChatEmbed`, `PageHeader`, `Card`, `CardTitle`, `Btn`) | `static/dist/vendor/kirocrew-app-sdk.mjs`, `kirocrew-ui.mjs` | All exported |
| `ChatEmbed` props | bundled `App-*.js` | Same prop list (`slotKey, agent, placeholder, frameless, startAtBottom, onSend, aboveComposer, composerMaxHeight, onFileOpen, onArtifactOpen`) |
| `useAppApi()` is a same-origin `fetch` plus `X-Session-Key`; errors are `AppApiError {status, body}` / `AppApiPermissionError`; `permissions.api` prefix matcher | bundled `App-*.js`, `apiError-*.js` | Same |
| Slot create ownership from `request["app"]`; approve 403 body | `dashboard/chat_api/slot_create.py`, `slot_approval.py` | Same |
| Token exchange `POST /api/apps/<name>/token` + `X-App-Secret` -> `{"token": ...}` | `dashboard/handlers/core.py::api_app_token` | Same (closes the "token-exchange response shape" gap) |
| Scaffold Vite config | `apps/scaffold.py` | Same lib-mode shape |

## Issue acceptance status

| Criterion | Status |
|---|---|
| QTZ-001 manifest, routed page, Vite build with host externals | Met (build, typecheck, bundle-import test) |
| QTZ-002 signed backend | Met (unit + real HTTP tests) |
| QTZ-003 page creates a slot and mounts `ChatEmbed` with `onSend`; error states for `slot_not_found` / `session_approval_not_granted` | Met as code; the page has not been rendered in a real host (app not yet trusted/enabled) |
| QTZ-004 workspace registry and confinement | Met, by unit and real HTTP tests (`tests/backend/test_workspace.py`, `test_hardening.py`). Registering a workspace worked live under the gateway sandbox (see the live run below) |
| QTZ-005 Markdown read/write API | Met, by unit and real HTTP tests (`tests/backend/test_notes.py`, `test_hardening.py`). Delete moves to `.trash` (no unlink). List, read, the 409 conflict and a save were exercised live |
| QTZ-006 notes UI | Met as code with vitest coverage of the logic modules (client, editor/conflict state, line endings, XSS, list navigation). Rendered in the real host in the live run below (register, list, open with preview, 409 conflict, reload, save). Earlier, one manual smoke run (2026-10-20): the components were built against a throwaway stub SDK with an in-memory fake backend (not committed) and driven in a browser. Open, split preview, 409 notice then explicit overwrite (CRLF kept), delete confirmation, arrow-key + Enter open, mixed-endings read-only, and the Chat tab all worked |
| QTZ-008 task persistence | Met, by unit and real HTTP tests (`tests/backend/test_tasks.py`). Not exercised against the live gateway. Project model: one project per workspace (`docs/architecture.md`) |
| QTZ-009 Kanban board and linkage | Met as code. Vitest covers board ordering, keyboard moves, drop index, task context formatting and capping, and the tasks client (a move calls only the move route). **Not rendered in a real host**: DnD, focus handling, the cross-tab note/chat requests, the transcript link and the `openChat` draft are checked by `tsc` and reading only. No manifest or permission change |
| QTZ-003 slot ownership | **accepted: owner-session default (user decision)**. Page-created slots are owner sessions, accepted for the MVP. Facts (read at f62ab4fd, rechecked unchanged in 0.10.0rc4): the page's `useAppApi()` client is a plain same-origin `fetch` that adds only `X-Session-Key`, so the gateway authenticates it by the owner's `mc_token_<port>` cookie and sets `request["app"] = ""` (`dashboard/token_auth.py`). `POST /api/chat/slots` records app ownership only from `request["app"]` (`dashboard/chat_api/slot_create.py`). So the session the page creates is an owner session with `app == ""`, called a "Quartizo-created session" here. App ownership would need a backend-mediated app-token path, which is not built. Measured on 0.10.0rc4: an app-token create returns a row with `app: "quartizo"`, `origin: "app"`. |

## Verified by tests

| What | How | Test |
|---|---|---|
| `X-KiroCrew-Proxy` HMAC verification: format, constant-time compare, ±60 s skew, body hash binding, path/query/method binding, refusal of missing, malformed, expired, future, wrong-secret and tampered requests, fail-closed with no secret | Unit tests, plus known-answer vectors **produced by the upstream `proxy_auth.py`** run in isolation | `tests/backend/test_proxy_auth.py` |
| `X-KiroCrew-Principal` verification: canonical claim shape, kinds, owner rules, ±60 s, binding to method/target/body, replay refusal, full-cache refusal | Same, including an upstream-signed vector | `tests/backend/test_proxy_auth.py` |
| The real server process: unsigned `/health`, signed `/api/status` round-trip, 401 for unsigned/tampered/replayed/expired, 404 only after auth, 503 without a secret, binds `127.0.0.1` only, secret never written to logs | `backend/server.py` as a subprocess over real HTTP | `tests/backend/test_http.py` |
| Slot logic: create/reopen body and key extraction, stale-send refusal, send body, `slot_not_found` / `session_approval_not_granted` / permission-fence classification | Vitest with a mocked `AppApi` | `ui/test/slots.test.ts` |
| Registry DB: migrations applied once and recorded; registrations persist across restarts | Unit tests on a temp `KIROCREW_HOME` | `tests/backend/test_workspace.py` |
| Root refusals: relative/NUL/missing/non-dir, `/` (also via `//`, `/tmp/..`, a symlink), the home dir itself, `$KIROCREW_HOME` and the data dir, overlaps both ways, and an inode-only alias (simulating case-insensitive `realpath`); a shared-prefix sibling (`/a/notes` vs `/a/notes-private`) is allowed | Unit tests | `tests/backend/test_workspace.py` |
| Relative-path refusals: `..`, `.`, empty segments, absolute, backslash, control chars, hidden segments, length; percent-encoding not re-decoded; no Unicode normalization | Unit tests | `tests/backend/test_workspace.py` |
| fd-based confinement: symlinks out of / inside the root and dangling ones refused; root or its parent swapped for a symlink -> `root_changed`; FIFO and directory are not files | Unit tests on real temp trees | `tests/backend/test_workspace.py` |
| Workspace routes: signed round trip, 401 unsigned, 403 for every non-owner principal | Real HTTP | `tests/backend/test_workspace.py` |
| Notes: exact byte round-trip (LF, CRLF, mixed, lone CR, BOM, no trailing newline, NUL, non-BMP), `.md` only, 2 MiB cap on read and write, non-UTF-8 refused | Unit tests | `tests/backend/test_notes.py` |
| Atomic writes: new inode (no write through a hard link), mode kept, no temp left behind; create never clobbers | Unit tests | `tests/backend/test_notes.py` |
| Conflicts: external edit before save -> 409 with `currentHash`; edit landing *during* the temp write -> 409 (late re-check); deleted note -> 409, not re-created | Unit + real HTTP | `tests/backend/test_notes.py` |
| Rename / overwrite needs `overwrite` + `confirm` (displaced note kept in `.trash`); delete needs `confirm: true` and moves to `.trash` with collision suffixes; `.trash` symlink refused | Unit + real HTTP | `tests/backend/test_notes.py` |
| List/search: hidden entries and symlinks skipped, name vs content match, all bounds (count, depth, entries, query length, large files) | Unit tests | `tests/backend/test_notes.py` |
| Markdown preview is sanitized: 30 XSS payloads (raw HTML, event handlers, `javascript:` in many encodings, `data:`/`vbscript:`/`file:`, protocol-relative and relative links, reference links, autolinks, images); output tags, attributes and `href`s are checked against allowlists | Vitest | `ui/test/markdown.test.ts` |
| Editor state: dirty tracking, CRLF round trip, mixed endings read-only, 409 never moves the base hash, only an explicit overwrite does | Vitest | `ui/test/editorDoc.test.ts`, `ui/test/lineEndings.test.ts` |
| Notes client: routes under `/apps/quartizo/api`, query percent-encoding (`+`), `confirm` only with overwrite / delete, 409 `currentHash` parsing, client-side path rules | Vitest with a mocked `AppApi` | `ui/test/notesApi.test.ts` |
| Review fixes: rename/trash via `renameat2(RENAME_NOREPLACE)`; the link+unlink fallback rolls back (409) when an injected `os.replace` swaps the source mid-move, and rolls back the trash copy when the unlink fails; unclassified `OSError` -> errno-mapped status without the path (read-only folder -> 403 over HTTP); roots refused when not owned, group/world-writable, or under `/proc` `/sys` `/dev`; foreign-owned subfolders refused; read-only note -> 403 `read_only`; hard links are not spelling aliases; >1 MiB bodies only for fresh note writes (413 before reading otherwise); 16-connection cap; scan bounds applied while iterating | Unit + real HTTP | `tests/backend/test_hardening.py` |
| Tasks (QTZ-008): CRUD; title/description/status/`note_ref`/`slot_id` refusals; no file access for `note_ref`; per-project scoping; reorder and cross-column moves with dense reindex; only the moved task's version changes; no-op moves; 409 `stale` on update/move/delete; rollback on failure; export/import round trip, `project_not_empty`, `confirm_required`, `uid_conflict` / `newUids`, 14 all-or-nothing rejections, caps; workspace removal guarded by `deleteTasks`; migration from an M2 (v2) DB; moves make no network call and keep `slot_id`; owner-only over HTTP; 4 MiB import body | Unit + real HTTP | `tests/backend/test_tasks.py` |
| Board (QTZ-009): column grouping/sort, `applyMove` reindex mirror (within and across columns, immutability, only status/order change), no-op detection, keyboard up/down/left/right with clamping and labels, drop index; task context exact format, fence escape, header flattening and bidi stripping, 8 KB cap with truncation line, surrogate-safe cut; tasks client routes, `expectedVersion`, `confirm` only with replace, `deleteTasks`, stale/count parsing, title/description/note-ref/slot checks | Vitest | `ui/test/board.test.ts`, `taskContext.test.ts`, `tasksApi.test.ts` |
| Built bundle imports only host import-map specifiers and has a default export | Vitest over `ui/dist/index.mjs` (skips before a build) | `ui/test/bundle.test.ts` |
| `tsc --noEmit` and `vite build` pass | `npm run typecheck`, `npm run build` | — |

## Measured against the real gateway (kirocrew 0.10.0rc4, 2026-10-20)

Gateway started with `kirocrew gateway --no-open --no-tunnel` on
`http://127.0.0.1:5476`. Trust settings were not changed.

| Step | Result |
|---|---|
| `npm run build`, then `kirocrew app install /home/felipe/Workspace/quartizo` | Installed `quartizo v0.1.0`, with the warning "registration blocked by execution policy: third-party app execution is disabled" (`agent.apps_trusted` is `[]`). `kirocrew app info`: `enabled: false`, approved grants `api: ["/api/chat", "/apps/quartizo/api"]` |
| `kirocrew app enable quartizo` | **Refused**: "blocked by execution policy ... trust this app alone in Settings (agent.apps_trusted)". The backend therefore never ran |
| `GET /apps/quartizo/api/status` via gateway (app token) | 403 `app_not_enabled`, refused by the gateway before the backend. **The signed proxy path is unverified** |
| Backend `/health`, direct unsigned hit on the backend port | **Not run**: no backend process without enable |
| Token exchange `POST /api/apps/quartizo/token` with the app's own `.app_secret` | 200 `{"token": ...}`, works while the app is installed but untrusted and disabled |

`tests/integration/test_gateway.py`, run with `KIROCREW_GATEWAY_URL` and
`KIROCREW_APP_SECRET_FILE`: **8 tests, 2 passed, 6 skipped, 0 failed**.

| Test | Result |
|---|---|
| `SessionOwnershipTests.test_create_then_reopen_own_slot` | **Pass.** App-token create returns 200 with `key`, `app: "quartizo"`, `origin: "app"`; reopening by key returns the same key; `GET /api/chat/slots/{key}?limit=1` 200 |
| `ToolApprovalTests.test_approve_and_reject_refused_without_grant` | **Pass.** `approved` and `rejected` both 403 `session_approval_not_granted` |
| `SignedProxyTests.test_status_reaches_backend_as_app_token_principal` | Skip: app not enabled (403 `app_not_enabled`). Once enabled it expects 403 `owner_session_required` from the backend; a 401 would mean signature drift |
| `SignedProxyTests.test_direct_unsigned_backend_hit_is_refused` | Skip: needs `KIROCREW_BACKEND_URL` (backend not running) |
| `SessionOwnershipTests.test_foreign_slot_is_slot_not_found` | Skip: needs `KIROCREW_FOREIGN_SLOT`. Listing owner slots needs the owner token, which this run did not use |
| `ToolApprovalTests.test_approve_reject_resolves_pending_request` | Skip: needs `sessionApproval` and a pending request |
| `OwnerCookieTests` (2) | Skip: need `KIROCREW_OWNER_TOKEN`. **The user must export their own dashboard session token**; the tests never read it from disk or cookies |

Headless browser check: **skipped**. Chromium is present, but the page needs
an owner dashboard login (not used here), and the app is not enabled.
`/apps/quartizo/ui/dist/index.mjs` is served (200) without auth while disabled.

Observed upstream behaviour, recorded as findings:

- **App-token chat access ignores trust and enable state.** While quartizo was
  untrusted and disabled, its app token still created and read its own slots
  under `/api/chat` and got the normal approve refusal. Only the
  `/apps/quartizo/api` proxy checks `enabled`.
- **An app token is spent by app-namespaced routes.** After one `?token=` call
  to `/apps/quartizo/...` or `/api/apps/quartizo/...` (the 403 on the proxy
  and a 200 on `GET /api/apps/quartizo` both did it), later calls with the
  same token got 403 `forbidden` (audit: "cookie auth failed: session
  revoked"). `/api/chat/*` calls do not spend it. The integration tests now
  take a fresh token for those routes. The root cause in `token_auth.py` was
  not traced.
- The gateway log shows `kiro-cli not found` when the gateway starts a
  runtime for the new slots. No turn was sent, so chat replies are unverified.
- Test slots left on the gateway, all app-owned (`app: "quartizo"`):
  `quartizo-it-probe`, `main` (an app-owned slot that the app created when it
  asked for the name `main`; it is not the owner's session), and
  `quartizo-it-<ts>` / `quartizo-ap-<ts>` from the test runs. No data was deleted.

## Live run with the app trusted and enabled (kirocrew 0.10.0rc4)

Run by the operator after M1, with `quartizo` trusted
(`agent.apps_trusted`) and enabled.

| Check | Result |
|---|---|
| `tests/integration/test_gateway.py` | **4 passed, 4 skipped.** Passed: signed `/apps/quartizo/api/status` reaches the backend (403 `owner_session_required` for the app-token principal, so the gateway signature verified); a direct unsigned hit on the backend port gets 401; create + reopen of an app-token slot; approve/reject 403 `session_approval_not_granted` without the grant. Skipped: the tests that need `KIROCREW_FOREIGN_SLOT`, a pending approval, or `KIROCREW_OWNER_TOKEN` |
| Who page calls run as | **`owner-session`**, observed in the page's Chat tab status ("caller: owner-session"). This confirms the source reading |
| M1 smoke in the dashboard | Registered a workspace, listed notes, opened one with the preview. An external edit then a save showed the 409 conflict notice, and nothing was overwritten. **Reload** loaded the external version, and a following save landed on disk |
| Uninstall | `kirocrew app uninstall quartizo` **clears `agent.apps_trusted`**. Trust must be granted again after a reinstall |
| Dashboard console noise | 403/503 errors in the browser console come from the host polling `/api/instances` and `/api/sessions/usage`, not from Quartizo |

## Not verified

- **Sandbox coverage.** The live run used one workspace in the owner's home,
  and the registry DB under `data/` worked (the backend started under the
  gateway's `python -I` launch). Which other host paths the
  `wrap_argv(mode="standard")` sandbox hides was not mapped.
- **Parts of the notes UI in the host**: rename, delete and keyboard
  navigation were not exercised live (only through their logic modules and
  the stub-SDK smoke run). Host styling of the plain elements is unreviewed.
  Props of `PageHeader`, `Card`, `CardTitle` and `Btn` are inferred (export
  names are confirmed).
- **Page-call details beyond the principal kind**: (b) `permissions.api` is
  enforced only by the SDK's client check; (c) Approve/Reject in the embed
  works without `sessionApproval`. `OwnerCookieTests` check (c) and need
  `KIROCREW_OWNER_TOKEN`.
- **Foreign-slot refusal** for app tokens, and **approval resolution** with
  the grant.
- **Sending a message / getting a reply**: no turn was sent (`kiro-cli` is not
  installed on this host).
- **Codex** (or any non-default agent runtime): not validated. The slot is
  created with no `agent`, so the gateway default applies.

## Known behaviour and limits (upstream, at the pinned commit)

- **ChatEmbed polls**: `GET /api/chat/slots/{slot}` every 1 s while a turn
  runs and every 5 s when idle (`ChatEmbed.tsx`, `RUNNING_POLL_MS`). No
  streaming, no reasoning display. Quartizo subscribes to no WS events.
- **Stop exists**, contrary to the issue brief's "no Stop": `ChatEmbed` at
  this commit renders Stop (soft, then force) through
  `/api/chat/slots/{slot}/stop`. It goes through the SDK, not Quartizo's
  `onSend`, and is covered by the `/api/chat` grant. Not exercised by any
  Quartizo test.
- **Approval semantics**: Approve/Reject/Trust cards are handled inside
  `ChatEmbed` (`POST /api/chat/slots/{slot}/approve` with
  `{action, request_id}`). Quartizo cannot see an approve refusal that happens
  inside the embed; it reports `session_approval_not_granted` only when its own
  calls get it. `yolo` is refused to apps. `GET /api/approvals` is always
  empty for apps.
- **Ownership and stale sends**: `onSend` checks the slot with
  `GET /api/chat/slots/{key}` before `POST /api/chat?ws=1`, so a deleted slot
  is refused instead of being silently re-created by the generic endpoint.
  A slot deleted *between* the two calls is still re-created by `/api/chat`
  (no conditional send exists). On load, a stored key is reopened with
  `POST /api/chat/slots {name: key}`. If that transcript is gone, the gateway
  creates a fresh slot under that name.
- **Attachments are unsupported**: `/api/upload/file` is not in
  `permissions.api`, so the SDK hides `ChatEmbed`'s attach control
  (`apiPathAllowed`) and any upload is refused client-side.
- **Stored slot keys are validated**: only names matching
  `^quartizo-[0-9a-z]+-[0-9a-z]{6}$` (the pattern Quartizo generates) are
  reopened. Anything else in localStorage is discarded.
- **Notes limits (M1)**: `.md` only (lowercase suffix), UTF-8 only (other
  encodings 415), 2 MiB per note, hidden files/folders and symlinks not
  shown or reachable, mixed line endings view-only. No `[[wikilinks]]`,
  backlinks or image display. The list does not watch the disk, so use
  **Refresh**. The backend is POSIX only.
- **Tasks limits (M3)**: one board per workspace; 2000 tasks, 200-character
  titles, 64 KiB descriptions, 4 MiB imports. No due dates, assignees, labels
  or task search. The board does not watch for changes from other tabs (use
  **Refresh**; stale writes are refused). `openChat` without a session
  (no linked or workspace chat yet) goes to `/chat?new=1`; whether the draft
  is kept there was not verified.
- **Unsupported / not built**: Git review, agents,
  skills, crons, panel tabs, session controls.

## App Kit gaps (from `docs/appkit-notes.md` §10)

### Resolved

| # | Gap | Resolution | Source (at pinned SHA) |
|---|---|---|---|
| 1 | Scaffold `ui/package.json` / `vite.config.ts`, externals | Scaffold templates: Vite lib mode, `formats: ['es']`, `fileName: () => 'index.mjs'`, React 18, Vite 5. The host import map is the full externals list: `react`, `react-dom`, `react-dom/client`, `react/jsx-runtime`, `@kirocrew/app-sdk`, `@kirocrew/app-sdk/ui`, `@tanstack/react-query`, `lucide-react` | `src/kiro_crew/apps/scaffold.py`; `website/scripts/lib/basePath.mjs` (`VENDOR_IMPORTS`); `website/public/vendor/*.mjs` |
| 2 | Page bundle contract | The host `lazy(() => import(bundle))`s and renders the **default export** inside `AppApiProvider`. `mountFunction` is not read by `AppHost` | `website/src/components/AppHost.tsx` |
| 4 | `POST /api/chat/slots` / `POST /api/chat` schemas, ownership | Create body `{name?, agent?, memory_mode?, mode?, title?, ...}`. The response is the serialized slot row, with the key in `key`. Send body `{message, slot, agent, meta?}` on `/api/chat?ws=1` (returns JSON at once instead of SSE). Ownership is `slot._app == request["app"]`, the app-token identity | `dashboard/chat_api/slot_create.py`, `chat_api/chat_send.py`, `website/src/app-sdk/appSendWire.ts`, `website/src/apps/design-critique/api.ts`, `dashboard/slot_ownership.py` |
| 5 | Proxy HMAC details | Timestamp in **integer seconds**. HMAC and body digest are **lowercase hex**. The signed target is the **backend-side** target `/api/<path>[?raw-query]`: `/apps/<name>` is stripped, and the raw query is kept as encoded on the wire | `src/kiro_crew/apps/routes.py::handle_app_api_proxy`, `src/kiro_crew/apps/proxy_auth.py` |
| 6 | Backend paths in `permissions.api` / `useAppApi` | The SDK client checks paths against `permissions.api` verbatim, with no implicit grant for the app's own proxy. Declare `/apps/<name>/api` and call `api.get('/apps/<name>/api/...')`. Builtins (md-notebook, file-explorer) do exactly this | `website/src/app-sdk/scopedApi.ts`, `AppHost.tsx`, builtin `app.json`s, `apps/permissions.py` |
| 7 (partly) | Trust format | `agent.apps_trusted` is a JSON array of exact app names, and anything malformed fails closed. No `kirocrew app trust` subcommand exists | `src/kiro_crew/apps/execution.py`, `src/kiro_crew/cli_commands_app.py` |
| 9 (partly) | What `--backend` scaffolds | `backend/server.py` (stdlib `HTTPServer` on `127.0.0.1:$PORT`, unsigned) and manifest `backend: {entryPoint, port: "auto", healthCheck: "/health"}`, with no `routes` | `src/kiro_crew/apps/scaffold.py` |
| 10 (partly) | Approve body | `POST /api/chat/slots/{slot}/approve` body `{action: "approved"\|"rejected"\|"rejected_once"\|"trust_command"\|..., request_id, pattern?, ttl_seconds?, origin?, request_mid?}`. Without the grant, the 403 body is `{"error":"app cannot manage session approvals","code":"session_approval_not_granted"}` | `dashboard/chat_api/slot_approval.py` |
| — | Token transport for app tokens | `?token=<app token>` query parameter, or the `mc_token_<port>` cookie. The app token comes from `POST /api/apps/<name>/token` with `X-App-Secret`, response `{"token": "..."}` (measured on 0.10.0rc4) | `dashboard/token_auth.py`, `dashboard/handlers/core.py` |

### Still open

| # | Gap | Where the choice is isolated |
|---|---|---|
| 3 | `useChatLauncher` formal signature | Not used |
| 7 | Whether `kirocrew config set agent.apps_trusted` is allowed from a shell; README points to the Settings UI. 0.10.0rc4's own refusal message says "trust this app alone in Settings (agent.apps_trusted)" | README |
| 8 | Minimum gateway version per feature (ChatEmbed `onSend`, `signedPrincipal`, body-bound HMAC) | `app.json` has no `minKiroCrewVersion` |
| 9 | Other `kirocrew app init` flags | — |
| 10 | `/api/approvals/{id}/{action}` and `POST /api/chat/mode` bodies | Not used |
| — | Published TS types for the SDK and the `@kirocrew/app-sdk/ui` component props (`PageHeader`, `Card`, `CardTitle`, `Btn`) | `ui/src/kirocrew-sdk.d.ts`, the only adapter for SDK shapes |
| — | Whether page `useAppApi()` calls are ever made under an app token (not in 0.10.0rc4 per source) | `ui/src/slots.ts` (`classifyError` handles both outcomes) |
| — | Whether dev mode restarts the backend on change | README |
