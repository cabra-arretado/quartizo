# Markdown tickets: phase 1 contracts and evidence

Date: 2026-10-20. Implements the format spike in
[the release plan](markdown-tickets-plan.md). The application still uses its
existing database board; these experiments are not imported by the backend.

## Current state

| Acceptance check | Evidence | State |
|---|---|---|
| Recognize a ticket; change its status without touching unrelated bytes | `spikes/markdown_tickets/test_source.py` | Passed |
| Toggle the intended checkbox, preserving all other bytes | Source-location, repeated-text, Unicode, BOM, LF/CRLF/lone-CR tests | Passed |
| Report duplicate identities without merging notes | Complete fixture-snapshot inspection retains both paths and diagnostics | Passed |
| Pin parser dependencies and finalize ordering | Isolated requirements, rank tests, and contracts below | Passed |
| Native Notes navigation and concurrent editing | Shared fixture attached in both apps; normal refresh/conflicts pass; real Notes editor silently overwrites timestamp-preserving edits | Blocked |

Phase 2 shared-write integration must wait for the native gate or an explicit
reduced write workflow. Do not describe phase 1 as accepted yet.

## Run the experiment

From the repository root, using Python 3.12 or newer:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r spikes/markdown_tickets/requirements.txt
make test-formats PYTHON=.venv/bin/python
.venv/bin/python -m spikes.markdown_tickets.fixtures /tmp/quartizo-markdown-fixture-new
```

The fixture command refuses an existing destination. It creates eleven notes,
including deliberately malformed metadata, duplicated ticket IDs, existing
unrelated properties, nested/alternate list markers, code examples, repeated
checkbox text, Unicode, BOM/CRLF, mixed endings, and a missing final newline.
Do not attach the source-code directory as a test vault.

The format suite is included in `make check` and CI. Its dependencies are
installed separately from backend tests so the existing application is still
tested with its stdlib-only runtime. For the whole check locally, install Ruff
0.17.1 in the venv and run `make check PYTHON=.venv/bin/python RUFF=.venv/bin/ruff`.

## File and metadata contract

Files are UTF-8, at most 2 MiB, with an optional UTF-8 BOM. Frontmatter starts
on the first physical line (after the BOM) with `---`, optionally followed by
spaces/tabs, and ends at the next such delimiter. An unclosed block is a
diagnostic; its contents must not produce TODOs. Frontmatter is limited to
64 KiB, 8,192 parser events, and 64 collection levels.

YAML is parsed with the pinned pure-Python safe parser, using nodes rather
than object constructors. Duplicate keys at any depth, non-string keys,
merge keys, anchors/aliases, custom tags, malformed YAML, and non-mapping
documents produce diagnostics and refuse mutations. The conservative
anchor/alias restriction is a spike limitation, not a claim that these are
invalid YAML. Notes remain readable. Body TODOs can still be extracted from
a closed block with invalid metadata, but cannot be toggled until repair.

| Property | Contract |
|---|---|
| `type` | Exact string `ticket` selects a board note. Ordinary notes need no properties. |
| `id` | Canonical lowercase hyphenated UUID, or preserved lowercase 32-hex legacy UID. New tickets will use UUIDv4. IDs are persistent, case-sensitive strings; native vault IDs never substitute for them. |
| `status` | Exact string: `backlog`, `ready`, `in_progress`, `review`, or `done`. |
| `order` | A quoted, fixed-width 32-character lowercase hexadecimal string, excluding the two boundary values below. |
| `quartizo_session` (reserved optional field) | A Quartizo session key under the existing slot-name rules, scoped to the workspace when applicable. The spike preserves it but does not validate or change it. Runtime session state stays in application storage. |

The first real top-level body H1 supplies the title, using its inline text
(without emphasis/link markup). Without an H1, use the filename without `.md`.
Code and quoted headings do not supply titles. The future description is the
body with that H1 source range omitted; it is not an authoritative SQLite
copy. The spike demonstrates title extraction, not description editing.

Explicit promotion refuses any pre-existing `id`, `type`, `status`, or `order`
property, even one that looks compatible. Resolving those meanings requires a
separate repair decision. Promotion preserves existing block properties and
the original body. Adding fields to flow-style frontmatter is unsupported in
the spike; changing a simple scalar already inside a flow mapping is tested.

Status updates replace only the selected scalar's source span. Plain, single-
and double-quoted string scalars are supported; multiline status values are
refused. No full-document serialization occurs. This preserves unrelated
comments, whitespace, quoting, nested YAML, Markdown, BOM, and final-newline
state. Mixed line endings remain readable but all mutations are refused.

Malformed or missing ticket fields keep the path and diagnostics visible.
Duplicate IDs must be checked over all registered workspace scopes in the
production service, and all copies must be quarantined from identity-based
writes until repaired. The prototype inspects an explicit complete fixture
snapshot, retains every path, and reports every duplicate. Its byte-transform
helpers alone do not enforce a cross-workspace duplicate guard.

## Ordering contract

Ranks encode unsigned 128-bit integers as fixed-width lowercase hexadecimal.
Compare using ASCII/binary lexical order, then persistent ticket ID for equal
ranks. Do not use a locale collation or convert the rank to a JavaScript number.

```text
reserved lower boundary: 00000000000000000000000000000000
initial rank:            7fffffffffffffffffffffffffffffff
reserved upper boundary: ffffffffffffffffffffffffffffffff
```

For a move, remove the moving ticket from its old position, validate the
destination neighbours and their source hashes, and choose the integer
midpoint between their ranks. A missing neighbour uses the appropriate
reserved boundary. A successful ordinary move changes one file. Keys never
grow beyond 32 characters. Repeated insertions into the narrowest gap can
exhaust it; the spike returns `RankExhausted`, never equal or truncated ranks.

The pure rebalance planner assigns evenly spaced ranks in the existing total
order. Production maintenance must be resumable:

1. Record the column snapshot, ordered IDs, paths, hashes, proposed ranks,
   and progress in durable application state, separate from the derived index.
2. Mark the column as under maintenance and block Quartizo moves there.
3. Validate and patch one file at a time, recording each resulting hash. On
   restart, recognize already-applied patches by their resulting content.
4. On an unrelated external change, stop and reconcile before continuing.
   Clear maintenance only after every planned file is verified and reindexed.

This is not a multi-file filesystem transaction. Other editors can observe a
partially applied rebalance. The companion must show the maintenance state;
there is no automatic rollback that rewrites intervening user edits. Journals,
column locking, and production rebalance execution belong to phase 2.

## TODO and source-location contract

Use CommonMark block parsing. A TODO is a list item's first paragraph beginning
with `[ ]`, `[x]`, or `[X]`, followed by whitespace or the end of the paragraph.
Recognize `-`, `+`, `*`, ordered `.`/`)` markers, nested items, quoted lists,
tabs, and a first paragraph beginning on the line after an empty list marker.
Ignore fenced/indented code, inline examples, escaped list markers,
frontmatter, later paragraphs in a list item, and unsupported states such as
`[/]`. Empty labels are valid. Each marker appears once, including in tickets.

The pinned paragraph rule is wrapped to capture its physical source position
after the Markdown parser removes list/blockquote prefixes. Parser upgrades
must rerun these position tests. No substring search guesses among repeated
TODO text. Parser nesting/resource limits need additional large-vault testing
before this spike becomes a production indexer.

Each result contains the entire-file SHA-256, UTF-8 byte offset of `[`,
one-based physical line, one-based Unicode code-point column, checked state,
raw inline Markdown label, list depth, and nearest preceding top-level heading.
Line/column are for display/navigation adapters, not mutation identity. A
future editor adapter must explicitly convert to UTF-16 coordinates if needed.

Toggle requests carry a source hash and the indexed source reference. Reread
and parse the current file, match the complete source snapshot, and patch only
the single ASCII byte inside the brackets. A stale hash, mismatched marker,
or forged location is refused. A request that already matches the checked
state is byte-for-byte idempotent, including an existing uppercase `X`.
Checkbox completion never changes ticket status.

The spike applies patches through the existing confined note writer in a
disposable-file integration test. That proves compatibility with its hash
checks and byte-preserving atomic replacement. It does not implement per-file
Quartizo write serialization, derived indexing, HTTP routes, or external-writer
coordination; those remain phase 2 work. Preserve the existing late hash check
and documented residual check-to-replace race when integrating it.

## Native Notes verification

The installed version examined is KiroCrew 0.10.0rc4. Reading the Notes
manifest, Python backend, and current frontend bundle establishes candidates
to test, not a supported embedding or navigation API. Installed bundle hashes
must not become a runtime integration dependency.

An isolated gateway was started with a new home under `/tmp`, no tunnel, and
crons disabled. Authentication worked, but `/md-notebook` showed the coding-
agent setup gate because no supported agent was installed. Existing user
vaults and installed Notes code were not changed. The user's normal gateway
was then started and authenticated at `http://localhost:5476`. Notes initially
reported that it was disabled, then became available during the session.

A fresh local-only Git fixture at
`/tmp/quartizo-notes-phase1-dgol0jq6/vault` was attached through native Notes'
**Attach a folder** form and registered in Quartizo as **Phase 1 disposable
vault**. Knowledge indexing remained off. The fixture has no remote. Existing
user vaults were not edited.

### Real browser results

| Scenario | Actual result |
|---|---|
| Open `ticket.md` in native Notes and Quartizo | Both show the same original file, including its frontmatter and Markdown body |
| Clean native buffer; change status to `review` and check the first TODO through Quartizo's existing confined file writer | Native Notes refreshes automatically and shows both changes |
| Add native unsaved text, then atomically replace the file with a new status and checkbox state 34 ms later (before the 1,000 ms autosave debounce) | Notes shows **This note changed on disk since you opened it** with **Use the version on disk** / **Keep my version**; the draft stays in the editor and external bytes remain on disk |
| Resolve that disposable conflict using the disk version | Native Notes loads status `in_progress` and all four completed checkboxes |
| Add native unsaved text; atomically replace the file 24 ms later with status `done` and its final checkbox unchecked, preserving the prior mtime exactly | Native autosave succeeds without a conflict alert; disk and Quartizo show stale status `in_progress`, the final checkbox checked, and the native text. Both external changes are lost |

The normal conflict screenshot and timestamp-preserving reproduction screenshot
were saved as local chat artifacts. Input text and the external version for the
last test are also retained beside the disposable fixture. The installed backend
SHA-256 below was rechecked before browser testing and was unchanged.

Native selection leaves the URL at `/md-notebook`; its notes are buttons rather
than file links. No supported file/line deep-link contract was established.
The initial navigation adapter must therefore show workspace-relative source
path/heading and an explicitly labeled **Open Kiro Notes** action. App navigation
is verified; precise note/line targeting remains unsupported. Rename, sync and
restart scenarios were not completed after the shared-write blocker was
reproduced.

The installed backend probe completed against KiroCrew 0.10.0rc4, with Notes
`server.py` SHA-256
`b7c9ada2cc28b78adb8ffbbd1d93655454412e228686c3a09b1056dbb22c20a1`:

| Reproduction | Actual result |
|---|---|
| Read note; change its status externally; advance its mtime by 10 ms; save the stale editor contents with the original `baseMtime` | 409; external content preserved |
| Read note; change its status externally; preserve the original mtime with `os.utime`; save the stale editor contents with the original `baseMtime` | Save succeeds; the externally changed status is lost |

The backend table records calls to the installed production save function on
disposable files. The real browser reproduction above independently confirms
the second case through native autosave. This proves a limit of the timestamp
guard, including timestamp-preserving tools or coarse timestamp clocks; it
does not imply every ordinary save loses changes. Quartizo's hash guard cannot
strengthen the other application's stale-write check.

Per the release plan, this is a blocker for unrestricted concurrent writes.
The next decision is a narrow upstream hash-based freshness change, or an
explicitly reduced workflow that prevents simultaneous native and companion
writes. A visual warning alone does not establish exclusive access. This spike
does not patch the installed package or change the agreed release workflow.

Real-host checklist:

1. Done: attach a disposable fixture folder in both native Notes and Quartizo.
2. App/vault/file opening works; no supported exact source-range navigation
   was established. The source-path/heading and app-opening fallback is required.
3. Clean refresh and ordinary dirty-buffer conflicts pass. Timestamp-preserving
   external edits are silently overwritten; this acceptance check fails.
4. Pending: after resolving the write-workflow decision, repeat after rename,
   native sync, and restart before changing the production board.

`probe_native_backend.py` optionally calls the installed backend save function
on temporary notes. It checks normal stale timestamps and timestamp-preserving
external changes. Run it with the interpreter that has KiroCrew installed.
It never modifies installed source, uses only its test-state-directory hook,
and is not a substitute for browser tests or a native dirty-buffer contract.

The report is retained in `markdown-tickets-native-probe.json`.

## Repository validation

`make check` passed with `PYTHON=.venv/bin/python`, `RUFF=.venv/bin/ruff`, and
the inherited `GIT_PAGER`/`PAGER` overrides removed (`TERM=xterm`). Ruff, strict
UI type checking, 233 backend/integration test cases (12 live-gateway cases
skipped without their explicit credentials), 227 UI tests, 23 format tests,
and the rebuilt-bundle drift check completed successfully. The UI bundle has
no diff. An earlier run with `GIT_PAGER=cat` failed the existing pager-control
test; socket-restricted runs also could not start HTTP test servers. No test
was changed to work around either environment restriction.

## Dependency decision

Pin `ruamel.yaml==0.19.1`, `markdown-it-py==4.0.0`, and its transitive
`mdurl==0.1.2` in `spikes/markdown_tickets/requirements.txt` for the spike.
The production backend now uses the same versions, vendored unchanged from
hash-pinned wheels in `backend/_vendor/` (decided for the read-only companion;
see [dependencies](dependencies.md)). Its read-only parser
(`backend/mdsource.py`) reproduces this spike's ticket, diagnostic and TODO
results on the fixture vault; the spike keeps the mutation prototypes.

The [ruamel.yaml API](https://yaml.dev/doc/ruamel.yaml/api/) provides safe
loading, and its [round-trip documentation](https://yaml.dev/doc/ruamel.yaml/detail/)
explicitly describes formatting normalization. This is why exact node-span
patching is required. The [Markdown token documentation](https://markdown-it-py.readthedocs.io/en/latest/api/markdown_it.token.html)
defines line maps; column capture additionally depends on the pinned paragraph
rule and is verified by the fixture tests.
