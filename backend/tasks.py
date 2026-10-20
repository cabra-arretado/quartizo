"""Kanban task metadata per project (QTZ-008).

Project model: **one project is one registered workspace**, identified by the
workspace's ``uid`` (32 random hex chars, never reused). Tasks are rows in the
app's SQLite DB (``db.py`` migration 3); nothing here touches the filesystem.

- ``note_ref`` is an optional workspace-relative ``.md`` path, validated with
  the same rules as the notes API (``notes.note_segments``). It is only a
  string: this module never opens it. The UI resolves it through the notes API
  (``GET .../note?path=``), which applies the full fd-based confinement.
- ``slot_id`` is an optional Quartizo chat session name (the UI's
  ``isSlotName`` pattern). A workspace session (``quartizo-w<uid>-...``) must
  belong to this project. It is only a label: the backend never calls the chat
  API, so no task operation (in particular a move) can start or touch a session.
- ``status`` is the human-assigned column. Runtime state of a linked session is
  never stored; the UI may show it read-only.
- Every write runs in one ``BEGIN IMMEDIATE`` transaction. Update, move and
  delete carry ``expectedVersion``; a stale one is refused with 409 ``stale``
  and the current task, so nothing is overwritten silently.
- Order: ``sort_order`` is a dense 0..n-1 index inside one (project, status)
  column, rewritten for the affected columns inside the move's transaction.
  Reindexing siblings changes neither their ``version`` nor ``updated_at``
  (their content did not change, so an open edit of a sibling stays valid).
"""
from __future__ import annotations

import re
import secrets
import sqlite3
import time
from collections.abc import Iterator
from contextlib import contextmanager

import db
import notes
from workspace import ApiError, Registry

STATUSES = ("backlog", "ready", "in_progress", "review", "done")
MAX_TITLE_CHARS = 200
MAX_DESCRIPTION_BYTES = 64 * 1024
MAX_TASKS_PER_PROJECT = 2000
MAX_IMPORT_BODY_BYTES = 4 * 1024 * 1024
EXPORT_FORMAT = "quartizo.tasks"
EXPORT_VERSION = 1
MAX_TIMESTAMP_MS = 2 ** 53 - 1

# Same as ui/src/slots.ts SLOT_NAME_RE; group 1 is the workspace uid, if any.
SLOT_NAME_RE = re.compile(r"quartizo-(?:w([0-9a-f]{32})-)?[0-9a-z]+-[0-9a-z]{6}")
_WORKSPACE_PREFIX_RE = re.compile(r"quartizo-w([0-9a-f]{32})-")
UID_RE = re.compile(r"[0-9a-f]{32}")
# C0, DEL and C1 controls, line/paragraph separators: a title is one plain line.
_TITLE_BAD = re.compile("[\x00-\x1f\x7f-\x9f\u2028\u2029]")
# Bidi override / embedding / isolate controls can reorder how a title is displayed.
_TITLE_BIDI = re.compile("[\u202a-\u202e\u2066-\u2069]")

_CREATE_KEYS = frozenset({"title", "description_markdown", "status", "note_ref", "slot_id"})
_UPDATE_KEYS = frozenset({"expectedVersion", "title", "description_markdown", "note_ref", "slot_id"})
_MOVE_KEYS = frozenset({"expectedVersion", "status", "index"})
_DELETE_KEYS = frozenset({"expectedVersion", "confirm"})
_IMPORT_KEYS = frozenset({"data", "replace", "confirm", "newUids"})
_EXPORT_KEYS = frozenset({"format", "version", "exported_at", "project", "tasks"})
_EXPORT_TASK_KEYS = frozenset({"uid", "title", "description_markdown", "status", "order",
                               "note_ref", "slot_id", "created_at", "updated_at"})

_COLUMNS = ("id, uid, project_id, title, description_markdown, status, sort_order, version, "
            "note_ref, slot_id, created_at, updated_at")


def now_ms() -> int:
    return time.time_ns() // 1_000_000


# --------------------------------------------------------------------------
# Field validation (each raises ApiError 400 with a stable code)
# --------------------------------------------------------------------------

def _refuse_unknown(body: dict, allowed: frozenset, where: str) -> None:
    extra = sorted(k for k in body if k not in allowed)
    if extra:
        hint = " (status and order change only through /move)" if {"status", "order"} & set(extra) else ""
        raise ApiError(400, "bad_field", f"unknown field(s) in {where}: {', '.join(map(str, extra[:5]))}{hint}")


