# KiroCrew App Kit notes

> **History.** Notes taken while building the original editor version of Quartizo. The platform facts still hold for 0.10.0rc4; the parts about chat embeds and sessions concern features Quartizo no longer has.

Source: github.com/kirodotdev/KiroCrew, `main` at commit `f62ab4fdb2bb0e492cd99325c596ec9e738abb70` (2026-10-20).
Latest release tag read: `v0.9.0` (published 2026-10-16). Docs read from `main`, not from the tag.
Files read (all HTTP 200): docs/app-kit/{README,getting-started,api-reference,manifest-reference,publishing-guide,migration-guide}.md.
Not read: docs/app-kit/examples/{minimal-app,full-app} (listed only), docs/system-specs/modules/app-kit-platform.md, docs/architecture/app-platform-trust-model.md.
Marker "UNSPECIFIED" = the docs above do not say. Cites: GS=getting-started, API=api-reference, MAN=manifest-reference, PUB=publishing-guide, MIG=migration-guide.

## 1. Manifest (`app.json`) [MAN]
Required (non-empty strings): `name` (kebab `^[a-z0-9]+(?:-[a-z0-9]+)*$`), `version` (MAJOR.MINOR.PATCH[-pre][+build]), `displayName`, `description`.
Recommended: `author`, `license`, `minKiroCrewVersion` (string, "Minimum Gateway version"; checked on install AND update [PUB]), `tags`, `jobFamilies`, `highlights`, `useCases`, `configuration`, `screenshots`, `screenshotsDark`.
Store art: top-level `iconPath` (scaffold: `assets/icon.png`, 512x512 opaque), `iconPathDark`, `heroImage*` [PUB].
Admission: `signer`, `signature` (publisher tooling; fail-closed on older gateways, so set `minKiroCrewVersion` on signed apps).
Resources: `agents` (paths to JSON), `skills` (dirs), `sops`, `mcpServers` (same as mcp.json), `config_keys`.
Other: `crons[]`, `ui`, `contributes`, `backend`, `permissions`, `notifications`, `publishProvider`, `setup`, `dependencies`, `lifecycle` (`gateway`|`app`|`locked`), `resources` (`gateway`|`app`), `platform`, `openCommand`.
Name reserved: `system`, `library`, `registry`, `registries`, `blob`, `install`, `register`, Windows device stems.
All resource/entry paths must be relative, inside app root, no `..`.
Unknown fields are preserved (forward compat).

Scaffold-style example (GS):
```json
{
  "name": "my-dashboard", "version": "0.1.0", "displayName": "My Dashboard",
  "description": "A Kiro Crew app: My Dashboard", "author": "yourname",
  "iconPath": "assets/icon.png",
  "agents": ["agents/sample-agent.json"], "skills": ["skills/sample-skill"],
  "ui": { "entry": "dist/index.mjs",
          "pages": [{ "route": "/apps/my-dashboard", "label": "My Dashboard", "icon": "Package" }] },
  "permissions": { "api": ["/api/status"], "events": ["notification"] }
}
```
Note: the scaffold writes NO `permissions` block; you must add it ("the SDK rejects a path or event the manifest does not declare") [GS].

### ui [MAN]
- `ui.entry` ESM bundle path, relative to `ui/` (e.g. `dist/index.mjs`; served at `/apps/<name>/ui/<entry>`).
- `ui.pages[]`: `route`, `label` (both required), `icon` (Lucide name), `iconUrl`, `iconInactiveUrl`, `entryPoint` (per-page bundle, overrides entry), `mountFunction` (default `"mount"`: "Exported function name in the ESM bundle").
- `ui.sidebar`: `section` (default "Apps"), `order` (default 10).
- `ui.overlays`: builtin-only; installed apps declaring it are refused.
- UNSPECIFIED: the exact module contract of a page bundle (default export React component per GS example vs `mount()` function per `mountFunction`); GS shows `export default function MyDashboard()`. Session controls: "The module's default export is rendered as `<Control session onClose />`".

