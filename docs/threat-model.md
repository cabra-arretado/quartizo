# Threat model (M1: Markdown workspaces)

Scope: the M1 sections only. These are workspace confinement, symlinks and
TOCTOU, and untrusted Markdown. Kanban, Git and chat-context features (M2+) are
out of scope.

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
3. The final file is opened with `O_NOFOLLOW | O_NONBLOCK` and then
   `fstat`-ed: it must be a regular file. FIFOs, sockets and devices are
   refused without blocking.

Because the open *is* the check, there is no window in which a path can be
swapped between validation and use. The kernel resolves each component
relative to an fd we already hold.

**Writes** never write in place. The temp file is created with
`O_CREAT | O_EXCL | O_NOFOLLOW` relative to the parent fd. It is then moved
with `renameat` (update) or `linkat` (create, rename, trash; these fail with
`EEXIST` instead of clobbering). `.trash` is opened like any other segment, so
a `.trash` symlink is refused and nothing is moved through it.

**Residual risks (accepted for M1):**

- **Update race window.** The current hash is re-checked after the temp file
  is fully written, immediately before `os.replace`. An external write that
  lands in the microseconds between that check and the replace is lost. That
  version is overwritten, not merged. Closing it needs a lock that every
  editor honours, and none exists for plain files.
- **Filesystems without hard links** (FAT/exFAT, some network and FUSE
  mounts): create, rename and delete answer 409 `links_unsupported` rather
  than fall back to a clobbering rename. Update (plain `os.replace`) works.

- **Hard links.** A hard link inside the workspace to a file elsewhere is a
  regular file and is readable. Creating one needs write access to the
  workspace and (with Linux `protected_hardlinks`) ownership of the target.
  Writes are not affected: an atomic write replaces the directory entry and
  never writes through the link.
- **Bind mounts and mount points inside a root** are crossed like ordinary
  directories.
- **Root renamed, not symlinked.** If the root directory is moved away and a
  *real* directory is created at the same path, Quartizo serves the new
  directory. That path is still the one the owner registered.
- **The sandbox.** The gateway runs the backend under its OS sandbox
  (`wrap_argv(mode="standard")` in 0.10.0rc4). Which host paths stay visible
  and writable inside it was not measured, because the app has not been
  enabled. A registered root the sandbox hides shows up as `root_missing`.
- **POSIX only.** Confinement needs `dir_fd` support in `os.open` (Linux,
  macOS). Windows is not supported by the M1 backend.
