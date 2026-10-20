"""Workspace roots: opt-in registration and path confinement.

A workspace is a directory the dashboard owner explicitly registered. Every
note path Quartizo touches is a *relative* path inside one registered root, and
is reached only through ``open_dir`` / ``open_file`` below.

Confinement, in order:

1. ``validate_relpath`` refuses, before touching the filesystem: non-strings,
   empty paths, NUL and other control characters, absolute paths, backslashes,
   empty / ``.`` / ``..`` segments, hidden (dot) segments, and over-long paths.
2. The root is opened component by component from ``/`` with
   ``O_DIRECTORY | O_NOFOLLOW``, so a registered root that has since been
   replaced by a symlink (or had a parent swapped for one) is refused.
3. Each segment of the relative path is opened relative to its parent's fd
   with ``O_NOFOLLOW`` (``openat``), so no symlink is ever followed inside a
   workspace: neither one that escapes the root nor one that stays inside it.
   There is no window between "check" and "open": the open *is* the check.
4. The final file is ``fstat``-ed after open and must be a regular file.

Residual risks are documented in docs/threat-model.md. POSIX only (needs
``dir_fd`` support in ``os.open``).
"""
from __future__ import annotations

import errno
import grp
import os
import pwd
import sqlite3
import stat
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path

import db

MAX_REL_PATH_CHARS = 1024
MAX_SEGMENT_BYTES = 255
MAX_NAME_CHARS = 80
PSEUDO_FS = ("/proc", "/sys", "/dev")

_DIR_FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | os.O_CLOEXEC


class ApiError(Exception):
    """A refusal with an HTTP status and a stable machine-readable code."""

    def __init__(self, status: int, code: str, message: str, **extra: object) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.extra = extra

    def body(self) -> dict:
        return {"error": self.message, "code": self.code, **self.extra}


@dataclass(frozen=True)
class Workspace:
    id: int
    uid: str
    name: str
    path: str

    def to_json(self) -> dict:
        return {"id": self.id, "uid": self.uid, "name": self.name, "path": self.path}


def validate_relpath(rel: object, *, allow_hidden: bool = False) -> list[str]:
    """Split a client-supplied relative path into safe segments, or raise 400.

    *allow_hidden* (Git paths only, QTZ-010) lets dot segments such as
    ``.gitignore`` through; every other rule is the same.
    """
    if not isinstance(rel, str) or not rel:
        raise ApiError(400, "bad_path", "path must be a non-empty string")
    if len(rel) > MAX_REL_PATH_CHARS:
        raise ApiError(400, "bad_path", "path too long")
    if any(ord(c) < 32 or ord(c) == 127 for c in rel):
        raise ApiError(400, "bad_path", "path contains control characters")
    if "\\" in rel:
        raise ApiError(400, "bad_path", "backslashes are not allowed in paths")
    if rel.startswith("/"):
        raise ApiError(400, "bad_path", "path must be relative to the workspace")
    segments = rel.split("/")
    for seg in segments:
        if seg in ("", ".", ".."):
            raise ApiError(400, "bad_path", "empty, '.' and '..' path segments are not allowed")
        if seg.startswith(".") and not allow_hidden:
            raise ApiError(400, "bad_path", "hidden path segments are not allowed")
        try:
            encoded = seg.encode("utf-8")
        except UnicodeEncodeError:
            raise ApiError(400, "bad_path", "path is not valid unicode") from None
        if len(encoded) > MAX_SEGMENT_BYTES:
            raise ApiError(400, "bad_path", "path segment too long")
    return segments


def os_error(err: OSError) -> ApiError:
    """Map an unexpected OSError to a refusal. Never includes the path."""
    code = err.errno
    if code in (errno.EACCES, errno.EPERM):
        return ApiError(403, "permission_denied", "permission denied")
    if code in (errno.ENOSPC, getattr(errno, "EDQUOT", errno.ENOSPC)):
        return ApiError(507, "no_space", "no space left on the device (or quota exceeded)")
    if code == errno.EROFS:
        return ApiError(409, "read_only_fs", "the filesystem is read-only")
    return ApiError(500, "io_error", f"filesystem error ({errno.errorcode.get(code, code)})")


