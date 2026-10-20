# Threat model (M1: Markdown workspaces)

Scope: workspace confinement (§1), symlinks and TOCTOU (§2), untrusted
Markdown (§3), task metadata (§4, M3) and read-only Git (§5, M4). Chat
context is covered in [m2.md](m2.md).

## Assets and actors

- **Assets.** Files the backend process can reach outside the registered
  workspaces: the KiroCrew home (`~/.kiro/crew`, which holds app secrets and
  agent state), dotfiles and credentials, other projects. Inside a workspace
  the asset is note content, which must never be silently lost.
- **Callers.** Only the gateway reaches the backend: every `/api` request
  carries a valid `X-KiroCrew-Proxy` HMAC and a signed principal. Every route
  also requires `kind == "owner-session"`, so the caller is the dashboard owner
  acting through the page. App tokens, agent tool calls and unclassified
  principals get 403 on every route.
- **Untrusted inputs.** The *content* of a workspace is untrusted. An agent, a
  synced vault, a cloned repo or a downloaded note can contain anything:
  symlinks, FIFOs, huge files, odd names, hostile Markdown. Request fields are
  also treated as hostile, even from the owner, because the page can be
  confused (for example by a crafted link).

## 1. Workspace confinement

**Registration is opt-in.** No directory is reachable until the owner
registers it with `POST /api/workspaces`. The stored root is the `realpath` at
registration time. Refused:

| Refusal | Why |
|---|---|
| Non-absolute paths, NUL bytes, missing paths, non-directories | No implicit base directory and no surprises |
| `/` itself, by path and by inode (`//`, `/tmp/..`, a symlink to `/`) | Everything would be in scope |
| The home directory itself (`$HOME` and the passwd entry, by path and inode) | Holds credentials and dotfiles; pick a folder inside it |
| Anything that overlaps the KiroCrew home (`$KIROCREW_HOME`) or Quartizo's data dir, in either direction | App secrets, agent prompts and memory are `.md`-adjacent state that agents rely on |
| Overlap with an already registered root, in either direction (409 `root_overlaps`) | One file, one workspace: no aliasing between roots |
| Anything under `/proc`, `/sys` or `/dev` | Pseudo-filesystems, not notes |
| A root not owned by the backend's uid (`root_not_owned`) | Another user could swap its contents or plant links under it |
| A world-writable root (`mode & 0o002`), or a group-writable one unless the group is the user's **private group** (`root_writable_by_others`). Private means: `st_gid == getgid()`, the group's name equals the user's name, and `gr_mem` is empty or only the user. Ubuntu's default umask is 002 with such groups, so real directories are mode 775 | Others could rename entries under us. A private group has no other member, so group write is no wider than owner write. Anything else: `chmod go-w`. The rule is `workspace.writable_by_others`, used at registration and again on every Git call (`open_dir_at` itself checks only ownership, not mode) |