### contributes [MAN]
- `contributes.commands[]`: `id`,`title`,`prompt` required; `subtitle`,`icon`,`keywords`,`argument{kind url|text,placeholder,hint,hosts,patternError}`,`autoSend`,`agent`. No page/backend needed.
- `contributes.sessionControls[]` (max 2/app): `id`,`entryPoint`,`label`,`icon`,`statusPath`. Control gets `session {sessionKey, folderId?, folderName?, cwd}` + `onClose`. `statusPath` GET gets `session_key` (+`folder_id`,`folder_name`), returns `{"state":"ok|warn|none","tooltip","detail"}`.
- `contributes.panelTabs[]` (max 8): `id` (`[a-z][a-z0-9_-]{0,63}`), `title`, `menuLabel`, `menuDescription`, `icon` (fixed set incl. BookOpen, Bot, Terminal...), `entry` (relative to `ui/`, NOT app root). Mounted in-process (no iframe), stays mounted while hidden; use `useAppInfo().active` to pause work [GS].
- `contributes.fileMenuItems` exists [MAN ~L494]; not read in detail.

### backend [MAN]
```json
{ "backend": { "entryPoint": "backend/server.py", "port": "auto", "healthCheck": "/health", "routes": "/api/apps/oncall-watchtower" } }
```
| field | default | notes |
|---|---|---|
| `entryPoint` | | script relative to app root, or dotted module via `python -m` (builtins) |
| `port` | `"auto"` | number or "auto" |
| `healthCheck` | `/health` | absolute path; polled at startup and for life; MUST answer UNSIGNED loopback GET with 2xx (no 3xx, no 401/403) else "app '<name>' has no reachable backend" |
| `routes` | | base route path |
| `type` | `""` | `python`,`asgi`,`node`,`exec`, or auto-detect (.sh / non-Python shebang = shell launcher; ELF needs `exec`; exec is POSIX-only) |
| `signedPrincipal` | false | only literal `true` adds `X-KiroCrew-Principal` |
`backend.hooks` (in-gateway Python): `routes`, `on_startup`, `on_shutdown` as `module.path:callable`; relative imports only. Not needed for the process model.
Backend-process vs hooks-only affects route base: entryPoint => proxied at `/apps/<app>/api/`; hooks.routes only => `/api/apps/<app>/` [MAN sessionControls].

### permissions [MAN]
```json
{ "permissions": { "api": ["/api/crons"], "events": ["notification","slots"], "mcpTools": [], "storage": true,
  "cron": true, "memory": "app-scoped", "network": false, "sessionApproval": false,
  "spawn": false, "jobs": false, "proposeCrewmate": false, "exposeToApps": [] } }
```
- `api`: allowed path prefixes. Matcher: `/api/x` matches itself + slash children; `/api/x/*` also base path; `/api/x*` any string prefix; trailing bare `/` is literal [API].
- `events`: allowed WS event types. `cron` must be true if `crons` non-empty. `memory`: ""|"app-scoped"|"shared".
- `sessionApproval`: see section 6.
- Updates adding entries to `api`/`events` keep app enabled but withhold the new entries until user approves; newly adding `sessionApproval` disables the app until the user re-enables.
- Most permission fields are "advisory" in-process; `sessionApproval` and `permissions.api` ARE enforced for app-token calls.

### setup / platform / dependencies [MAN]
- `setup.onInstall` (shell; registry installs and every registry update; NOT run on local-path install), `onUninstall`, `onEnable` (non-zero rolls enable back), `onDisable`, `onEnableTimeout`/`onDisableTimeout` (30), `configSchema`, `onUpdate` is never executed. All via `/bin/bash`.
- `platform.os` default `["macos","linux"]` (excludes windows), `installMode` server|client.
- `dependencies.commands` checked on PATH, misses reported only.

## 2. Scaffold [GS, PUB]
`kirocrew app init my-dashboard --ui` (flags seen: `--ui`, `--backend`, `--cron` [PUB]):
```
my-dashboard/
├── app.json
├── assets/icon.png
├── agents/sample-agent.json
├── skills/sample-skill/SKILL.md
├── ui/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/App.tsx
│   └── .gitignore
└── README.md
```
UNSPECIFIED: contents of `ui/package.json` and `ui/vite.config.ts` (not shown); what `--backend`/`--cron` add to the layout; other `init` flags.
Build: `cd ui && npm install && npm run build` -> `dist/index.mjs`. Node 22.12+ (24 LTS recommended).
Agent JSON example: `{"name":"my-agent","model":"auto","description":"...","prompt":"...","tools":["@kirocrew-core"]}`.
Recommended committed repo layout for publishing: `ui/dist/index.mjs` committed [PUB].