def _classify_open_error(err: OSError, parent_fd: int, name: str) -> ApiError:
    # ENOTDIR is ambiguous (a symlink under O_DIRECTORY|O_NOFOLLOW, or a plain
    # file), so look at what is there without following it.
    if err.errno in (errno.ELOOP, errno.ENOTDIR, errno.EMLINK):
        try:
            if stat.S_ISLNK(os.stat(name, dir_fd=parent_fd, follow_symlinks=False).st_mode):
                return ApiError(403, "symlink_refused", "symlinks are not followed inside a workspace")
        except OSError:
            pass
        if err.errno == errno.ENOTDIR:
            return ApiError(404, "not_found", "a path segment is not a directory")
        return ApiError(403, "symlink_refused", "symlinks are not followed inside a workspace")
    if err.errno == errno.ENOENT:
        return ApiError(404, "not_found", "no such file")
    return os_error(err)


def open_root(root: str) -> int:
    """Open a registered root without following any symlink on the way. Caller closes."""
    if not os.path.isabs(root):
        raise ApiError(500, "bad_root", "registered root is not absolute")
    fd = os.open("/", _DIR_FLAGS)
    try:
        for part in [p for p in root.split("/") if p]:
            try:
                nxt = os.open(part, _DIR_FLAGS, dir_fd=fd)
            except OSError as err:
                refusal = _classify_open_error(err, fd, part)
                if refusal.code == "symlink_refused":
                    raise ApiError(409, "root_changed",
                                   "the workspace root is now (or is under) a symlink; re-register it") from None
                if refusal.status == 404:
                    raise ApiError(404, "root_missing", "the workspace root no longer exists") from None
                raise refusal from None
            os.close(fd)
            fd = nxt
        return fd
    except BaseException:
        os.close(fd)
        raise


def _owned(fd: int) -> int:
    """Return *fd* if the directory belongs to this uid; otherwise close it and refuse."""
    if os.fstat(fd).st_uid != os.getuid():
        os.close(fd)
        raise ApiError(403, "not_owned", "a folder in this path belongs to another user")
    return fd


def open_dir_at(parent_fd: int, name: str, *, create: bool = False) -> int:
    """Open one directory segment relative to *parent_fd*: no symlink, owned by us."""
    try:
        return _owned(os.open(name, _DIR_FLAGS, dir_fd=parent_fd))
    except FileNotFoundError:
        if not create:
            raise ApiError(404, "not_found", "no such directory") from None
    except OSError as err:
        raise _classify_open_error(err, parent_fd, name) from None
    try:
        os.mkdir(name, 0o777, dir_fd=parent_fd)
    except FileExistsError:
        pass  # raced with someone else creating it; the open below re-checks
    except OSError as err:
        raise _classify_open_error(err, parent_fd, name) from None
    try:
        return _owned(os.open(name, _DIR_FLAGS, dir_fd=parent_fd))
    except OSError as err:
        raise _classify_open_error(err, parent_fd, name) from None


@contextmanager
def open_parent(root: str, segments: list[str], *, create: bool = False) -> Iterator[int]:
    """Yield an fd for the directory holding ``segments[-1]``, confined to *root*."""
    fd = open_root(root)
    try:
        for seg in segments[:-1]:
            nxt = open_dir_at(fd, seg, create=create)
            os.close(fd)
            fd = nxt
        yield fd
    finally:
        os.close(fd)


