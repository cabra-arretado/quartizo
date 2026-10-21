"""Kiro Notes companion: a read-only, rebuildable index of Markdown tickets and TODOs.

A workspace in companion mode is edited in native Kiro Notes; Quartizo only
reads it (docs/markdown-tickets-plan.md, "read-only companion first"). This
module never opens a note for writing. It scans the folder, parses every
``.md`` with ``mdsource``, and stores what the Board and TODOs views query in
the derived ``companion_*`` tables (db.py migration 6). Files stay
authoritative: dropping those tables and rescanning gives the same answers.

Scans, in a single background worker thread:

* Every note is read and hashed on every scan, so an edit that kept its
  timestamp is still seen. Only a changed hash is re-parsed; unchanged rows are
  copied forward.
* A scan writes a new generation beside the active one and swaps it in only
  once it finished, in one transaction. Readers never see a half-built index.
* Bounded: entry, note and depth limits. Hitting one, or failing to read a
  directory, makes the scan *incomplete*: notes it did not see keep their
  last-known rows (``retained``) instead of being treated as deleted. A note
  that cannot be read keeps its last-known rows too. Deletion is inferred only
  from a complete scan.
* A root that cannot be opened fails the scan and keeps the previous
  generation, with the error recorded.

Scans run at startup, on an explicit Refresh or Rebuild, when the views open,
and while they are visible (the UI asks; requests closer together than
``MIN_INTERVAL_SECONDS`` are skipped unless manual).
"""
from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import threading
import time
from collections import defaultdict
from collections.abc import Iterator
from contextlib import contextmanager

import db
from workspace import ApiError, Registry, Workspace, open_dir_at, open_file_at, open_root, validate_relpath

# Bump when parsing or the stored shape changes: older rows are then re-parsed.
INDEX_VERSION = 2
NOTE_SUFFIX = ".md"
MAX_SCAN_ENTRIES = 200_000
MAX_NOTES = 50_000
MAX_DEPTH = 32
BATCH_NOTES = 100
MAX_READ_BYTES = 2 * 1024 * 1024
MIN_INTERVAL_SECONDS = 10.0
MAX_TODO_RESULTS = 5000
TODO_STATES = ("open", "done", "all")


def _now_ms() -> int:
    return int(time.time() * 1000)


class _Scan:
    """Running totals of one scan, shown as progress."""

    def __init__(self, rebuild: bool) -> None:
        self.rebuild = rebuild
        self.started_ms = _now_ms()
        self.entries = 0
        self.notes = 0
        self.complete = True
        self.cancelled = False

    def progress(self) -> dict:
        return {"notes": self.notes, "startedAt": self.started_ms, "rebuild": self.rebuild}


