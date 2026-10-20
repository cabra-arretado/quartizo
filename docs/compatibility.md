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
| QTZ-003 slot ownership | **accepted: owner-session default (user decision)**. Page-created slots are owner sessions, accepted for the MVP. Facts (read at f62ab4fd, rechecked unchanged in 0.10.0rc4): the page's `useAppApi()` client is a plain same-origin `fetch` that adds only `X-Session-Key`, so the gateway authenticates it by the owner's `mc_token_<port>` cookie and sets `request["app"] = ""` (`dashboard/token_auth.py`). `POST /api/chat/slots` records app ownership only from `request["app"]` (`dashboard/chat_api/slot_create.py`). So the session the page creates is an owner session with `app == ""`, called a "Quartizo-created session" here. App ownership would need a backend-mediated app-token path, which is not built. Measured on 0.10.0rc4: an app-token create returns a row with `app: "quartizo"`, `origin: "app"`. |

## Verified by tests

| What | How | Test |
|---|---|---|
| `X-KiroCrew-Proxy` HMAC verification: format, constant-time compare, ±60 s skew, body hash binding, path/query/method binding, refusal of missing, malformed, expired, future, wrong-secret and tampered requests, fail-closed with no secret | Unit tests, plus known-answer vectors **produced by the upstream `proxy_auth.py`** run in isolation | `tests/backend/test_proxy_auth.py` |
| `X-KiroCrew-Principal` verification: canonical claim shape, kinds, owner rules, ±60 s, binding to method/target/body, replay refusal, full-cache refusal | Same, including an upstream-signed vector | `tests/backend/test_proxy_auth.py` |
| The real server process: unsigned `/health`, signed `/api/status` round-trip, 401 for unsigned/tampered/replayed/expired, 404 only after auth, 503 without a secret, binds `127.0.0.1` only, secret never written to logs | `backend/server.py` as a subprocess over real HTTP | `tests/backend/test_http.py` |
| Slot logic: create/reopen body and key extraction, stale-send refusal, send body, `slot_not_found` / `session_approval_not_granted` / permission-fence classification | Vitest with a mocked `AppApi` | `ui/test/slots.test.ts` |
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

## Not verified

- **Signed proxy end to end, backend health, and the direct-hit refusal** in a
  real gateway: blocked on trust and enable. Covered locally by
  `tests/backend/test_http.py` and the cross-check with the installed signer.
- **The page in a real host**: module loading, `ChatEmbed` rendering, UI
  component props (export names are confirmed; props of `PageHeader`, `Card`,
  `CardTitle`, `Btn` are not).
- **Who page requests run as**: read from source (unchanged in 0.10.0rc4),
  not observed. For page calls this means: (a) the session is an owner
  session (accepted, see above); (b) `permissions.api` is enforced only by the
  SDK's client check; (c) Approve/Reject in the embed works without
  `sessionApproval`. `OwnerCookieTests` check (a) and (c) and need
  `KIROCREW_OWNER_TOKEN`. The other integration tests are app-token contract
  tests and do not reflect the shipped UI.
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
- **Unsupported / not built**: Markdown notes, Kanban, Git review, agents,
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
