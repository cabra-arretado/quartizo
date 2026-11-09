"""Explicit, backed-up conversion of legacy database cards to portable notes.

The journal and backups are application state, outside the disposable index.
Legacy rows and linked notes are never changed. Each file is created without
replacement; a restart recognizes already-created bytes instead of duplicating
them. Completed files may subsequently be edited: retries never restore their
old contents.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sqlite3
import tempfile
import time
from pathlib import Path
from urllib.parse import quote

import companion_write
import db
import mdsource
from workspace import ApiError, Registry, Workspace, validate_relpath

_UID = re.compile(r"[0-9a-f]{32}")
MAX_TASKS = 2000


def _digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _json_bytes(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2).encode("utf-8")


def _save(path: Path, value: object) -> None:
    fd, tmp = tempfile.mkstemp(prefix=".migration-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(_json_bytes(value))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(tmp, path)
        directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)


class LegacyMigration:
    def __init__(self, registry: Registry, writer: companion_write.CompanionWriter):
        self.registry, self.writer = registry, writer

    def _current_workspace(self, ws: Workspace, *, writable: bool = False) -> Workspace:
        """Refresh a queued request's registration while holding the write lock."""
        current = self.registry.get(ws.id)
        if current.uid != ws.uid:
            raise ApiError(409, "workspace_changed", "the workspace registration changed; reload before continuing")
        if writable:
            self.writer.index.require_writes(current)
        return current

    @staticmethod
    def _validate_generated(item: dict, data: bytes) -> None:
        note = mdsource.parse_note(item["path"], data)
        if (note.diagnostics or not note.ticket or note.ticket_id != item["uid"]
                or note.status != item["status"] or note.order != item["order"]):
            raise ApiError(409, "migration_invalid_output",
                           "a legacy card cannot become an editable ticket; repair its source before migration",
                           path=item["path"], diagnostics=[d.code for d in note.diagnostics])

    def _identity_paths(self) -> dict[str, list[tuple[Workspace, str]]]:
        existing: dict[str, list[tuple[Workspace, str]]] = {}
        for owner, path, note in self.writer.snapshot():
            if note.ticket_id:
                existing.setdefault(note.ticket_id, []).append((owner, path))
        return existing

    @staticmethod
    def _matches(ws: Workspace, uid: str, existing: dict) -> list[tuple[Workspace, str]]:
        matches = existing.get(uid, [])
        if len(matches) > 1 or any(owner.uid != ws.uid for owner, _ in matches):
            raise ApiError(409, "duplicate_id", "a legacy card ID is already used by another note; repair before migration")
        return matches

    @classmethod
    def _completed_path(cls, ws: Workspace, item: dict, step: dict, existing: dict) -> str:
        matches = cls._matches(ws, item["uid"], existing)
        path = matches[0][1] if matches else step.get("path", item["path"])
        item["path"] = path
        return path

    def export(self, ws: Workspace) -> dict:
        conn = db.connect(self.registry.db_path)
        try:
            rows = conn.execute("SELECT * FROM tasks WHERE project_id = ? ORDER BY status, sort_order, id",
                                (ws.uid,)).fetchall()
            if len(rows) > MAX_TASKS:
                raise ApiError(413, "migration_limit", "legacy migration is limited to 2000 cards")
            return {"format": "quartizo-legacy-tasks-v1", "workspace": ws.to_json(),
                    "tasks": [dict(row) for row in rows]}
        finally:
            conn.close()

    def _plan(self, ws: Workspace) -> tuple[dict, list[tuple[dict, bytes]]]:
        exported = self.export(ws)
        plan_hash = _digest(_json_bytes({"workspaceUid": ws.uid, "tasks": exported["tasks"]}))
        counts: dict[str, int] = {}
        for task in exported["tasks"]:
            counts[task["status"]] = counts.get(task["status"], 0) + 1
        offsets: dict[str, int] = {}
        result, warnings = [], []
        for task in exported["tasks"]:
            uid, status = task["uid"], task["status"]
            if not isinstance(uid, str) or not _UID.fullmatch(uid) or status not in mdsource.STATUSES:
                raise ApiError(409, "legacy_invalid", "a legacy card has invalid identity or status; export it before repair")
            offsets[status] = offsets.get(status, 0) + 1
            rank = f"{mdsource.MAX_RANK // (counts[status] + 1) * offsets[status]:032x}"
            path = f"Quartizo tickets/{uid}.md"
            title = " ".join(task["title"].splitlines())
            header = f'---\nid: "{uid}"\ntype: ticket\nstatus: {status}\norder: "{rank}"\n'
            if task["slot_id"]:
                header += "quartizo_session: " + json.dumps(task["slot_id"], ensure_ascii=False) + "\n"
            # These are new Markdown files, not edits to the old string. Use
            # LF throughout so native Notes recognizes their checkboxes and
            # the result never becomes read-only solely through mixed endings.
            # The untouched database rows and backup retain the original text.
            description = task["description_markdown"].replace("\r\n", "\n").replace("\r", "\n")
            normalized = description != task["description_markdown"]
            if normalized:
                warnings.append(f"Card {uid}: the new ticket note uses LF line endings; its original description is preserved in the database and backup.")
            body = header + "---\n\n# " + title + "\n\n" + description
            if task["note_ref"]:
                try:
                    validate_relpath(task["note_ref"])
                except ApiError:
                    warnings.append(f"Card {uid} has an invalid old note reference; it is preserved in the backup.")
                else:
                    target = quote(task["note_ref"], safe="/")
                    # This ticket is created in a subfolder, so its relationship is relative to that folder.
                    body += f"\n\n[Linked note](../{target})\n"
            item = {"id": task["id"], "uid": uid, "title": task["title"], "status": status,
                    "order": rank, "path": path, "noteRef": task["note_ref"], "slotId": task["slot_id"],
                    "normalizedLineEndings": normalized}
            data = body.encode("utf-8")
            self._validate_generated(item, data)
            result.append((item, data))
        return {"workspace": ws.to_json(), "planHash": plan_hash, "tasks": [item for item, _ in result],
                "warnings": warnings, "backupRequired": True}, result

    def _journal_path(self, ws: Workspace) -> Path:
        return self.registry.data_dir / f"migration-{ws.uid}.json"

    def _journal(self, ws: Workspace) -> dict | None:
        try:
            journal = json.loads(self._journal_path(ws).read_bytes())
            if (not isinstance(journal, dict) or not isinstance(journal.get("completed"), dict)
                    or not isinstance(journal.get("planHash"), str) or not isinstance(journal.get("backup"), dict)):
                raise ValueError("invalid journal shape")
            return journal
        except FileNotFoundError:
            return None
        except (ValueError, UnicodeDecodeError):
            raise ApiError(409, "migration_journal_invalid", "migration journal needs recovery from its backup") from None

    def preview(self, ws: Workspace) -> dict:
        with self.writer.lock:
            ws = self._current_workspace(ws)
            preview, plan = self._plan(ws)
            journal = self._journal(ws)
            if journal is not None and journal["planHash"] != preview["planHash"]:
                preview["warnings"].append("Legacy cards changed after conversion began; the saved migration must be reviewed.")
            completed = {} if journal is None else journal.get("completed", {})
            existing = self._identity_paths() if completed else {}
            for item, data in plan:
                item["migrated"] = item["uid"] in completed
                if item["migrated"]:
                    self._completed_path(ws, item, completed[item["uid"]], existing)
                try:
                    current = companion_write.read_note(ws, item["path"])
                except ApiError as err:
                    if err.status != 404:
                        preview["warnings"].append(f"Destination {item['path']} cannot be read safely.")
                else:
                    if item["uid"] not in completed and current != data:
                        preview["warnings"].append(f"Destination {item['path']} already exists with different content.")
                    elif item["uid"] in completed and _digest(current) != completed[item["uid"]]["hash"]:
                        item["changed"] = True
                        preview["warnings"].append(f"Converted note {item['path']} has newer edits. Review it before resuming with its current contents.")
            preview["complete"] = bool(journal and journal.get("complete"))
            preview["backup"] = journal.get("backup") if journal else None
            return preview

    def _backup(self, ws: Workspace, plan_hash: str) -> dict:
        folder = self.registry.data_dir / f"migration-backup-{ws.uid}-{time.time_ns()}"
        folder.mkdir(mode=0o700)
        source = sqlite3.connect(self.registry.db_path)
        destination = sqlite3.connect(folder / db.DB_FILENAME)
        try:
            source.backup(destination)
        finally:
            destination.close()
            source.close()
        os.chmod(folder / db.DB_FILENAME, 0o600)
        _save(folder / "legacy-tasks.json", self.export(ws))
        _save(folder / "manifest.json", {"workspaceUid": ws.uid, "planHash": plan_hash})
        return {"directory": str(folder), "database": str(folder / db.DB_FILENAME),
                "export": str(folder / "legacy-tasks.json")}

    def run(self, ws: Workspace, body: dict) -> dict:
        if body.get("confirm") is not True:
            raise ApiError(400, "confirmation_required", "review the migration preview and confirm before creating files")
        if not isinstance(body.get("acceptCurrent", False), bool):
            raise ApiError(400, "bad_confirmation", "acceptCurrent must be true or false")
        with self.writer.lock:
            ws = self._current_workspace(ws, writable=True)
            preview, plan = self._plan(ws)
            if body.get("planHash") != preview["planHash"]:
                raise ApiError(409, "migration_changed", "legacy cards changed; review a fresh migration preview")
            if self.writer.maintenance(ws):
                raise ApiError(409, "maintenance_pending", "finish column ordering maintenance before migrating legacy cards")
            journal = self._journal(ws)
            if journal is not None and journal["planHash"] != preview["planHash"]:
                raise ApiError(409, "migration_changed", "legacy cards changed after migration started; preserve the saved backup")
            if journal is None:
                # Persist planned hashes BEFORE any vault write. A crash after file creation is recognizable.
                journal = {"planHash": preview["planHash"], "backup": self._backup(ws, preview["planHash"]),
                           "completed": {}, "complete": False,
                           "planned": {item["uid"]: {"path": item["path"], "hash": _digest(data)} for item, data in plan}}
                _save(self._journal_path(ws), journal)
            was_complete = journal.get("complete") is True
            # Existing IDs anywhere in the companion must match this journal's
            # own output. No identity is silently merged into another note.
            existing = self._identity_paths()
            for item, data in plan:
                uid, path = item["uid"], item["path"]
                matches = self._matches(ws, uid, existing)
                if uid in journal["completed"]:
                    # Never overwrite a ticket edited after conversion, even on an explicit retry.
                    path = self._completed_path(ws, item, journal["completed"][uid], existing)
                    journal["completed"][uid]["path"] = path
                    current = companion_write.read_note(ws, path)
                    parsed = mdsource.parse_note(path, current)
                    if parsed.ticket_id != uid or parsed.diagnostics:
                        raise ApiError(409, "migration_conflict", "a previously converted ticket changed identity; nothing was replaced")
                    if not was_complete and _digest(current) != journal["completed"][uid]["hash"]:
                        if body.get("acceptCurrent") is not True:
                            raise ApiError(409, "migration_conflict", "a converted ticket changed before migration verification; preserve both versions and review the backup")
                        journal["completed"][uid].update(hash=_digest(current), acceptedCurrent=True)
                        _save(self._journal_path(ws), journal)
                    continue
                if matches and matches[0][1] != path:
                    raise ApiError(409, "duplicate_id", "a legacy card ID is already used at another path; nothing was merged")
                try:
                    current = companion_write.read_note(ws, path)
                except ApiError as err:
                    if err.status != 404:
                        raise
                    companion_write.create_file(ws, path, data)
                else:
                    if current != data:
                        raise ApiError(409, "migration_collision", "a migration destination already exists; nothing was replaced", path=path)
                written = companion_write.read_note(ws, path)
                if written != data:
                    raise ApiError(409, "migration_conflict", "a newly converted ticket changed during verification; nothing was replaced")
                self._validate_generated(item, written)
                journal["completed"][uid] = {"path": path, "hash": _digest(data)}
                _save(self._journal_path(ws), journal)
            # Verify the source snapshot again before marking the conversion complete.
            if self._plan(ws)[0]["planHash"] != preview["planHash"]:
                raise ApiError(409, "migration_changed", "legacy cards changed during conversion; preserve the backup and review")
            if not was_complete:
                # A later external edit to an earlier output cannot go unnoticed
                # merely because its individual step was already journaled.
                for step in journal["completed"].values():
                    if _digest(companion_write.read_note(ws, step["path"])) != step["hash"]:
                        raise ApiError(409, "migration_conflict", "converted notes changed before final verification; nothing was replaced")
            journal["complete"] = True
            _save(self._journal_path(ws), journal)
            self.writer.index.request(ws, manual=True)
            return {"backup": journal["backup"], "migrated": [{"uid": item["uid"], "path": item["path"]} for item, _ in plan],
                    "remaining": 0, "complete": True}
