"""Quartizo's registry database (stdlib ``sqlite3``).

It holds the workspace registry (which roots the owner opted in) and, since
migration 6, the Kiro Notes companion switch plus its derived, rebuildable
Markdown index. Note content always lives in the Markdown files themselves.

Migrations 3-5 created the tables of features Quartizo no longer has (database
tasks, Git repos, created chat sessions). Nothing reads them any more; they are
kept rather than dropped so an upgrade never deletes data. A workspace's old
tasks still go with it when it is removed (FK cascade).

Schema changes are numbered entries in ``MIGRATIONS``; each is applied once, in
order, inside one transaction, and recorded in ``schema_migrations``. Never edit
an applied entry: append a new one.
"""
from __future__ import annotations

import secrets
import sqlite3
import threading
import time
from collections.abc import Iterator
from contextlib import contextmanager
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
    # 3: Kanban tasks (QTZ-008). `project_id` is the owning workspace's `uid`;
    # deleting the workspace row cascades to its tasks (Registry.unregister
    # refuses that unless the caller explicitly asked to delete them). A later
    # migration that rebuilds `workspaces` must therefore turn foreign keys off
    # first, or the DROP TABLE would cascade. `sort_order` is a dense 0..n-1
    # index inside one (project, status) column, rewritten in the same
    # transaction as every move. `version` starts at 1 and is bumped by every
    # write to that task (the optimistic-concurrency token for update/move).
    """
    CREATE TABLE tasks (
        id                   INTEGER PRIMARY KEY AUTOINCREMENT,
        uid                  TEXT    NOT NULL UNIQUE,
        project_id           TEXT    NOT NULL REFERENCES workspaces(uid) ON DELETE CASCADE,
        title                TEXT    NOT NULL,
        description_markdown TEXT    NOT NULL DEFAULT '',
        status               TEXT    NOT NULL
            CHECK (status IN ('backlog', 'ready', 'in_progress', 'review', 'done')),
        sort_order           INTEGER NOT NULL,
        version              INTEGER NOT NULL DEFAULT 1,
        note_ref             TEXT,
        slot_id              TEXT,
        created_at           INTEGER NOT NULL,
        updated_at           INTEGER NOT NULL
    );
    CREATE INDEX tasks_board ON tasks (project_id, status, sort_order);
    """,
    # 4: Git repository roots (QTZ-010), registered separately from notes
    # workspaces. Same id/uid scheme as workspaces. `path` is the realpath of
    # the work tree top level at registration time. No FK to workspaces: a repo
    # may contain, or sit inside, a notes workspace (see docs/architecture.md).
    """
    CREATE TABLE repos (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        uid        TEXT    NOT NULL UNIQUE,
        name       TEXT    NOT NULL,
        path       TEXT    NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
    );
    """,
    # 5: session keys Quartizo itself created (M5 review). The Agents tab calls a
    # session Quartizo's only if its key is here; a name pattern alone proves
    # nothing. `workspace_uid` is set for workspace chats. No FK: the record
    # outlives an unregistered workspace.
    """
    CREATE TABLE created_slots (
        key           TEXT PRIMARY KEY,
        workspace_uid TEXT,
        created_at    INTEGER NOT NULL
    );
    """,
    # 6: Kiro Notes companion (read-only Board and TODOs over Markdown files).
    # `workspaces.companion` is application state: the owner's explicit switch
    # that makes Quartizo read-only in that folder and indexes it. The three
    # companion_* tables are a DERIVED index: the files are authoritative, and
    # dropping every companion_* row loses nothing a rescan cannot rebuild. A
    # scan writes a new `generation` beside the active one and swaps
    # companion_index.generation only once it finished (companion.py). Deleting
    # the workspace row cascades to its index rows.
    """
    ALTER TABLE workspaces ADD COLUMN companion INTEGER NOT NULL DEFAULT 0;
    CREATE TABLE companion_generations (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_uid TEXT    NOT NULL REFERENCES workspaces(uid) ON DELETE CASCADE,
        started_at    INTEGER NOT NULL
    );
    CREATE TABLE companion_index (
        workspace_uid TEXT    PRIMARY KEY REFERENCES workspaces(uid) ON DELETE CASCADE,
        generation    INTEGER,
        version       INTEGER NOT NULL,
        started_at    INTEGER,
        completed_at  INTEGER,
        complete      INTEGER NOT NULL DEFAULT 0,
        files         INTEGER NOT NULL DEFAULT 0,
        retained      INTEGER NOT NULL DEFAULT 0,
        error_code    TEXT,
        error         TEXT,
        failed_at     INTEGER
    );
    CREATE TABLE companion_notes (
        workspace_uid TEXT    NOT NULL REFERENCES workspaces(uid) ON DELETE CASCADE,
        generation    INTEGER NOT NULL,
        path          TEXT    NOT NULL,
        hash          TEXT,
        size          INTEGER,
        mtime_ms      INTEGER,
        title         TEXT    NOT NULL,
        ticket        INTEGER NOT NULL,
        ticket_id     TEXT,
        status        TEXT,
        sort_key      TEXT,
        diagnostics   TEXT    NOT NULL,
        retained      INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (workspace_uid, generation, path)
    );
    CREATE TABLE companion_todos (
        workspace_uid TEXT    NOT NULL REFERENCES workspaces(uid) ON DELETE CASCADE,
        generation    INTEGER NOT NULL,
        path          TEXT    NOT NULL,
        ordinal       INTEGER NOT NULL,
        marker_start  INTEGER NOT NULL,
        line          INTEGER NOT NULL,
        col           INTEGER NOT NULL,
        checked       INTEGER NOT NULL,
        text          TEXT    NOT NULL,
        depth         INTEGER NOT NULL,
        heading       TEXT,
        PRIMARY KEY (workspace_uid, generation, path, ordinal)
    );
    """,
)


