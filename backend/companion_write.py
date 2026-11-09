"""Hash-guarded, source-preserving writes for the native Notes companion.

Only the requested YAML scalars or checkbox byte change. All our mutations
serialize through one lock. Native/external writers do not take that lock;
the final hash check narrows, but cannot eliminate, the check-to-replace race.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import stat
import threading
import time
import uuid
from collections import Counter, OrderedDict
from contextlib import contextmanager
from dataclasses import replace

import companion
import mdsource
from mdsource import MAX_RANK, STATUSES, _Source
from workspace import ApiError, Registry, Workspace, open_dir_at, open_file_at, open_root, os_error, validate_relpath

_HEX = re.compile(r"[0-9a-f]{64}")
_ID = re.compile(r"(?:[0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})")
SNAPSHOT_SECONDS = 5.0


class Snapshot(list):
    """One live identity inventory with constant-time duplicate checks."""

    def __init__(self, rows):
        super().__init__(rows)
        self.identities = Counter(note.ticket_id for _, _, note in rows if note.ticket_id)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _path(value: object) -> list[str]:
    parts = validate_relpath(value)
    if not parts[-1].endswith(".md") or parts[-1] == ".md":
        raise ApiError(400, "not_markdown", "only .md files are supported")
    return parts


@contextmanager
def _parent(ws: Workspace, path: object, *, create: bool = False):
    parts = _path(path)
    fd = open_root(ws.path)
    try:
        for part in parts[:-1]:
            if create:
                try:
                    os.mkdir(part, 0o755, dir_fd=fd)
                except FileExistsError:
                    pass
            child = open_dir_at(fd, part)
            os.close(fd)
            fd = child
        yield fd, parts[-1]
    except OSError as err:
        raise os_error(err) from None
    finally:
        os.close(fd)


def _read(parent: int, name: str) -> tuple[bytes, os.stat_result]:
    fd, st = open_file_at(parent, name)
    try:
        chunks, total = [], 0
        while total <= mdsource.MAX_FILE_BYTES:
            chunk = os.read(fd, min(65536, mdsource.MAX_FILE_BYTES + 1 - total))
            if not chunk:
                break
            chunks.append(chunk)
            total += len(chunk)
        if total > mdsource.MAX_FILE_BYTES:
            raise ApiError(413, "too_large", "notes are limited to 2 MiB")
        return b"".join(chunks), st
    finally:
        os.close(fd)


def read_note(ws: Workspace, path: object) -> bytes:
    with _parent(ws, path) as (parent, name):
        return _read(parent, name)[0]


def _check_hash(data: bytes, expected: object) -> None:
    if not isinstance(expected, str) or not _HEX.fullmatch(expected):
        raise ApiError(400, "bad_hash", "expectedHash must be the SHA-256 last read")
    if digest(data) != expected:
        raise ApiError(409, "conflict", "the note changed; refresh before retrying", currentHash=digest(data))


def _fsync(fd: int) -> None:
    try:
        os.fsync(fd)
    except OSError:
        pass


def _write(ws: Workspace, path: str, data: bytes, expected: str | None, *, validate=None) -> dict:
    if len(data) > mdsource.MAX_FILE_BYTES:
        raise ApiError(413, "too_large", "notes are limited to 2 MiB")
    with _parent(ws, path, create=expected is None) as (parent, name):
        mode = 0o600
        if expected is not None:
            current, st = _read(parent, name)
            _check_hash(current, expected)
            if not st.st_mode & stat.S_IWUSR:
                raise ApiError(403, "read_only", "the note is read-only on disk")
            mode = stat.S_IMODE(st.st_mode) & 0o777
        temp = f".quartizo-{secrets.token_hex(12)}.tmp"
        fd = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW | os.O_CLOEXEC, mode, dir_fd=parent)
        try:
            os.fchmod(fd, mode)
            view = memoryview(data)
            while view:
                view = view[os.write(fd, view) :]
            os.fsync(fd)
        except BaseException:
            os.close(fd)
            os.unlink(temp, dir_fd=parent)
            raise
        os.close(fd)
        try:
            if validate is not None:
                validate()
            if expected is None:
                try:
                    os.link(temp, name, src_dir_fd=parent, dst_dir_fd=parent, follow_symlinks=False)
                except FileExistsError:
                    raise ApiError(409, "exists", "a note already exists at this path") from None
            else:
                _check_hash(_read(parent, name)[0], expected)
                os.replace(temp, name, src_dir_fd=parent, dst_dir_fd=parent)
            _fsync(parent)
        finally:
            try:
                os.unlink(temp, dir_fd=parent)
            except FileNotFoundError:
                pass
    return {"path": path, "hash": digest(data)}


def write_note(ws: Workspace, path: str, data: bytes, expected_hash: str) -> dict:
    return _write(ws, path, data, expected_hash)


def create_file(ws: Workspace, path: str, data: bytes) -> dict:
    return _write(ws, path, data, None)


def _source(path: str, data: bytes, expected: object | None = None) -> tuple[_Source, mdsource.Note]:
    if expected is not None:
        _check_hash(data, expected)
    note = mdsource.parse_note(path, data)
    if note.diagnostics:
        raise ApiError(
            409,
            "invalid_metadata",
            note.diagnostics[0].message,
            diagnostics=[{"code": d.code, "message": d.message} for d in note.diagnostics],
        )
    return _Source(data, data.decode("utf-8"), note), note


def patch_scalar(path: str, data: bytes, key: str, value: str) -> bytes:
    source, _ = _source(path, data)
    node = source.fields.get(key)
    if (
        not isinstance(node, mdsource.ScalarNode)
        or node.tag != mdsource._STRING_TAG
        or node.style not in (None, "'", '"')
        or node.start_mark.line != node.end_mark.line
    ):
        raise ApiError(409, "unsupported_scalar", "only single-line string properties can be changed")
    if not re.fullmatch(r"[a-z0-9_]+", value):
        raise ApiError(400, "bad_value", "unsupported property value")
    # YAML can infer an integer when a previously plain rank acquires only
    # numeric digits. Keep the updated value a string in every case.
    quote = node.style or ('"' if key == "order" else "")
    start = source.byte_offset(source.yaml_start + node.start_mark.index)
    end = source.byte_offset(source.yaml_start + node.end_mark.index)
    return data[:start] + f"{quote}{value}{quote}".encode("ascii") + data[end:]


def promote_bytes(path: str, data: bytes, uid: str, rank: str, status: str = "backlog") -> bytes:
    source, _ = _source(path, data)
    if not _ID.fullmatch(uid) or not mdsource.valid_rank(rank) or status not in STATUSES:
        raise ApiError(400, "bad_ticket", "invalid ticket identity, rank or status")
    if any(k in source.fields for k in ("id", "type", "status", "order")):
        raise ApiError(409, "property_collision", "existing id/type/status/order properties require explicit repair")
    if source.flow_mapping:
        raise ApiError(409, "unsupported_yaml", "adding ticket properties requires block-style frontmatter")
    endings = re.findall(r"\r\n|\r|\n", source.text)
    newline = endings[0] if endings else "\n"
    fields = newline.join((f'id: "{uid}"', "type: ticket", f"status: {status}", f'order: "{rank}"', ""))
    if source.yaml_end is not None:
        # An explicit YAML document terminator belongs before the Markdown
        # delimiter. Appending after it would start invalid trailing YAML.
        end = source.yaml_document_end if source.yaml_document_end is not None else source.yaml_end
        at = source.byte_offset(end)
        result = data[:at] + fields.encode() + data[at:]
    else:
        at = 3 if data.startswith(b"\xef\xbb\xbf") else 0
        result = data[:at] + f"---{newline}{fields}---{newline}".encode() + data[at:]
    note = mdsource.parse_note(path, result)
    if note.diagnostics or (note.ticket_id, note.status, note.order) != (uid, status, rank):
        raise ApiError(409, "invalid_metadata", "ticket promotion could not preserve valid metadata; nothing was changed")
    return result


def between(lower: str | None = None, upper: str | None = None) -> str:
    if any(rank is not None and not mdsource.valid_rank(rank) for rank in (lower, upper)):
        raise ApiError(409, "invalid_order", "invalid destination rank")
    left, right = int(lower, 16) if lower else 0, int(upper, 16) if upper else MAX_RANK
    if right - left <= 1:
        raise ApiError(409, "rank_exhausted", "destination ranks need rebalancing before this move")
    return f"{(left + right) // 2:032x}"


class CompanionWriter:
    def __init__(self, registry: Registry, index: companion.CompanionIndex):
        self.registry, self.index = registry, index
        self.lock = threading.RLock()
        self.journal_dir = registry.data_dir / "ticket-maintenance"
        self._metadata_cache: OrderedDict[tuple[str, str], tuple[int, mdsource.Note]] = OrderedDict()
        self._metadata_cache_limit = 4096

    def _require(self, ws: Workspace) -> Workspace:
        ws = self.registry.get(ws.id)
        self.index.require_writes(ws)
        path = self.registry.data_dir / f"migration-{ws.uid}.json"
        if path.exists():
            try:
                pending = json.loads(path.read_text(encoding="utf-8")).get("complete") is not True
            except (OSError, ValueError, AttributeError):
                pending = True
            if pending:
                raise ApiError(409, "migration_pending", "finish verifying the legacy-card migration before editing")
        return ws

    def _snapshot(self) -> list[tuple[Workspace, str, mdsource.Note]]:
        """Check live files, never trust cached IDs or a timestamp-only scan."""
        result = []
        deadline = time.monotonic() + SNAPSHOT_SECONDS

        def check_budget(ws: Workspace) -> None:
            if time.monotonic() > deadline:
                self.index.request(ws, manual=True)
                raise ApiError(409, "index_not_ready", "the companion inventory needs more indexing time; refresh after its background scan finishes",
                               workspaceId=ws.id)

        with self.index._conn() as conn:
            for ws in self.registry.list():
                if not ws.companion:
                    continue
                scan = companion._Scan(False)
                for path, st, data in self.index._walk(ws, scan):
                    check_budget(ws)
                    scan.notes += 1
                    if st is None or data is None:
                        raise ApiError(409, "incomplete_scan", "a companion note could not be read; writes are paused")
                    note = self._identity_metadata(conn, ws, path, data)
                    check_budget(ws)
                    if any(d.code in ("too_large", "not_utf8") for d in note.diagnostics):
                        raise ApiError(409, "incomplete_scan", "a companion note could not be inspected; writes are paused")
                    result.append((ws, path, note))
                if not scan.complete:
                    raise ApiError(409, "incomplete_scan", "a companion scan is incomplete; writes are paused")
        return Snapshot(result)

    def _identity_metadata(self, conn, ws: Workspace, path: str, data: bytes) -> mdsource.Note:
        current_hash = digest(data)
        key = (ws.uid, path)
        cached = self._metadata_cache.get(key)
        if cached is not None and cached[0] == companion.INDEX_VERSION and cached[1].hash == current_hash:
            note = cached[1]
            self._metadata_cache.move_to_end(key)
        else:
            # The background index already parsed unchanged files. Its row is
            # useful only after comparing it to the freshly read live hash;
            # retained rows and timestamp-only matches never authorize reuse.
            row = conn.execute(
                "SELECT n.* FROM companion_notes n JOIN companion_index i"
                " ON i.workspace_uid = n.workspace_uid AND i.generation = n.generation"
                " WHERE n.workspace_uid = ? AND n.path = ? AND n.hash = ?"
                " AND n.retained = 0 AND i.version = ?",
                (ws.uid, path, current_hash, companion.INDEX_VERSION),
            ).fetchone()
            if row is None:
                note = mdsource.parse_metadata(data)
            else:
                note = mdsource.Note(
                    hash=current_hash, size=len(data), title="", ticket=bool(row["ticket"]),
                    ticket_id=row["ticket_id"], status=row["status"], order=row["sort_key"],
                    diagnostics=[mdsource.Diagnostic(d["code"], d["message"]) for d in json.loads(row["diagnostics"])],
                )
            self._metadata_cache[key] = (companion.INDEX_VERSION, note)
            self._metadata_cache.move_to_end(key)
            while len(self._metadata_cache) > self._metadata_cache_limit:
                self._metadata_cache.popitem(last=False)
        return replace(note, diagnostics=list(note.diagnostics))

    def snapshot(self) -> list[tuple[Workspace, str, mdsource.Note]]:
        """Live, bounded cross-workspace identity inventory (caller holds ``lock``)."""
        return self._snapshot()

    @staticmethod
    def _unique(snapshot, ws: Workspace, path: str, note: mdsource.Note) -> None:
        if note.ticket_id and snapshot.identities[note.ticket_id] != 1:
            raise ApiError(409, "duplicate_id", "this ticket ID is used by more than one note")

    def _journal_path(self, ws: Workspace, status: str):
        return self.journal_dir / f"{ws.uid}-{status}.json"

    def _not_maintaining(self, ws: Workspace, status: str) -> None:
        if self._journal_path(ws, status).exists():
            raise ApiError(409, "maintenance_pending", "resume this column rebalance before moving tickets")

    def maintenance(self, ws: Workspace) -> list[str]:
        return [s for s in STATUSES if self._journal_path(ws, s).exists()]

    def _finish(self, ws: Workspace, path: str, data: bytes, expected: str | None, *, validate=None) -> dict:
        def validate_scope() -> None:
            current = self._require(ws)
            if current.uid != ws.uid:
                raise ApiError(409, "workspace_changed", "the workspace registration changed; reopen it before writing")
            if validate is not None:
                validate()

        # Validate before even creating parent directories, and once more
        # immediately before publishing the staged file.
        validate_scope()
        result = _write(ws, path, data, expected, validate=validate_scope)
        note = mdsource.parse_note(path, data)
        result.update(id=note.ticket_id, status=note.status, order=note.order)
        self.index.request(ws, manual=True)
        return result

    def create(self, ws: Workspace, body: dict) -> dict:
        with self.lock:
            ws = self._require(ws)
            path = body.get("path")
            _path(path)
            title, description = body.get("title"), body.get("body", "")
            status = body.get("status", "backlog")
            if not isinstance(title, str) or not title.strip() or len(title) > 200 or any(ord(c) < 32 for c in title):
                raise ApiError(400, "bad_title", "title must be a nonempty single line of at most 200 characters")
            if not isinstance(description, str) or status not in STATUSES:
                raise ApiError(400, "bad_ticket", "invalid description or status")
            self._not_maintaining(ws, status)
            snapshot = self._snapshot()
            rank = self._append_rank(snapshot, ws, status)
            try:
                data = f"# {title.strip()}\n\n{description}".encode()
            except UnicodeEncodeError:
                raise ApiError(400, "bad_content", "ticket content must be valid Unicode") from None
            data = promote_bytes(path, data, str(uuid.uuid4()), rank, status)
            return self._finish(ws, path, data, None)

    def _append_rank(self, snapshot, ws: Workspace, status: str) -> str:
        column = [(p, n) for w, p, n in snapshot if w.uid == ws.uid and n.ticket and n.status == status]
        for path, note in column:
            if note.diagnostics:
                raise ApiError(409, "invalid_metadata", "repair destination column metadata before adding a ticket")
            self._unique(snapshot, ws, path, note)
        return between(max(n.order for _, n in column) if column else None)

    def promote(self, ws: Workspace, body: dict) -> dict:
        with self.lock:
            ws = self._require(ws)
            path = body.get("path")
            data = read_note(ws, path)
            _check_hash(data, body.get("expectedHash"))
            self._not_maintaining(ws, "backlog")
            snapshot = self._snapshot()
            uid = str(uuid.uuid4())
            result = promote_bytes(path, data, uid, self._append_rank(snapshot, ws, "backlog"))
            return self._finish(ws, path, result, digest(data))

    def demote(self, ws: Workspace, body: dict) -> dict:
        """Remove only ticket properties, keeping the note and body intact."""
        with self.lock:
            ws = self._require(ws)
            path = body.get("path")
            data = read_note(ws, path)
            _check_hash(data, body.get("expectedHash"))
            source, note = _source(path, data, body.get("expectedHash"))
            if not note.ticket:
                raise ApiError(409, "not_ticket", "note is not a ticket")
            self._not_maintaining(ws, note.status)
            self._unique(self._snapshot(), ws, path, note)
            if source.flow_mapping:
                raise ApiError(409, "unsupported_yaml", "removing ticket properties requires block frontmatter")
            spans = []
            for key, node in source.fields.items():
                if key not in ("id", "type", "status", "order"):
                    continue
                line = source.position(source.yaml_start + node.start_mark.index)[0]
                end_line = source.position(source.yaml_start + node.end_mark.index)[0]
                if line != end_line or not re.match(rf"{key}[ \t]*:", source.lines[line]):
                    raise ApiError(409, "unsupported_scalar", "ticket properties must occupy their own lines")
                spans.append((source.byte_starts[line], source.byte_starts[line + 1]))
            for start, end in sorted(spans, reverse=True):
                data = data[:start] + data[end:]
            return self._finish(ws, path, data, body["expectedHash"])

    def move(self, ws: Workspace, body: dict) -> dict:
        with self.lock:
            ws = self._require(ws)
            path, status = body.get("path"), body.get("status")
            if status not in STATUSES:
                raise ApiError(400, "bad_status", "unsupported status")
            data = read_note(ws, path)
            _check_hash(data, body.get("expectedHash"))
            _, note = _source(path, data, body.get("expectedHash"))
            if not note.ticket:
                raise ApiError(409, "not_ticket", "note is not a ticket")
            self._not_maintaining(ws, status)
            self._not_maintaining(ws, note.status)
            snapshot = self._snapshot()
            self._unique(snapshot, ws, path, note)
            column = sorted(
                [
                    (p, n)
                    for w, p, n in snapshot
                    if w.uid == ws.uid and p != path and n.ticket and n.status == status
                ],
                key=lambda item: (item[1].order or "", item[1].ticket_id or "", item[0]),
            )
            if any(n.diagnostics for _, n in column):
                raise ApiError(409, "invalid_metadata", "repair destination column ticket metadata before moving")
            lower, upper = body.get("before"), body.get("after")
            if lower is None and upper is None:
                rank = between(column[-1][1].order if column else None)
            else:
                positions = []
                for ref, fallback in ((lower, -1), (upper, len(column))):
                    if ref is None:
                        positions.append(fallback)
                        continue
                    if not isinstance(ref, dict):
                        raise ApiError(400, "bad_neighbor", "destination neighbor must contain path and hash")
                    at = next((i for i, (p, _) in enumerate(column) if p == ref.get("path")), None)
                    if at is None or column[at][1].hash != ref.get("hash"):
                        raise ApiError(409, "conflict", "destination neighbor changed; refresh before moving")
                    self._unique(snapshot, ws, column[at][0], column[at][1])
                    positions.append(at)
                if positions[1] != positions[0] + 1:
                    raise ApiError(409, "conflict", "destination neighbors are no longer adjacent")
                rank = between(
                    column[positions[0]][1].order if positions[0] >= 0 else None,
                    column[positions[1]][1].order if positions[1] < len(column) else None,
                )
            references = [(p, n.hash) for p, n in column]

            def check_neighbors():
                for neighbor_path, neighbor_hash in references:
                    _check_hash(read_note(ws, neighbor_path), neighbor_hash)

            changed = patch_scalar(path, data, "status", status)
            changed = patch_scalar(path, changed, "order", rank)
            return self._finish(ws, path, changed, digest(data), validate=check_neighbors)

    def toggle(self, ws: Workspace, body: dict) -> dict:
        with self.lock:
            ws = self._require(ws)
            path = body.get("path")
            data = read_note(ws, path)
            _check_hash(data, body.get("expectedHash"))
            _, note = _source(path, data, body.get("expectedHash"))
            checked = body.get("checked")
            if not isinstance(checked, bool):
                raise ApiError(400, "bad_checked", "checked must be a boolean")
            coords = tuple(body.get(k) for k in ("markerStart", "line", "column"))
            if any(not isinstance(v, int) or isinstance(v, bool) for v in coords):
                raise ApiError(400, "bad_location", "checkbox byte offset, line and column are required")
            todo = next((t for t in note.todos if (t.marker_start, t.line, t.column) == coords), None)
            if todo is None:
                raise ApiError(409, "stale_location", "this source no longer identifies a checkbox")
            if note.ticket:
                self._not_maintaining(ws, note.status)
                snapshot = self._snapshot()
                self._unique(snapshot, ws, path, note)
            if todo.checked == checked:
                return {"path": path, "hash": digest(data)}
            at = todo.marker_start + 1
            changed = data[:at] + (b"x" if checked else b" ") + data[at + 1 :]
            return self._finish(ws, path, changed, digest(data))

    def _save_journal(self, path, journal: dict) -> None:
        self.journal_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
        temporary = path.with_suffix(".tmp")
        with temporary.open("w", encoding="utf-8") as stream:
            json.dump(journal, stream)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        fd = os.open(self.journal_dir, os.O_RDONLY | os.O_DIRECTORY)
        try:
            _fsync(fd)
        finally:
            os.close(fd)

    def rebalance(self, ws: Workspace, body: dict) -> dict:
        """Resume one durable column plan; never roll back an intervening user edit."""
        with self.lock:
            ws = self._require(ws)
            status = body.get("status")
            if status not in STATUSES:
                raise ApiError(400, "bad_status", "unsupported status")
            if not isinstance(body.get("reconcile", False), bool):
                raise ApiError(400, "bad_reconcile", "reconcile must be true or false")
            path = self._journal_path(ws, status)
            snapshot = self._snapshot()
            if path.exists():
                journal = json.loads(path.read_text(encoding="utf-8"))
            else:
                column = sorted(
                    [(p, n) for w, p, n in snapshot if w.uid == ws.uid and n.ticket and n.status == status],
                    key=lambda item: (item[1].order or "", item[1].ticket_id or "", item[0]),
                )
                steps = []
                for i, (p, note) in enumerate(column):
                    data = read_note(ws, p)
                    _check_hash(data, note.hash)
                    _source(p, data)
                    self._unique(snapshot, ws, p, note)
                    rank = f"{(MAX_RANK // (len(column) + 1)) * (i + 1):032x}"
                    result = patch_scalar(p, data, "order", rank)
                    steps.append(
                        {
                            "path": p,
                            "before": digest(data),
                            "after": digest(result),
                            "rank": rank,
                            "id": note.ticket_id,
                            "done": False,
                        }
                    )
                journal = {"workspace": ws.uid, "status": status, "steps": steps}
                self._save_journal(path, journal)
            # Filenames can change while the process is down; the journal's
            # stable identity is the recovery reference. Resolve all steps
            # before continuing so an ambiguous/missing ticket cannot cause
            # another partial pass at stale paths.
            current_paths = {
                note.ticket_id: (current_path, note)
                for owner, current_path, note in snapshot
                if owner.uid == ws.uid and note.ticket_id
            }
            renamed = False
            for step in journal["steps"]:
                if snapshot.identities[step["id"]] > 1:
                    raise ApiError(409, "duplicate_id", "a maintenance ticket ID is used by more than one note")
                target = current_paths.get(step["id"])
                if target is None:
                    raise ApiError(409, "maintenance_ticket_missing", "a maintenance ticket is missing; restore its identity before resuming")
                current_path, note = target
                if note.status != status:
                    raise ApiError(409, "conflict", "ticket changed column during maintenance; repair before resuming")
                if step["path"] != current_path:
                    step["path"] = current_path
                    renamed = True
            if renamed:
                self._save_journal(path, journal)
            for step in journal["steps"]:
                data = read_note(ws, step["path"])
                current = digest(data)
                _, note = _source(step["path"], data)
                self._unique(snapshot, ws, step["path"], note)
                if note.ticket_id != step["id"] or note.status != status:
                    raise ApiError(409, "conflict", "ticket changed during maintenance; repair before resuming")
                if current != step["after"]:
                    if current != step["before"]:
                        if body.get("reconcile") is not True:
                            raise ApiError(409, "conflict", "external edit stopped rebalance; file was not overwritten")
                        # The owner explicitly chose to keep the latest note
                        # contents. Rebase only this scalar patch, retaining
                        # the journal's intended identity and column order.
                        step["before"] = current
                        step["after"] = digest(patch_scalar(step["path"], data, "order", step["rank"]))
                        self._save_journal(path, journal)
                    changed = patch_scalar(step["path"], data, "order", step["rank"])
                    _write(ws, step["path"], changed, current)
                step["done"] = True
                self._save_journal(path, journal)
            for step in journal["steps"]:
                _check_hash(read_note(ws, step["path"]), step["after"])
            path.unlink()
            fd = os.open(self.journal_dir, os.O_RDONLY | os.O_DIRECTORY)
            try:
                _fsync(fd)
            finally:
                os.close(fd)
            self.index.request(ws, manual=True)
            return {"ok": True, "status": status, "updated": len(journal["steps"])}
