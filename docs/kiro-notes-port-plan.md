# Plan: port KiroCrew Notes into Quartizo

Status: draft, 2026-10-21. Nothing ported yet.

## Goal

Replace Quartizo's own Notes editor with a copy of the native KiroCrew Notes
app (`md-notebook`), so Quartizo edits notes the way Kiro Notes does, and the
Board and TODOs sit on top of that editor.

Why it matters for the companion: today Board and TODOs are read-only because
native Kiro Notes saves are guarded by mtime only and can overwrite external
changes. If Quartizo owns the editor, Quartizo can add the content-hash guard to
its copy and then let the Board move cards and the TODOs check boxes, without
waiting for a KiroCrew release.

## Source

- Repository: `~/Workspace/KiroCrew` (github.com/kirodotdev/KiroCrew), pinned
  at commit `bdb1c87ff` (2026-10-20). Matches installed kirocrew 0.10.0rc4.
- Backend: `src/kiro_crew/apps/builtins/md_notebook/`, about 5,060 lines of
  Python (server 1,570; git_ops 1,390; server_paths 740; server_store 380;
  notes 370; syncer 230; server_host 185; server_http 190).
- UI: `website/src/apps/md-notebook/`, about 7,400 lines of React/TypeScript
  (state hook 1,580; page 1,080; settings 960; preview 600; note row 520).
- Upstream churn: 14 commits touching these folders in the last month.

## License

Apache-2.0, © Amazon.com, Inc. or its affiliates. Quartizo stays MIT; the
copied files stay Apache-2.0. Obligations:

1. Ship the Apache-2.0 text and KiroCrew's `NOTICE` with the copied code
   (`third_party/kirocrew-notes/LICENSE`, `NOTICE`).
2. Keep existing notices in the copied files (none have per-file headers today).
3. Mark every copied file we change: a header line "Modified by Quartizo from
   KiroCrew <commit>, <path>".
4. List it in `THIRD_PARTY_NOTICES.md` and the README.
5. No "Kiro" branding: the copy is called Quartizo Notes, not Kiro Notes.

UI libraries it pulls in beyond what the host shares (react, react-query,
lucide-react are already host modules): mermaid (MIT), highlight.js
(BSD-3-Clause), dompurify (MPL-2.0 or Apache-2.0; we take Apache-2.0),
framer-motion (MIT), react-i18next (MIT; confirm the exact version).

## What it depends on, and the replacement

### Backend

| Upstream dependency | Replacement in Quartizo |
|---|---|
| aiohttp web server and its routing | Quartizo's existing stdlib HTTP server and router; handlers rewritten from async to sync (logic kept) |
| `kiro_crew.apps.proxy_auth` (signed proxy requests) | Quartizo's existing app-token/proxy auth |
| `kiro_crew.atomic_write`, `platform_compat`, `constants`, `config.paths`, `loop_lock`, `sel`, `git_config_hooks`, `git_worktree_scope` | Small local copies in `backend/kironotes/_compat.py` (also Apache-2.0, marked modified) or Quartizo's existing fd-relative file helpers |
| PyYAML | the vendored ruamel.yaml (already in `backend/_vendor`) |
| `vaults.json` under the KiroCrew config dir | Quartizo's SQLite workspace registry (vault = workspace) |
| `/api/knowledge` registration | dropped in the first release (needs a new permission) |
| `pick-folder` (native folder dialog) | dropped; path is typed, as Quartizo does today |

Kept as-is in logic: note listing, read/save/new/duplicate/move/delete, trash,
search, wikilinks and backlinks (`notes.py`), Git clone/attach/status/commit/
sync with conflict reporting (`git_ops.py`, `syncer.py`), path rules
(`server_paths.py`).

Added by Quartizo: the content-hash freshness check on every save, rename and
delete (`baseHash`, 409 with the current hash), on top of upstream's mtime check.

### UI

| Upstream dependency | Replacement |
|---|---|
| `i18n/t`, `react-i18next`, 145 `apps.mdNotebook.*` strings in 14 locales | English only at first: copy the `en.json` subtree and a 20-line `t()` lookup; no react-i18next |
| Dashboard components: Clickable, ErrorNotice, ReadingWidthToggle, BrandIcon, icons/panels, destinationVars, useImeGuard, useIsMobile, urlTransform, i18n/format (about 1,900 lines) | Copy the small ones; replace ErrorNotice and i18n/format with simpler local versions |
| highlightClient (highlight.js in a web worker + dompurify) | Bundle highlight.js and dompurify; run on the main thread first (the worker URL trick depends on the host's build) |
| mermaid (lazy import) | Phase 2: bundle as a separate lazy chunk, or leave diagrams as code blocks |
| framer-motion | Remove (animations only) |
| Direct `fetch` to `/apps/md-notebook/api` | Quartizo's `AppApi` client to `/apps/quartizo/api/notes/...` |

## Phases

1. **Backend core.** Port `notes.py`, `server_paths.py`, the note routes and
   `server_store.py` onto Quartizo's server, backed by the workspace registry.
   Port upstream's backend tests for those parts (`test_md_notebook_notes.py`,
   `test_md_notebook_write_safety.py`). Add the hash guard and its tests.
2. **UI editor.** Port the page, state hook, note row, block editor and
   preview with the replacements above. Replace Quartizo's Notes tab.
3. **Git.** Port `git_ops.py` and `syncer.py` (attach, status, commit, sync,
   conflict reporting). Clone and PATs last, since they need network and
   secret handling reviewed against Quartizo's threat model.
4. **Companion goes read-write.** With Quartizo owning the editor and the hash
   guard, enable moving cards and checking TODOs, using the phase 1 write rules
   (`docs/markdown-tickets-phase1.md`).
5. **Extras.** Mermaid, settings page, Knowledge indexing if wanted.

Each phase lands as its own commit with tests; `make check` stays green.

## Risks

- **Two editors on one folder.** Native Kiro Notes still exists. If a folder
  is open in both, native saves can still overwrite Quartizo's. The companion
  switch stays, inverted: a folder is edited in Quartizo, and the docs say not
  to edit it in Kiro Notes at the same time.
- **Drift.** Upstream changes often. We pin the commit and record it; pulling
  later fixes is a manual diff against that commit.
- **Size.** Bundle grows from about 310 KB to roughly 1 MB with highlight.js;
  mermaid adds a few MB as a lazy chunk.
- **Rewrite risk in the async-to-sync change.** Mitigated by porting
  upstream's tests with the code.

## Open decisions

1. Branch: start from `feat/kiro-notes-companion` (keeps Board/TODOs and the
   index) or from `main`.
2. First release without Git clone/PAT and Knowledge: yes or no.
3. English only at first: yes or no.
