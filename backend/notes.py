"""Markdown note operations inside one registered workspace root.

Every filesystem access goes through the fd-relative helpers in
``workspace.py`` (no symlink is ever followed). Notes are bytes on disk:
content is sent as a string, and that string is exactly the file's UTF-8
decoding (BOM and line endings included), so reading and writing back round-trips
byte for byte. Files that are not valid UTF-8 are refused, never rewritten.

Writes are atomic: a temp file in the same directory, fsync, then
``os.replace`` (update) or ``link`` (create / rename, which fails instead of
clobbering), then fsync of the directory. Updates carry the hash the client
last read; on mismatch the write is refused with 409 and the current hash.

Delete moves the note to ``<root>/.trash/<same relative path>`` (Obsidian's
own trash folder; ``.trash`` is a hidden segment, so the API cannot reach it).
"""
from __future__ import annotations

import errno
import hashlib
import os
import re
import secrets
import time
from collections.abc import Iterator

from workspace import (
    ApiError,
    open_dir_at,
    open_file_at,
    open_parent,
    open_root,
    validate_relpath,
)

MAX_FILE_BYTES = 2 * 1024 * 1024
MAX_LIST_FILES = 2000
MAX_LIST_DEPTH = 12
MAX_SCAN_ENTRIES = 20000
MAX_QUERY_CHARS = 200
MAX_SEARCH_BYTES = 64 * 1024 * 1024
SEARCH_SECONDS = 5.0
SNIPPET_CHARS = 160
TRASH_DIR = ".trash"
NOTE_SUFFIX = ".md"

_HEX64_RE = re.compile(r"[0-9a-f]{64}")
_TMP_PREFIX = ".quartizo-"


def note_segments(rel: object) -> list[str]:
    segments = validate_relpath(rel)
    name = segments[-1]
    if not name.endswith(NOTE_SUFFIX) or len(name) == len(NOTE_SUFFIX):
        raise ApiError(400, "not_markdown", "only .md files are supported")
    return segments


def _encode(content: object) -> bytes:
    if not isinstance(content, str):
        raise ApiError(400, "bad_content", "content must be a string")
    try:
        data = content.encode("utf-8")
    except UnicodeEncodeError:
        raise ApiError(400, "bad_content", "content is not valid unicode (lone surrogate)") from None
    if len(data) > MAX_FILE_BYTES:
        raise ApiError(413, "too_large", f"notes are limited to {MAX_FILE_BYTES} bytes")
    return data


def _expected_hash(value: object, *, required: bool) -> str | None:
    if value is None and not required:
        return None
    if not isinstance(value, str) or not _HEX64_RE.fullmatch(value):
        raise ApiError(400, "bad_hash", "expectedHash must be the 64-char lowercase hex sha256 last read")
    return value


