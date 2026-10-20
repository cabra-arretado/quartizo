"""Quartizo's registry database (stdlib ``sqlite3``).

It holds registry/index data only: which workspace roots the owner opted in.
Note content always lives in the Markdown files themselves.

Schema changes are numbered entries in ``MIGRATIONS``; each is applied once, in
order, inside one transaction, and recorded in ``schema_migrations``. Never edit
an applied entry: append a new one.
"""
from __future__ import annotations

import secrets
import sqlite3
import time
from pathlib import Path

DB_FILENAME = "quartizo.sqlite3"

MIGRATIONS: tuple[str, ...] = (
    # 1: workspace roots. `path` is the realpath at registration time.
    """
    CREATE TABLE workspaces (
        id         INTEGER PRIMARY KEY,
        name       TEXT    NOT NULL,
        path       TEXT    NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
    );
    """,
    # 2: ids are never reused (AUTOINCREMENT), and every workspace gets a random
    # `uid` (32 hex chars). The UI keys per-workspace state (its chat session)
    # by `uid`, so a later workspace can never inherit an earlier one's state,
    # even if an id was reused before this migration. Table rebuild, since
    # SQLite cannot add AUTOINCREMENT in place.
    """
    CREATE TABLE workspaces_v2 (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        uid        TEXT    NOT NULL UNIQUE,
        name       TEXT    NOT NULL,
        path       TEXT    NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
    );
    INSERT INTO workspaces_v2 (id, uid, name, path, created_at)
        SELECT id, lower(hex(randomblob(16))), name, path, created_at FROM workspaces;
    DROP TABLE workspaces;
    ALTER TABLE workspaces_v2 RENAME TO workspaces;
    """,
)


def connect(path: Path) -> sqlite3.Connection:
    """Open (creating if needed) and migrate the DB. One connection per call site."""
    conn = sqlite3.connect(path, timeout=10, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    migrate(conn)
    return conn


def migrate(conn: sqlite3.Connection) -> int:
    """Apply pending migrations; returns the resulting schema version."""
    conn.execute("BEGIN IMMEDIATE")
    try:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS schema_migrations ("
            " version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)"
        )
        current = conn.execute("SELECT COALESCE(MAX(version), 0) FROM schema_migrations").fetchone()[0]
        for version, sql in enumerate(MIGRATIONS, start=1):
            if version <= current:
                continue
            for statement in filter(str.strip, sql.split(";")):
                conn.execute(statement)
            conn.execute("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
                         (version, int(time.time())))
        conn.execute("COMMIT")
    except BaseException:
        conn.execute("ROLLBACK")
        raise
    return len(MIGRATIONS)


def list_workspaces(conn: sqlite3.Connection) -> list[sqlite3.Row]:
    return conn.execute("SELECT id, uid, name, path, created_at FROM workspaces ORDER BY name, id").fetchall()


def get_workspace(conn: sqlite3.Connection, workspace_id: int) -> sqlite3.Row | None:
    return conn.execute("SELECT id, uid, name, path, created_at FROM workspaces WHERE id = ?",
                        (workspace_id,)).fetchone()


def new_uid() -> str:
    return secrets.token_hex(16)


def insert_workspace(conn: sqlite3.Connection, name: str, path: str) -> tuple[int, str]:
    uid = new_uid()
    cur = conn.execute("INSERT INTO workspaces (uid, name, path, created_at) VALUES (?, ?, ?, ?)",
                       (uid, name, path, int(time.time())))
    return int(cur.lastrowid), uid


def delete_workspace(conn: sqlite3.Connection, workspace_id: int) -> bool:
    return conn.execute("DELETE FROM workspaces WHERE id = ?", (workspace_id,)).rowcount > 0
