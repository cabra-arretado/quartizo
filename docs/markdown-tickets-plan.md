# Quartizo: Kiro Notes companion, then a unified workspace

Status: the read-only companion delivery (see the 2026-10-20 update at the
end) is implemented: per-workspace companion mode, the rebuildable index,
read-only Board and TODOs, and the navigation fallback. Shared-folder writes
remain blocked: timestamp-preserving external edits can be silently
overwritten by Notes autosave, so phase 1 acceptance for writes is pending a
native fix; see the phase 1 evidence. Format contracts are in
[markdown-tickets-phase1.md](markdown-tickets-phase1.md).

Date: 2026-10-20

## Outcome and scope

Deliver the product in two releases. Use Kiro Notes unchanged for the first release, then add its features to a unified Quartizo interface in the second.

| Release | User experience | Scope |
|---|---|---|
| 1 — Companion | Kiro Notes for writing; a separate Quartizo page for Board and TODOs | Shared Markdown files, ticket metadata, a rebuildable index, and migration of existing cards |
| 2 — Unified Quartizo | Notes, Board, and TODOs in one Quartizo interface | Adapt Kiro Notes' source and reuse the companion's data services |

Both releases operate on the same Markdown files:

| View | Source | Editing behavior |
|---|---|---|
| Notes | Registered Markdown folders | Kiro Notes edits the original note in release 1; Quartizo gains its own Notes view in release 2 |
| Board | Notes marked as tickets in frontmatter | Moving a card updates its metadata; a navigation adapter opens the note in the available editor |
| TODOs | Markdown checkboxes in all registered folders | Toggle the original checkbox; identify and navigate to its source using the available editor capabilities |

Ticket identity, status, ordering, content, and TODO completion live in files. SQLite supplies a rebuildable index for fast queries. Existing workspace/repository registrations and session accounting remain application state, separate from the derived index.

In release 1, Kiro Notes owns its editor, folder navigation, wikilinks, backlinks, vault cloning/sync, and optional Knowledge integration. Attach the same existing vault folder in both apps. Quartizo provides ticket and TODO operations over that folder; it does not clone the editor, replace Notes' backend, edit its installed package, or read its private configuration as an integration contract. Chat, Agents, and the existing Git inspector remain available as secondary views.

Release 2 is an additive interface change. Retain the same vaults, note IDs, frontmatter contract, and TODO syntax. This transition should not require a ticket-content migration; an index upgrade may require a rebuild, and editor configuration may require mapping. Changing the agreed file format later would be a separate migration decision.

## Proposed data contract

Ticket notes use ordinary YAML frontmatter. Start with four fields and the existing five board columns:

```markdown
---
id: 8423e295-12ce-4b61-a281-d719c1fa86f6
type: ticket
status: ready
order: "7fffffffffffffffffffffffffffffff"
---

# Fix login timeout

Sessions expire while the user is typing.

- [ ] Reproduce the timeout
- [ ] Add a regression test
```

