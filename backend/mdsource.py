"""Read-only parsing of one Markdown note: ticket properties, title and checkboxes.

A port of the read half of the phase 1 spike (``spikes/markdown_tickets/source.py``);
the contracts are in docs/markdown-tickets-phase1.md. Nothing here writes or
patches bytes: this delivery only indexes. YAML nodes, never a reserialized
document, are inspected. Checkboxes and their headings follow native Kiro
Notes' line rules (``_todos``), so Quartizo lists exactly the checkboxes Kiro
Notes shows; no Markdown parser is involved.

Every problem becomes a ``Diagnostic`` on the note rather than an exception,
so a damaged note stays visible.
"""
from __future__ import annotations

import hashlib
import re
from bisect import bisect_right
from dataclasses import dataclass, field

import vendored

vendored.activate()

from ruamel.yaml import YAML  # noqa: E402
from ruamel.yaml.error import YAMLError  # noqa: E402
from ruamel.yaml.events import AliasEvent, MappingEndEvent, MappingStartEvent, SequenceEndEvent, SequenceStartEvent  # noqa: E402
from ruamel.yaml.nodes import MappingNode, ScalarNode, SequenceNode  # noqa: E402

STATUSES = ("backlog", "ready", "in_progress", "review", "done")
MAX_FILE_BYTES = 2 * 1024 * 1024
MAX_FRONTMATTER_BYTES = 64 * 1024
MAX_YAML_EVENTS = 8192
MAX_YAML_DEPTH = 64
MAX_TODOS_PER_NOTE = 2000
MAX_LABEL_CHARS = 500
MIN_RANK, MAX_RANK = 0, (1 << 128) - 1

_STRING_TAG = "tag:yaml.org,2002:str"
_SAFE_TAGS = frozenset({"str", "int", "float", "bool", "null", "timestamp", "binary", "map", "seq"})
_TICKET_ID = re.compile(r"(?:[0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})")
_RANK = re.compile(r"[0-9a-f]{32}")
# Native Kiro Notes' rules (kirocrew 0.10.0rc4, md-notebook utils.ts and Preview.tsx), as JavaScript
# reads them: JS ``\s`` also matches U+FEFF and ``.`` stops at ``\r``, so a CRLF line is never a checkbox.
_JS_SPACE = "[\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]"
_JS_DOT = "[^\n\r\u2028\u2029]"
_KIRO_FRONTMATTER = re.compile(r"---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|\Z)")  # FM_RE
_KIRO_LIST = re.compile(rf"({_JS_SPACE}*)(- \[[ x]\] |[-*] |(\d+)\. )")  # LIST_MARKER_RE
_KIRO_CHECKBOX = re.compile(rf"({_JS_SPACE}*)- \[( |x)\] ({_JS_DOT}*)\Z")
_KIRO_HEADING = re.compile(rf"(#{{1,6}}) ({_JS_DOT}*)\Z")
_TAB_STOP = 4
_DELIMITER = re.compile(r"---[ \t]*$")
# Unparseable metadata can still say it is a ticket; such a note goes to the
# board's repair lane instead of disappearing.
_TYPE_TICKET_LINE = re.compile(r"""^type[ \t]*:[ \t]*(["']?)ticket\1[ \t]*(?:#.*)?$""", re.MULTILINE)


@dataclass(frozen=True)
class Diagnostic:
    code: str
    message: str


@dataclass(frozen=True)
class Todo:
    marker_start: int  # zero-based UTF-8 byte offset of '[' in the file
    line: int  # one-based physical line
    column: int  # one-based Unicode code-point column of '['
    checked: bool
    text: str  # raw inline Markdown label, trimmed and bounded
    depth: int  # 0 for a top-level list item
    heading: str | None  # nearest preceding top-level heading


@dataclass
class Note:
    hash: str
    size: int
    title: str
    # True when `type: ticket` was read, or claimed by unparseable metadata.
    ticket: bool = False
    ticket_id: str | None = None
    status: str | None = None
    order: str | None = None
    diagnostics: list[Diagnostic] = field(default_factory=list)
    todos: list[Todo] = field(default_factory=list)

    def diagnose(self, code: str, message: str) -> None:
        if not any(d.code == code for d in self.diagnostics):
            self.diagnostics.append(Diagnostic(code, message))


