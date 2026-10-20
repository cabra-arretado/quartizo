"""Read-only Git for explicitly registered repositories (QTZ-010).

A repo is a Git work tree top level that the dashboard owner registered
(``POST /api/repos``). The same root policy as notes workspaces applies
(``workspace.canonical_root``), plus: ``git rev-parse --show-toplevel`` must
be the path itself.

Every Git call goes through ``GitRunner.run``. The frontend never sends Git
arguments: only a repo id, a pathspec (validated like note paths, see
``git_path``) and an enum (``mode``). The argv is built here from fixed lists.

Layers, each one enough on its own for the hostile-config cases in
tests/backend/test_git.py (a repo's ``.git/config``, ``.gitattributes`` and
``.git/info/attributes`` are attacker-controlled: any agent working in the
repo can write them):

1. ``subprocess`` with an argv list (never a shell), ``stdin=DEVNULL``,
   ``cwd=<root>``, a timeout, an output cap (read through pipes, then the
   process group is killed), and a minimal environment: no inherited ``GIT_*``,
   no system or global config, ``HOME`` an empty app-owned directory,
   ``GIT_CEILING_DIRECTORIES`` and, on every work-tree call, an explicit
   ``--git-dir=<root>/.git`` so discovery never walks above the root.
2. Hardening ``-c`` options on every call (``HARDENING``), ``--no-pager``,
   ``--no-optional-locks`` and ``GIT_OPTIONAL_LOCKS=0`` (nothing is written:
   no index refresh), ``--work-tree=<root>`` (a hostile ``core.worktree``
   cannot point elsewhere), protocol allowlist ``GIT_ALLOW_PROTOCOL`` plus
   ``GIT_NO_LAZY_FETCH`` (no network, no ``core.sshCommand``).
3. Filter drivers: ``git status`` and ``git diff-files`` run
   ``filter.<driver>.clean`` on stat-dirty files, even with optional locks off
   (measured). Every ``filter.*`` driver named in the effective config is
   blanked (``clean``/``smudge``/``process`` empty, ``required`` false) through
   ``GIT_CONFIG_COUNT``, which keeps key and value apart.
4. Git may not start any process at all: it is exec'd through a tiny Python
   trampoline that sets ``RLIMIT_NPROC`` to 0 first, so every fork, and every
   thread, git attempts fails. This closes what the layers above cannot: the
   race where a driver is added to the config between the enumeration in (3)
   and the real call, and any command-running config not known here. Threaded
   index preload/reading is turned off so git does not need threads. The same
   trampoline caps git's heap (``RLIMIT_DATA``, 512 MiB) and fails closed: if
   it can still fork (root, ``CAP_SYS_RESOURCE``) git is not run
   (``git_sandbox_unavailable``).

Diffs use plumbing (``diff-files``, ``diff-index``), which reads no diff UI
config (no textconv, no external diff, no color), plus ``--no-ext-diff
--no-textconv``.
"""
from __future__ import annotations

import os
import re
import selectors
import shutil
import signal
import sqlite3
import stat
import subprocess
import sys
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass

import db
from workspace import (
    MAX_NAME_CHARS,
    ApiError,
    Registry,
    _ident,
    canonical_root,
    open_file_at,
    open_parent,
    open_root,
    writable_by_others,
    validate_relpath,
)

GIT_TIMEOUT_S = 10.0
MAX_DIFF_BYTES = 512 * 1024
MAX_DIFF_FILE_BYTES = 8 * 1024 * 1024
MAX_STATUS_BYTES = 4 * 1024 * 1024
MAX_STATUS_ENTRIES = 5000
MAX_SMALL_OUTPUT = 256 * 1024
MAX_STDERR_BYTES = 16 * 1024
MAX_FILTER_DRIVERS = 64
MIN_GIT_VERSION = (2, 38)  # ls-files --format
DIFF_MODES = ("worktree", "staged")
BINARY_SNIFF_BYTES = 8000  # what git itself looks at

# Fixed options before every subcommand. Command-line config wins over the
# repo's own config for the same key.
HARDENING: tuple[str, ...] = (
    "--no-pager",
    "--no-optional-locks",
    "-c", "core.fsmonitor=false",
    "-c", "core.hooksPath=/dev/null",
    "-c", "diff.external=",
    "-c", "core.pager=cat",
    "-c", "protocol.allow=never",
    "-c", "credential.helper=",
    "-c", "status.submoduleSummary=false",
    "-c", "submodule.recurse=false",
    # Layer 4 forbids threads; these keep git from needing any.
    "-c", "core.preloadIndex=false",
    "-c", "index.threads=1",
)
DIFF_FLAGS: tuple[str, ...] = (
    "--no-ext-diff", "--no-textconv", "--no-color", "--ignore-submodules=dirty", "--submodule=short",
)

