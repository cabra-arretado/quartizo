"""The default board and the syntax of stable Markdown status IDs."""
from __future__ import annotations

import re
from dataclasses import dataclass

_STATUS_ID = re.compile(r"[a-z][a-z0-9_]{0,31}")
_COLOR = re.compile(r"#[0-9a-fA-F]{6}")


@dataclass(frozen=True)
class Column:
    id: str
    label: str
    color: str | None = None

    def to_json(self) -> dict[str, str]:
        data = {"id": self.id, "label": self.label}
        if self.color is not None:
            data["color"] = self.color
        return data


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


def valid_column_color(value: object) -> bool:
    return isinstance(value, str) and bool(_COLOR.fullmatch(value))