_migrated: set[str] = set()
_migrate_lock = threading.Lock()


def connect(path: Path) -> sqlite3.Connection:
    """Open (creating if needed) the DB, migrating it once per process and path.

    One connection per call site.
    """
    conn = sqlite3.connect(path, timeout=10, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    key = str(path)
    if key not in _migrated:
        with _migrate_lock:
            if key not in _migrated:
                try:
                    migrate(conn)
                except BaseException:
                    conn.close()
                    raise
                _migrated.add(key)
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
    return conn.execute("SELECT id, uid, name, path, companion, created_at FROM workspaces ORDER BY name, id").fetchall()


def get_workspace(conn: sqlite3.Connection, workspace_id: int) -> sqlite3.Row | None:
    return conn.execute("SELECT id, uid, name, path, companion, created_at FROM workspaces WHERE id = ?",
                        (workspace_id,)).fetchone()


def set_companion(conn: sqlite3.Connection, workspace_id: int, enabled: bool) -> bool:
    return conn.execute("UPDATE workspaces SET companion = ? WHERE id = ?",
                        (1 if enabled else 0, workspace_id)).rowcount > 0


def new_uid() -> str:
    return secrets.token_hex(16)


def insert_workspace(conn: sqlite3.Connection, name: str, path: str, companion: bool = False) -> tuple[int, str]:
    uid = new_uid()
    cur = conn.execute("INSERT INTO workspaces (uid, name, path, created_at, companion) VALUES (?, ?, ?, ?, ?)",
                       (uid, name, path, int(time.time()), 1 if companion else 0))
    return int(cur.lastrowid), uid


def old_task_counts(conn: sqlite3.Connection) -> dict[int, int]:
    """Tasks left from the removed database board, per workspace id (only workspaces that have some)."""
    return {r[0]: r[1] for r in conn.execute(
        "SELECT w.id, COUNT(*) FROM tasks JOIN workspaces w ON w.uid = tasks.project_id GROUP BY w.id")}


def delete_workspace(conn: sqlite3.Connection, workspace_id: int) -> bool:
    return conn.execute("DELETE FROM workspaces WHERE id = ?", (workspace_id,)).rowcount > 0


@contextmanager
def transaction(conn: sqlite3.Connection, *, write: bool = True) -> Iterator[sqlite3.Connection]:
    """``BEGIN IMMEDIATE`` .. ``COMMIT``; rolls back on any exception.

    IMMEDIATE takes the write lock up front, so a read-check-write sequence
    inside (version check, reindex) cannot interleave with another writer.
    ``write=False`` uses a plain ``BEGIN`` (a consistent read snapshot, no lock).
    """
    conn.execute("BEGIN IMMEDIATE" if write else "BEGIN")
    try:
        yield conn
        conn.execute("COMMIT")
    except BaseException:
        conn.execute("ROLLBACK")
        raise
