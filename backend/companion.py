"""Shared, rebuildable Markdown index for Notes, Tasks, and TODOs.

The background worker applies batches of filesystem events to the active
generation in one transaction. On filesystems without a native watcher, it
compares file metadata and opens only the affected notes. Startup, manual
refresh, and periodic reconciliation read and hash the full workspace,
including edits that preserved the file timestamp.

A full scan stages a new generation before atomically publishing it. If a
scan is incomplete or a path cannot be read, its last-known rows are kept.
The filesystem remains authoritative. This module never writes to a note.
"""
from __future__ import annotations

import fcntl
import hashlib
import json
import os
import sqlite3
import stat
import sys
import threading
import time
from collections import Counter, defaultdict
from collections.abc import Iterable, Iterator
from contextlib import contextmanager
from dataclasses import dataclass, field

import db
from note_links import note_keys
from note_watcher import FolderWatcher
from workspace import ApiError, Registry, Workspace, open_dir_at, open_file_at, open_root, validate_relpath

# Bump when parsing or the stored shape changes: older rows are then re-parsed.
INDEX_VERSION = 6
NOTE_SUFFIX = ".md"
MAX_SCAN_ENTRIES = 200_000
MAX_NOTES = 50_000
MAX_DEPTH = 32
BATCH_NOTES = 100
MAX_READ_BYTES = 2 * 1024 * 1024
MIN_INTERVAL_SECONDS = 10.0
DEBOUNCE_SECONDS = 0.2
METADATA_POLL_SECONDS = 3.0
WATCH_CHECK_SECONDS = 10.0
RECONCILE_SECONDS = 300.0
MAX_PENDING_PATHS = 128
MAX_TODO_RESULTS = 5000
MAX_BACKLINK_RESULTS = 200
MAX_BACKLINK_TITLE = 500
TODO_STATES = ("open", "done", "all")
StatStamp = tuple[int, int, int, int, int, int]
Snapshot = dict[str, StatStamp | None]


def _stamp(st: os.stat_result | None) -> StatStamp | None:
    if st is None:
        return None
    return (st.st_dev, st.st_ino, st.st_mtime_ns, st.st_ctime_ns, st.st_size, st.st_mode)


@dataclass
class _Job:
    due: float
    full: bool = False
    rebuild: bool = False
    probe: bool = False
    paths: set[str] = field(default_factory=set)


@dataclass
class _Tracking:
    workspace: Workspace
    probe_at: float = float("inf")
    full_at: float = float("inf")
    native: bool = False
    probe_complete: bool = True
    snapshot: Snapshot = field(default_factory=dict)


def _now_ms() -> int:
    return int(time.time() * 1000)


class _CancelledScan(Exception):
    """Roll back an incremental transaction when its workspace is removed."""


class _Scan:
    """Running totals of one scan, shown as progress."""

    def __init__(self, rebuild: bool) -> None:
        self.rebuild = rebuild
        self.started_ms = _now_ms()
        self.entries = 0
        self.notes = 0
        self.complete = True
        self.cancelled = False
        self.snapshot: Snapshot = {}
        self.removed: set[str] = set()

    def progress(self) -> dict:
        return {"notes": self.notes, "startedAt": self.started_ms, "rebuild": self.rebuild}