def open_file_at(parent_fd: int, name: str, flags: int = os.O_RDONLY) -> tuple[int, os.stat_result]:
    """Open a regular file relative to *parent_fd* (no symlink), returning (fd, fstat)."""
    try:
        fd = os.open(name, flags | os.O_NOFOLLOW | os.O_CLOEXEC | os.O_NONBLOCK, dir_fd=parent_fd)
    except OSError as err:
        if err.errno == errno.EISDIR:
            raise ApiError(400, "not_a_file", "path is a directory") from None
        raise _classify_open_error(err, parent_fd, name) from None
    st = os.fstat(fd)
    if not stat.S_ISREG(st.st_mode):
        os.close(fd)
        raise ApiError(400, "not_a_file", "path is not a regular file")
    return fd, st


# --------------------------------------------------------------------------
# Registry
# --------------------------------------------------------------------------

def _home_dirs() -> list[str]:
    homes = [os.path.expanduser("~")]
    try:
        homes.append(pwd.getpwuid(os.getuid()).pw_dir)
    except KeyError:
        pass
    return [h for h in homes if h and os.path.isabs(h)]


def _ident(path: str) -> tuple[int, int] | None:
    try:
        st = os.stat(path)
    except OSError:
        return None
    return st.st_dev, st.st_ino


def _ancestor_idents(path: str) -> set[tuple[int, int]]:
    """(dev, ino) of *path* and every ancestor up to ``/``."""
    out = set()
    p = path
    while True:
        ident = _ident(p)
        if ident:
            out.add(ident)
        parent = os.path.dirname(p)
        if parent == p:
            return out
        p = parent


def _inside(child: str, parent: str) -> bool:
    """Path-string containment on canonical paths. ``/a/notes-private`` is not in ``/a/notes``."""
    return child == parent or child.startswith(parent.rstrip("/") + "/")


def _overlaps(a: str, b: str) -> bool:
    """True when either directory contains the other, by path or by inode.

    The inode comparison also catches aliases a string compare misses: a
    case-insensitive or normalizing filesystem (where realpath may keep the
    caller's spelling), or a bind mount.
    """
    if _inside(a, b) or _inside(b, a):
        return True
    ia, ib = _ident(a), _ident(b)
    return (ia is not None and ia in _ancestor_idents(b)) or (ib is not None and ib in _ancestor_idents(a))


def _private_group(gid: int) -> bool:
    """Whether *gid* is this user's own user-private group (Ubuntu: umask 002,
    group named like the user, nobody else in it)."""
    if gid != os.getgid():
        return False
    try:
        user = pwd.getpwuid(os.getuid()).pw_name
        group = grp.getgrgid(gid)
    except KeyError:
        return False
    return group.gr_name == user and all(m == user for m in group.gr_mem)


def writable_by_others(st: os.stat_result) -> bool:
    """World-writable, or group-writable by a group other than a private one."""
    if st.st_mode & 0o002:
        return True
    return bool(st.st_mode & 0o020) and not _private_group(st.st_gid)


def canonical_root(raw: object, protected: tuple[str, ...], noun: str = "workspace") -> str:
    """The root policy shared by workspaces and Git repos: realpath, or raise 400.

    Refused: non-absolute, NUL, missing, not a directory, ``/``, the home
    directory itself, ``/proc`` ``/sys`` ``/dev``, anything overlapping a
    *protected* directory (KiroCrew home, the app data dir), not owned by this
    uid, world-writable, or group-writable by a shared (non user-private) group.
    """
    if not isinstance(raw, str) or not raw.strip():
        raise ApiError(400, "bad_root", "path must be a non-empty string")
    if "\x00" in raw:
        raise ApiError(400, "bad_root", "path contains a NUL byte")
    if not os.path.isabs(raw):
        raise ApiError(400, "bad_root", f"{noun} path must be absolute")
    real = os.path.realpath(raw)
    try:
        st = os.stat(real)
    except OSError:
        raise ApiError(400, "bad_root", f"{noun} path does not exist") from None
    if not stat.S_ISDIR(st.st_mode):
        raise ApiError(400, "bad_root", f"{noun} path is not a directory")
    ident = (st.st_dev, st.st_ino)
    if real == "/" or ident == _ident("/"):
        raise ApiError(400, "root_refused", f"the filesystem root cannot be a {noun}")
    for home in _home_dirs():
        home_real = os.path.realpath(home)
        if real == home_real or ident == _ident(home_real):
            raise ApiError(400, "root_refused",
                           f"your home directory itself cannot be a {noun}; pick a folder inside it")
    for pseudo in PSEUDO_FS:
        if _inside(real, pseudo):
            raise ApiError(400, "root_refused", f"{pseudo} is not a place for a {noun}")
    for p in protected:
        if _overlaps(real, p):
            raise ApiError(400, "root_refused", f"{noun} overlaps KiroCrew or Quartizo data")
    if st.st_uid != os.getuid():
        raise ApiError(400, "root_not_owned", "the folder must belong to you")
    if writable_by_others(st):
        raise ApiError(400, "root_writable_by_others",
                       "the folder is world-writable or writable by a shared group; run `chmod go-w` on it first")
    return real