EMPTY_TREE = {
    "sha1": "4b825dc642cb6eb9a060e54bf8d69288fbee4904",
    "sha256": "6ef19b41225c5369f1c104d45d8d85efa9b057b53b14b4b9b939dd74decc5321",
}

# Runs as `python -I -S -c <this> <git> <args...>`: no site, no env, no cwd on
# sys.path. The limits are inherited by git: it cannot fork or spawn threads,
# and its heap (brk and anonymous mmap; file mmaps such as packs are not
# counted) is capped. RLIMIT_NPROC does not bind root or CAP_SYS_RESOURCE, so
# the wrapper then probes with a fork and, if one succeeds, does not run git.
GIT_DATA_LIMIT = 512 << 20
SANDBOX_EXIT = 97
SANDBOX_MARK = b"quartizo-git-sandbox-unavailable"
_LIMITS = ("import os,resource,sys\n"
           "resource.setrlimit(resource.RLIMIT_NPROC,(0,0))\n"
           f"resource.setrlimit(resource.RLIMIT_DATA,({GIT_DATA_LIMIT},{GIT_DATA_LIMIT}))\n")
_NO_SPAWN = (_LIMITS +
             "try:\n"
             " pid=os.fork()\n"
             "except OSError:\n"
             " pid=-1\n"
             "if pid==0:os._exit(0)\n"
             "if pid>0:\n"
             " os.waitpid(pid,0)\n"
             f" sys.stderr.write('{SANDBOX_MARK.decode()}\\n')\n"
             f" os._exit({SANDBOX_EXIT})\n"
             "os.execv(sys.argv[1],sys.argv[1:])")

_OID_RE = re.compile(r"[0-9a-f]{40}|[0-9a-f]{64}")
_FILTER_KEY_RE = re.compile(rb"filter\.(.+)\.(?:clean|smudge|process|required)")
_VERSION_RE = re.compile(rb"git version (\d+)\.(\d+)")


@dataclass(frozen=True)
class Repo:
    id: int
    uid: str
    name: str
    path: str

    def to_json(self) -> dict:
        return {"id": self.id, "uid": self.uid, "name": self.name, "path": self.path}


@dataclass
class GitResult:
    returncode: int
    stdout: bytes
    stderr: bytes
    truncated: bool


def git_path(rel: object) -> list[str]:
    """A repo-relative path from the client: the note path rules, except dot
    segments are allowed (``.gitignore``, ``.github/...``) and any ``.git``
    segment is refused (any case: case-insensitive filesystems)."""
    segments = validate_relpath(rel, allow_hidden=True)
    if any(seg.casefold() == ".git" for seg in segments):
        raise ApiError(400, "bad_path", "paths inside .git are not reachable")
    return segments


def literal(path: str) -> str:
    """A pathspec that matches exactly *path*: no glob, no magic, no option."""
    return ":(literal)" + path


# --------------------------------------------------------------------------
# Runner
# --------------------------------------------------------------------------

