"""The default board and the syntax of stable Markdown status IDs."""
from __future__ import annotations

import re
from dataclasses import dataclass

_STATUS_ID = re.compile(r"[a-z][a-z0-9_]{0,31}")


@dataclass(frozen=True)
class Column:
    id: str
    label: str


DEFAULT_COLUMNS = (
    Column("backlog", "Backlog"),
    Column("ready", "Ready"),
    Column("in_progress", "In Progress"),
    Column("review", "Review"),
    Column("done", "Done"),
)
DEFAULT_STATUSES = tuple(column.id for column in DEFAULT_COLUMNS)


def valid_status_id(value: object) -> bool:
    return isinstance(value, str) and value != "repair" and bool(_STATUS_ID.fullmatch(value))