Overlap is decided twice. First on canonical path strings with a separator
boundary, so `/a/notes-private` is **not** inside `/a/notes`. Then by
`(st_dev, st_ino)` of each root against the other's ancestors. The inode check
catches aliases that a string compare misses: case-insensitive or normalizing
filesystems (macOS `realpath` keeps the caller's spelling), and bind mounts.

**Every note path is relative to one root** and is validated before any
filesystem call (`workspace.validate_relpath`). Refused with 400: empty
paths, absolute paths, backslashes, NUL and other control characters, empty
segments (`a//b`), `.` and `..` segments, **hidden segments** (any segment
starting with `.`, so `.trash`, `.obsidian` and `.git` are unreachable through
the API), paths over 1024 characters, and segments over 255 bytes.
Percent-encoding is decoded exactly once, by the HTTP layer, so a literal
`%2e%2e` is just a name.

**Unicode normalization: not applied.** NFC `café.md` and NFD `café.md` are
different names on Linux and are passed through unchanged. macOS APFS/HFS+ may
resolve both to one file. This does not affect confinement: whatever name the
filesystem resolves, it resolves inside the opened root fd. It can, however,
make two list entries look identical in the UI.

**Case.** Quartizo does not fold case. On a case-sensitive filesystem `Notes`
and `notes` are different directories and may be separate roots. On a
case-insensitive one they are the same inode, and the inode overlap check
refuses the second registration.

## 2. Symlinks and TOCTOU

No path string is ever resolved and then reopened. Access goes through file
descriptors (`workspace.open_root`, `open_dir_at`, `open_file_at`):

1. The root is opened from `/` one component at a time with
   `O_DIRECTORY | O_NOFOLLOW`. If the root, or any of its parents, was
   replaced by a symlink after registration, the open fails and the API
   answers 409 `root_changed` ("re-register it"). It never follows the link.
2. Each segment of the relative path is opened with `openat(parent_fd, seg,
   O_NOFOLLOW ...)`. **No symlink inside a workspace is followed, whether it
   points out of the root or stays inside it.** A symlink yields 403
   `symlink_refused`. Listing skips symlinks and hidden entries.
3. Every directory segment opened under the root must also be owned by the
   backend's uid (403 `not_owned` otherwise; listing skips such folders).
4. The final file is opened with `O_NOFOLLOW | O_NONBLOCK` and then
   `fstat`-ed: it must be a regular file. FIFOs, sockets and devices are
   refused without blocking.

Because the open *is* the check, there is no window in which a path can be
swapped between validation and use. The kernel resolves each component
relative to an fd we already hold.

**Writes** never write in place. The temp file is created with
`O_CREAT | O_EXCL | O_NOFOLLOW` relative to the parent fd. It is then moved
with `renameat` (update) or `linkat` (create, which fails with `EEXIST`
instead of clobbering). A note whose file lacks the owner-write bit is never
replaced (403 `read_only`). `.trash` is opened like any other segment, so a
`.trash` symlink is refused and nothing is moved through it.

**Rename and trash** move with a single `renameat2(..., RENAME_NOREPLACE)` on
Linux (called through `ctypes` with the directory fds). It is atomic and never
replaces the target. If an editor atomically replaces the source just before
the call, the *new* file is what moves, so no version is lost. Elsewhere
(macOS, or a filesystem that rejects the flag with `EINVAL`), the fallback is
`linkat(src, dst)`, then a check that `src` is still the inode just linked,
then `unlinkat(src)`. If the check fails, the new link is removed and the
request answers 409 `conflict`. If the unlink fails, the new link is removed
(no note is left in two places, e.g. in `.trash` as well) and the error is
returned.

**Errors** that the file layer does not classify are mapped by errno, never
with a path in the message: `EACCES`/`EPERM` 403, `ENOSPC`/`EDQUOT` 507,
`EROFS` 409, anything else 500 `io_error`.

**Request limits.** Bodies are capped at 1 MiB, except note writes
(`POST`/`PUT .../note`), which may reach the note limit after JSON escaping
(about 12 MiB). The larger limit applies only if the `X-KiroCrew-Proxy`
timestamp is fresh. That is a cheap check made before the body is read; the
full HMAC is verified afterwards. At most 16 connections are served at once.
Further ones wait up to 5 s in the accept loop and are then dropped.

**Residual risks (accepted for M1):**

- **Update race window.** The current hash is re-checked after the temp file
  is fully written, immediately before `os.replace`. An external write that
  lands in the microseconds between that check and the replace is lost. That
  version is overwritten, not merged. Closing it needs a lock that every
  editor honours, and none exists for plain files.
- **Move fallback window** (non-Linux, or no `RENAME_NOREPLACE` support). An
  external atomic replace of the source that lands between the inode check
  and `unlinkat` removes that new version from the source name. The old
  version is the one that was moved, so the new edit is lost. The window is
  two syscalls wide. On Linux with `renameat2` there is no such window.
- **Filesystems without hard links** (FAT/exFAT, some network and FUSE
  mounts): create answers 409 `links_unsupported` rather than fall back to a
  clobbering rename, and so do rename and delete when `renameat2` is not
  available there either. Update (plain `os.replace`) works.

- **Hard links.** A hard link inside the workspace to a file elsewhere is a
  regular file and is readable. Creating one needs write access to the
  workspace and (with Linux `protected_hardlinks`) ownership of the target.
  Writes are not affected: an atomic write replaces the directory entry and
  never writes through the link. Renaming a note onto another hard link of
  the same inode is refused (409 `exists`). Only a same-folder name that
  differs in case is treated as a spelling alias on a case-insensitive
  filesystem.
- **Bind mounts and mount points inside a root** are crossed like ordinary
  directories.
- **Root renamed, not symlinked.** If the root directory is moved away and a
  *real* directory is created at the same path, Quartizo serves the new
  directory. That path is still the one the owner registered.
- **The sandbox.** The gateway runs the backend under its OS sandbox
  (`wrap_argv(mode="standard")` in 0.10.0rc4). A workspace in the owner's
  home was registered, read and written in the live smoke run (see
  compatibility.md). Which other host paths stay visible was not mapped. A
  registered root that the sandbox hides shows up as `root_missing`.
- **POSIX only.** Confinement needs `dir_fd` support in `os.open` (Linux,
  macOS). Windows is not supported by the M1 backend.

## 3. Untrusted Markdown

Note content is rendered into the dashboard page, which holds the owner's
session and can call every API Quartizo is granted. Hostile Markdown must not
run script, load resources or navigate with the owner's credentials.
`ui/src/markdown.ts`:

- **Raw HTML is disabled** (`markdown-it` `html: false`). `<script>`,
  `<img onerror>`, `<iframe>`, `<svg onload>`, `<details ontoggle>` and HTML
  comments are emitted as escaped text.
- **URL allowlist.** A link renders only if its normalized URL starts with
  `http://`, `https://` or `mailto:`. Anything else stays literal text with no
  anchor: `javascript:` in any case or with entity, tab or percent tricks,
  `data:`, `vbscript:`, `file:`, protocol-relative `//host`, and relative
  paths such as `/api/...`. This covers inline links, reference definitions
  and autolinks.
- **No images are loaded.** An image renders as a `[image: alt]` text
  placeholder, so a preview makes no network request: no tracking pixels and
  no credentialed GETs against the gateway.
- **Links open in a new tab** with `rel="noopener noreferrer nofollow"`.
- Code spans and fences are escaped by markdown-it. Table alignment is the
  only `style` attribute it emits (`text-align:...`).

`ui/test/markdown.test.ts` renders 30 payloads. For each output it checks
every tag and attribute against an allowlist and every `href` against the URL
allowlist, and it asserts that no script-capable element appears.

**Residual risk.** The sanitizer is markdown-it's own escaping plus our
renderer rules. No second, DOM-based pass (DOMPurify) runs. A markdown-it
bug that emits raw markup would reach `dangerouslySetInnerHTML`. The pinned
version and the structural test reduce the risk, but they cannot rule it out.
Note *names* are rendered as React text, never as HTML.

## 4. Task metadata (M3)

Tasks are rows in the app's SQLite DB, behind the same signed, owner-only
routes as everything else. The threats are a task becoming a way to reach
files or sessions, an import that corrupts or silently replaces data, and
lost updates.

- **`note_ref` grants nothing.** It is validated with the note path rules
  (`notes.note_segments`: relative, no `..`, no hidden segments, no
  backslash or control characters, `.md`), stored as a string and never
  opened by `tasks.py` (a test patches `os.open` to fail during task
  writes). The UI opens it only through `GET .../note?path=`, so the M1
  confinement (§1-2) applies in full. A dangling `note_ref` is just a 404
  when opened.
- **`slot_id` grants nothing.** It must match Quartizo's own session-name
  pattern, and a workspace session must be this workspace's. The backend has
  no chat client, and `tasks.py` imports no network module (a test checks
  the source and patches `socket` during moves). The UI uses `slot_id` only
  for a transcript link and a read-only status poll, and re-checks it with
  `isSlotName` first.
- **Moves never launch anything.** A move only rewrites `status` and order.
  Agent prompts are built only after an explicit click, previewed, and handed
  over with `autoSend: false` (see the UI notes in the compatibility doc).
- **Size limits.** Title 200 characters, description 64 KiB, 2000 tasks per
  project, 1 MiB request body for task routes and 4 MiB for an import (only
  with a fresh proxy timestamp, like note writes).
- **Import.** Strict schema (unknown keys refused), every field validated
  before the transaction starts, one transaction, all or nothing. It never
  replaces existing tasks unless `replace` and `confirm` are both true, and
  never reuses a uid owned by another project.
- **Lost updates.** Update, move and delete need the version last read; a
  stale one is refused (409 `stale`) and the UI shows the conflict.
- **Workspace removal** with tasks needs an explicit `deleteTasks=1`.
- **Rendering.** Titles render as React text. Descriptions go through
  `ui/src/markdown.ts` (§3), the same sanitizer as notes.
- **Errors.** A SQLite error answers 503 `db_busy` (lock timeout) or 500
  `db_error`, never with SQL or a path.

- **UI.** The board's drop handler accepts only its own MIME type and a uid
  of a task on this board. `slot_id` is re-checked with `isLinkableSlot`
  before any status poll or transcript link. `note_ref` is re-checked with
  `isNoteRef` before linking and is opened only by Notes through the notes
  API. An import file is size-checked (4 MiB) and JSON-parsed in the page.
  Then it goes to the backend, which decides; replace and copy each need an
  explicit confirmation in the page.

**Residual risks.** Task data is plain SQLite in the app data dir, readable
by anything running as the owner (like the notes themselves). A move's
`index` is relative to the server's current column, so a move based on a
stale view of the *other* cards lands at that index, not next to a
particular neighbour; only the moved task's own version is checked.

## 5. Git, read only (M4)

**The threat.** A repository's `.git/config`, `.gitattributes` and
`.git/info/attributes` are attacker-controlled data. Anything that can write
in the work tree can write them, in particular an agent working in the repo
under its own sandbox. Git config can name commands (`core.fsmonitor`,
`filter.<d>.clean`/`smudge`/`process`, `diff.<d>.textconv`/`command`,
`diff.external`, `core.pager`, `core.sshCommand`, hooks, credential
helpers…). If Quartizo's backend ran one of them, the agent would get code
execution as the owner, outside its sandbox, triggered by the owner just
looking at a diff. So no read path may run any repo-configured command.

**Registration.** The workspace root policy (§1) applies unchanged
(`workspace.canonical_root`), plus `.git` must be a real directory or a
`gitdir:` file (not a symlink) and `git rev-parse --show-toplevel` must
equal the canonical path. Each call re-opens the root without following a
symlink (`root_changed` otherwise), re-checks owner and mode, and re-checks
`.git`.

**How git is run** (`backend/gitrepo.py`, every call):

| Measure | What it stops |
|---|---|
| `subprocess.Popen` with an argv list, never a shell; `stdin=DEVNULL`; `cwd=<root>`; own process group | Shell injection; prompts; stray children survive a kill |
| Fixed subcommands and flags built server-side. The page sends only an id, a path and an enum. Paths go after `--` as `:(literal)<path>` | Option injection (`--output=…`, `-c…`, leading `-`), pathspec magic and globs |
| 10 s timeout, stdout cap read through the pipe (4 MiB status, 512 KiB diff, 256 KiB other), 16 KiB stderr; on either limit the process group is SIGKILLed | Hangs and memory exhaustion |
| Environment built from scratch: `GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_SYSTEM`/`GIT_CONFIG_GLOBAL=/dev/null`, `GIT_ATTR_NOSYSTEM=1`, `GIT_TERMINAL_PROMPT=0`, `GIT_OPTIONAL_LOCKS=0`, `GIT_NO_LAZY_FETCH=1`, `GIT_ALLOW_PROTOCOL=none`, `GIT_NO_REPLACE_OBJECTS=1`, `LC_ALL=C`, `GIT_CEILING_DIRECTORIES=<parent of root>` (defence in depth: it splits on `:`), a minimal `PATH`. Nothing is inherited: no `GIT_DIR`, `GIT_WORK_TREE`, `GIT_INDEX_FILE`, `GIT_CONFIG_PARAMETERS`, `SSH_AUTH_SOCK` | Inherited redirection, the user's global/system config (and its filters, e.g. git-lfs), network, discovery above the root |
| `HOME` and `XDG_CONFIG_HOME` = an empty, app-owned `0700` dir (`<data>/git-home`). **Decision:** not the user's home. Global config is already off by `GIT_CONFIG_GLOBAL`; this also keeps `~`-relative lookups away from the user's dotfiles. Cost: personal settings (e.g. `core.quotePath`, aliases) are ignored, which is fine for fixed plumbing | Global config and attributes |
| `-c core.fsmonitor=false -c core.hooksPath=/dev/null -c diff.external= -c core.pager=cat -c protocol.allow=never -c credential.helper= -c status.submoduleSummary=false -c submodule.recurse=false --no-pager --no-optional-locks`; diffs add `--no-ext-diff --no-textconv --no-color --ignore-submodules=dirty` | The named config keys. Command-line config wins over the repo's |
| `--git-dir=<root>/.git --work-tree=<root>` on every work-tree call (`.git` may be a `gitdir:` file; git follows it; tested for worktrees and submodule checkouts). Roots whose path contains `:` are also refused at registration (`root_refused`) | A hostile `core.worktree` (or `core.bare`) pointing git at another folder; discovery walking above the root when a `:` in the path breaks `GIT_CEILING_DIRECTORIES` |
| Plumbing for diffs (`diff-files`, `diff-index`) | Diff UI config: textconv, external diff, color, renames config |
| Every `filter.<driver>` in the effective config is blanked through `GIT_CONFIG_COUNT` (`clean`, `smudge`, `process` empty; `required=false`). Over 64 drivers: 409 `too_many_filters` | **Clean filters run on read paths.** Measured on git 2.53: `git status` and `git diff-files` run `filter.<d>.clean` on a stat-dirty, same-size file, even with `GIT_OPTIONAL_LOCKS=0` and `--no-optional-locks` (those stop the index *write*, not the content compare). There is no flag that disables all filters, and attributes in `.git/info/attributes` override anything we could set, so the drivers are enumerated (`git config --null --name-only --list`) and neutralized by name. `GIT_CONFIG_COUNT` keeps key and value apart, so a driver name containing `=` cannot break the override |
| **git may not start any process or thread.** It is exec'd through `python -I -S -c` that sets `RLIMIT_NPROC` to 0 first (soft and hard). Every `fork`/`clone` git attempts then fails with `EAGAIN`; threaded index preload/reading is turned off so git does not need threads | Everything the rows above do not: the **race** where an agent adds a filter driver between the enumeration call and the real call (or flips `includeIf.onbranch`), and any command-running config not known here. Measured: with the drivers *not* blanked, a hostile `required` clean filter makes git fail ("cannot create async thread"), it does not run |
| **git's heap is capped** by the same trampoline: `RLIMIT_DATA` = 512 MiB (not `RLIMIT_AS`, so pack and index mmaps still work). An allocation past it fails (`git_failed`, or `git_out_of_memory`) | Memory bombs: `.git/info/attributes` symlinked to `/dev/zero`, `core.attributesFile=/dev/zero`, `status --find-renames` over a huge staged blob. Tested: both attribute bombs fail in under 3 s |
| **Fail closed if the limit does not bind.** After setting the limits the trampoline tries `fork()`. If that succeeds (root, `CAP_SYS_RESOURCE`) the child exits at once and the trampoline exits 97 without running git; the backend answers 500 `git_sandbox_unavailable` | The no-spawn layer silently doing nothing when run as root. Tested by running the trampoline without the `RLIMIT_NPROC` line |

Each layer is tested on its own: the hostile-config tests run every
endpoint with the no-spawn limit off (flags and blanking alone) and with the
blanking off (the limit alone). Every hostile test first shows that plain
git, run the way a user would, does run the hostile command (the marker
appears), so the test is not vacuous.

**Not mutated.** Status runs with optional locks off (no index refresh
write, no `index.lock`), diffs are plumbing, and nothing else is run. A test
snapshots the whole root (`.git` included: index bytes, refs, every file's
mode, size, mtime, inode and hash, and directory mtimes) before and after
every endpoint, with a stat-dirty file, an untracked cache, a dirty
submodule, a staged rename and an untracked file present.

**Paths.** The note path rules (§1) with two changes for Git: dot segments
are allowed (`.gitignore`, `.github/…`), and any `.git` segment is refused
in any case. A directory path does not widen a diff: results are matched to
the exact path. An ignored file cannot be read through the diff route. An
untracked file is read with the fd-based no-follow helpers (§2); an
untracked symlink shows its target string, never the target's content.

**Rendering.** Diff text, file names and branch names are React text nodes.
Nothing from git reaches `innerHTML`. Git's stderr is never sent to the
page (it names paths); failures map to stable codes.

**Residual risks.**

- **Root swap race.** The root is checked fd-relative, but git gets
  `cwd=<path>`; a rename of the root to a symlink in the microseconds
  between the check and git's `chdir` would be followed. The swap needs
  write access to the root's parent.
- **`gitdir:` files are trusted.** A `.git` file (worktree, submodule) can
  point at any repository the owner can read; Quartizo then shows that
  repository's index and objects against this work tree. Only the owner
  sees it, and git itself checks ownership (`safe.directory`).
- **`RLIMIT_NPROC` is counted per user** (per user namespace on Linux 5.14+).
  It does not bind root or processes with `CAP_SYS_RESOURCE` /
  `CAP_SYS_ADMIN`; there Quartizo refuses to run git (500
  `git_sandbox_unavailable`) rather than run it unconfined. The trampoline adds
  about 15 ms per git call (4-6 calls per request).
- **Resource use inside git.** A huge repository can still make status
  slow (bounded by the 10 s timeout) or hit the 512 MiB `RLIMIT_DATA` heap cap
  (git then fails with `git_failed`/`git_out_of_memory`). File mmaps (packs)
  are not counted by that limit; the 10 s timeout and output caps bound the rest.
- **Partial clones** show missing objects as 500 `git_failed`: lazy fetch
  is refused, by design.
