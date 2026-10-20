# Changelog

## 0.0.1 - 2026-10-20

First release. Written against KiroCrew `f62ab4fd`, verified against
**kirocrew 0.10.0rc4** (see [compatibility.md](compatibility.md)). `app.json`
is at version 0.0.1. License: MIT.

### Added

- **M0 (QTZ-001..003).** App Kit manifest and routed page, Vite lib-mode bundle
  with host externals, stdlib Python backend verifying the gateway's signed
  proxy (`X-KiroCrew-Proxy` HMAC and signed principal, replay refusal, owner
  only), and a Chat tab with a page-created session in `ChatEmbed`.
- **M1 (QTZ-004..006).** Workspaces: registered folders with fd-based path
  confinement; Markdown notes API (list, search, read, create, update with
  hash conflicts, rename, delete to `.trash`, atomic writes); notes UI with
  editor, split/preview, sanitized Markdown.
- **M2 (QTZ-007).** Explicit note context (selection or whole note) handed to a
  per-workspace chat session, or to the full chat as an unsent draft.
- **M3 (QTZ-008, 009).** Per-workspace task metadata in SQLite and a Kanban
  board with ordered and keyboard moves, note/session links, agent-prompt
  preview, JSON import/export.
- **M4 (QTZ-010, 011).** Read-only Git view of several registered
  repositories: status and diff through hardened git, with a keyboard-driven
  changed-files list and diff viewer. Quartizo never stages, commits or writes.
- **M5 (QTZ-012).** Read-only Agents tab: Quartizo's sessions, tool calls,
  errors and subagents, with bounded polling and stale markers.
- **M6 (QTZ-013).** Release hardening: ruff lint, `make check`, CI on
  ubuntu and macOS (Python 3.12/3.13, Node 22) with a `ui/dist` drift check,
  consolidated threat model, compatibility matrix, install docs and
  dependency audit.

### Fixed during M6 (found by macOS CI)

- `ui/src/agents.ts` renamed `agentsModel.ts`: it clashed with `Agents.tsx` on
  case-insensitive filesystems.
- Backend start no longer stalls on a reverse-DNS lookup in
  `HTTPServer.server_bind`.
- Git runner on macOS: `RLIMIT_DATA` is applied on Linux only (macOS rejects
  it), and the real git behind the `/usr/bin/git` Xcode shim is found with
  `xcrun --find git` (the shim cannot run under `RLIMIT_NPROC=0`).

### Migration notes

- The backend keeps its data in `quartizo.sqlite3` under
  `$KIROCREW_HOME/apps/quartizo/data/` (default
  `~/.kiro/crew/apps/quartizo/data/`).
- **DB migrations 1-5 are forward-only and applied automatically** at backend
  start, each in one transaction and recorded in `schema_migrations`:
  1 workspaces, 2 never-reused ids and workspace `uid`, 3 tasks, 4 Git repos,
  5 recorded sessions. There are no down migrations.
- **Back up `quartizo.sqlite3` before upgrading** (stop the app first, or copy
  the file with `sqlite3 quartizo.sqlite3 ".backup backup.sqlite3"`).
- Updating through `kirocrew app uninstall` clears the trust for the app
  (measured on 0.10.0rc4): re-trust before re-enabling. Data in `data/` is
  kept. See the README.
- `app.json` permissions are unchanged since M0 (`/api/chat`,
  `/apps/quartizo/api`), so an update needs no new approval.

### Rollback notes

1. Disable the app and stop it.
2. Restore the backed-up `quartizo.sqlite3` over the data-dir copy (a newer
   schema cannot be read by an older backend).
3. Install the older version of the app, then re-trust and enable it.
4. Notes are plain files and were never converted; nothing to restore there.
   Task data created after the backup is lost with the restore (export tasks
   as JSON first if you need them).

### Known limitations

See [compatibility.md](compatibility.md) ("Not verified" and "Known behaviour
and limits") and the residual risks in [threat-model.md](threat-model.md):
POSIX only, no chat reply verified (no `kiro-cli` on the test host), Tasks,
Git and Agents tabs not yet checked in a real host, dev toolchain advisories
([dependencies.md](dependencies.md)).