class Registry:
    """Registered workspace roots, persisted in the app's SQLite DB."""

    def __init__(self, data_dir: Path, *, protected: tuple[str, ...] = ()) -> None:
        self.data_dir = data_dir
        data_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.db_path = data_dir / db.DB_FILENAME
        # Directories a root may neither be nor contain nor sit inside: the
        # KiroCrew home (secrets, agent state) and this app's own data dir.
        self.protected = tuple(os.path.realpath(p) for p in (*protected, str(data_dir)))
        self._lock = threading.Lock()
        db.connect(self.db_path).close()  # migrate at startup

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        conn = db.connect(self.db_path)
        try:
            yield conn
        finally:
            conn.close()

    def list(self) -> list[Workspace]:
        with self._conn() as conn:
            return [Workspace(r["id"], r["uid"], r["name"], r["path"]) for r in db.list_workspaces(conn)]

    def get(self, workspace_id: int) -> Workspace:
        with self._conn() as conn:
            row = db.get_workspace(conn, workspace_id)
        if row is None:
            raise ApiError(404, "workspace_not_found", "no such workspace")
        return Workspace(row["id"], row["uid"], row["name"], row["path"])

    def canonical_root(self, raw: object) -> str:
        """Validate a candidate root and return its realpath, or raise."""
        return canonical_root(raw, self.protected)

    def register(self, raw_path: object, name: object = None) -> Workspace:
        real = self.canonical_root(raw_path)
        if name is None or name == "":
            label = os.path.basename(real)
        elif isinstance(name, str) and len(name) <= MAX_NAME_CHARS and not any(ord(c) < 32 for c in name):
            label = name.strip() or os.path.basename(real)
        else:
            raise ApiError(400, "bad_name", f"name must be a string of at most {MAX_NAME_CHARS} characters")
        with self._lock, self._conn() as conn:
            for ws in db.list_workspaces(conn):
                if _overlaps(real, ws["path"]):
                    raise ApiError(409, "root_overlaps",
                                   f"overlaps the registered workspace {ws['name']!r}", workspaceId=ws["id"])
            new_id, uid = db.insert_workspace(conn, label, real)
        return Workspace(new_id, uid, label, real)

    def unregister(self, workspace_id: int, *, delete_tasks: bool = False) -> None:
        """Forget a root. Files are never touched.

        The workspace is also a task project (QTZ-008), and its tasks go with
        it (FK cascade). So a workspace that still has tasks is refused with
        409 ``project_has_tasks`` unless the caller explicitly passed
        *delete_tasks*. Count and delete happen in one transaction.
        """
        with self._lock, self._conn() as conn, db.transaction(conn):
            if db.get_workspace(conn, workspace_id) is None:
                raise ApiError(404, "workspace_not_found", "no such workspace")
            count = db.count_tasks(conn, workspace_id)
            if count and delete_tasks is not True:
                raise ApiError(409, "project_has_tasks",
                               f"this workspace has {count} task(s); removing it deletes them",
                               taskCount=count)
            db.delete_workspace(conn, workspace_id)