class CompanionIndex:
    def __init__(self, registry: Registry) -> None:
        self.registry = registry
        # The production server always sets this from its own runtime. A
        # standalone index can still be used in pure file/parser tests.
        self.write_blocked: dict | None = None
        try:
            import mdsource
        except ImportError as err:
            self.parse_note = None
            self.unavailable: str | None = f"the Markdown parsers could not be loaded: {err}"
        else:
            self.parse_note = mdsource.parse_note
            self.unavailable = None
        self._cv = threading.Condition()
        self._queue: dict[str, _Job] = {}
        self._tracking: dict[str, _Tracking] = {}
        self._retired: set[str] = set()
        self._closed = False
        self._running: dict[str, _Scan] = {}
        self._last_finished: dict[str, float] = {}
        self._thread: threading.Thread | None = None

    # ------------------------------------------------------------------
    # Worker
    # ------------------------------------------------------------------

    @contextmanager
    def _conn(self) -> Iterator[sqlite3.Connection]:
        conn = db.connect(self.registry.db_path)
        try:
            yield conn
        finally:
            conn.close()

    def start(self) -> None:
        """Discard generations an interrupted scan left behind, then index every companion workspace."""
        with self._conn() as conn, db.transaction(conn):
            for table in ("companion_notes", "companion_todos"):
                conn.execute(
                    f"DELETE FROM {table} WHERE generation IS NOT (SELECT generation FROM companion_index i"
                    f" WHERE i.workspace_uid = {table}.workspace_uid)")
        if self.unavailable:
            return
        self._thread = threading.Thread(target=self._work, name="quartizo-companion", daemon=True)
        self._thread.start()
        for ws in self.registry.list():
            if ws.companion:
                self.request(ws, manual=True)

    def request(self, ws: Workspace, *, rebuild: bool = False, manual: bool = False) -> bool:
        """Queue a full scan. Legacy automatic callers are still throttled."""
        if self.unavailable or not ws.companion:
            return False
        with self._cv:
            if self._closed:
                return False
            job = self._queue.get(ws.uid)
            if job and job.full:
                job.rebuild |= rebuild
                return True
            if not (rebuild or manual):
                last = self._last_finished.get(ws.uid)
                if ws.uid in self._running:
                    return True
                if last is not None and time.monotonic() - last < MIN_INTERVAL_SECONDS:
                    return False
            self._tracking.setdefault(ws.uid, _Tracking(ws))
            self._queue[ws.uid] = _Job(time.monotonic(), full=True, rebuild=rebuild)
            self._cv.notify()
            return True

    def request_paths(self, ws: Workspace, paths: Iterable[str]) -> None:
        """Queue known writes to update only their registered relative paths."""
        self._request_changes(ws, paths)

    def _request_changes(self, ws: Workspace, paths: Iterable[str], *,
                         probe: bool = False, tracking: _Tracking | None = None) -> None:
        if self.unavailable or not ws.companion:
            return
        with self._cv:
            # A late watcher callback must never re-register a removed folder.
            if self._closed or (tracking is not None and self._tracking.get(ws.uid) is not tracking):
                return
            job = self._queue.get(ws.uid)
            if job and job.full:
                return
            if job is None:
                job = _Job(time.monotonic() + DEBOUNCE_SECONDS)
            job.probe |= probe
            for path in paths:
                try:
                    segments = validate_relpath(path)
                except ApiError:
                    continue
                if len(segments) <= MAX_DEPTH + 1 and path.endswith(NOTE_SUFFIX):
                    job.paths.add(path)
                if len(job.paths) > MAX_PENDING_PATHS:
                    job.full = True
                    job.paths.clear()
                    break
            if job.paths or job.full or job.probe:
                self._tracking.setdefault(ws.uid, _Tracking(ws))
                self._queue[ws.uid] = job
                self._cv.notify()

    def cancel(self, ws_uid: str) -> None:
        with self._cv:
            self._queue.pop(ws_uid, None)
            self._tracking.pop(ws_uid, None)
            self._last_finished.pop(ws_uid, None)
            self._retired.add(ws_uid)
            running = self._running.get(ws_uid)
            if running:
                running.cancelled = True
            self._cv.notify_all()

    def close(self) -> None:
        with self._cv:
            self._closed = True
            self._queue.clear()
            for scan in self._running.values():
                scan.cancelled = True
            self._cv.notify_all()
        if self._thread is not None:
            self._thread.join()

    def wait_idle(self, timeout: float = 30.0) -> bool:
        """For tests: block until no scan is queued or running."""
        deadline = time.monotonic() + timeout
        with self._cv:
            while self._queue or self._running:
                left = deadline - time.monotonic()
                if left <= 0:
                    return False
                self._cv.wait(left)
            return True

    def _next_job(self) -> tuple[str, _Job] | None:
        """Take due work under the condition lock, sleeping until work is due."""
        now = time.monotonic()
        due = float("inf")
        for uid, tracked in self._tracking.items():
            if tracked.full_at <= now:
                job = self._queue.pop(uid, None)
                return uid, _Job(now, full=True, rebuild=bool(job and job.rebuild))
            due = min(due, tracked.full_at)
        for uid, job in self._queue.items():
            if job.due <= now:
                return uid, self._queue.pop(uid)
            due = min(due, job.due)
        for uid, tracked in self._tracking.items():
            # Prefer a coalescing event batch to a metadata probe.
            if uid in self._queue:
                continue
            if tracked.probe_at <= now:
                return uid, _Job(now, probe=not tracked.native)
            due = min(due, tracked.probe_at)
        self._cv.wait(None if due == float("inf") else max(0.0, due - now))
        return None

    def _work(self) -> None:
        watcher = FolderWatcher()
        try:
            while True:
                with self._cv:
                    if self._closed:
                        return
                    retired = self._retired
                    self._retired = set()
                    work = None if retired else self._next_job()
                    if work:
                        uid, job = work
                        tracked = self._tracking[uid]
                        scan = _Scan(job.rebuild)
                        self._running[uid] = scan
                for uid in retired:
                    watcher.remove(uid)
                if work:
                    self._process_job(watcher, tracked, job, scan)
        finally:
            watcher.close()

    def _process_job(self, watcher: FolderWatcher, tracked: _Tracking, job: _Job, scan: _Scan) -> None:
        ws = tracked.workspace
        try:
            try:
                current = self.registry.get(ws.id)
            except ApiError as err:
                if err.code != "workspace_not_found":
                    raise
                current = None
            if scan.cancelled:
                return
            if current is None or not current.companion or current.uid != ws.uid:
                with self._cv:
                    if self._tracking.get(ws.uid) is tracked:
                        self.cancel(ws.uid)
                return
            self._run_job(watcher, tracked, job, scan)
        except Exception as err:  # never let one workspace stop the worker
            if not scan.cancelled:
                now = time.monotonic()
                if tracked.full_at <= now:
                    tracked.full_at = now + RECONCILE_SECONDS
                if tracked.probe_at <= now:
                    tracked.probe_at = now + METADATA_POLL_SECONDS
                try:
                    if isinstance(err, ApiError):
                        tracked.probe_complete = False
                        self._record_failure(ws.uid, err.code, err.message)
                    else:
                        self._record_failure(ws.uid, "scan_failed", f"the scan failed ({type(err).__name__})")
                except Exception as failure:  # e.g. the database stayed locked, keep working
                    sys.stderr.write(f"quartizo: could not record a scan failure ({type(failure).__name__})\n")
        finally:
            with self._cv:
                self._running.pop(ws.uid, None)
                if self._tracking.get(ws.uid) is tracked and job.full:
                    self._last_finished[ws.uid] = time.monotonic()
                self._cv.notify_all()

    def _run_job(self, watcher: FolderWatcher, tracked: _Tracking, job: _Job, scan: _Scan) -> None:
        ws = tracked.workspace
        now = time.monotonic()
        if job.full or job.probe or tracked.probe_at <= now:
            native, attached = watcher.ensure(
                ws, lambda paths, probe: self._request_changes(ws, paths, probe=probe, tracking=tracked),
            )
            job.full |= attached
            job.probe |= tracked.native != native
            tracked.native = native
            tracked.probe_at = now + (WATCH_CHECK_SECONDS if native else METADATA_POLL_SECONDS)
        if job.probe and not job.full:
            self._probe(ws, tracked, job, scan)
        if scan.cancelled:
            return
        if not job.full and job.paths:
            job.full = not self._index_paths(ws, job.paths, scan)
        if job.full:
            # Set the deadline before reading in case the root is unavailable.
            tracked.full_at = now + RECONCILE_SECONDS
            self.scan(ws, scan)
            tracked.probe_complete = scan.complete
        if not scan.cancelled:
            if job.full and scan.complete:
                tracked.snapshot = scan.snapshot
            else:
                tracked.snapshot.update(scan.snapshot)
                for rel in scan.removed:
                    tracked.snapshot.pop(rel, None)

    def _probe(self, ws: Workspace, tracked: _Tracking, job: _Job, scan: _Scan) -> None:
        """Compare bounded stat snapshots without reading unchanged note bytes."""
        probe = _Scan(False)
        snapshot = {}
        try:
            for rel, st, _ in self._walk(ws, probe, metadata_only=True):
                if scan.cancelled:
                    return
                snapshot[rel] = _stamp(st)
                probe.notes += 1
        except ApiError:
            tracked.probe_complete = False
            raise
        previous_complete = tracked.probe_complete
        tracked.probe_complete = probe.complete
        if previous_complete != probe.complete:
            # Report incomplete trees and reconcile when they are readable again.
            job.full = True
        if not probe.complete:
            # Never infer deletions from an incomplete tree. Reconcile persistent
            # failures on the normal full-scan schedule rather than every probe.
            return
        previous = tracked.snapshot
        job.paths.update(previous.keys() - snapshot.keys())
        job.paths.update(rel for rel, stamp in snapshot.items() if rel not in previous or previous[rel] != stamp)
        if len(job.paths) > MAX_PENDING_PATHS:
            job.full = True

    # ------------------------------------------------------------------
    # One scan
    # ------------------------------------------------------------------

    def scan(self, ws: Workspace, scan: _Scan) -> None:
        """Index *ws* into a new generation and swap it in. Reads files only."""
        with self._conn() as conn:
            with db.transaction(conn):
                conn.execute("INSERT OR IGNORE INTO companion_index (workspace_uid, version) VALUES (?, ?)",
                             (ws.uid, INDEX_VERSION))
                conn.execute("UPDATE companion_index SET started_at = ? WHERE workspace_uid = ?",
                             (scan.started_ms, ws.uid))
                generation = conn.execute("INSERT INTO companion_generations (workspace_uid, started_at)"
                                          " VALUES (?, ?)", (ws.uid, scan.started_ms)).lastrowid
                state = conn.execute("SELECT generation, version FROM companion_index WHERE workspace_uid = ?",
                                     (ws.uid,)).fetchone()
            active = state["generation"]
            previous: dict[str, str | None] = {}
            reusable: dict[str, str | None] = {}
            if active is not None:
                for row in conn.execute(
                    "SELECT path, hash, retained FROM companion_notes WHERE workspace_uid = ? AND generation = ?",
                    (ws.uid, active),
                ):
                    previous[row["path"]] = row["hash"]
                    if not scan.rebuild and state["version"] == INDEX_VERSION and not row["retained"]:
                        reusable[row["path"]] = row["hash"]
            try:
                seen = self._index_files(conn, ws, scan, generation, active, reusable, previous)
            except ApiError as err:
                scan.complete = False
                self._discard(conn, ws.uid, generation)
                self._record_failure(ws.uid, err.code, err.message)
                return
            if scan.cancelled:
                self._discard(conn, ws.uid, generation)
                return
            if not scan.complete and active is not None:
                # Not seen is not deleted: keep every unseen note's last-known rows.
                unseen = [p for p in previous if p not in seen]
                for start in range(0, len(unseen), BATCH_NOTES):
                    with db.transaction(conn):
                        self._copy(conn, ws.uid, active, generation, unseen[start:start + BATCH_NOTES], retain=True)
            with db.transaction(conn):
                if scan.cancelled or not self._still_companion(conn, ws.uid):
                    scan.cancelled = True
                else:
                    self._swap(conn, ws.uid, generation, scan)
            if scan.cancelled:
                self._discard(conn, ws.uid, generation)

    @staticmethod
    def _still_companion(conn, uid: str) -> bool:
        row = conn.execute("SELECT companion FROM workspaces WHERE uid = ?", (uid,)).fetchone()
        return row is not None and row[0] == 1

    def _swap(self, conn, uid: str, generation: int, scan: _Scan) -> None:
        retained = conn.execute("SELECT COUNT(*) FROM companion_notes WHERE workspace_uid = ? AND"
                                " generation = ? AND retained = 1", (uid, generation)).fetchone()[0]
        conn.execute(
            "UPDATE companion_index SET generation = ?, version = ?,"
            " completed_at = MAX(COALESCE(completed_at, 0) + 1, ?), complete = ?,"
            " files = (SELECT COUNT(*) FROM companion_notes WHERE workspace_uid = ? AND generation = ?),"
            " retained = ?, error_code = NULL, error = NULL, failed_at = NULL WHERE workspace_uid = ?",
            (generation, INDEX_VERSION, _now_ms(), 1 if scan.complete else 0, uid, generation,
             retained, uid))
        for table in ("companion_notes", "companion_todos"):
            conn.execute(f"DELETE FROM {table} WHERE workspace_uid = ? AND generation != ?", (uid, generation))
        conn.execute("DELETE FROM companion_generations WHERE workspace_uid = ? AND id != ?", (uid, generation))

    def _index_files(self, conn, ws: Workspace, scan: _Scan, generation: int, active: int | None,
                     reusable: dict[str, str | None], previous: dict[str, str | None]) -> set[str]:
        seen: set[str] = set()
        batch: list[tuple[str, os.stat_result | None, bytes | None]] = []

        def flush() -> None:
            if not batch:
                return
            with db.transaction(conn):
                if not self._still_companion(conn, ws.uid):
                    scan.cancelled = True
                    return
                for rel, st, data in batch:
                    if data is None or st is None:
                        if rel in previous and active is not None:
                            self._copy(conn, ws.uid, active, generation, [rel], retain=True, unreadable=True)
                        else:
                            self._insert_unreadable(conn, ws.uid, generation, rel)
                        continue
                    mtime_ms = st.st_mtime_ns // 1_000_000
                    if active is not None and reusable.get(rel) == hashlib.sha256(data).hexdigest():
                        self._copy(conn, ws.uid, active, generation, [rel], retain=False, mtime_ms=mtime_ms)
                    else:
                        self._insert(conn, ws.uid, generation, rel, mtime_ms, self.parse_note(rel, data))
            batch.clear()

        for rel, st, data in self._walk(ws, scan):
            if scan.cancelled:
                break
            seen.add(rel)
            scan.snapshot[rel] = _stamp(st) if data is not None else None
            batch.append((rel, st, data))
            scan.notes += 1
            if len(batch) >= BATCH_NOTES:
                flush()
        if not scan.cancelled:
            flush()
        return seen

    def _walk(self, ws: Workspace, scan: _Scan, *, metadata_only: bool = False
              ) -> Iterator[tuple[str, os.stat_result | None, bytes | None]]:
        """(relative path, fstat, bytes) for every addressable note; (path, None, None) if unreadable.

        Hidden entries (``.trash``, ``.git``, ``.obsidian``) and symlinks are
        skipped. Every open is fd-relative with
        O_NOFOLLOW (workspace.py), and at most one fd per directory level is
        held. Raises ApiError only for the root itself.
        """
        root_fd = open_root(ws.path)
        try:
            yield from self._walk_dir(root_fd, "", 0, scan, metadata_only=metadata_only)
        finally:
            os.close(root_fd)

    def _walk_dir(self, dir_fd: int, prefix: str, depth: int, scan: _Scan, *, metadata_only: bool) -> Iterator:
        entries = []
        try:
            with os.scandir(dir_fd) as it:
                for entry in it:
                    scan.entries += 1
                    if scan.entries > MAX_SCAN_ENTRIES:
                        scan.complete = False
                        break
                    entries.append(entry)
        except OSError:
            scan.complete = False
            return
        entries.sort(key=lambda e: e.name)
        subdirs = []
        for entry in entries:
            name = entry.name
            if name.startswith("."):
                continue
            try:
                if entry.is_symlink():
                    continue
                is_dir = entry.is_dir(follow_symlinks=False)
            except OSError:
                scan.complete = False
                continue
            try:
                validate_relpath(prefix + name)
            except ApiError:
                continue  # not a safe relative path (control characters, too long, ...)
            if is_dir:
                subdirs.append(name)
            elif name.endswith(NOTE_SUFFIX) and len(name) > len(NOTE_SUFFIX):
                if scan.notes >= MAX_NOTES:
                    scan.complete = False
                    return
                rel = prefix + name
                if metadata_only:
                    try:
                        st = entry.stat(follow_symlinks=False)
                    except FileNotFoundError:
                        continue
                    except OSError:
                        yield rel, None, None
                    else:
                        if stat.S_ISREG(st.st_mode):
                            yield rel, st, None
                else:
                    item = self._read(dir_fd, rel, name)
                    if item is not None:
                        yield item
        if depth >= MAX_DEPTH:
            if subdirs:
                scan.complete = False
            return
        for name in subdirs:
            if scan.cancelled or scan.entries > MAX_SCAN_ENTRIES or scan.notes >= MAX_NOTES:
                scan.complete = False
                return
            try:
                child = open_dir_at(dir_fd, name)
            except ApiError:
                scan.complete = False
                continue
            try:
                yield from self._walk_dir(child, f"{prefix}{name}/", depth + 1, scan, metadata_only=metadata_only)
            finally:
                os.close(child)

    @staticmethod
    def _read(dir_fd: int, rel: str, name: str, *, root_path: str | None = None
              ) -> tuple[str, os.stat_result | None, bytes | None] | None:
        """The note's fstat and bytes; None when it vanished or is not a regular file (not a note)."""
        try:
            fd, st = open_file_at(dir_fd, name)
        except ApiError as err:
            if err.status == 404 or err.code in ("not_a_file", "symlink_refused"):
                return None
            return rel, None, None
        except OSError:
            return rel, None, None
        try:
            if root_path is not None and hasattr(fcntl, "F_GETPATH"):
                # macOS can open a path through different casing or Unicode
                # spellings. Key a changed row by the name returned by the OS.
                try:
                    absolute = os.fsdecode(fcntl.fcntl(fd, fcntl.F_GETPATH, bytes(1024)).split(b"\0", 1)[0])
                except OSError:
                    absolute = ""
                prefix = root_path + os.sep
                if absolute.startswith(prefix):
                    actual = absolute[len(prefix):]
                    try:
                        parts = validate_relpath(actual)
                    except ApiError:
                        return None
                    if len(parts) > MAX_DEPTH + 1 or not actual.endswith(NOTE_SUFFIX):
                        return None
                    rel = actual
            chunks, total = [], 0
            while total <= MAX_READ_BYTES:
                chunk = os.read(fd, min(1 << 16, MAX_READ_BYTES + 1 - total))
                if not chunk:
                    break
                chunks.append(chunk)
                total += len(chunk)
            return rel, st, b"".join(chunks)
        except OSError:
            return rel, None, None
        finally:
            os.close(fd)

    def _read_path(self, root_fd: int, rel: str, root_path: str) -> tuple[str, os.stat_result | None, bytes | None] | None:
        """None means the note is no longer indexable. An unreadable note retains its row."""
        fd = root_fd
        parts = rel.split("/")
        try:
            for segment in parts[:-1]:
                child = open_dir_at(fd, segment)
                if fd != root_fd:
                    os.close(fd)
                fd = child
            return self._read(fd, rel, parts[-1], root_path=root_path)
        except ApiError as err:
            if err.status == 404 or err.code == "symlink_refused":
                return None
            return rel, None, None
        finally:
            if fd != root_fd:
                os.close(fd)

    def _index_paths(self, ws: Workspace, paths: set[str], scan: _Scan) -> bool:
        """Update one active generation atomically, or return false if it needs a full scan."""
        with self._conn() as conn:
            state = conn.execute("SELECT * FROM companion_index WHERE workspace_uid = ?", (ws.uid,)).fetchone()
            if state is None or state["generation"] is None or state["version"] != INDEX_VERSION:
                return False
            root = open_root(ws.path)
            try:
                with db.transaction(conn):
                    if scan.cancelled or not self._still_companion(conn, ws.uid):
                        scan.cancelled = True
                        return True
                    if state["files"] + len(paths) > MAX_NOTES:
                        placeholders = ",".join("?" for _ in paths)
                        existing = conn.execute(
                            "SELECT COUNT(*) FROM companion_notes WHERE workspace_uid = ? AND generation = ?"
                            f" AND path IN ({placeholders})", (ws.uid, state["generation"], *paths),
                        ).fetchone()[0]
                        if state["files"] + len(paths) - existing > MAX_NOTES:
                            return False
                    self._replace_paths(conn, ws, state, root, paths, scan)
                    if scan.cancelled:
                        raise _CancelledScan
                    return True
            except _CancelledScan:
                return True
            finally:
                os.close(root)

    def _replace_paths(self, conn, ws: Workspace, state, root: int, paths: set[str], scan: _Scan) -> None:
        uid = ws.uid
        generation = state["generation"]
        files, retained = state["files"], state["retained"]
        changed = False
        for rel in sorted(paths):
            if scan.cancelled:
                break
            result = self._read_path(root, rel, ws.path)
            if result is not None and result[0] != rel:
                # On a case-only rename the old path can still open the file.
                scan.removed.add(rel)
                alias_key = (uid, generation, rel)
                alias = conn.execute(
                    "SELECT retained FROM companion_notes WHERE workspace_uid = ? AND generation = ? AND path = ?",
                    alias_key,
                ).fetchone()
                if alias is not None:
                    self._delete_path(conn, alias_key)
                    files -= 1
                    retained -= alias["retained"]
                    changed = True
                rel = result[0]
            key = (uid, generation, rel)
            previous = conn.execute(
                "SELECT hash, mtime_ms, retained, diagnostics FROM companion_notes"
                " WHERE workspace_uid = ? AND generation = ? AND path = ?", key,
            ).fetchone()
            scan.notes += 1
            if result is None:
                scan.removed.add(rel)
                if previous is not None:
                    self._delete_path(conn, key)
                    files -= 1
                    retained -= previous["retained"]
                    changed = True
                continue

            _, st, data = result
            if st is None or data is None:
                scan.snapshot[rel] = None
                if previous is None:
                    self._insert_unreadable(conn, uid, generation, rel)
                    files += 1
                    changed = True
                else:
                    diagnostics = self._unreadable_diagnostics(previous["diagnostics"])
                    if diagnostics != previous["diagnostics"] or not previous["retained"]:
                        conn.execute("UPDATE companion_notes SET diagnostics = ?, retained = 1"
                                     " WHERE workspace_uid = ? AND generation = ? AND path = ?",
                                     (diagnostics, *key))
                        retained += 1 - previous["retained"]
                        changed = True
                continue

            scan.snapshot[rel] = _stamp(st)
            mtime_ms = st.st_mtime_ns // 1_000_000
            if previous is not None and not previous["retained"] and previous["hash"] == hashlib.sha256(data).hexdigest():
                if previous["mtime_ms"] != mtime_ms:
                    conn.execute("UPDATE companion_notes SET mtime_ms = ?"
                                 " WHERE workspace_uid = ? AND generation = ? AND path = ?", (mtime_ms, *key))
                    changed = True
                continue
            if previous is None:
                files += 1
            else:
                self._delete_path(conn, key)
                retained -= previous["retained"]
            self._insert(conn, uid, generation, rel, mtime_ms, self.parse_note(rel, data))
            changed = True

        if changed:
            conn.execute(
                "UPDATE companion_index SET files = ?, retained = ?,"
                " completed_at = MAX(COALESCE(completed_at, 0) + 1, ?) WHERE workspace_uid = ?",
                (files, retained, _now_ms(), uid),
            )

    @staticmethod
    def _delete_path(conn, key: tuple[str, int, str]) -> None:
        for table in ("companion_todos", "companion_notes"):
            conn.execute(f"DELETE FROM {table} WHERE workspace_uid = ? AND generation = ? AND path = ?", key)

    @staticmethod
    def _unreadable_diagnostics(value: str) -> str:
        diagnostics = [item for item in json.loads(value) if item["code"] != "unreadable"]
        diagnostics.append({"code": "unreadable", "message": "the note could not be read; showing what was last indexed"})
        return json.dumps(diagnostics)

    # ------------------------------------------------------------------
    # Rows
    # ------------------------------------------------------------------

    def _insert(self, conn, uid: str, generation: int, rel: str, mtime_ms: int, note) -> None:
        conn.execute(
            "INSERT INTO companion_notes (workspace_uid, generation, path, hash, size, mtime_ms, title, ticket,"
            " ticket_id, status, sort_key, diagnostics, links) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (uid, generation, rel, note.hash, note.size, mtime_ms, note.title, 1 if note.ticket else 0, note.ticket_id, note.status, note.order,
             json.dumps([{"code": d.code, "message": d.message} for d in note.diagnostics]), json.dumps(note.links)))
        conn.executemany(
            "INSERT INTO companion_todos (workspace_uid, generation, path, ordinal, marker_start, line, col, checked,"
            " text, depth, heading) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [(uid, generation, rel, i, t.marker_start, t.line, t.column, 1 if t.checked else 0, t.text, t.depth,
              t.heading) for i, t in enumerate(note.todos)])

    def _insert_unreadable(self, conn, uid: str, generation: int, rel: str) -> None:
        title = rel.rsplit("/", 1)[-1][: -len(NOTE_SUFFIX)]
        conn.execute(
            "INSERT INTO companion_notes (workspace_uid, generation, path, title, ticket, diagnostics)"
            " VALUES (?, ?, ?, ?, 0, ?)",
            (uid, generation, rel, title, json.dumps([{"code": "unreadable", "message": "the note could not be read"}])))

    def _copy(self, conn, uid: str, src: int, dst: int, paths: list[str], *, retain: bool,
              unreadable: bool = False, mtime_ms: int | None = None) -> None:
        """Carry rows of *paths* from generation *src* to *dst* (unchanged, or retained as last known)."""
        conn.executemany(
            "INSERT INTO companion_notes (workspace_uid, generation, path, hash, size, mtime_ms, title, ticket,"
            " ticket_id, status, sort_key, diagnostics, links, retained) SELECT workspace_uid, ?, path, hash, size,"
            " COALESCE(?, mtime_ms), title, ticket, ticket_id, status, sort_key, diagnostics, links, ?"
            " FROM companion_notes WHERE workspace_uid = ? AND generation = ? AND path = ?",
            [(dst, mtime_ms, 1 if retain else 0, uid, src, p) for p in paths])
        conn.executemany(
            "INSERT INTO companion_todos (workspace_uid, generation, path, ordinal, marker_start, line, col, checked,"
            " text, depth, heading) SELECT workspace_uid, ?, path, ordinal, marker_start, line, col, checked, text,"
            " depth, heading FROM companion_todos WHERE workspace_uid = ? AND generation = ? AND path = ?",
            [(dst, uid, src, p) for p in paths])
        if unreadable:
            for p in paths:
                row = conn.execute("SELECT diagnostics FROM companion_notes WHERE workspace_uid = ? AND"
                                   " generation = ? AND path = ?", (uid, dst, p)).fetchone()
                if row is None:
                    continue
                conn.execute("UPDATE companion_notes SET diagnostics = ? WHERE workspace_uid = ? AND generation = ?"
                             " AND path = ?", (self._unreadable_diagnostics(row["diagnostics"]), uid, dst, p))

    def _discard(self, conn, uid: str, generation: int) -> None:
        with db.transaction(conn):
            for table in ("companion_notes", "companion_todos"):
                conn.execute(f"DELETE FROM {table} WHERE workspace_uid = ? AND generation = ?", (uid, generation))
            conn.execute("DELETE FROM companion_generations WHERE id = ?", (generation,))

    def _record_failure(self, uid: str, code: str, message: str) -> None:
        with self._conn() as conn, db.transaction(conn):
            conn.execute("UPDATE companion_index SET error_code = ?, error = ?, failed_at = ? WHERE workspace_uid = ?"
                         " AND (error_code IS NOT ? OR error IS NOT ?)", (code, message, _now_ms(), uid, code, message))

    def forget(self, ws_uid: str) -> None:
        """Drop the derived index of a workspace that left companion mode (files untouched)."""
        self.cancel(ws_uid)
        with self._conn() as conn, db.transaction(conn):
            for table in ("companion_notes", "companion_todos", "companion_index", "companion_generations"):
                conn.execute(f"DELETE FROM {table} WHERE workspace_uid = ?", (ws_uid,))

    # ------------------------------------------------------------------
    # Queries (the active generation only)
    # ------------------------------------------------------------------

    def status(self, ws: Workspace) -> dict:
        if not ws.companion:
            return {"state": "off"}
        if self.unavailable:
            return {"state": "unavailable", "error": self.unavailable}
        with self._conn() as conn:
            row = conn.execute("SELECT * FROM companion_index WHERE workspace_uid = ?", (ws.uid,)).fetchone()
        return self._status(ws, row)

    def _status(self, ws: Workspace, row: sqlite3.Row | None) -> dict:
        with self._cv:
            running = self._running.get(ws.uid)
            queued = ws.uid in self._queue
            progress = running.progress() if running else None
        out: dict = {
            "state": "scanning" if running or queued else "ready",
            "queued": queued,
            "progress": progress,
            "writeBlocked": self.write_blocked,
            "indexedAt": None, "complete": False, "files": 0, "retained": 0, "error": None,
            "maintenance": [s for s in ws.statuses
                            if (self.registry.data_dir / "ticket-maintenance" / f"{ws.uid}-{s}.json").exists()],
        }
        migration_path = self.registry.data_dir / f"migration-{ws.uid}.json"
        try:
            out["migrationPending"] = (json.loads(migration_path.read_text(encoding="utf-8")).get("complete")
                                       is not True) if migration_path.exists() else False
        except (OSError, ValueError, AttributeError):
            out["migrationPending"] = True
        if row is None or row["generation"] is None:
            if not running and not queued:
                out["state"] = "error" if row is not None and row["error_code"] else "unindexed"
        else:
            out.update(indexedAt=row["completed_at"], complete=bool(row["complete"]), files=row["files"],
                       retained=row["retained"])
            if row["version"] != INDEX_VERSION:
                out["outdated"] = True
        if row is not None and row["error_code"]:
            out["error"] = {"code": row["error_code"], "message": row["error"], "at": row["failed_at"]}
            if out["state"] == "ready":
                out["state"] = "stale"
        return out

    def _require(self, ws: Workspace) -> None:
        if self.unavailable:
            raise ApiError(503, "parsers_unavailable", self.unavailable)
        if not ws.companion:
            raise ApiError(409, "not_companion", "this workspace is not in Kiro Notes companion mode")

    def require_writes(self, ws: Workspace) -> None:
        self._require(ws)
        if self.write_blocked:
            raise ApiError(409, self.write_blocked["code"], self.write_blocked["message"])

    def _duplicates(self, conn) -> dict[str, list[dict]]:
        """Every ticket ID used by more than one note, over all companion workspaces."""
        rows = conn.execute(
            "SELECT n.ticket_id, n.path, w.id AS ws_id, w.name AS ws_name FROM companion_notes n"
            " JOIN companion_index i ON i.workspace_uid = n.workspace_uid AND i.generation = n.generation"
            " JOIN workspaces w ON w.uid = n.workspace_uid AND w.companion = 1"
            " WHERE n.ticket = 1 AND n.ticket_id IS NOT NULL AND n.ticket_id IN ("
            "  SELECT m.ticket_id FROM companion_notes m"
            "  JOIN companion_index j ON j.workspace_uid = m.workspace_uid AND j.generation = m.generation"
            "  JOIN workspaces v ON v.uid = m.workspace_uid AND v.companion = 1"
            "  WHERE m.ticket = 1 AND m.ticket_id IS NOT NULL GROUP BY m.ticket_id HAVING COUNT(*) > 1)").fetchall()
        out: dict[str, list[dict]] = defaultdict(list)
        for r in rows:
            out[r["ticket_id"]].append({"workspaceId": r["ws_id"], "workspace": r["ws_name"], "path": r["path"]})
        return out

    def list_notes(self, ws: Workspace) -> dict:
        """All note titles and paths from the shared active generation."""
        self._require(ws)
        with self._conn() as conn, db.transaction(conn, write=False):
            row = conn.execute("SELECT * FROM companion_index WHERE workspace_uid = ?", (ws.uid,)).fetchone()
            notes = conn.execute(
                "SELECT path, title FROM companion_notes WHERE workspace_uid = ? AND generation IS ? ORDER BY path",
                (ws.uid, row["generation"] if row else None),
            ).fetchall()
        return {"notes": [dict(note) for note in notes], "index": self._status(ws, row)}

    def backlinks(self, ws: Workspace, path: object) -> dict:
        """Return notes whose outgoing link resolves to the exact indexed path."""
        self._require(ws)
        validate_relpath(path)
        found = []
        with self._conn() as conn, db.transaction(conn, write=False):
            gen = self._generation(conn, ws.uid)
            key = (ws.uid, gen)
            scope = "workspace_uid = ? AND generation IS ?"
            target = conn.execute(f"SELECT title FROM companion_notes WHERE {scope} AND path = ?", (*key, path)).fetchone()
            if target is None:
                return {"notes": [], "truncated": False}
            full, title, stem = note_keys(path, target["title"])
            names = {title, stem} - {""}
            paths = 0
            titles: Counter[str] = Counter()
            stems: Counter[str] = Counter()
            for row in conn.execute(f"SELECT path, title FROM companion_notes WHERE {scope}", key):
                other_full, other_title, other_stem = note_keys(row["path"], row["title"])
                paths += other_full == full
                if other_title in names:
                    titles[other_title] += 1
                if other_stem in names:
                    stems[other_stem] += 1
            targets = {f"path:{full}"} if paths == 1 else set()
            if title and titles[title] == 1:
                targets.add(f"name:{title}")
            if not titles[stem] and stems[stem] == 1:
                targets.add(f"name:{stem}")
            if targets:
                # Search serialized keys to filter in SQLite, then verify matches
                # against the decoded array so escaped JSON text cannot alias a key.
                needles = tuple(json.dumps(target) for target in targets)
                matches = " OR ".join("instr(links, ?) > 0" for _ in needles)
                rows = conn.execute(f"SELECT path, title, links FROM companion_notes WHERE {scope} AND path != ?"
                                    f" AND ({matches}) ORDER BY path", (*key, path, *needles))
                for row in rows:
                    if targets.isdisjoint(json.loads(row["links"])):
                        continue
                    found.append({"path": row["path"], "title": row["title"][:MAX_BACKLINK_TITLE]})
                    if len(found) > MAX_BACKLINK_RESULTS:
                        break
        return {"notes": found[:MAX_BACKLINK_RESULTS], "truncated": len(found) > MAX_BACKLINK_RESULTS}

    def board(self, ws: Workspace) -> dict:
        """Ticket notes of *ws*: placed by status and rank, or in the repair lane."""
        self._require(ws)
        with self._conn() as conn, db.transaction(conn, write=False):
            gen = self._generation(conn, ws.uid)
            notes = conn.execute(
                "SELECT n.path, n.title, n.hash, n.mtime_ms, n.ticket, n.ticket_id, n.status, n.sort_key,"
                " n.diagnostics, n.retained, (SELECT COUNT(*) FROM companion_todos t WHERE t.workspace_uid = n.workspace_uid AND"
                " t.generation = n.generation AND t.path = n.path) AS todo_total, (SELECT COUNT(*) FROM"
                " companion_todos t WHERE t.workspace_uid = n.workspace_uid AND t.generation = n.generation AND"
                " t.path = n.path AND t.checked = 1) AS todo_done FROM companion_notes n WHERE n.workspace_uid = ?"
                " AND n.generation IS ? ORDER BY n.path", (ws.uid, gen)).fetchall()
            duplicates = self._duplicates(conn)
        tickets, other = [], []
        statuses = set(ws.statuses)
        for n in notes:
            diagnostics = json.loads(n["diagnostics"])
            if n["ticket"] and n["ticket_id"] in duplicates:
                others = [d for d in duplicates[n["ticket_id"]] if (d["workspaceId"], d["path"]) != (ws.id, n["path"])]
                diagnostics.append({"code": "duplicate_id", "message": "this ticket ID is also used by another note",
                                    "others": others})
            item = {
                "path": n["path"], "title": n["title"], "hash": n["hash"], "mtimeMs": n["mtime_ms"],
                "diagnostics": diagnostics, "retained": bool(n["retained"]),
            }
            if not n["ticket"]:
                if diagnostics:
                    other.append(item)
                continue
            status = n["status"]
            if status and status not in statuses:
                diagnostics.append({"code": "unconfigured_status", "message": f"Status '{status}' has no column. Move this ticket or restore its column in Settings."})
            item.update(id=n["ticket_id"], status=status, order=n["sort_key"],
                        todos={"total": n["todo_total"], "done": n["todo_done"]},
                        lane=status if status in statuses else "repair")
            tickets.append(item)
        # ASCII order of the fixed-width rank, then ID; an invalid rank sorts last, then by path.
        tickets.sort(key=lambda t: (t["order"] is None, t["order"] or "", t["id"] or "", t["path"]))
        return {"workspace": ws.to_json(), "index": self.status(ws), "tickets": tickets, "notes": other}

    def todos(self, workspaces: list[Workspace], state: str) -> dict:
        """Checkboxes in the given companion workspaces, grouped by note, each marker once."""
        if state not in TODO_STATES:
            raise ApiError(400, "bad_state", "state must be open, done or all")
        for ws in workspaces:
            self._require(ws)
        groups: list[dict] = []
        counts = {"open": 0, "done": 0}
        returned = 0
        truncated = False
        with self._conn() as conn, db.transaction(conn, write=False):
            for ws in workspaces:
                labels = {column.id: column.label for column in ws.columns}
                gen = self._generation(conn, ws.uid)
                for c in conn.execute("SELECT checked, COUNT(*) AS n FROM companion_todos WHERE workspace_uid = ?"
                                      " AND generation IS ? GROUP BY checked", (ws.uid, gen)):
                    counts["done" if c["checked"] else "open"] += c["n"]
                where = {"open": " AND t.checked = 0", "done": " AND t.checked = 1", "all": ""}[state]
                rows = conn.execute(
                    "SELECT t.*, n.title, n.ticket, n.ticket_id, n.status, n.hash, n.retained, n.diagnostics FROM companion_todos t"
                    " JOIN companion_notes n ON n.workspace_uid = t.workspace_uid AND n.generation = t.generation AND"
                    f" n.path = t.path WHERE t.workspace_uid = ? AND t.generation IS ?{where}"
                    " ORDER BY t.path, t.ordinal LIMIT ?", (ws.uid, gen, MAX_TODO_RESULTS - returned + 1)).fetchall()
                current = None
                for r in rows:
                    if returned >= MAX_TODO_RESULTS:
                        truncated = True
                        break
                    if current is None or current["path"] != r["path"]:
                        current = {"workspaceId": ws.id, "workspace": ws.name, "path": r["path"], "title": r["title"],
                                   "ticket": bool(r["ticket"]), "ticketId": r["ticket_id"], "status": r["status"],
                                   "statusLabel": labels.get(r["status"], r["status"]),
                                   "hash": r["hash"], "retained": bool(r["retained"]),
                                   "diagnostics": json.loads(r["diagnostics"]), "items": []}
                        groups.append(current)
                    current["items"].append({
                        "ordinal": r["ordinal"], "markerStart": r["marker_start"], "line": r["line"], "column": r["col"], "checked": bool(r["checked"]),
                        "text": r["text"], "depth": r["depth"], "heading": r["heading"],
                    })
                    returned += 1
                if truncated:
                    break
        return {"groups": groups, "counts": counts, "truncated": truncated,
                "index": {str(ws.id): self.status(ws) for ws in workspaces}}

    def _generation(self, conn, uid: str) -> int | None:
        row = conn.execute("SELECT generation FROM companion_index WHERE workspace_uid = ?", (uid,)).fetchone()
        return row["generation"] if row else None