def _encodable(value: str, code: str, what: str) -> bytes:
    try:
        return value.encode("utf-8")
    except UnicodeEncodeError:
        raise ApiError(400, code, f"{what} is not valid unicode (lone surrogate)") from None


def validate_title(value: object) -> str:
    if not isinstance(value, str):
        raise ApiError(400, "bad_title", "title must be a string")
    title = value.strip()
    if not title:
        raise ApiError(400, "bad_title", "title must not be empty")
    if len(title) > MAX_TITLE_CHARS:
        raise ApiError(400, "bad_title", f"title is limited to {MAX_TITLE_CHARS} characters")
    if _TITLE_BAD.search(title):
        raise ApiError(400, "bad_title", "title must be one line without control characters")
    if _TITLE_BIDI.search(title):
        raise ApiError(400, "bad_title", "title must not contain bidirectional control characters")
    _encodable(title, "bad_title", "title")
    return title


def validate_description(value: object) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        raise ApiError(400, "bad_description", "description_markdown must be a string")
    if "\x00" in value:
        raise ApiError(400, "bad_description", "description_markdown must not contain NUL")
    if len(_encodable(value, "bad_description", "description_markdown")) > MAX_DESCRIPTION_BYTES:
        raise ApiError(413, "description_too_large",
                       f"description_markdown is limited to {MAX_DESCRIPTION_BYTES} bytes of UTF-8")
    return value


def validate_status(value: object) -> str:
    if not isinstance(value, str) or value not in STATUSES:
        raise ApiError(400, "bad_status", f"status must be one of {', '.join(STATUSES)}")
    return value


def validate_note_ref(value: object) -> str | None:
    """A workspace-relative .md path (notes API rules), stored as given; never opened here."""
    if value is None:
        return None
    try:
        notes.note_segments(value)
    except ApiError as err:
        raise ApiError(400, "bad_note_ref", f"note_ref: {err.message}") from None
    return value  # type: ignore[return-value]


def validate_slot_id(value: object, project_uid: str) -> str | None:
    if value is None:
        return None
    m = SLOT_NAME_RE.fullmatch(value) if isinstance(value, str) else None
    if m is None:
        raise ApiError(400, "bad_slot_id", "slot_id must be a Quartizo chat session name")
    # The optional group is skipped for `quartizo-w<uid>-abcdef`, so look for a uid prefix separately.
    prefixed = _WORKSPACE_PREFIX_RE.match(value)
    for uid in (m.group(1), prefixed.group(1) if prefixed else None):
        if uid is not None and uid != project_uid:
            raise ApiError(400, "bad_slot_id", "slot_id names the chat session of another workspace")
    return value  # type: ignore[return-value]


def _int(value: object, code: str, what: str, *, minimum: int, maximum: int = MAX_TIMESTAMP_MS) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not minimum <= value <= maximum:
        raise ApiError(400, code, f"{what} must be an integer in [{minimum}, {maximum}]")
    return value


def validate_version(value: object) -> int:
    if value is None:
        raise ApiError(400, "version_required", "expectedVersion (the task version last read) is required")
    return _int(value, "bad_version", "expectedVersion", minimum=1)