class GitRunner:
    """Runs one hardened git command with caps. See the module docstring."""

    def __init__(self, home: str, *, git: str | None = None, timeout: float = GIT_TIMEOUT_S,
                 no_spawn: bool = True) -> None:
        self.home = home
        os.makedirs(home, mode=0o700, exist_ok=True)
        self.git = git if git is not None else shutil.which("git")
        self.timeout = timeout
        self.no_spawn = no_spawn  # tests turn layer 4 off to check the other layers alone
        self._version: tuple[int, int] | None = None
        self._lock = threading.Lock()

    def _env(self, root: str, config: dict[str, str]) -> dict[str, str]:
        git_dir = os.path.dirname(self.git or "/usr/bin/git")
        env = {
            "PATH": os.pathsep.join(dict.fromkeys((git_dir, "/usr/bin", "/bin"))),
            "HOME": self.home,
            "XDG_CONFIG_HOME": self.home,
            "LC_ALL": "C",
            "LANG": "C",
            "TZ": "UTC",
            "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_CONFIG_SYSTEM": os.devnull,
            "GIT_CONFIG_GLOBAL": os.devnull,
            "GIT_ATTR_NOSYSTEM": "1",
            "GIT_TERMINAL_PROMPT": "0",
            "GIT_OPTIONAL_LOCKS": "0",
            "GIT_NO_LAZY_FETCH": "1",
            # Set, so every transport is refused regardless of protocol.<name>.allow.
            "GIT_ALLOW_PROTOCOL": "none",
            "GIT_PROTOCOL_FROM_USER": "0",
            "GIT_NO_REPLACE_OBJECTS": "1",
            "GIT_PAGER": "cat",
            "PAGER": "cat",
            "GIT_ADVICE": "0",
            "GIT_CEILING_DIRECTORIES": os.path.dirname(root) or "/",
        }
        env.update(config)
        return env

    def argv(self, root: str, args: list[str], *, work_tree: bool) -> list[str]:
        if not self.git:
            raise ApiError(503, "git_unavailable", "git is not installed (or not on PATH)")
        cmd = [self.git, *HARDENING]
        if work_tree:
            # An explicit git dir: no discovery above the root, whatever the
            # path looks like (GIT_CEILING_DIRECTORIES splits on ':').
            cmd.append(f"--git-dir={root}/.git")
            cmd.append(f"--work-tree={root}")
        cmd.extend(args)
        if self.no_spawn:
            return [sys.executable, "-I", "-S", "-c", _NO_SPAWN, *cmd]
        return cmd

    def version(self, root: str) -> tuple[int, int]:
        with self._lock:
            if self._version is None:
                res = self._exec(root, ["--version"], limit=4096, work_tree=False, config={})
                if _sandbox_failed(res):
                    raise _sandbox_error()
                m = _VERSION_RE.match(res.stdout)
                if res.returncode != 0 or not m:
                    raise ApiError(503, "git_unavailable", "could not run git --version")
                self._version = (int(m.group(1)), int(m.group(2)))
        if self._version < MIN_GIT_VERSION:
            raise ApiError(503, "git_too_old",
                           "git {}.{} or newer is required".format(*MIN_GIT_VERSION))
        return self._version

    def run(self, root: str, args: list[str], *, limit: int = MAX_SMALL_OUTPUT, work_tree: bool = True,
            config: dict[str, str] | None = None) -> GitResult:
        self.version(root)
        return self._exec(root, args, limit=limit, work_tree=work_tree, config=config or {})

    def _exec(self, root: str, args: list[str], *, limit: int, work_tree: bool,
              config: dict[str, str]) -> GitResult:
        argv = self.argv(root, args, work_tree=work_tree)
        try:
            proc = subprocess.Popen(
                argv, cwd=root, env=self._env(root, config), stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, close_fds=True, start_new_session=True,
            )
        except FileNotFoundError:
            raise ApiError(503, "git_unavailable", "git is not installed (or not on PATH)") from None
        except NotADirectoryError:
            raise ApiError(404, "root_missing", "the repository folder no longer exists") from None
        out, err = bytearray(), bytearray()
        truncated = False
        deadline = time.monotonic() + self.timeout
        sel = selectors.DefaultSelector()
        try:
            sel.register(proc.stdout, selectors.EVENT_READ)  # type: ignore[arg-type]
            sel.register(proc.stderr, selectors.EVENT_READ)  # type: ignore[arg-type]
            while sel.get_map() and not truncated:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise ApiError(504, "git_timeout", f"git took longer than {self.timeout:g} s")
                for key, _ in sel.select(remaining):
                    chunk = os.read(key.fd, 1 << 16)
                    if not chunk:
                        sel.unregister(key.fileobj)
                    elif key.fileobj is proc.stdout:
                        out += chunk
                        if len(out) > limit:
                            del out[limit:]
                            truncated = True
                            break
                    elif len(err) < MAX_STDERR_BYTES:
                        err += chunk[: MAX_STDERR_BYTES - len(err)]
            if truncated:
                _kill(proc)
            try:
                proc.wait(timeout=max(0.05, deadline - time.monotonic()))
            except subprocess.TimeoutExpired:
                raise ApiError(504, "git_timeout", f"git took longer than {self.timeout:g} s") from None
        finally:
            sel.close()
            if proc.poll() is None:
                _kill(proc)
            proc.wait()
            proc.stdout.close()  # type: ignore[union-attr]
            proc.stderr.close()  # type: ignore[union-attr]
        return GitResult(proc.returncode, bytes(out), bytes(err), truncated)


