"""Read-only parsing of one Markdown note: ticket properties, title and checkboxes.

A port of the read half of the phase 1 spike (``spikes/markdown_tickets/source.py``);
the contracts are in docs/markdown-tickets-phase1.md. Nothing here writes or
patches bytes: this delivery only indexes. YAML nodes, never a reserialized
document, are inspected; Markdown block-parser positions (with the pinned
paragraph rule wrapped to keep the physical column) distinguish real list
checkboxes from examples in code, frontmatter or later paragraphs.

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

from markdown_it import MarkdownIt  # noqa: E402
from markdown_it.rules_block.paragraph import paragraph  # noqa: E402
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
_CHECKBOX = re.compile(r"^\[([ xX])\](?=[ \t\n]|$)")
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


def _inline_label(token) -> str:
    return "".join(" " if child.type in ("softbreak", "hardbreak") else child.content
                   for child in token.children or []
                   if child.type in ("text", "code_inline", "image", "softbreak", "hardbreak")).strip()


def _capture_paragraph(state, start_line, end_line, silent):
    # Lists and blockquotes adjust bMarks/tShift before calling the paragraph
    # rule. Capture that position before they restore the outer parser state.
    start = state.bMarks[start_line] + state.tShift[start_line]
    index = len(state.tokens)
    matched = paragraph(state, start_line, end_line, silent)
    if matched and not silent:
        for token in state.tokens[index:]:
            if token.type == "inline":
                token.meta["source_column"] = start - state.env["line_starts"][start_line]
    return matched


def _make_parser() -> MarkdownIt:
    parser = MarkdownIt("commonmark")
    parser.block.ruler.at("paragraph", _capture_paragraph)
    return parser


# Shared: each parse() builds its own state, so one configured parser serves every thread.
_PARSER = _make_parser()


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
            note.diagnose("mixed_endings", "mixed line endings; Quartizo will never modify this note")
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

    def tokens(self):
        body = self.text[self.body_start:].replace("\r\n", "\n").replace("\r", "\n")
        line_starts = [0]
        line_starts.extend(match.end() for match in re.finditer("\n", body))
        return _PARSER.parse(body, {"line_starts": line_starts})


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


def _todos(source: _Source, note: Note, tokens) -> None:
    depth, heading = 0, None
    for index, token in enumerate(tokens):
        if token.type == "heading_open" and token.level == 0:
            heading = _inline_label(tokens[index + 1])
        if token.type == "list_item_close":
            depth -= 1
        if token.type != "list_item_open":
            continue
        depth += 1
        if tokens[index + 1].type != "paragraph_open" or tokens[index + 2].type != "inline":
            continue
        inline = tokens[index + 2]
        match = _CHECKBOX.match(inline.content)
        if not match:
            continue
        if len(note.todos) >= MAX_TODOS_PER_NOTE:
            note.diagnose("todo_limit", f"only the first {MAX_TODOS_PER_NOTE} checkboxes are indexed")
            return
        line = source.body_line + inline.map[0]
        column = inline.meta["source_column"]
        # A leading BOM is excluded from the parser but remains in the file.
        if line == 0 and source.body_start == 1:
            column += 1
        marker_byte = source.byte_offset(source.char_starts[line] + column)
        if source.data[marker_byte:marker_byte + 3] != match.group(0).encode("ascii"):
            # Never guess: a position that does not point at its marker hides every TODO of the note.
            note.todos = []
            note.diagnose("ambiguous_location", "a checkbox's source position could not be verified")
            return
        text = inline.content[3:].strip()
        note.todos.append(Todo(marker_byte, line + 1, column + 1, match[1] != " ",
                               text[:MAX_LABEL_CHARS], depth - 1, heading))


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
    try:
        tokens = source.tokens()
    except RecursionError:
        note.diagnose("markdown_limit", "note is nested too deeply to index its checkboxes")
        return note
    for index, token in enumerate(tokens):
        if token.type == "heading_open" and token.tag == "h1" and token.level == 0:
            note.title = _inline_label(tokens[index + 1]) or note.title
            break
    _todos(source, note, tokens)
    return note
