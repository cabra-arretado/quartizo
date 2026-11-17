"""Durable presentation preferences for one signed owner."""
from __future__ import annotations

import json
import re
import sqlite3
from contextlib import closing
from pathlib import Path

import db
from workspace import ApiError

MAX_PREFERENCES_BYTES = 64 << 10
_MAX_DEPTH = 8
_KEY = re.compile(r"[A-Za-z][A-Za-z0-9]{0,63}")
_MAP_FIELDS = ("noteFolders", "folderAppearance", "laneSort")


def _read(conn: sqlite3.Connection, owner_id: str) -> dict:
    row = conn.execute("SELECT data FROM preferences WHERE owner_id = ?", (owner_id,)).fetchone()
    return json.loads(row["data"]) if row is not None else {}


def read(path: Path, owner_id: str) -> dict:
    with closing(db.connect(path)) as conn:
        return _read(conn, owner_id)


def _check_depth(value: object, depth: int = 0) -> None:
    if not isinstance(value, (dict, list)):
        return
    if depth >= _MAX_DEPTH:
        raise ApiError(400, "bad_preferences", "preferences are nested too deeply")
    for item in value.values() if isinstance(value, dict) else value:
        _check_depth(item, depth + 1)


def _encode(values: dict) -> str:
    try:
        data = json.dumps(values, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
        size = len(data.encode("utf-8"))
    except (UnicodeError, ValueError):
        raise ApiError(400, "bad_preferences", "preferences must use valid Unicode and finite numbers") from None
    if size > MAX_PREFERENCES_BYTES:
        raise ApiError(413, "preferences_too_large", "saved preferences exceed the size limit")
    return data


def update(path: Path, owner_id: str, body: dict) -> dict:
    changes = body.get("changes")
    only_if_missing = body.get("onlyIfMissing", False)
    if (not isinstance(only_if_missing, bool) or not isinstance(changes, dict)
            or any(not _KEY.fullmatch(key) for key in changes)
            or body.keys() - {"changes", "onlyIfMissing"}):
        raise ApiError(400, "bad_preferences", "provide an object of named preference changes and an optional boolean onlyIfMissing")
    _check_depth(changes)
    _encode(changes)
    if any(key in changes and not isinstance(changes[key], dict) for key in _MAP_FIELDS):
        raise ApiError(400, "bad_preferences", "folder and column preferences must be objects")
    with closing(db.connect(path)) as conn, db.transaction(conn):
        current = _read(conn, owner_id)
        updated = {**changes, **current} if only_if_missing else {**current, **changes}
        if not only_if_missing:
            # Each folder or column has independent preferences. Preserve entries
            # changed by another browser since this client loaded its settings.
            for key in _MAP_FIELDS:
                if key in changes and isinstance(current.get(key), dict):
                    updated[key] = {**current[key], **changes[key]}
        if changes and (not only_if_missing or changes.keys() - current.keys()):
            conn.execute(
                "INSERT INTO preferences (owner_id, data) VALUES (?, ?) "
                "ON CONFLICT(owner_id) DO UPDATE SET data = excluded.data",
                (owner_id, _encode(updated)),
            )
        return updated