def _kill(proc: subprocess.Popen) -> None:
    try:
        os.killpg(proc.pid, signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        pass


def _sandbox_failed(res: GitResult) -> bool:
    return res.returncode == SANDBOX_EXIT and SANDBOX_MARK in res.stderr


def _sandbox_error() -> ApiError:
    return ApiError(500, "git_sandbox_unavailable",
                    "the process limit that confines git is not enforced here (running as root?); git is not run")


def _failure(res: GitResult, what: str) -> ApiError:
    """Map a failed git call. Never echoes git's stderr (it names paths)."""
    if _sandbox_failed(res):
        return _sandbox_error()
    err = res.stderr.lower()
    if b"out of memory" in err or b"malloc failed" in err or b"cannot allocate memory" in err:
        return ApiError(500, "git_out_of_memory", f"git {what} hit the memory limit")
    if b"not a git repository" in err or b"must be run in a work tree" in err:
        return ApiError(409, "not_a_repo", "this folder is no longer a Git work tree")
    if b"dubious ownership" in err:
        return ApiError(409, "unsafe_repo", "git refused the repository (dubious ownership)")
    return ApiError(500, "git_failed", f"git {what} failed (exit {res.returncode})")


def _ok(res: GitResult, what: str) -> GitResult:
    if res.returncode != 0 and not res.truncated:
        raise _failure(res, what)
    return res


# --------------------------------------------------------------------------
# Parsing
# --------------------------------------------------------------------------

def _text(raw: bytes) -> tuple[str, bool]:
    """(text, valid): valid is False when *raw* is not UTF-8 (shown lossy, not diffable)."""
    try:
        return raw.decode("utf-8"), True
    except UnicodeDecodeError:
        return raw.decode("utf-8", "replace"), False


def _diffable(path: str, valid: bool) -> bool:
    if not valid:
        return False
    try:
        git_path(path.rstrip("/"))
    except ApiError:
        return False
    return True


def parse_status(data: bytes, *, max_entries: int = MAX_STATUS_ENTRIES) -> dict:
    """Parse ``git status --porcelain=v2 -z --branch`` output.

    Returns ``{head, entries, truncated}``. Unknown record types are skipped.
    """
    head = {"oid": None, "branch": None, "detached": False, "unborn": False,
            "upstream": None, "ahead": None, "behind": None}
    entries: list[dict] = []
    truncated = False
    tokens = data.split(b"\0")
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        i += 1
        if not tok:
            continue
        if tok.startswith(b"# "):
            key, _, value = tok[2:].partition(b" ")
            val = value.decode("utf-8", "replace")
            if key == b"branch.oid":
                head["unborn"] = val == "(initial)"
                head["oid"] = val if _OID_RE.fullmatch(val) else None
            elif key == b"branch.head":
                head["detached"] = val == "(detached)"
                head["branch"] = None if head["detached"] else val
            elif key == b"branch.upstream":
                head["upstream"] = val
            elif key == b"branch.ab":
                m = re.fullmatch(r"\+(\d+) -(\d+)", val)
                if m:
                    head["ahead"], head["behind"] = int(m.group(1)), int(m.group(2))
            continue
        kind = tok[:2]
        entry: dict | None = None
        if kind in (b"1 ", b"2 ", b"u "):
            nfields = {b"1 ": 9, b"2 ": 10, b"u ": 11}[kind]
            parts = tok.split(b" ", nfields - 1)
            if len(parts) != nfields:
                continue
            xy = parts[1].decode("ascii", "replace")
            sub = parts[2].decode("ascii", "replace")
            path, valid = _text(parts[-1])
            entry = {
                "path": path, "origPath": None,
                "kind": {b"1 ": "changed", b"2 ": "renamed", b"u ": "unmerged"}[kind],
                "index": xy[0], "worktree": xy[1:2] or ".",
                "submodule": sub.startswith("S"),
                "submoduleCommitChanged": sub.startswith("S") and sub[1:2] == "C",
                "score": None, "diffable": _diffable(path, valid),
            }
            if kind == b"2 ":
                score = parts[8].decode("ascii", "replace")
                if score[:1] == "C":
                    entry["kind"] = "copied"
                entry["score"] = int(score[1:]) if score[1:].isdigit() else None
                if i < len(tokens):
                    orig, ovalid = _text(tokens[i])
                    i += 1
                    entry["origPath"] = orig
                    entry["diffable"] = entry["diffable"] and _diffable(orig, ovalid)
        elif kind in (b"? ", b"! "):
            path, valid = _text(tok[2:])
            entry = {
                "path": path, "origPath": None,
                "kind": "untracked" if kind == b"? " else "ignored",
                "index": kind[:1].decode(), "worktree": kind[:1].decode(),
                "submodule": False, "submoduleCommitChanged": False, "score": None,
                # An untracked directory (`dir/`) is listed, not descended into.
                "diffable": not path.endswith("/") and _diffable(path, valid),
            }
        if entry is None:
            continue
        if entry["kind"] == "unmerged":
            entry["staged"] = entry["unstaged"] = True
        else:
            entry["staged"] = entry["index"] not in (".", "?", "!")
            entry["unstaged"] = entry["worktree"] not in (".",) or entry["kind"] == "untracked"
        if len(entries) >= max_entries:
            truncated = True
            break
        entries.append(entry)
    return {"head": head, "entries": entries, "truncated": truncated}


def counts(entries: list[dict]) -> dict:
    return {
        "staged": sum(1 for e in entries if e["staged"] and e["kind"] != "unmerged"),
        "unstaged": sum(1 for e in entries if e["unstaged"] and e["kind"] not in ("unmerged", "untracked")),
        "untracked": sum(1 for e in entries if e["kind"] == "untracked"),
        "conflicted": sum(1 for e in entries if e["kind"] == "unmerged"),
    }


def is_binary_diff(text: str) -> bool:
    return any(line.startswith("Binary files ") and line.endswith(" differ") for line in text.split("\n"))


def _cut(data: bytes, limit: int) -> tuple[bytes, bool]:
    """At most *limit* bytes, cut after the last full line when over."""
    if len(data) <= limit:
        return data, False
    head = data[:limit]
    nl = head.rfind(b"\n")
    return (head[: nl + 1] if nl >= 0 else head), True


# --------------------------------------------------------------------------
# Store
# --------------------------------------------------------------------------

class RepoStore:
    """Registered repos (DB migration 4) and the read-only Git operations on them."""

    def __init__(self, registry: Registry, runner: GitRunner) -> None:
        self.registry = registry
        self.runner = runner
        self._lock = threading.Lock()

    @contextmanager
    def _conn(self, *, write: bool = False) -> Iterator[sqlite3.Connection]:
        conn = db.connect(self.registry.db_path)
        try:
            with db.transaction(conn, write=write):
                yield conn
        finally:
            conn.close()

    # -- registry ----------------------------------------------------------

    def list(self) -> list[Repo]:
        with self._conn() as conn:
            return [Repo(r["id"], r["uid"], r["name"], r["path"]) for r in db.list_repos(conn)]

    def get(self, repo_id: int) -> Repo:
        with self._conn() as conn:
            row = db.get_repo(conn, repo_id)
        if row is None:
            raise ApiError(404, "repo_not_found", "no such repository")
        return Repo(row["id"], row["uid"], row["name"], row["path"])

    def register(self, raw_path: object, name: object = None) -> Repo:
        real = canonical_root(raw_path, self.registry.protected, "repository")
        label = _label(name, real)
        try:
            self._check_git_entry(real)
        except ApiError as err:
            if err.code != "not_a_repo":
                raise
            if _under_git(real):
                raise ApiError(400, "not_repo_toplevel",
                               "the folder is inside a repository; register the repository's top-level folder") from None
            raise ApiError(400, "not_a_repo", "the folder is not a Git work tree (it has no .git)") from None
        if ":" in real:
            # Discovery here relies on GIT_CEILING_DIRECTORIES, which splits on ':'.
            raise ApiError(400, "root_refused", "a repository path cannot contain ':'")
        res = self.runner.run(real, ["rev-parse", "--show-toplevel"], limit=8192, work_tree=False)
        if res.returncode != 0:
            raise ApiError(400, "not_a_repo", "the folder is not a Git work tree (bare repos are not supported)")
        top = res.stdout.rstrip(b"\n")
        if b"\n" in top or os.path.realpath(os.fsdecode(top)) != real:
            raise ApiError(400, "not_repo_toplevel",
                           "the folder is inside a repository; register the repository's top-level folder")
        ident = _ident(real)
        with self._lock, self._conn(write=True) as conn:
            for row in db.list_repos(conn):
                if row["path"] == real or (ident is not None and _ident(row["path"]) == ident):
                    raise ApiError(409, "repo_exists", f"already registered as {row['name']!r}",
                                   repoId=row["id"])
            new_id, uid = db.insert_repo(conn, label, real)
        return Repo(new_id, uid, label, real)

    def unregister(self, repo_id: int) -> None:
        """Forget a repo. Nothing on disk is touched."""
        with self._lock, self._conn(write=True) as conn:
            if not db.delete_repo(conn, repo_id):
                raise ApiError(404, "repo_not_found", "no such repository")

    # -- per-call checks ---------------------------------------------------

    @staticmethod
    def _check_git_entry(root: str) -> None:
        """The root opens without following a symlink, is still ours, and its
        ``.git`` is a real directory or a ``gitdir:`` file (worktree, submodule),
        not a symlink."""
        fd = open_root(root)
        try:
            st = os.fstat(fd)
            if st.st_uid != os.getuid():
                raise ApiError(403, "not_owned", "the repository folder belongs to another user")
            if writable_by_others(st):
                raise ApiError(409, "root_writable_by_others",
                               "the repository folder is world-writable or writable by a shared group; run `chmod go-w` on it")
            try:
                gst = os.stat(".git", dir_fd=fd, follow_symlinks=False)
            except FileNotFoundError:
                raise ApiError(409, "not_a_repo", "the folder has no .git") from None
        finally:
            os.close(fd)
        if stat.S_ISLNK(gst.st_mode):
            raise ApiError(409, "git_link_refused", ".git is a symlink; it is not followed")
        if not (stat.S_ISDIR(gst.st_mode) or stat.S_ISREG(gst.st_mode)):
            raise ApiError(409, "not_a_repo", ".git is neither a directory nor a gitdir file")

    def filter_overrides(self, root: str) -> dict[str, str]:
        """GIT_CONFIG_COUNT entries blanking every filter driver in the effective config."""
        res = self.runner.run(root, ["config", "--null", "--name-only", "--list"], limit=MAX_SMALL_OUTPUT)
        if res.truncated:
            raise ApiError(409, "config_too_large", "the repository's Git config is too large")
        _ok(res, "config")
        drivers: list[bytes] = []
        for key in res.stdout.split(b"\0"):
            m = _FILTER_KEY_RE.fullmatch(key)
            if m and m.group(1) not in drivers:
                drivers.append(m.group(1))
        if len(drivers) > MAX_FILTER_DRIVERS:
            raise ApiError(409, "too_many_filters", "the repository defines too many filter drivers")
        env: dict[str, str] = {}
        n = 0
        for drv in drivers:
            name = os.fsdecode(drv)
            for var, value in (("clean", ""), ("smudge", ""), ("process", ""), ("required", "false")):
                env[f"GIT_CONFIG_KEY_{n}"] = f"filter.{name}.{var}"
                env[f"GIT_CONFIG_VALUE_{n}"] = value
                n += 1
        env["GIT_CONFIG_COUNT"] = str(n)
        return env

    def _prepare(self, repo_id: int) -> tuple[Repo, dict[str, str]]:
        repo = self.get(repo_id)
        self._check_git_entry(repo.path)
        return repo, self.filter_overrides(repo.path)

    def _git(self, repo: Repo, cfg: dict[str, str], args: list[str], what: str, *,
             limit: int = MAX_SMALL_OUTPUT) -> GitResult:
        return _ok(self.runner.run(repo.path, args, limit=limit, config=cfg), what)

    # -- reads -------------------------------------------------------------

    def _status(self, repo: Repo, cfg: dict[str, str]) -> dict:
        res = self._git(repo, cfg, [
            "status", "--porcelain=v2", "-z", "--branch", "--untracked-files=normal", "--ignored=no",
            "--ignore-submodules=dirty", "--find-renames", "--ahead-behind",
        ], "status", limit=MAX_STATUS_BYTES)
        if res.truncated:
            raise ApiError(413, "status_too_large", "git status output is over the size limit")
        return parse_status(res.stdout)

    def status(self, repo_id: int) -> dict:
        repo, cfg = self._prepare(repo_id)
        parsed = self._status(repo, cfg)
        c = counts(parsed["entries"])
        return {"repo": repo.to_json(), "head": parsed["head"], "counts": c,
                "clean": not parsed["entries"], "entries": parsed["entries"], "truncated": parsed["truncated"]}

    def info(self, repo_id: int) -> dict:
        repo, cfg = self._prepare(repo_id)
        parsed = self._status(repo, cfg)
        res = self._git(repo, cfg, ["rev-parse", "--absolute-git-dir", "--path-format=absolute",
                                    "--git-common-dir", "--is-shallow-repository"], "rev-parse")
        lines = res.stdout.split(b"\n")
        # `--show-superproject-working-tree` would spawn git in the parent (refused
        # by layer 4), so a submodule shows as "gitfile": .git is a `gitdir:` file
        # (submodule or --separate-git-dir) that is not a linked worktree.
        if len(lines) > 1 and lines[0] != lines[1]:
            kind = "linked-worktree"
        elif os.path.isfile(os.path.join(repo.path, ".git")):
            kind = "gitfile"
        else:
            kind = "directory"
        return {
            "repo": repo.to_json(), "head": parsed["head"], "counts": counts(parsed["entries"]),
            "clean": not parsed["entries"], "gitDir": kind,
            "shallow": len(lines) > 2 and lines[2] == b"true",
        }

    def _index_entries(self, repo: Repo, cfg: dict[str, str], path: str) -> list[tuple[str, int | None]]:
        """(mode, size) of the index entries for exactly *path* (several stages when unmerged)."""
        res = self._git(repo, cfg, ["ls-files", "-z", "--cached",
                                    "--format=%(objectmode) %(objectsize) %(stage)%x09%(path)",
                                    "--", literal(path)], "ls-files")
        out = []
        for rec in res.stdout.split(b"\0"):
            meta, tab, rpath = rec.partition(b"\t")
            if not tab or rpath != os.fsencode(path):
                continue
            mode, size, _stage = (meta.decode("ascii", "replace").split(" ") + ["", "", ""])[:3]
            out.append((mode, int(size) if size.isdigit() else None))
        return out

    def _head(self, repo: Repo, cfg: dict[str, str]) -> str:
        res = self.runner.run(repo.path, ["rev-parse", "--verify", "-q", "HEAD^{commit}"], config=cfg)
        oid = res.stdout.strip().decode("ascii", "replace")
        if res.returncode == 0 and _OID_RE.fullmatch(oid):
            return oid
        fmt = self._git(repo, cfg, ["rev-parse", "--show-object-format"], "rev-parse").stdout.strip()
        return EMPTY_TREE.get(fmt.decode("ascii", "replace"), EMPTY_TREE["sha1"])

    def _tree_size(self, repo: Repo, cfg: dict[str, str], base: str, path: str) -> int | None:
        res = self._git(repo, cfg, ["ls-tree", "-l", "-z", base, "--", literal(path)], "ls-tree")
        for rec in res.stdout.split(b"\0"):
            meta, tab, rpath = rec.partition(b"\t")
            if tab and rpath == os.fsencode(path):
                size = meta.split()[-1] if meta.split() else b"-"
                return int(size) if size.isdigit() else None
        return None

    @staticmethod
    def _worktree_stat(root: str, segments: list[str]) -> os.stat_result | None:
        """lstat of the work tree file, reached fd-relative without following symlinks."""
        try:
            with open_parent(root, segments) as parent:
                return os.stat(segments[-1], dir_fd=parent, follow_symlinks=False)
        except ApiError as err:
            if err.status == 404:
                return None
            raise
        except FileNotFoundError:
            return None

    @staticmethod
    def _refuse_large(*sizes: int | None) -> None:
        if any(s is not None and s > MAX_DIFF_FILE_BYTES for s in sizes):
            raise ApiError(413, "file_too_large",
                           f"files over {MAX_DIFF_FILE_BYTES // (1024 * 1024)} MiB are not diffed")

    def diff(self, repo_id: int, raw_path: object, raw_mode: object, raw_orig: object = None) -> dict:
        if raw_mode not in DIFF_MODES:
            raise ApiError(400, "bad_mode", f"mode must be one of {', '.join(DIFF_MODES)}")
        segments = git_path(raw_path)
        path = "/".join(segments)
        orig = None
        if raw_orig not in (None, ""):
            if raw_mode != "staged":
                raise ApiError(400, "bad_orig", "orig is only used for staged renames")
            orig = "/".join(git_path(raw_orig))
        repo, cfg = self._prepare(repo_id)
        index = self._index_entries(repo, cfg, path)
        if raw_mode == "worktree":
            if not index:
                return self._untracked(repo, cfg, segments, path)
            st = self._worktree_stat(repo.path, segments)
            self._refuse_large(*(s for _, s in index),
                               st.st_size if st is not None and stat.S_ISREG(st.st_mode) else None)
            args = ["diff-files", "-p", *DIFF_FLAGS, "--", literal(path)]
        else:
            base = self._head(repo, cfg)
            sizes = [s for _, s in index] + [self._tree_size(repo, cfg, base, path)]
            if orig is not None:
                sizes.append(self._tree_size(repo, cfg, base, orig))
            self._refuse_large(*sizes)
            specs = [literal(path)] + ([literal(orig)] if orig is not None else [])
            args = ["diff-index", "--cached", "-p", "-M", *DIFF_FLAGS, base, "--", *specs]
        res = self._git(repo, cfg, args, args[0], limit=MAX_DIFF_BYTES + 1)
        data, cut = _cut(res.stdout, MAX_DIFF_BYTES)
        text = data.decode("utf-8", "replace")
        return {"path": path, "mode": raw_mode, "origPath": orig, "diff": text,
                "binary": is_binary_diff(text), "truncated": cut or res.truncated, "untracked": False}

    def _untracked(self, repo: Repo, cfg: dict[str, str], segments: list[str], path: str) -> dict:
        """An untracked (not ignored) file, shown as an all-added diff. Read fd-relative, capped."""
        res = self._git(repo, cfg, ["ls-files", "-z", "--others", "--exclude-standard", "--", literal(path)],
                        "ls-files")
        if os.fsencode(path) not in res.stdout.split(b"\0"):
            raise ApiError(404, "not_changed", "the path is not tracked, untracked or changed (ignored files are not shown)")
        st = self._worktree_stat(repo.path, segments)
        if st is None:
            raise ApiError(404, "not_found", "no such file")
        self._refuse_large(st.st_size)
        if stat.S_ISLNK(st.st_mode):
            with open_parent(repo.path, segments) as parent:
                content = os.fsencode(os.readlink(segments[-1], dir_fd=parent))
            mode = "120000"
        else:
            with open_parent(repo.path, segments) as parent:
                fd, fst = open_file_at(parent, segments[-1])
            try:
                self._refuse_large(fst.st_size)
                chunks, total = [], 0
                while total <= MAX_DIFF_FILE_BYTES and (chunk := os.read(fd, 1 << 16)):
                    chunks.append(chunk)
                    total += len(chunk)
            finally:
                os.close(fd)
            content = b"".join(chunks)
            self._refuse_large(len(content))
            mode = "100755" if fst.st_mode & 0o100 else "100644"
        head = f"diff --git a/{path} b/{path}\nnew file mode {mode}\n"
        if b"\0" in content[:BINARY_SNIFF_BYTES]:
            text = head + f"Binary files /dev/null and b/{path} differ\n"
            return {"path": path, "mode": "worktree", "origPath": None, "diff": text,
                    "binary": True, "truncated": False, "untracked": True}
        lines = content.split(b"\n")
        no_eol = bool(content) and not content.endswith(b"\n")
        if not no_eol:
            lines = lines[:-1]
        body = [head.encode(), b"--- /dev/null\n", f"+++ b/{path}\n".encode()]
        if lines:
            body.append(f"@@ -0,0 +1{',' + str(len(lines)) if len(lines) != 1 else ''} @@\n".encode())
            body.extend(b"+" + line + b"\n" for line in lines)
            if no_eol:
                body.append(b"\\ No newline at end of file\n")
        data, cut = _cut(b"".join(body), MAX_DIFF_BYTES)
        return {"path": path, "mode": "worktree", "origPath": None, "diff": data.decode("utf-8", "replace"),
                "binary": False, "truncated": cut, "untracked": True}


def _under_git(path: str) -> bool:
    """Whether an ancestor of *path* has a ``.git`` entry (only for a helpful refusal message)."""
    parent = os.path.dirname(path)
    while parent != path:
        dot_git = os.path.join(parent, ".git")
        if os.path.isfile(dot_git) or os.path.isfile(os.path.join(dot_git, "HEAD")):
            return True
        path, parent = parent, os.path.dirname(parent)
    return False


def _label(name: object, real: str) -> str:
    if name is None or name == "":
        return os.path.basename(real)
    if isinstance(name, str) and len(name) <= MAX_NAME_CHARS and not any(ord(c) < 32 or ord(c) == 127 for c in name):
        return name.strip() or os.path.basename(real)
    raise ApiError(400, "bad_name", f"name must be a string of at most {MAX_NAME_CHARS} characters")