## 3. Frontend SDK [GS, API]
Package `@kirocrew/app-sdk` (+ `@kirocrew/app-sdk/ui`). "You do not `npm install`" it. Host import map resolves bare specifiers to host vendored copies via `window.__kirocrew_modules`. Mark as build externals: `@kirocrew/app-sdk`, React, ReactDOM, lucide-react [GS, MIG], and `@tanstack/react-query` [GS] (host provides QueryClient per app+session; no provider needed).
UNSPECIFIED: exact externals list for Vite (e.g. `@kirocrew/app-sdk/ui`, `react/jsx-runtime`, `react-dom/client`), and the exact vite.config; docs say only "mark these as externals". Safe assumption to verify: also externalize the `/ui` subpath.

Hooks (all from `@kirocrew/app-sdk`) [GS]:
- `useAppApi()` -> client `{raw, request, get, post, put, patch, del}`:
  - `raw(path, init?) -> Response` (non-2xx throws), `request<T>(path, init?)`, `get<T>(path, init?)`, `del<T>(path, init?)`, `post<T>(path, body?, init?)`, `put`, `patch` (body JSON-serialized, default `Content-Type: application/json`).
  - Errors: `Error("API <status>: <body>")`, `name:'AppApiError'`, `.status`, `.body` (string). Import `AppApiError` as TYPE only.
  - Host owns `X-Session-Key` (pages use `dashboard:ui`); caller cannot set it. Path check is on initial URL only.
  - Empty successful JSON response returns `undefined`.