def _meta(st: os.stat_result, digest: str) -> dict:
    return {"hash": digest, "size": st.st_size, "mtimeMs": st.st_mtime_ns // 1_000_000}


def _read_fd(fd: int, limit: int) -> bytes:
    chunks, total = [], 0
    while total <= limit:
        chunk = os.read(fd, min(1 << 16, limit + 1 - total))
        if not chunk:
            break
        chunks.append(chunk)
        total += len(chunk)
    return b"".join(chunks)


def _current(parent_fd: int, name: str) -> tuple[str, os.stat_result] | None:
    """(sha256, fstat) of the note as it is on disk now, or None if it is gone."""
    try:
        fd, st = open_file_at(parent_fd, name)
    except ApiError as err:
        if err.status == 404:
            return None
        raise
    try:
        h = hashlib.sha256()
        while chunk := os.read(fd, 1 << 16):
            h.update(chunk)
        return h.hexdigest(), st
    finally:
        os.close(fd)


def _conflict(current: tuple[str, os.stat_result] | None) -> ApiError:
    if current is None:
        return ApiError(409, "conflict", "the note was deleted on disk since you opened it",
                        currentHash=None, currentMtimeMs=None)
    digest, st = current
    return ApiError(409, "conflict", "the note changed on disk since you opened it",
                    currentHash=digest, currentMtimeMs=st.st_mtime_ns // 1_000_000)


def _write_temp(parent_fd: int, data: bytes, mode: int | None) -> str:
    tmp = f"{_TMP_PREFIX}{secrets.token_hex(8)}.tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC,
                 0o666, dir_fd=parent_fd)
    try:
        if mode is not None:
            os.fchmod(fd, mode)
        view = memoryview(data)
        while view:
            view = view[os.write(fd, view):]
        os.fsync(fd)
    except BaseException:
        os.close(fd)
        _unlink_quiet(parent_fd, tmp)
        raise
    os.close(fd)
    return tmp


def _unlink_quiet(dir_fd: int, name: str) -> None:
    try:
        os.unlink(name, dir_fd=dir_fd)
    except OSError:
        pass


def _fsync_dir(dir_fd: int) -> None:
    try:
        os.fsync(dir_fd)
    except OSError:
        pass  # some filesystems refuse fsync on a directory; the data itself was synced


def _link(src_dir: int, src: str, dst_dir: int, dst: str) -> None:
    """No-clobber move step: create *dst* as a new name for *src* (EEXIST if taken)."""
    try:
        os.link(src, dst, src_dir_fd=src_dir, dst_dir_fd=dst_dir, follow_symlinks=False)
    except FileExistsError:
        raise
    except OSError as err:
        if err.errno == errno.ENOENT:
            raise ApiError(404, "not_found", "no such note") from None
        if err.errno == errno.EXDEV:
            raise ApiError(409, "cross_device", "source and destination are on different filesystems") from None
        if err.errno in (errno.EPERM, errno.ENOTSUP, errno.EOPNOTSUPP, errno.EMLINK):
            raise ApiError(409, "links_unsupported", "this filesystem does not support hard links, which "
                           "Quartizo needs to create, rename and trash notes without clobbering") from None
        raise ApiError(500, "io_error", f"link failed ({errno.errorcode.get(err.errno, err.errno)})") from None


# --------------------------------------------------------------------------
# List / search
# --------------------------------------------------------------------------

def list_notes(root: str, query: str = "", content: bool = False) -> dict:
    """Every ``.md`` under *root* (bounded), optionally filtered by name or content."""
    if not isinstance(query, str) or len(query) > MAX_QUERY_CHARS:
        raise ApiError(400, "bad_query", f"query must be at most {MAX_QUERY_CHARS} characters")
    needle = query.strip().casefold()
    state = {"scanned": 0, "bytes": 0, "truncated": False, "deadline": time.monotonic() + SEARCH_SECONDS}
    files: list[dict] = []
    fd = open_root(root)
    try:
        for rel, parent_fd, name, st in _walk(fd, "", 0, state):
            item = {"path": rel, "size": st.st_size, "mtimeMs": st.st_mtime_ns // 1_000_000}
            if needle:
                if needle in rel.casefold():
                    item["match"] = "name"
                elif content and st.st_size <= MAX_FILE_BYTES:
                    snippet = _content_match(parent_fd, name, needle, state)
                    if snippet is None:
                        continue
                    item["match"], item["snippet"] = "content", snippet
                else:
                    continue
            files.append(item)
            if len(files) >= MAX_LIST_FILES:
                state["truncated"] = True
                break
    finally:
        os.close(fd)
    return {"files": files, "truncated": state["truncated"]}


def _walk(dir_fd: int, prefix: str, depth: int, state: dict) -> Iterator[tuple[str, int, str, os.stat_result]]:
    try:
        with os.scandir(dir_fd) as it:
            entries = sorted(it, key=lambda e: e.name)
    except OSError:
        return
    subdirs = []
    for entry in entries:
        state["scanned"] += 1
        if state["scanned"] > MAX_SCAN_ENTRIES or time.monotonic() > state["deadline"]:
            state["truncated"] = True
            return
        name = entry.name
        if name.startswith(".") or entry.is_symlink():
            continue
        try:
            validate_relpath(prefix + name)
        except ApiError:
            continue  # a name the API could not address (control chars, too long)
        if entry.is_dir(follow_symlinks=False):
            subdirs.append(name)
        elif name.endswith(NOTE_SUFFIX) and len(name) > len(NOTE_SUFFIX) and entry.is_file(follow_symlinks=False):
            try:
                st = entry.stat(follow_symlinks=False)
            except OSError:
                continue
            yield prefix + name, dir_fd, name, st
    if depth >= MAX_LIST_DEPTH:
        if subdirs:
            state["truncated"] = True
        return
    for name in subdirs:
        try:
            child = open_dir_at(dir_fd, name)
        except ApiError:
            continue
        try:
            yield from _walk(child, f"{prefix}{name}/", depth + 1, state)
        finally:
            os.close(child)
        if state["truncated"]:
            return


def _content_match(parent_fd: int, name: str, needle: str, state: dict) -> str | None:
    if state["bytes"] >= MAX_SEARCH_BYTES:
        state["truncated"] = True
        return None
    try:
        fd, _ = open_file_at(parent_fd, name)
    except ApiError:
        return None
    try:
        data = _read_fd(fd, MAX_FILE_BYTES)
    finally:
        os.close(fd)
    state["bytes"] += len(data)
    for line in data.decode("utf-8", errors="replace").splitlines():
        folded = line.casefold()
        at = folded.find(needle)
        if at >= 0:
            start = max(0, at - SNIPPET_CHARS // 3)
            return line[start:start + SNIPPET_CHARS].strip()
    return None


# --------------------------------------------------------------------------
# Read / create / update / rename / delete
# --------------------------------------------------------------------------

def read_note(root: str, rel: object) -> dict:
    segments = note_segments(rel)
    with open_parent(root, segments) as parent:
        fd, st = open_file_at(parent, segments[-1])
        try:
            if st.st_size > MAX_FILE_BYTES:
                raise ApiError(413, "too_large", f"notes are limited to {MAX_FILE_BYTES} bytes", size=st.st_size)
            data = _read_fd(fd, MAX_FILE_BYTES)
        finally:
            os.close(fd)
    if len(data) > MAX_FILE_BYTES:
        raise ApiError(413, "too_large", f"notes are limited to {MAX_FILE_BYTES} bytes")
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        raise ApiError(415, "not_utf8", "this file is not valid UTF-8; Quartizo will not edit it") from None
    meta = _meta(st, hashlib.sha256(data).hexdigest())
    meta["size"] = len(data)  # what was actually read, if the file changed under fstat
    return {"path": "/".join(segments), "content": text, **meta}


def create_note(root: str, rel: object, content: object) -> dict:
    segments = note_segments(rel)
    data = _encode(content)
    name = segments[-1]
    with open_parent(root, segments, create=True) as parent:
        tmp = _write_temp(parent, data, None)
        try:
            _link(parent, tmp, parent, name)
        except FileExistsError:
            raise ApiError(409, "exists", "a note with that name already exists") from None
        finally:
            _unlink_quiet(parent, tmp)
        _fsync_dir(parent)
        st = os.stat(name, dir_fd=parent, follow_symlinks=False)
    return {"path": "/".join(segments), **_meta(st, hashlib.sha256(data).hexdigest())}


def update_note(root: str, rel: object, content: object, expected_hash: object) -> dict:
    segments = note_segments(rel)
    data = _encode(content)
    expected = _expected_hash(expected_hash, required=True)
    name = segments[-1]
    with open_parent(root, segments) as parent:
        current = _current(parent, name)
        if current is None or current[0] != expected:
            raise _conflict(current)
        tmp = _write_temp(parent, data, current[1].st_mode & 0o7777)
        try:
            # Re-check as late as possible: an external edit that landed while
            # the temp file was written must not be overwritten.
            current = _current(parent, name)
            if current is None or current[0] != expected:
                raise _conflict(current)
            os.replace(tmp, name, src_dir_fd=parent, dst_dir_fd=parent)
        except BaseException:
            _unlink_quiet(parent, tmp)
            raise
        _fsync_dir(parent)
        st = os.stat(name, dir_fd=parent, follow_symlinks=False)
    return {"path": "/".join(segments), **_meta(st, hashlib.sha256(data).hexdigest())}


def rename_note(root: str, src_rel: object, dst_rel: object, *, overwrite: object = False,
                confirm: object = False, expected_hash: object = None) -> dict:
    src = note_segments(src_rel)
    dst = note_segments(dst_rel)
    if src == dst:
        raise ApiError(400, "same_path", "source and destination are the same")
    expected = _expected_hash(expected_hash, required=False)
    trashed = None
    with open_parent(root, src) as sp:
        current = _current(sp, src[-1])
        if current is None:
            raise ApiError(404, "not_found", "no such note")
        if expected is not None and current[0] != expected:
            raise _conflict(current)
        src_st = current[1]
        with open_parent(root, dst, create=True) as dp:
            try:
                _link(sp, src[-1], dp, dst[-1])
            except FileExistsError:
                dst_st = os.stat(dst[-1], dir_fd=dp, follow_symlinks=False)
                if (dst_st.st_dev, dst_st.st_ino) == (src_st.st_dev, src_st.st_ino):
                    # Same file under another spelling (case-insensitive FS): a plain rename.
                    os.rename(src[-1], dst[-1], src_dir_fd=sp, dst_dir_fd=dp)
                    _fsync_dir(dp)
                    return {"path": "/".join(dst), "trashed": None}
                if overwrite is not True or confirm is not True:
                    raise ApiError(409, "exists", "the destination exists; resend with overwrite and confirm "
                                   "to move it to .trash and replace it") from None
                trashed = _trash(root, dst)
                try:
                    _link(sp, src[-1], dp, dst[-1])
                except FileExistsError:
                    raise ApiError(409, "exists", "the destination was re-created meanwhile",
                                   trashed=trashed) from None
            os.unlink(src[-1], dir_fd=sp)
            _fsync_dir(dp)
        _fsync_dir(sp)
    return {"path": "/".join(dst), "trashed": trashed}


def delete_note(root: str, rel: object, *, confirm: object, expected_hash: object = None) -> dict:
    segments = note_segments(rel)
    if confirm is not True:
        raise ApiError(400, "confirm_required", "deleting needs \"confirm\": true")
    expected = _expected_hash(expected_hash, required=False)
    if expected is not None:
        with open_parent(root, segments) as parent:
            current = _current(parent, segments[-1])
        if current is None:
            raise ApiError(404, "not_found", "no such note")
        if current[0] != expected:
            raise _conflict(current)
    return {"trashed": _trash(root, segments)}


def _trash(root: str, segments: list[str]) -> str:
    """Move a note to ``.trash/<relative path>`` (suffixing ``" N"`` on collision)."""
    stem = segments[-1][: -len(NOTE_SUFFIX)]
    with open_parent(root, segments) as src_dir:
        fd, _ = open_file_at(src_dir, segments[-1])  # refuses symlinks and non-files
        os.close(fd)
        root_fd = open_root(root)
        try:
            fd = open_dir_at(root_fd, TRASH_DIR, create=True)
        finally:
            os.close(root_fd)
        try:
            for seg in segments[:-1]:
                nxt = open_dir_at(fd, seg, create=True)
                os.close(fd)
                fd = nxt
            for n in range(1000):
                name = segments[-1] if n == 0 else f"{stem} {n}{NOTE_SUFFIX}"
                try:
                    _link(src_dir, segments[-1], fd, name)
                except FileExistsError:
                    continue
                break
            else:
                raise ApiError(409, "trash_full", "too many trashed notes with this name")
            os.unlink(segments[-1], dir_fd=src_dir)
            _fsync_dir(fd)
            _fsync_dir(src_dir)
        finally:
            os.close(fd)
    return "/".join([TRASH_DIR, *segments[:-1], name])