class _Refused(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def valid_rank(rank: object) -> bool:
    return isinstance(rank, str) and bool(_RANK.fullmatch(rank)) and MIN_RANK < int(rank, 16) < MAX_RANK


def _indent_columns(indent: str) -> int:
    """Kiro Notes' indentPx in columns: tabs expand to the next tab stop."""
    col = 0
    for ch in indent:
        col = col + _TAB_STOP - col % _TAB_STOP if ch == "\t" else col + 1
    return col


def _stem(path: str) -> str:
    name = path.rsplit("/", 1)[-1]
    return name[:-3] if name.endswith(".md") else name


class _Source:
    def __init__(self, data: bytes, text: str, note: Note):
        self.data, self.text, self.note = data, text, note
        self.lines = re.findall(r"[^\r\n]*(?:\r\n|\r|\n|$)", text)
        if self.lines[-1:] == [""]:
            self.lines.pop()
        self.char_starts, self.byte_starts = [0], [0]
        for line in self.lines:
            self.char_starts.append(self.char_starts[-1] + len(line))
            self.byte_starts.append(self.byte_starts[-1] + len(line.encode("utf-8")))
        if len(set(re.findall(r"\r\n|\r|\n", text))) > 1:
            note.diagnose("mixed_endings", "mixed line endings")
        self.body_line = 0
        self.body_start = 1 if text.startswith("﻿") else 0
        self.fields: dict[str, object] = {}
        self._frontmatter()

    def byte_offset(self, char_offset: int) -> int:
        line = bisect_right(self.char_starts, char_offset) - 1
        if line == len(self.lines):
            return len(self.data)
        return self.byte_starts[line] + len(self.lines[line][:char_offset - self.char_starts[line]].encode("utf-8"))

    def _frontmatter(self) -> None:
        if not self.lines or not _DELIMITER.fullmatch(self.lines[0].lstrip("﻿").rstrip("\r\n")):
            return
        yaml_start, yaml_end = self.char_starts[1], None
        for index, line in enumerate(self.lines[1:], 1):
            if _DELIMITER.fullmatch(line.rstrip("\r\n")):
                yaml_end = self.char_starts[index]
                self.body_line = index + 1
                self.body_start = self.char_starts[index + 1]
                break
        if yaml_end is None:
            # Unclosed: nothing after the opening delimiter is body, so it yields no TODOs.
            self.body_line, self.body_start = len(self.lines), len(self.text)
            self.note.diagnose("unclosed_frontmatter", "frontmatter has no closing --- delimiter")
            self._claimed_ticket(self.text[yaml_start:])
            return
        raw = self.text[yaml_start:yaml_end]
        if len(raw.encode("utf-8")) > MAX_FRONTMATTER_BYTES:
            self.note.diagnose("metadata_too_large", "frontmatter exceeds 64 KiB")
            self._claimed_ticket(raw)
            return
        try:
            depth = 0
            for count, event in enumerate(YAML(typ="safe", pure=True).parse(raw), 1):
                if count > MAX_YAML_EVENTS:
                    raise _Refused("yaml_limit", "frontmatter contains too many YAML events")
                if isinstance(event, AliasEvent) or getattr(event, "anchor", None) is not None:
                    raise _Refused("yaml_reference", "YAML anchors and aliases need repair before Quartizo can use this metadata")
                if isinstance(event, (MappingStartEvent, SequenceStartEvent)):
                    depth += 1
                    if depth > MAX_YAML_DEPTH:
                        raise _Refused("yaml_limit", "frontmatter nesting exceeds 64 levels")
                elif isinstance(event, (MappingEndEvent, SequenceEndEvent)):
                    depth -= 1
            node = YAML(typ="safe", pure=True).compose(raw)
            if node is None:
                return
            self._validate_yaml(node)
            if not isinstance(node, MappingNode):
                raise _Refused("metadata_not_mapping", "frontmatter must be a YAML mapping")
            self.fields = {key.value: value for key, value in node.value}
        except _Refused as err:
            self.note.diagnose(err.code, str(err))
            self._claimed_ticket(raw)
        except (YAMLError, RecursionError):
            self.note.diagnose("invalid_yaml", "frontmatter is not unambiguous, valid YAML")
            self._claimed_ticket(raw)

    def _claimed_ticket(self, raw: str) -> None:
        if _TYPE_TICKET_LINE.search(raw):
            self.note.ticket = True

    def _validate_yaml(self, node) -> None:
        if not node.tag.startswith("tag:yaml.org,2002:") or node.tag.rsplit(":", 1)[-1] not in _SAFE_TAGS:
            raise _Refused("unsupported_yaml", "custom tags, merge keys and special YAML types are not supported")
        if isinstance(node, MappingNode):
            seen: set[str] = set()
            for key, value in node.value:
                if not isinstance(key, ScalarNode) or key.tag != _STRING_TAG:
                    raise _Refused("unsupported_yaml", "frontmatter keys must be strings; merge keys are not supported")
                if key.value in seen:
                    raise _Refused("duplicate_yaml_key", "frontmatter contains a duplicate property")
                seen.add(key.value)
                self._validate_yaml(value)
        elif isinstance(node, SequenceNode):
            for child in node.value:
                self._validate_yaml(child)

    def field(self, key: str) -> str | None:
        node = self.fields.get(key)
        return node.value if isinstance(node, ScalarNode) and node.tag == _STRING_TAG else None

    def position(self, char_offset: int) -> tuple[int, int]:
        """Zero-based physical line and column of a character offset."""
        line = bisect_right(self.char_starts, char_offset) - 1
        return line, char_offset - self.char_starts[line]


def _ticket_fields(source: _Source, note: Note) -> None:
    if source.field("type") != "ticket":
        return
    note.ticket = True
    note.ticket_id, note.status, note.order = (source.field(key) for key in ("id", "status", "order"))
    if note.ticket_id is None or not _TICKET_ID.fullmatch(note.ticket_id):
        note.diagnose("invalid_id", "ticket requires a UUID or a preserved 32-hex legacy UID")
        note.ticket_id = None
    if note.status not in STATUSES:
        note.diagnose("invalid_status", "ticket status is missing or unsupported")
        note.status = None
    if not valid_rank(note.order):
        note.diagnose("invalid_order", "ticket order is missing or invalid")
        note.order = None


def _todos(source: _Source, note: Note) -> None:
    """Checkboxes exactly as native Kiro Notes renders them, so both show the same TODOs.

    Like Kiro Notes: drop a frontmatter block that starts the file, split the
    rest on ``\\n``, skip ```` ``` ```` fences, and take ``- [ ] text`` /
    ``- [x] text`` lines at any indentation. ``*``/``+``/numbered items,
    ``[X]``, quoted items, ``~~~`` fences and CRLF lines are not checkboxes
    there, while an indented line is one. Depth follows its list rails: any
    line that is not a list item ends the list.
    """
    text = source.text
    frontmatter = _KIRO_FRONTMATTER.match(text)
    offset = frontmatter.end() if frontmatter else 0
    fenced, heading, indents = False, None, []
    for raw in text[offset:].split("\n"):
        start, offset = offset, offset + len(raw) + 1
        if not _KIRO_LIST.match(raw):
            indents = []
        if raw.startswith("```"):
            fenced = not fenced
            continue
        if fenced:
            continue
        head = _KIRO_HEADING.match(raw)
        if head:
            heading = head[2].strip() or None
            continue
        match = _KIRO_CHECKBOX.match(raw)
        if not match:
            continue
        if len(note.todos) >= MAX_TODOS_PER_NOTE:
            note.diagnose("todo_limit", f"only the first {MAX_TODOS_PER_NOTE} checkboxes are indexed")
            return
        indent = _indent_columns(match[1])
        while indents and indents[-1] >= indent:
            indents.pop()
        depth = len(indents)
        indents.append(indent)
        marker = start + len(match[1]) + 2  # the '[' after "- "
        line, column = source.position(marker)
        note.todos.append(Todo(source.byte_offset(marker), line + 1, column + 1, match[2] == "x",
                               match[3].strip()[:MAX_LABEL_CHARS], depth, heading))


def _title(source: _Source) -> str | None:
    """The first ``# `` heading after Quartizo's own frontmatter reading, outside ``` fences."""
    fenced = False
    for raw in source.lines[source.body_line:]:
        line = raw.rstrip("\r\n").lstrip("\ufeff")
        if line.startswith("```"):
            fenced = not fenced
        elif not fenced and line.startswith("# "):
            return line[2:].strip().rstrip("#").strip() or None
    return None


def parse_note(path: str, data: bytes) -> Note:
    """Everything the index stores for one note. Never raises for bad content."""
    note = Note(hash=hashlib.sha256(data).hexdigest(), size=len(data), title=_stem(path))
    if len(data) > MAX_FILE_BYTES:
        note.diagnose("too_large", "note exceeds 2 MiB and is not indexed")
        return note
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        note.diagnose("not_utf8", "note is not valid UTF-8 and is not indexed")
        return note
    source = _Source(data, text, note)
    _ticket_fields(source, note)
    note.title = _title(source) or note.title
    _todos(source, note)
    return note