The sample `order` is the initial fixed-width 128-bit hexadecimal rank selected
by the phase 1 spike. Encoding, comparison, exhaustion, and resumable rebalance
rules are in [the phase 1 contract](markdown-tickets-phase1.md#ordering-contract).

1. **Ticket identity and selection.** `type: ticket` includes a note on the board. `id` is persistent and survives renames; new tickets get UUIDs. Migration preserves existing unique task UIDs. Ordinary notes require no new metadata. Promoting a note is explicit and must detect conflicting existing property meanings before writing.
2. **Title, description, and status.** The first body H1 supplies the title, falling back to the filename; the remaining body supplies the description. No separate authoritative title or description is stored in SQLite. Statuses are `backlog`, `ready`, `in_progress`, `review`, and `done`. Missing or invalid ticket fields appear as repairable diagnostics rather than disappearing from the interface.
3. **Portable ordering and relationships.** `order` uses sparse sortable keys with a deterministic ID tie-break. Ordinary moves change one note rather than renumbering all siblings. Define key growth limits and resumable rebalance behavior in Phase 1; multi-file maintenance must not be described as a filesystem transaction. Portable note relationships use Markdown links; existing session links get a documented optional frontmatter field. Runtime session state remains live application data.
4. **TODO semantics.** Parse real Markdown checkbox list items, including nested items and valid alternate list markers. V1 recognizes unchecked and checked markers (`[ ]`, `[x]`, `[X]`). Ignore examples in fenced/indented code and frontmatter. Preserve the surrounding text and nesting. Completing every checkbox does not automatically change ticket status.
5. **Metadata compatibility.** Read safe YAML and preserve unrelated frontmatter, comments, quoting, and Markdown formatting during targeted updates. Malformed or ambiguous metadata stays readable and gets a diagnostic; metadata mutations are refused until repaired. TaskNotes is the architectural reference, while exact field mapping and format compatibility are evaluated separately from this initial contract.

## Implementation sequence

Complete release 1 (phases 1–4) before starting release 2 (phase 5). Each phase has a concrete acceptance check.

### Boundaries that support both releases

1. **Editor-independent services.** Keep ticket queries, board moves, TODO queries/toggles, file mutations, and index reconciliation outside UI components. The future Notes view consumes these services rather than creating another note store.
2. **Stable file references.** Use Quartizo workspace identity and relative note paths, with persistent ticket IDs where present. Map these to Kiro Notes' vault references through a small integration adapter; never make native vault IDs the ticket's identity.
3. **Replaceable note navigation.** Board and TODOs emit one open-note request containing the source reference and optional source range. Release 1 navigates to Kiro Notes; release 2 opens Quartizo's editor. Verify native deep links before promising file or line selection. If exact targeting is unavailable, show the source path/heading and provide a clearly labeled Open Kiro Notes action as the initial fallback.
4. **Separate writers.** Kiro Notes retains its own save implementation in release 1. Quartizo serializes and validates its own writes, and detects changes from Notes through reconciliation. Cross-app access to unsaved editor buffers is not assumed.

### 1. Specify formats and prove the risky operations — 1–2 developer days

Produce a small fixture vault and written contracts for ticket fields, TODO parsing, ordering, source-location validation, and conflicts. Prototype a round-trip-preserving YAML updater and a Markdown parser with accurate source ranges. Choose and pin dependencies based on those results; the current stdlib-only backend is a constraint to reassess, not a reason to write an incomplete YAML parser.

Test notes with existing properties, duplicate IDs, invalid YAML, nested lists, checkbox examples, Unicode, BOMs, LF/CRLF, and repeated identical TODO text. Quartizo treats mixed-line-ending files as read-only unless exact byte-preserving mutation is proven.

Verify the companion integration with the installed Kiro Notes version: attach a disposable folder to both apps, determine native navigation capabilities, and check how Notes handles external metadata/checkbox edits with both clean and unsaved editor buffers. Record capabilities and the navigation fallback. If a native behavior can silently lose changes, treat it as a release blocker requiring a narrow upstream fix or a reduced write workflow before proceeding.

Acceptance: a fixture ticket is recognized, its status can be changed, and one checkbox can be toggled while unrelated bytes remain unchanged. Duplicate IDs are reported and never silently merged. The supported Kiro Notes navigation and concurrent-edit behavior are demonstrated rather than assumed.

### 2. Build shared file mutations and the derived index — 3–5 developer days

Add proposed backend modules for metadata parsing, checkbox extraction, file mutations, and indexing. Keep current path confinement, authentication, size limits, atomic replacement, and trash handling. Append database migrations; do not edit applied migrations.

All Quartizo metadata changes and checkbox toggles use one mutation service; the future Quartizo editor will use it too. Kiro Notes saves continue through its existing backend. Each Quartizo write request includes a source content hash. Serialize Quartizo writes to the same file, reread and validate before applying the patch, and return the new hash. Reject stale or ambiguous edits with a conflict response. Retain the documented residual limitations of coordinating with unrelated external writers.

The index records note paths/hashes, ticket properties, TODO source ranges, and scan diagnostics. TODO database IDs are index-local references, not permanent identities: a toggle must validate the current source and never trust a saved line number alone. Persist only the data needed for queries and diagnostics; files remain authoritative.

Successful file writes are indexed immediately. If indexing fails afterward, report the file save as successful and the index as stale; schedule reconciliation. Scan on startup and manual Refresh, then run bounded periodic reconciliation. Reconcile when a visible view is reopened. Use content validation to detect changes that timestamps alone miss. A native filesystem watcher can be added only if measured latency or cost requires it.

Scan in bounded batches rather than assuming the existing 2,000-result note listing represents the whole vault. Expose progress, freshness, and incomplete/error states. Retain last-known rows on unreadable files or failed scans; infer deletions only from a successful scan of the relevant scope. Rebuild into a new index generation and swap it into service after completion.

Acceptance: Kiro Notes saves and other external-file edits update the index; interruption between a Quartizo file write and SQLite update repairs on reconciliation; discarding derived tables rebuilds equivalent ticket and TODO results without touching files or registrations.

### 3. Connect Board and add TODOs — 3–5 developer days

Refactor the existing board to query indexed ticket notes. Reuse its layout, keyboard navigation, and drag/drop interactions, while replacing the current dense database ordering and task versions with note identity, sparse ranks, and source hashes. Validate source/destination context for moves so stale board state cannot silently choose a different position.

Make Board and TODOs the primary views of the companion. Keep the current Quartizo editor out of the new primary workflow; retain legacy access only as needed during migration. Opening a card goes through the note-navigation adapter, using verified native targeting or the explicit source-path fallback. Creating a card creates a ticket note; promoting an existing note adds ticket metadata after collision checks. Removing a note from Board removes its ticket marker and preserves its body. Moving a note to trash is a separate, clearly labeled operation. Workspace removal forgets indexed data and registrations, leaving notes on disk.

Add a TODOs view across all registered folders, with workspace and completion filters, grouping by note, and source-note/heading context. Hide completed items by default. Clicking an item sends its verified source range to the navigation adapter; the adapter only promises capabilities established in phase 1. Checking an item updates the original file through the shared mutation service. Each checkbox appears once even when its note is also a ticket.

Treat Kiro Notes as an independent writer. Use source hashes to reject stale Quartizo operations and verify native refresh/conflict behavior in real-host scenarios; do not implement a pretend cross-app save prompt without a supported integration. For any retained Quartizo editor, prompt to save or cancel before another Quartizo view edits the same file and refresh clean buffers after successful writes. Preserve existing explicit review before sending note/ticket context into chat, and adapt agent/session links to the new ticket identities.

Acceptance: one ticket note appears in native Kiro Notes and Quartizo's Board, and contributes its checkboxes to TODOs. A card move, checkbox toggle, rename, and Notes edit reconcile across the two apps; ticket status and checkbox completion remain independent. Unsupported exact-note navigation has a visible, usable fallback.

### 4. Migrate existing cards and ship release 1 — 3–5 developer days

Build an explicit migration preview: show source card counts, destination paths, statuses/order, existing note/session links, and any conflicts. Every existing card becomes a new ticket note; linked notes stay intact and are referenced from it. Several cards linking to the same note therefore remain separate tickets without rewriting or combining that note.

Back up application data and export legacy cards before conversion. Use collision-safe names, preserve legacy UIDs, retain legacy rows, and record progress so interrupted runs resume without duplicating files. Keep each workspace's legacy board authoritative until all of its cards are converted and verified; block legacy edits during conversion and provide a resumable failure state. Switch each verified workspace to the file-backed board explicitly. Migration audit data is application state, not part of the disposable index.

Verify counts, contents, relationships, and relative order against the preview. Re-running migration must create no duplicates. Provide a recovery procedure that preserves post-migration note edits; do not automatically delete created notes as rollback. Running an older application against a migrated workspace must be documented as requiring the pre-migration application backup, not as an ordinary downgrade.

Add focused backend, API, and UI integration tests for the new write paths, stale data, malformed metadata, renames, duplicate task text, interrupted rebuilds/migration, and line-ending preservation. Re-run existing authentication, confinement, Markdown sanitization, chat, and Git checks. Run `make check`, then exercise the real KiroCrew host with native Kiro Notes, Quartizo, and an external editor editing a disposable vault. Include native Notes with unsaved edits, native vault sync, and app restarts. Use an actual browser to verify keyboard/focus behavior, navigation capabilities/fallbacks, and source-location labels.

Acceptance: existing cards survive conversion with matching content/status/order; legacy data remains recoverable; companion tests pass; deleting only the derived task index and rebuilding restores the views. Native Kiro Notes remains the writing interface. Update README, architecture, compatibility, and third-party notices, and rebuild the committed UI bundle.

### 5. Add the unified Quartizo interface in release 2 — 8–13 additional developer days

Start after the companion release is verified. Use a short source-reuse spike pinned to a known upstream commit to decide how to adapt Kiro Notes' source into Quartizo. There is no verified public Notes embedding component to depend on. Inventory the editor and navigation dependencies, replace host-private imports with App Kit adapters, and carry upstream attribution and license notices with reused source. Retain the companion's shared mutation/index services rather than introducing a second note store. Notes, Board, and TODOs become primary views within Quartizo.

Implement and validate the features in a bounded order: editing and folder/navigation behavior; wikilinks and backlinks; then vault Git clone/sync and optional Knowledge indexing. Record an explicit upstream feature checklist during the spike so “clone” has a testable meaning. Existing read-only Git inspection remains separate from any new vault-sync write operations. Evaluate required dependencies, permissions, credential handling, conflict behavior, and editor source-position mapping before each integration.

Any feature requiring host-private APIs gets a documented adapter or a visible scope decision; do not depend on hashed installed bundles. The first delivery targets the current Linux/macOS support. Windows support and full Tasks/TaskNotes language compatibility are separate estimates, not implied by visual parity.

Switch the note-navigation adapter from native Notes to the integrated editor and add shared in-app dirty-buffer handling, source selection, and focus restoration. Keep existing file IDs, metadata, and vault locations. Record the upstream baseline and an update procedure so maintenance of the adapted editor is explicit.

Acceptance: the agreed upstream feature checklist passes in the real host, including editing a ticket and jumping to/toggling TODOs through the adapted editor. Notes, Board, and TODOs continue to read and change the same files. Existing companion tickets and TODOs work in the unified interface without converting their content or metadata.

## Release gates

1. Discarding only derived index tables loses no ticket identity, content, status, ordering, portable relationships, or checkbox state. Workspace registrations, session accounting, and migration records are preserved separately.
2. Stale, ambiguous, malformed, duplicate-ID, and incomplete-scan states are surfaced; known conflicts do not silently overwrite note content or target a different TODO.
3. In release 1, native Kiro Notes and Quartizo edits reconcile over their shared folders; in release 2, the integrated Notes, Board, and TODO views agree through shared services. Damaged or unreadable input is never treated as evidence of deletion.
4. Migration is previewable, recoverable, resumable, and idempotent. Existing linked notes and legacy exports are preserved.
5. Repository checks and real-host scenarios pass for the release scope. Documentation names any remaining Notes-parity gaps.

## Effort and first action

Release 1, Kiro Notes companion (phases 1–4): **10–17 developer days**, approximately **2–4 working weeks** for one developer. Release 2, unified Quartizo (phase 5): **8–13 additional developer days**. Combined: **18–30 developer days**, approximately **4–6 working weeks**. These are planning ranges, not elapsed-time commitments. Native navigation/concurrent-edit integration, metadata-preserving writes, migration edge cases, and later upstream editor reuse are the main uncertainties; phase 1 and the phase 5 spike should refine the estimates. Release 1 does not include editor cloning or Notes feature-parity work.

The first implementation action is to attach a disposable fixture folder to native Kiro Notes and Quartizo, add a ticket note and ordinary-note checkbox examples, and prove metadata/checkbox round trips and cross-app refresh/conflict behavior. Then implement the companion against those contracts.

## References and current implementation

| Reference | Relevance |
|---|---|
| `backend/notes.py`, `backend/workspace.py`, `ui/src/editorDoc.ts` | Existing confined file access, hashes, atomic writes, and editor conflict state |
| `backend/tasks.py`, `backend/db.py`, `ui/src/tasksApi.ts`, `ui/src/board.ts` | Legacy database cards, migrations, API shapes, and dense ordering to replace |
| `ui/src/App.tsx`, `ui/src/Notes.tsx`, `ui/src/Tasks.tsx`, `ui/src/taskContext.ts` | Current view composition, editor/board interaction, and explicit chat context |
| [TaskNotes core concepts](https://tasknotes.dev/obsidian/core-concepts/), [Tasks source cache](https://raw.githubusercontent.com/obsidian-tasks-group/obsidian-tasks/main/src/Obsidian/Cache.ts), [Dataview index](https://raw.githubusercontent.com/blacksmithgu/obsidian-dataview/master/src/data-index/index.ts) | Note-per-task metadata, checkbox aggregation, and rebuildable indexes |
| [Kiro Notes manifest](https://raw.githubusercontent.com/kirodotdev/KiroCrew/main/src/kiro_crew/apps/builtins/md_notebook/app.json), `docs/compatibility.md`, `docs/dependencies.md` | Feature baseline, host integration constraints, and dependency review |

## Update — 2026-10-20: read-only companion first, with clickable sources

**Decision:** deliver a read-only Board and TODOs companion before enabling
shared-folder writes. This addendum takes precedence over the earlier writable
release 1 scope for the next delivery. The writable companion and unified
Quartizo interface remain later stages.

The native Notes tests demonstrated clean-buffer refresh and ordinary
dirty-buffer conflicts, but also reproduced silent overwrites when an external
edit preserves the file's timestamp. See
[phase 1 evidence](markdown-tickets-phase1.md#native-notes-verification).
That blocks companion writes, while read-only indexing and navigation can
proceed without changing Notes.

| Capability | Initial read-only delivery |
|---|---|
| Board and TODOs | Display ticket notes, statuses, ordering, checkboxes, and diagnostics from the shared Markdown files through the rebuildable index |
| Click a ticket or TODO | Show its source file path and heading, with an **Open Kiro Notes** action through the navigation adapter |
| Open native Notes | App-level navigation to `/md-notebook` is verified |
| Jump to an exact note or checkbox | Not verified; do not promise direct file or line selection. Use the visible source path/heading so the user can select the source in Notes |
| Move cards or check off TODOs in Quartizo | Disabled until the native conflict gap is resolved and the shared-write gate passes |

The read-only path must not write ticket metadata, ordering, Markdown content,
or checkbox state. Creating/promoting/removing tickets and trashing source notes
are also outside this delivery. Enforce this boundary in the backend/API as
well as the UI; a retained Quartizo editor must not provide a write bypass for
these companion vaults. Native Notes remains the editing interface. Application
state such as folder registrations and the derived SQLite index can still be
updated.

**Next implementation:** build the read/index/reconciliation portion of phase
2, followed by the read-only Board and TODOs views from phase 3. Preserve the
editor-independent services and replaceable navigation adapter. Legacy-card
conversion remains a separate explicit migration under the original preview,
backup, and verification requirements; read-only browsing must not trigger it.

**Acceptance:** native Notes edits reconcile into the Board and TODOs; each
checkbox appears once; clickable entries expose the correct source context and
open Notes; unsupported exact targeting has a visible fallback. Browsing,
refreshing, and rebuilding the index leave vault bytes unchanged, and companion
write operations are unavailable. Missing, malformed, duplicate-ID, stale, and
incomplete-scan states remain visible.

A KiroCrew fork and upstream PR for the Notes conflict check remain a possible
follow-up. Before enabling companion writes, repeat the failing native scenario
against the fixed version and pass the original write-path release gates. The
earlier effort estimates cover the full writable releases; estimate this
smaller read-only delivery separately.

### Delivered — read-only companion

Implemented in `backend/companion.py`, `backend/mdsource.py`,
`ui/src/Companion.tsx`, `ui/src/companionApi.ts` and `ui/src/noteNav.ts`; usage
in the README ("Using the Kiro Notes companion"), design in
[architecture](architecture.md#kiro-notes-companion-read-only), risks in
[threat model §10](threat-model.md#10-kiro-notes-companion-read-only).

| Decision | Choice |
|---|---|
| Which folders are companion vaults | An explicit per-workspace switch (`workspaces.companion`, migration 6). While on, every Quartizo note write to that folder is refused by the backend. The legacy database board of that workspace is kept untouched and returns when the switch is turned off |
| Parser packaging | ruamel.yaml 0.19.1, markdown-it-py 4.0.0 and mdurl 0.1.2 vendored unchanged from hash-pinned wheels in `backend/_vendor/` ([dependencies](dependencies.md)) |
| Index | Derived `companion_*` tables, rebuilt by generation; every note is hashed on every scan; incomplete scans and unreadable notes retain last-known rows |
| Reconciliation | Startup, view open, every 30 s while a view is visible, Refresh, Rebuild; no filesystem watcher |
| Navigation | App-level **Open Kiro Notes** plus visible path, line/column and heading; **View in Quartizo (read-only)** |

Acceptance evidence: `tests/backend/test_companion.py` covers recognition,
duplicate IDs across workspaces, the repair lane, each checkbox once,
timestamp-preserving external edits, renames and deletions, incomplete and
failed scans, unreadable notes, rebuilding from dropped tables, interrupted
generations, and an unchanged vault (bytes, mtimes, hidden entries) after
browsing, refreshing and rebuilding over HTTP, where every write route is
refused. Through an isolated 0.10.0rc4 gateway the API gave the same results
and left the fixture vault byte-identical
([compatibility](compatibility.md#kiro-notes-companion-isolated-gateway-kirocrew-0100rc4-2026-10-20)).
**Not yet done:** the rendered Board/TODOs in the dashboard and reconciliation
against real native Notes edits, sync and restarts; the isolated gateway's
setup gate needs a signed-in `kiro-cli`.

