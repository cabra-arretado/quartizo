# Compatibility

## Pinned upstream

- Repository: `kirodotdev/KiroCrew`
- Commit: `f62ab4fdb2bb0e492cd99325c596ec9e738abb70` (`main`, 2026-10-20; newer than release `v0.9.0`)
- Every upstream fact below was read at that commit. KiroCrew was **not**
  installed or run while building this; no gateway was available.
- `app.json` sets no `minKiroCrewVersion`: the upstream docs name no minimum
  version for any feature used here, and `0.9.0` might predate the pinned
  `main`. Set it once a release that includes the pinned commit is verified.

## Issue acceptance status

| Criterion | Status |
|---|---|
| QTZ-001 manifest, routed page, Vite build with host externals | Met (build, typecheck, bundle-import test) |
| QTZ-002 signed backend | Met (unit + real HTTP tests) |
| QTZ-003 page creates a slot and mounts `ChatEmbed` with `onSend`; error states for `slot_not_found` / `session_approval_not_granted` | Met as code; not run in a real host |
| **QTZ-003 slots stay app-owned** | **BLOCKED / UNMET.** At the pinned SHA, the page's `useAppApi()` client is a plain same-origin `fetch` that adds only `X-Session-Key` (`website/src/app-sdk/scopedApi.ts`). The gateway therefore authenticates it by the owner's `mc_token_<port>` cookie and sets `request["app"] = ""` (`dashboard/token_auth.py`). `POST /api/chat/slots` records app ownership only from `request["app"]` (`dashboard/chat_api/slot_create.py`, `deny_app_slot_session_access`). So the session the page creates is an **owner session with `_app == ""`**, called a "Quartizo-created session" here. Real app ownership would need a backend-mediated path, where the backend exchanges the app secret for an app token (`POST /api/apps/quartizo/token`) and creates and sends on the page's behalf. That path is unverified and not built. |

## Verified by tests

| What | How | Test |
|---|---|---|
| `X-KiroCrew-Proxy` HMAC verification: format, constant-time compare, ±60 s skew, body hash binding, path/query/method binding, refusal of missing, malformed, expired, future, wrong-secret and tampered requests, fail-closed with no secret | Unit tests, plus known-answer vectors **produced by the upstream `proxy_auth.py`** run in isolation | `tests/backend/test_proxy_auth.py` |
| `X-KiroCrew-Principal` verification: canonical claim shape, kinds, owner rules, ±60 s, binding to method/target/body, replay refusal, full-cache refusal | Same, including an upstream-signed vector | `tests/backend/test_proxy_auth.py` |
| The real server process: unsigned `/health`, signed `/api/status` round-trip, 401 for unsigned/tampered/replayed/expired, 404 only after auth, 503 without a secret, binds `127.0.0.1` only, secret never written to logs | `backend/server.py` as a subprocess over real HTTP | `tests/backend/test_http.py` |
| Slot logic: create/reopen body and key extraction, stale-send refusal, send body, `slot_not_found` / `session_approval_not_granted` / permission-fence classification | Vitest with a mocked `AppApi` | `ui/test/slots.test.ts` |
| Built bundle imports only host import-map specifiers and has a default export | Vitest over `ui/dist/index.mjs` (skips before a build) | `ui/test/bundle.test.ts` |
| `tsc --noEmit` and `vite build` pass | `npm run typecheck`, `npm run build` | — |

## Not verified (no gateway available)

The integration tests in `tests/integration/test_gateway.py` cover the points
below. They **skip** unless `KIROCREW_GATEWAY_URL` and `KIROCREW_APP_TOKEN` are
set, and have never run.

- **Slot ownership (app-token contract only)**: that `POST /api/chat/slots`
  from an app token creates a slot the app owns, reopens it by key, and returns 404 `slot_not_found` for a
  transcript it does not own.
- **Tool approval approve/reject**: that `POST /api/chat/slots/{slot}/approve`
  returns 403 `session_approval_not_granted` without the grant, and resolves a
  pending request when it is granted. The resolution test also needs a pending
  request (`KIROCREW_PENDING_SLOT`, `KIROCREW_PENDING_REQUEST_ID`).
- **The page in a real host**: module loading, the `ChatEmbed` rendering, and
  whether the SDK UI component props in `ui/src/kirocrew-sdk.d.ts` match.
- **Who page requests run as** (see the BLOCKED row above). Read from source,
  not observed. It follows that for page calls: (a) the session is an owner
  session, not app-owned; (b) `permissions.api` is enforced only by the SDK's
  client check; (c) Approve/Reject in the embed works without
  `sessionApproval`. `OwnerCookieTests` in `tests/integration/test_gateway.py`
  check (a) and (c) against a real gateway (they skip without
  `KIROCREW_OWNER_TOKEN`). The other integration tests are **app-token contract
  tests**. They describe the gateway's behaviour for an app-token caller and do
  not reflect the shipped UI.
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
| — | Token transport for app tokens | `?token=<app token>` query parameter, or the `mc_token_<port>` cookie. The app token comes from `POST /api/apps/<name>/token` with `X-App-Secret` | `dashboard/token_auth.py` |

### Still open

| # | Gap | Where the choice is isolated |
|---|---|---|
| 3 | `useChatLauncher` formal signature | Not used |
| 7 | Whether `kirocrew config set agent.apps_trusted` is allowed from a shell; README points to the Settings UI | README |
| 8 | Minimum gateway version per feature (ChatEmbed `onSend`, `signedPrincipal`, body-bound HMAC) | `app.json` has no `minKiroCrewVersion` |
| 9 | Other `kirocrew app init` flags | — |
| 10 | `/api/approvals/{id}/{action}` and `POST /api/chat/mode` bodies | Not used |
| — | Published TS types for the SDK and the `@kirocrew/app-sdk/ui` component props (`PageHeader`, `Card`, `CardTitle`, `Btn`) | `ui/src/kirocrew-sdk.d.ts`, the only adapter for SDK shapes |
| — | Whether page `useAppApi()` calls are ever made under an app token (see "Who page requests run as") | `ui/src/slots.ts` (`classifyError` handles both outcomes) |
| — | Token-exchange response shape (`POST /api/apps/<name>/token`); integration tests take a ready token | `tests/integration/test_gateway.py` |
| — | Whether dev mode restarts the backend on change | README |