- `useAppEvents(event, cb)`, `useTheme()`, `useAppInfo()` (name, version, permissions, `active?`; treat undefined as true), `useNavigate()`, `useNotify()`, `useNavBadge()`, `useChatLauncher()`.
- `useChatLauncher()` returns `openChat`: `openChat({ message, autoSend?, slotKey?, agent? })` [GS]. `autoSend:false` = unsent draft (new session unless `slotKey`; with `slotKey`, appends to that session's unsent text). Omit `autoSend` = send automatically (no `slotKey` = start new session). `agent` only for new sessions. Target must activate successfully else message not used. UNSPECIFIED: formal TS type, return value/promise shape, whether `message` is optional, how a new session's key is returned.
- Other exports: `useImeGuard`, `activeLocale`, `fmt*`, `useLanguageGeneration`, chat marker helpers, `ChatMessageList`, `ChatPanel`, `ChatEmbed`.
- `@kirocrew/app-sdk/ui` components: Card, CardTitle, Btn, SendBtn, Input, SearchInput, Badge, SourceBadge, StatCard, Skeleton, ContentSkeleton, EmptyState, PageHeader, Toggle, InfoTip, SegmentedControl, MarkdownRenderer, Clickable, Modal, ErrorNotice, Settings{Section,Card,Input,Toggle,Select}.

### ChatEmbed [API "Embedded Chat"]
```tsx
import { ChatEmbed } from '@kirocrew/app-sdk'
<ChatEmbed slotKey="coder-abc123" />
```
Props: `slotKey` (string, required), `agent?` (sent with each `POST /api/chat`), `placeholder?`, `frameless?`, `startAtBottom?`, `onSend?(message, meta?: {files?: string[]}) => Promise|void` (replaces `POST /api/chat`; "Use it when the app owns its slots: the generic endpoint creates a missing slot with no app ownership and no project"), `aboveComposer?` (ReactNode), `composerMaxHeight?` (px, default 240), `onFileOpen?(path, {line?,endLine?})`, `onArtifactOpen?(slug)` (keep handlers referentially stable).
Required `permissions.api`: `/api/chat` (covers `GET /api/chat/slots/{slot}?limit=N`, `POST /api/chat`, `POST /api/chat/slots/{slot}/approve`, `POST /api/chat/slots/{slot}/stop`). Doc example grants: `["/api/chat", "/api/chat/slots"]`. Optional: `/api/upload/file` (attachments), `/api/slash-commands`. Do NOT declare `/api/file-search` for installed apps (refused).
Behaviour: polls slot every 1 s while running, 5 s idle (newest 200 rows); no streaming, no reasoning display; Stop button exists (soft then force). Approve/Reject/Trust cards inside embed need `permissions.sessionApproval` for app tokens (403 `session_approval_not_granted` otherwise). "Trust" = lasting auto-approve policy for that session.
`ChatPanel` props: `slotKey`, `conversationOnly?`; "A session the app has just created with `POST /api/chat/slots` can be passed straight away".

## 4. Chat slots / app-owned sessions [API]
- Create: `POST /api/chat/slots` (list: `GET`), body `{name, agent}` per MIG (`api.post('/api/chat/slots', {name, agent})`). Read: `GET /api/chat/slots/{slot}[?limit=N]` (fields `stop_state`, `stop_declined`, `turn`, `turn_gen`). Delete: `DELETE /api/chat/slots/{slot}`. Send: `POST /api/chat` (creates missing slot WITHOUT app ownership/project). Context: `POST /api/chat/slots/{slot}/context`; note: `POST /api/chat/slots/{slot}/note`. Others: `/stop[?force=true]`, `/approve`, `/resume`, `POST /api/chat/mode`.
- Ownership for app-token callers: a new slot may only be opened on a fresh name or a transcript the app already owns; `POST /api/chat/slots` with `name`, a `POST /api/chat` that would create its slot, and `/resume` return 404 `{"error":"not found","code":"slot_not_found"}` for others' transcripts. All other refusals use the same body as a missing target (except missing-grant 403).
- `GET/DELETE /api/sessions*` only reach transcripts recording the calling app as owner. Bulk `DELETE /api/sessions` and `/api/sessions/clearable/count` always refused for apps.
- Per-slot routes `/api/chat/slots/{slot}/*`: with `sessionApproval` only approve/deny reaches non-owned sessions; all else 404 `slot_not_found` unless the app owns the slot, whatever `permissions.api` holds [MAN].
- Slot key format example: `dashboard:chat-2-1787502679` (session key) and `coder-abc123` (slot key in examples). UNSPECIFIED: exact response JSON of `POST /api/chat/slots` (field holding the slot key; docs say `SlotInfo`), exact `POST /api/chat` body schema (fields besides `agent`, `meta`, `sendId`), how ownership is recorded/identified (presumably app-token principal), name uniqueness/format rules, message-length limit.
- WS events (need `permissions.events`): `chat_chunk, chat_thinking, chat_status, chat_message, chat_done, tool_call, tool_result, notification, slots, slot_title, dashboard, log, refresh, approval, approval_resolved, subagent_done`. `slots` event carries `detail: null`; re-read via scoped client. Full set/scoping: `src/kiro_crew/dashboard/ws_event_scope.py` (not read).

## 5. Backend process, proxy and signing [API, MAN]
Launch: gateway spawns `backend.entryPoint` as a sandboxed child. Env injected: `PORT` (bind `127.0.0.1:$PORT`; "auto" port = assigned), `KIROCREW_APP_NAME`, `KIROCREW_HOME`, `KIROCREW_GATEWAY_ORIGIN` (only with bound-port evidence; use for callbacks e.g. `POST /api/notifications/push`), `KIROCREW_PROXY_SECRET` (only if a secret exists), `KIROCREW_SPAWNED=1`, `KIROCREW_SPAWN_INSTANCE`, `KIROCREW_GATEWAY_ORIGIN_PROOF` (hex HMAC-SHA256(secret, origin)).
Secret source: env `KIROCREW_PROXY_SECRET`; on disk `<KIROCREW_HOME>/apps/<name>/.app_secret` (0600), default `~/.kiro/crew/apps/{name}/.app_secret`. If no `.app_secret`, nothing injected.
Proxy: `* /apps/{name}/api/{path}` -> backend. Ordinary response capped at 30 s total; `text/event-stream` has no total but must emit an event or `:` comment at least every 60 s.
UI calls it from the page via `useAppApi()` with path `/apps/{name}/api/...`? UNSPECIFIED whether `permissions.api` must list `/apps/<name>/api` and whether `api.get` takes that exact path; GS says only "dashboard UI can call your app's backend through the gateway reverse proxy at `/apps/{name}/api/*`".

Request signature header: `X-KiroCrew-Proxy: <timestamp>:<hmac-sha256>`.
Signed message (verbatim): `timestamp:method:/api/path[?query]:sha256(body)`; key = app secret; `sha256(body)` = hex SHA-256 of raw body (empty body -> `e3b0c442...`). Algorithm HMAC-SHA256. Compare constant-time; reject if timestamp not within +-60 s of now.
Target = raw percent-encoded request-target as on the wire (`raw_request_target`), not a re-encoded path. UNSPECIFIED: whether `/api/path` in the message is the path as received by the backend (after stripping `/apps/{name}`) or includes the prefix; timestamp unit (seconds vs ms; principal claim `issuedAt` example 1791589507 is seconds, proxy header unit not stated); HMAC output encoding (hex assumed from "hex SHA-256" wording and "hmac-sha256"; not stated). Verify empirically before relying.
Python helper (needs `kiro_crew` importable):
```python
from kiro_crew.apps.proxy_auth import raw_request_target, verify_proxy_request
ok = verify_proxy_request(request.headers.get('X-KiroCrew-Proxy',''), method=request.method,
        target=raw_request_target(request), body=await request.read())   # kwargs-only; secret=None -> proxy_secret()
```
Other helpers: `proxy_secret()`, `verify_proxy_principal_claim(...)`, `ProxyPrincipalReplayCache(max_entries=4096)`.
Signed principal (opt-in `backend.signedPrincipal:true`): header `X-KiroCrew-Principal: <base64url-canonical-json>.<hmac-sha256>`; claim fields exactly `issuedAt, kind, ownerId, requestId (32 lowercase hex), version (1)`; canonical JSON = sorted keys, no whitespace, base64url without padding. HMAC key = app secret over newline-joined lines: `kirocrew-proxy-principal-v1`, `<issuedAt>`, `<method>`, `<raw-target>`, `<sha256(body)>`, `<base64url-canonical-json>`. Kinds: `agent-tool`, `app-token`, `owner-session` (non-empty ownerId), `none`. Reject `issuedAt` >60 s skew; reject replayed `requestId` (record atomically). Gateway strips client-sent `X-KiroCrew-Proxy`/`X-KiroCrew-Principal`.
Dashboard-owner-only checks: require `kind == owner-session`.

## 6. Approval semantics [API, MAN]
- `permissions.sessionApproval` (bool): lets the app act on existing LOCAL USER sessions: send messages (incl. response-option choices; not agent binding/persona/slash-command changes), approve/deny pending tool requests, change approval modes. Not cron/system/remote/member-mode/other apps' sessions. Apps always retain access to their own slots.
- Without it: `POST /api/chat/slots/{slot}/approve` and `POST /api/approvals/{id}/{action}` return 403 `session_approval_not_granted` to app tokens, EVEN for the app's own slots. A bare internal-secret caller is refused too.
- Id resolves on an owned slot or local user session; an id pending on >1 controllable session is refused, name the slot route. Background approvals (cron, autonudge, subagent, task runner) never resolvable by apps; `GET /api/approvals` is always empty for apps (read pending from slot history).
- Modes via `POST /api/chat/mode`: only Normal, Reads (`trust_reads`), Trust (`trust`); `yolo` dashboard-only; mode change must name a live allowed slot.
- Approval actions (python-client labels): `approveAction(slotId, taskId, pattern?)`, `rejectAction`, `resolveApproval(approvalId, action, slotId?, pattern?)`; `trust_command`/`trust_base` require `pattern`. UNSPECIFIED: exact JSON request bodies for `/approve` and `/api/approvals/{id}/{action}`.
- Shown in install/enable consent dialog; official catalog entries mirror it.

## 7. Install / trust / enable / dev [GS, PUB, API]
```
kirocrew gateway                              # run gateway (prereq)
kirocrew app init <name> --ui [--backend --cron]
kirocrew app install /absolute/path/to/app    # local path: copies+registers, does NOT run setup.onInstall
kirocrew app enable <name>                    # refused for any non-builtin app until trusted
kirocrew app disable <name>
kirocrew app info <name>
kirocrew app dev <name> [--off] [--confirm-out-of-install-root]
kirocrew token                                # prints dashboard URL/token
```
Trust: Settings -> Security -> Third-party apps. Grants one app via config key `agent.apps_trusted` or all via `agent.apps_allow_third_party` = JSON `true`. Enable "refuses every app that is not built in" otherwise; untrusted executable surfaces (backend process, hooks, lifecycle scripts, openCommand, registry install scripts) fail with `app_execution_denied`. Only literal `true` admits. UNSPECIFIED: a CLI command to trust an app (none documented; `agent.apps_trusted` value format e.g. list of names is not given); whether `kirocrew app trust` exists.
`enable`/`disable` apply live via the CLI's owner-only Unix socket when gateway is reachable (POSIX); otherwise recorded for next gateway start.
REST (owner only, need dashboard/app auth): `POST /api/apps/install`, `/{name}/enable`, `/{name}/disable`, `/{name}/update`, `/{name}/uninstall`, `/{name}/dev` body `{"enabled":bool}`; `GET /api/apps`, `/api/apps/{name}/manifest`. Static UI: `GET /apps/{name}/ui/{path}`.
Installed to `~/.kiro/crew/apps/{name}/`; `data/` preserved across updates; excludes `node_modules,.git,__pycache__,.venv,.kirocrew-deps`; symlinks outside tree omitted -> commit `ui/dist/`.
Iteration without dev mode: rebuild UI, press Update in App Store UI, refresh.
Dev mode: symlink the WHOLE dir `~/.kiro/crew/apps/<name>/ui` -> source `ui/` (never per-file: 404 via O_NOFOLLOW). Serves `Cache-Control: no-store`, watches `ui/`, broadcasts WS `app_reload {app, ts}`. Out-of-install root requires operator running `kirocrew app dev <name> --confirm-out-of-install-root` in own terminal (agent shells refused: `dev_mode_operator_attestation_required`); grants stored in `~/.kiro/crew/apps/.dev-grants.json`; re-toggle after re-pointing. Builtins cannot use dev mode.
Backend restart on code change in dev mode: UNSPECIFIED.

## 8. Gateway version requirement
`minKiroCrewVersion` manifest field only. The docs state no concrete minimum gateway version for any feature (project "pre-1.0"; "no blanket since 1.0 floor"; "Set `minKiroCrewVersion` for a feature your app requires") [MIG]. Latest release v0.9.0. UNSPECIFIED: which version introduced ChatEmbed, `sessionApproval`, `signedPrincipal`, body-bound HMAC, `panelTabs`. Feature-detect with try/catch on structured 404 (MIG).

## 9. Misc facts
- Node backends: verify HMAC by hand as above; python backends without `kiro_crew` likewise.
- Python deps: root `requirements.txt` provisioned at spawn into `data/.kirocrew-deps/` for `.py` entrypoints. Don't create `.venv`.
- Python client `kirocrew-client` is source-only, not on PyPI; no TS gateway client exists.
- Python app-token auth: secret exchange via `authenticate()`; cookie named from Host header.
- PUB review checklist: minimal permissions, icon 512x512 opaque, UI bundle committed, idempotent `onInstall` exit 0 within 300 s.

## 10. UNSPECIFIED gaps (summary)
1. Scaffold `ui/package.json` and `vite.config.ts` contents; exact Vite externals/format.
2. Page bundle export contract (default export vs `mount`) beyond GS example.
3. `useChatLauncher` formal TS signature and return value.
4. `POST /api/chat/slots` and `POST /api/chat` request/response schemas; how app ownership is bound.
5. Proxy HMAC details: timestamp unit, hmac output encoding, whether signed path includes `/apps/<name>` prefix.
6. How UI paths to the backend appear in `permissions.api` / `useAppApi` calls.
7. CLI to trust an app; format of `agent.apps_trusted`.
8. Concrete minimum gateway version per feature.
9. `kirocrew app init` options beyond `--ui`, `--backend`, `--cron`; what `--backend` scaffolds.
10. Approve/approval-mode request body schemas; examples/ fixtures not read.