def to_json(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "uid": row["uid"],
        "project_id": row["project_id"],
        "title": row["title"],
        "description_markdown": row["description_markdown"],
        "status": row["status"],
        "order": row["sort_order"],
        "version": row["version"],
        "note_ref": row["note_ref"],
        "slot_id": row["slot_id"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


# --------------------------------------------------------------------------
# Store
# --------------------------------------------------------------------------

class TaskStore:
    """Task CRUD, moves and import/export for the projects in *registry*."""

    def __init__(self, registry: Registry) -> None:
        self.registry = registry

    @contextmanager
    def _tx(self, *, write: bool = True) -> Iterator[sqlite3.Connection]:
        conn = db.connect(self.registry.db_path)
        try:
            with db.transaction(conn, write=write):
                yield conn
        finally:
            conn.close()

    @staticmethod
    def _project(conn: sqlite3.Connection, ws_id: int) -> sqlite3.Row:
        """The workspace row (= project), read inside the caller's transaction."""
        row = db.get_workspace(conn, ws_id)
        if row is None:
            raise ApiError(404, "workspace_not_found", "no such workspace")
        return row

    @staticmethod
    def _rows(conn: sqlite3.Connection, project_uid: str) -> list[sqlite3.Row]:
        order = " ".join(f"WHEN '{s}' THEN {i}" for i, s in enumerate(STATUSES))
        return conn.execute(
            f"SELECT {_COLUMNS} FROM tasks WHERE project_id = ? "
            f"ORDER BY CASE status {order} END, sort_order, id", (project_uid,),
        ).fetchall()

    @staticmethod
    def _column(conn: sqlite3.Connection, project_uid: str, status: str) -> list[int]:
        return [r[0] for r in conn.execute(
            "SELECT id FROM tasks WHERE project_id = ? AND status = ? ORDER BY sort_order, id",
            (project_uid, status))]

    @staticmethod
    def _reindex(conn: sqlite3.Connection, ids: list[int]) -> None:
        for position, task_id in enumerate(ids):
            conn.execute("UPDATE tasks SET sort_order = ? WHERE id = ? AND sort_order != ?",
                         (position, task_id, position))

    @staticmethod
    def _task(conn: sqlite3.Connection, project_uid: str, task_id: int) -> sqlite3.Row:
        row = conn.execute(f"SELECT {_COLUMNS} FROM tasks WHERE id = ? AND project_id = ?",
                           (task_id, project_uid)).fetchone()
        if row is None:
            raise ApiError(404, "task_not_found", "no such task in this workspace")
        return row

    @staticmethod
    def _check_version(row: sqlite3.Row, expected: int) -> None:
        if row["version"] != expected:
            raise ApiError(409, "stale", "the task changed since you loaded it",
                           currentVersion=row["version"], task=to_json(row))

    # -- reads -------------------------------------------------------------

    def list(self, ws_id: int) -> dict:
        with self._tx(write=False) as conn:
            ws = self._project(conn, ws_id)
            rows = self._rows(conn, ws["uid"])
        return {"project": {"id": ws["uid"], "workspaceId": ws["id"], "name": ws["name"]},
                "statuses": list(STATUSES), "tasks": [to_json(r) for r in rows]}

    def get(self, ws_id: int, task_id: int) -> dict:
        with self._tx(write=False) as conn:
            ws = self._project(conn, ws_id)
            return {"task": to_json(self._task(conn, ws["uid"], task_id))}

    # -- writes ------------------------------------------------------------

    def create(self, ws_id: int, body: dict) -> dict:
        _refuse_unknown(body, _CREATE_KEYS, "task")
        title = validate_title(body.get("title"))
        description = validate_description(body.get("description_markdown"))
        status = validate_status(body.get("status", "backlog"))
        note_ref = validate_note_ref(body.get("note_ref"))
        with self._tx() as conn:
            ws = self._project(conn, ws_id)
            slot_id = validate_slot_id(body.get("slot_id"), ws["uid"])
            count = conn.execute("SELECT COUNT(*) FROM tasks WHERE project_id = ?", (ws["uid"],)).fetchone()[0]
            if count >= MAX_TASKS_PER_PROJECT:
                raise ApiError(409, "too_many_tasks", f"a project is limited to {MAX_TASKS_PER_PROJECT} tasks")
            position = len(self._column(conn, ws["uid"], status))
            ts = now_ms()
            cur = conn.execute(
                "INSERT INTO tasks (uid, project_id, title, description_markdown, status, sort_order, "
                "version, note_ref, slot_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)",
                (db.new_uid(), ws["uid"], title, description, status, position, note_ref, slot_id, ts, ts))
            return {"task": to_json(self._task(conn, ws["uid"], int(cur.lastrowid)))}

    def update(self, ws_id: int, task_id: int, body: dict) -> dict:
        """Edit title, description, note_ref and slot_id. Never status or order (see move)."""
        _refuse_unknown(body, _UPDATE_KEYS, "task update")
        expected = validate_version(body.get("expectedVersion"))
        fields: dict[str, object] = {}
        if "title" in body:
            fields["title"] = validate_title(body["title"])
        if "description_markdown" in body:
            fields["description_markdown"] = validate_description(body["description_markdown"])
        if "note_ref" in body:
            fields["note_ref"] = validate_note_ref(body["note_ref"])
        if "slot_id" not in body and not fields:
            raise ApiError(400, "nothing_to_update", "no field to update")
        with self._tx() as conn:
            ws = self._project(conn, ws_id)
            if "slot_id" in body:
                fields["slot_id"] = validate_slot_id(body["slot_id"], ws["uid"])
            row = self._task(conn, ws["uid"], task_id)
            self._check_version(row, expected)
            assignments = ", ".join(f"{name} = ?" for name in fields)  # names from the fixed set above
            conn.execute(f"UPDATE tasks SET {assignments}, version = version + 1, updated_at = ? WHERE id = ?",
                         (*fields.values(), now_ms(), task_id))
            return {"task": to_json(self._task(conn, ws["uid"], task_id))}

    def move(self, ws_id: int, task_id: int, body: dict) -> dict:
        """Put the task at *index* of column *status*; reindex the affected columns.

        This only rewrites ``status`` / ``sort_order`` (and the moved task's
        version and updated_at). It never touches ``slot_id`` and, like every
        route here, makes no chat or agent call.
        """
        _refuse_unknown(body, _MOVE_KEYS, "move")
        expected = validate_version(body.get("expectedVersion"))
        status = validate_status(body.get("status"))
        index = _int(body.get("index"), "bad_index", "index", minimum=0, maximum=MAX_TASKS_PER_PROJECT)
        with self._tx() as conn:
            ws = self._project(conn, ws_id)
            row = self._task(conn, ws["uid"], task_id)
            self._check_version(row, expected)
            source = self._column(conn, ws["uid"], row["status"])
            target = source if row["status"] == status else self._column(conn, ws["uid"], status)
            target = [i for i in target if i != task_id]
            index = min(index, len(target))
            moved = row["status"] != status or source.index(task_id) != index
            if moved:
                target.insert(index, task_id)
                if row["status"] != status:
                    self._reindex(conn, [i for i in source if i != task_id])
                conn.execute("UPDATE tasks SET status = ?, version = version + 1, updated_at = ? WHERE id = ?",
                             (status, now_ms(), task_id))
                self._reindex(conn, target)
            return {"task": to_json(self._task(conn, ws["uid"], task_id)), "moved": moved,
                    "tasks": [to_json(r) for r in self._rows(conn, ws["uid"])]}

    def delete(self, ws_id: int, task_id: int, body: dict) -> dict:
        _refuse_unknown(body, _DELETE_KEYS, "delete")
        if body.get("confirm") is not True:
            raise ApiError(400, "confirm_required", "deleting a task needs confirm: true")
        expected = validate_version(body.get("expectedVersion"))
        with self._tx() as conn:
            ws = self._project(conn, ws_id)
            row = self._task(conn, ws["uid"], task_id)
            self._check_version(row, expected)
            conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
            self._reindex(conn, self._column(conn, ws["uid"], row["status"]))
        return {"ok": True}

    # -- import / export ---------------------------------------------------

    def export(self, ws_id: int) -> dict:
        with self._tx(write=False) as conn:
            ws = self._project(conn, ws_id)
            rows = self._rows(conn, ws["uid"])
        return {
            "format": EXPORT_FORMAT,
            "version": EXPORT_VERSION,
            "exported_at": now_ms(),
            "project": {"id": ws["uid"], "name": ws["name"]},
            "tasks": [{k: v for k, v in to_json(r).items() if k in _EXPORT_TASK_KEYS} for r in rows],
        }

    @staticmethod
    def _parse_export(data: object) -> list[dict]:
        """Validate a whole export document before anything is written."""
        if not isinstance(data, dict):
            raise ApiError(400, "bad_import", "data must be a Quartizo task export object")
        _refuse_unknown(data, _EXPORT_KEYS, "export")
        if data.get("format") != EXPORT_FORMAT or data.get("version") != EXPORT_VERSION:
            raise ApiError(400, "bad_import", f"not a {EXPORT_FORMAT} v{EXPORT_VERSION} export")
        project = data.get("project")
        if project is not None and not isinstance(project, dict):
            raise ApiError(400, "bad_import", "project must be an object")
        items = data.get("tasks")
        if not isinstance(items, list):
            raise ApiError(400, "bad_import", "tasks must be a list")
        if len(items) > MAX_TASKS_PER_PROJECT:
            raise ApiError(413, "too_many_tasks", f"an import is limited to {MAX_TASKS_PER_PROJECT} tasks")
        parsed, seen, ts = [], set(), now_ms()
        for n, item in enumerate(items):
            try:
                if not isinstance(item, dict):
                    raise ApiError(400, "bad_import", "task must be an object")
                _refuse_unknown(item, _EXPORT_TASK_KEYS, "task")
                uid = item.get("uid")
                if uid is not None:
                    if not isinstance(uid, str) or not UID_RE.fullmatch(uid):
                        raise ApiError(400, "bad_import", "uid must be 32 lowercase hex characters")
                    if uid in seen:
                        raise ApiError(400, "bad_import", "duplicate uid")
                    seen.add(uid)
                created = _int(item.get("created_at", ts), "bad_import", "created_at", minimum=0)
                updated = _int(item.get("updated_at", created), "bad_import", "updated_at", minimum=0)
                parsed.append({
                    "uid": uid,
                    "title": validate_title(item.get("title")),
                    "description_markdown": validate_description(item.get("description_markdown")),
                    "status": validate_status(item.get("status")),
                    "order": _int(item.get("order", n), "bad_import", "order", minimum=0, maximum=2 ** 31),
                    "note_ref": validate_note_ref(item.get("note_ref")),
                    "slot_id": item.get("slot_id"),  # checked against the target project below
                    "created_at": created,
                    "updated_at": updated,
                    "n": n,
                })
            except ApiError as err:
                raise ApiError(err.status, err.code, f"task {n}: {err.message}", taskIndex=n) from None
        return parsed

    def import_(self, ws_id: int, body: dict) -> dict:
        """All-or-nothing import of one export document into this project.

        A project that already has tasks is refused (409 ``project_not_empty``)
        unless ``replace`` and ``confirm`` are both true; then the existing
        tasks are deleted in the same transaction. A uid already used by a task
        of another project is refused (409 ``uid_conflict``) unless
        ``newUids: true`` (import as copies with fresh uids).
        """
        _refuse_unknown(body, _IMPORT_KEYS, "import")
        replace = body.get("replace", False)
        new_uids = body.get("newUids", False)
        if not isinstance(replace, bool) or not isinstance(new_uids, bool):
            raise ApiError(400, "bad_import", "replace and newUids must be booleans")
        if replace and body.get("confirm") is not True:
            raise ApiError(400, "confirm_required", "replacing the existing tasks needs confirm: true")
        items = self._parse_export(body.get("data"))
        with self._tx() as conn:
            ws = self._project(conn, ws_id)
            for item in items:
                try:
                    item["slot_id"] = validate_slot_id(item["slot_id"], ws["uid"])
                except ApiError as err:
                    raise ApiError(400, err.code, f"task {item['n']}: {err.message}", taskIndex=item["n"]) from None
            existing = conn.execute("SELECT COUNT(*) FROM tasks WHERE project_id = ?", (ws["uid"],)).fetchone()[0]
            if existing and not replace:
                raise ApiError(409, "project_not_empty",
                               f"this project already has {existing} task(s); import with replace + confirm "
                               "to replace them", taskCount=existing)
            if replace:
                conn.execute("DELETE FROM tasks WHERE project_id = ?", (ws["uid"],))
            if new_uids:
                for item in items:
                    item["uid"] = None
            taken = [i["uid"] for i in items if i["uid"] is not None and conn.execute(
                "SELECT 1 FROM tasks WHERE uid = ?", (i["uid"],)).fetchone()]
            if taken:
                raise ApiError(409, "uid_conflict",
                               f"{len(taken)} task uid(s) already exist in another project; "
                               "import with newUids: true to import copies", conflictCount=len(taken))
            columns: dict[str, list[dict]] = {s: [] for s in STATUSES}
            for item in sorted(items, key=lambda i: (i["order"], i["n"])):
                columns[item["status"]].append(item)
            for status, column in columns.items():
                for position, item in enumerate(column):
                    conn.execute(
                        "INSERT INTO tasks (uid, project_id, title, description_markdown, status, sort_order, "
                        "version, note_ref, slot_id, created_at, updated_at) "
                        "VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)",
                        (item["uid"] or db.new_uid(), ws["uid"], item["title"], item["description_markdown"],
                         status, position, item["note_ref"], item["slot_id"],
                         item["created_at"], item["updated_at"]))
            rows = self._rows(conn, ws["uid"])
        return {"imported": len(items), "replaced": existing if replace else 0,
                "tasks": [to_json(r) for r in rows]}