class CompanionIndex:
    def __init__(self, registry: Registry) -> None:
        self.registry = registry
        try:
            import mdsource
        except ImportError as err:
            self.parse_note = None
            self.unavailable: str | None = f"the Markdown parsers could not be loaded: {err}"
        else:
            self.parse_note = mdsource.parse_note
            self.unavailable = None
        self._cv = threading.Condition()
        self._queue: dict[str, bool] = {}  # workspace uid -> rebuild requested
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
        """Queue a scan of *ws*. False when skipped (not companion, throttled, unavailable)."""
        if self.unavailable or not ws.companion:
            return False
        with self._cv:
            if ws.uid in self._queue:
                self._queue[ws.uid] = self._queue[ws.uid] or rebuild
                return True
            if ws.uid in self._running and not (rebuild or manual):
                return True
            last = self._last_finished.get(ws.uid)
            if not manual and not rebuild and last is not None and time.monotonic() - last < MIN_INTERVAL_SECONDS:
                return False
            self._queue[ws.uid] = rebuild
            self._cv.notify()
        return True

    def cancel(self, ws_uid: str) -> None:
        with self._cv:
            self._queue.pop(ws_uid, None)
            running = self._running.get(ws_uid)
            if running:
                running.cancelled = True

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

    def _work(self) -> None:
        while True:
            with self._cv:
                while not self._queue:
                    self._cv.wait()
                uid, rebuild = next(iter(self._queue.items()))
                del self._queue[uid]
                scan = _Scan(rebuild)
                self._running[uid] = scan
            try:
                ws = next((w for w in self.registry.list() if w.uid == uid), None)
                if ws is not None and ws.companion:
                    self.scan(ws, scan)
            except Exception as err:  # never let one workspace stop the worker
                self._record_failure(uid, "scan_failed", f"the scan failed ({type(err).__name__})")
            finally:
                with self._cv:
                    self._running.pop(uid, None)
                    self._last_finished[uid] = time.monotonic()
                    self._cv.notify_all()

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
            if active is not None:
                previous = {r["path"]: r["hash"] for r in conn.execute(
                    "SELECT path, hash FROM companion_notes WHERE workspace_uid = ? AND generation = ?",
                    (ws.uid, active))}
            reusable = active is not None and not scan.rebuild and state["version"] == INDEX_VERSION
            try:
                seen = self._index_files(conn, ws, scan, generation, active, previous if reusable else {}, previous)
            except ApiError as err:
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
                if not self._still_companion(conn, ws.uid):
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
            "UPDATE companion_index SET generation = ?, version = ?, completed_at = ?, complete = ?,"
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
                            self._copy(conn, ws.uid, active, generation, [rel], retain=True,
                                       add_diagnostic=("unreadable", "the note could not be read; showing what was last indexed"))
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
            batch.append((rel, st, data))
            scan.notes += 1
            if len(batch) >= BATCH_NOTES:
                flush()
        if not scan.cancelled:
            flush()
        return seen

    def _walk(self, ws: Workspace, scan: _Scan) -> Iterator[tuple[str, os.stat_result | None, bytes | None]]:
        """(relative path, fstat, bytes) for every addressable note; (path, None, None) if unreadable.

        Hidden entries (``.trash``, ``.git``, ``.obsidian``) and symlinks are
        skipped, like the notes list. Every open is fd-relative with
        O_NOFOLLOW (workspace.py), and at most one fd per directory level is
        held. Raises ApiError only for the root itself.
        """
        root_fd = open_root(ws.path)
        try:
            yield from self._walk_dir(root_fd, "", 0, scan)
        finally:
            os.close(root_fd)

    def _walk_dir(self, dir_fd: int, prefix: str, depth: int, scan: _Scan) -> Iterator:
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
                continue  # a name the notes API could not address either
            if is_dir:
                subdirs.append(name)
            elif name.endswith(NOTE_SUFFIX) and len(name) > len(NOTE_SUFFIX):
                if scan.notes >= MAX_NOTES:
                    scan.complete = False
                    return
                item = self._read(dir_fd, prefix + name, name)
                if item is not None:
                    yield item
        if depth >= MAX_DEPTH:
            if subdirs:
                scan.complete = False
            return
        for name in subdirs:
            if scan.cancelled or scan.entries > MAX_SCAN_ENTRIES or scan.notes >= MAX_NOTES:
                scan.complete = scan.complete and scan.cancelled
                return
            try:
                child = open_dir_at(dir_fd, name)
            except ApiError:
                scan.complete = False
                continue
            try:
                yield from self._walk_dir(child, f"{prefix}{name}/", depth + 1, scan)
            finally:
                os.close(child)

    @staticmethod
    def _read(dir_fd: int, rel: str, name: str) -> tuple[str, os.stat_result | None, bytes | None] | None:
        """The note's fstat and bytes; None when it vanished or is not a regular file (not a note)."""
        try:
            fd, st = open_file_at(dir_fd, name)
        except ApiError as err:
            if err.status == 404 or err.code == "not_a_file":
                return None
            return rel, None, None
        except OSError:
            return rel, None, None
        try:
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

    # ------------------------------------------------------------------
    # Rows
    # ------------------------------------------------------------------

    def _insert(self, conn, uid: str, generation: int, rel: str, mtime_ms: int, note) -> None:
        conn.execute(
            "INSERT INTO companion_notes (workspace_uid, generation, path, hash, size, mtime_ms, title, ticket,"
            " ticket_id, status, sort_key, diagnostics) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (uid, generation, rel, note.hash, note.size, mtime_ms, note.title, 1 if note.ticket else 0, note.ticket_id, note.status, note.order,
             json.dumps([{"code": d.code, "message": d.message} for d in note.diagnostics])))
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
              add_diagnostic: tuple[str, str] | None = None, mtime_ms: int | None = None) -> None:
        """Carry rows of *paths* from generation *src* to *dst* (unchanged, or retained as last known)."""
        conn.executemany(
            "INSERT INTO companion_notes (workspace_uid, generation, path, hash, size, mtime_ms, title, ticket,"
            " ticket_id, status, sort_key, diagnostics, retained) SELECT workspace_uid, ?, path, hash, size,"
            " COALESCE(?, mtime_ms), title, ticket, ticket_id, status, sort_key, diagnostics, ?"
            " FROM companion_notes WHERE workspace_uid = ? AND generation = ? AND path = ?",
            [(dst, mtime_ms, 1 if retain else 0, uid, src, p) for p in paths])
        conn.executemany(
            "INSERT INTO companion_todos (workspace_uid, generation, path, ordinal, marker_start, line, col, checked,"
            " text, depth, heading) SELECT workspace_uid, ?, path, ordinal, marker_start, line, col, checked, text,"
            " depth, heading FROM companion_todos WHERE workspace_uid = ? AND generation = ? AND path = ?",
            [(dst, uid, src, p) for p in paths])
        if add_diagnostic:
            code, message = add_diagnostic
            for p in paths:
                row = conn.execute("SELECT diagnostics FROM companion_notes WHERE workspace_uid = ? AND"
                                   " generation = ? AND path = ?", (uid, dst, p)).fetchone()
                if row is None:
                    continue
                diagnostics = [d for d in json.loads(row["diagnostics"]) if d["code"] != code]
                diagnostics.append({"code": code, "message": message})
                conn.execute("UPDATE companion_notes SET diagnostics = ? WHERE workspace_uid = ? AND generation = ?"
                             " AND path = ?", (json.dumps(diagnostics), uid, dst, p))

    def _discard(self, conn, uid: str, generation: int) -> None:
        with db.transaction(conn):
            for table in ("companion_notes", "companion_todos"):
                conn.execute(f"DELETE FROM {table} WHERE workspace_uid = ? AND generation = ?", (uid, generation))
            conn.execute("DELETE FROM companion_generations WHERE id = ?", (generation,))

    def _record_failure(self, uid: str, code: str, message: str) -> None:
        with self._conn() as conn, db.transaction(conn):
            conn.execute("UPDATE companion_index SET error_code = ?, error = ?, failed_at = ? WHERE workspace_uid = ?",
                         (code, message, _now_ms(), uid))

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
        with self._cv:
            running = self._running.get(ws.uid)
            queued = ws.uid in self._queue
            progress = running.progress() if running else None
        out: dict = {
            "state": "scanning" if running or queued else "ready",
            "queued": queued,
            "progress": progress,
            "indexedAt": None, "complete": False, "files": 0, "retained": 0, "error": None,
        }
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

    def board(self, ws: Workspace) -> dict:
        """Ticket notes of *ws*: placed by status and rank, or in the repair lane."""
        self._require(ws)
        with self._conn() as conn, db.transaction(conn, write=False):
            gen = self._generation(conn, ws.uid)
            notes = conn.execute(
                "SELECT n.*, (SELECT COUNT(*) FROM companion_todos t WHERE t.workspace_uid = n.workspace_uid AND"
                " t.generation = n.generation AND t.path = n.path) AS todo_total, (SELECT COUNT(*) FROM"
                " companion_todos t WHERE t.workspace_uid = n.workspace_uid AND t.generation = n.generation AND"
                " t.path = n.path AND t.checked = 1) AS todo_done FROM companion_notes n WHERE n.workspace_uid = ?"
                " AND n.generation IS ? ORDER BY n.path", (ws.uid, gen)).fetchall()
            duplicates = self._duplicates(conn)
        tickets, other = [], []
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
            item.update(id=n["ticket_id"], status=n["status"], order=n["sort_key"],
                        todos={"total": n["todo_total"], "done": n["todo_done"]},
                        lane=n["status"] or "repair")
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
                gen = self._generation(conn, ws.uid)
                for c in conn.execute("SELECT checked, COUNT(*) AS n FROM companion_todos WHERE workspace_uid = ?"
                                      " AND generation IS ? GROUP BY checked", (ws.uid, gen)):
                    counts["done" if c["checked"] else "open"] += c["n"]
                where = {"open": " AND t.checked = 0", "done": " AND t.checked = 1", "all": ""}[state]
                rows = conn.execute(
                    "SELECT t.*, n.title, n.ticket, n.ticket_id, n.status, n.hash, n.retained FROM companion_todos t"
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
                                   "hash": r["hash"], "retained": bool(r["retained"]), "items": []}
                        groups.append(current)
                    current["items"].append({
                        "ordinal": r["ordinal"], "line": r["line"], "column": r["col"], "checked": bool(r["checked"]),
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
