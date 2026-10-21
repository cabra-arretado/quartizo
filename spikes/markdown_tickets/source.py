"""Prove parser-guided, byte-preserving patches before adding production services.

This module only transforms in-memory bytes. It does not scan or write a vault,
resolve duplicate identities across workspaces, or provide a filesystem lock.
YAML nodes locate exact scalars; reserializing a document would normalize it.
Markdown block-parser positions distinguish real list checkboxes from examples.
"""
from __future__ import annotations

import hashlib
import re
from bisect import bisect_right
from collections import defaultdict
from collections.abc import Mapping
from dataclasses import dataclass

from markdown_it import MarkdownIt
from markdown_it.rules_block.paragraph import paragraph
from ruamel.yaml import YAML
from ruamel.yaml.error import YAMLError
from ruamel.yaml.events import AliasEvent
from ruamel.yaml.nodes import MappingNode, ScalarNode, SequenceNode

from .ranks import rank_value

STATUSES = ("backlog", "ready", "in_progress", "review", "done")
MAX_FILE_BYTES = 2 * 1024 * 1024
MAX_FRONTMATTER_BYTES = 64 * 1024
MAX_YAML_EVENTS = 8192
MAX_YAML_DEPTH = 64
_STRING_TAG = "tag:yaml.org,2002:str"
_TICKET_ID = re.compile(r"(?:[0-9a-f]{32}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})")
_CHECKBOX = re.compile(r"^\[([ xX])\](?=[ \t\n]|$)")
_DELIMITER = re.compile(r"---[ \t]*$")
_RESERVED = ("id", "type", "status", "order")


class Refused(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


@dataclass(frozen=True)
class Diagnostic:
    code: str
    message: str


@dataclass(frozen=True)
class Ticket:
    id: str | None
    title: str
    status: str | None
    order: str | None


@dataclass(frozen=True)
class Todo:
    source_hash: str
    marker_start: int  # zero-based UTF-8 byte offset of '[' in the original file
    line: int  # one-based physical line
    column: int  # one-based Unicode code-point column of '['
    checked: bool
    text: str
    depth: int
    heading: str | None


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


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


class Source:
    def __init__(self, data: bytes):
        if len(data) > MAX_FILE_BYTES:
            raise Refused("too_large", "note exceeds 2 MiB")
        try:
            self.text = data.decode("utf-8")
        except UnicodeDecodeError:
            raise Refused("not_utf8", "note is not UTF-8") from None
        self.data = data
        self.hash = digest(data)
        self.lines = re.findall(r"[^\r\n]*(?:\r\n|\r|\n|$)", self.text)
        if self.lines[-1:] == [""]:
            self.lines.pop()
        self.char_starts, self.byte_starts = [0], [0]
        for line in self.lines:
            self.char_starts.append(self.char_starts[-1] + len(line))
            self.byte_starts.append(self.byte_starts[-1] + len(line.encode("utf-8")))
        endings = set(re.findall(r"\r\n|\r|\n", self.text))
        self.newline = next(iter(endings)) if len(endings) == 1 else "\n"
        self.diagnostics: list[Diagnostic] = []
        if len(endings) > 1:
            self._diagnose("mixed_endings", "mixed line endings are read-only in this spike")
        self.body_line = 0
        self.body_start = 1 if self.text.startswith("\ufeff") else 0
        self.yaml_start: int | None = None
        self.yaml_end: int | None = None
        self.fields: dict[str, object] = {}
        self.flow_mapping = False
        self._frontmatter()

    def _diagnose(self, code: str, message: str) -> None:
        if not any(item.code == code for item in self.diagnostics):
            self.diagnostics.append(Diagnostic(code, message))

    def byte_offset(self, char_offset: int) -> int:
        line = bisect_right(self.char_starts, char_offset) - 1
        if line == len(self.lines):
            return len(self.data)
        return self.byte_starts[line] + len(self.lines[line][:char_offset - self.char_starts[line]].encode("utf-8"))

    def _frontmatter(self) -> None:
        if not self.lines or not _DELIMITER.fullmatch(self.lines[0].lstrip("\ufeff").rstrip("\r\n")):
            return
        self.yaml_start = self.char_starts[1]
        for index, line in enumerate(self.lines[1:], 1):
            if _DELIMITER.fullmatch(line.rstrip("\r\n")):
                self.yaml_end = self.char_starts[index]
                self.body_line = index + 1
                self.body_start = self.char_starts[index + 1]
                break
        if self.yaml_end is None:
            self.body_line, self.body_start = len(self.lines), len(self.text)
            self._diagnose("unclosed_frontmatter", "frontmatter has no closing --- delimiter")
            return
        raw = self.text[self.yaml_start:self.yaml_end]
        if len(raw.encode("utf-8")) > MAX_FRONTMATTER_BYTES:
            self._diagnose("metadata_too_large", "frontmatter exceeds 64 KiB")
            return
        try:
            depth = 0
            for count, event in enumerate(YAML(typ="safe", pure=True).parse(raw), 1):
                if count > MAX_YAML_EVENTS:
                    raise Refused("yaml_limit", "frontmatter contains too many YAML events")
                if isinstance(event, AliasEvent) or getattr(event, "anchor", None) is not None:
                    raise Refused("yaml_reference", "YAML anchors and aliases require explicit repair before mutation")
                if type(event).__name__ in ("MappingStartEvent", "SequenceStartEvent"):
                    depth += 1
                    if depth > MAX_YAML_DEPTH:
                        raise Refused("yaml_limit", "frontmatter nesting exceeds 64 levels")
                elif type(event).__name__ in ("MappingEndEvent", "SequenceEndEvent"):
                    depth -= 1
            node = YAML(typ="safe", pure=True).compose(raw)
            if node is None:
                return
            self._validate_yaml(node)
            if not isinstance(node, MappingNode):
                raise Refused("metadata_not_mapping", "frontmatter must be a YAML mapping")
            self.flow_mapping = bool(node.flow_style)
            self.fields = {key.value: value for key, value in node.value}
        except Refused as err:
            self._diagnose(err.code, str(err))
        except YAMLError:
            self._diagnose("invalid_yaml", "frontmatter is not unambiguous, valid YAML")

    def _validate_yaml(self, node) -> None:
        if not node.tag.startswith("tag:yaml.org,2002:") or node.tag.rsplit(":", 1)[-1] not in {
            "str", "int", "float", "bool", "null", "timestamp", "binary", "map", "seq",
        }:
            raise Refused("unsupported_yaml", "custom tags, merge keys and special YAML types are read-only")
        if isinstance(node, MappingNode):
            seen: set[str] = set()
            for key, value in node.value:
                if not isinstance(key, ScalarNode) or key.tag != _STRING_TAG:
                    raise Refused("unsupported_yaml", "frontmatter keys must be strings; merge keys are read-only")
                if key.value in seen:
                    raise Refused("duplicate_yaml_key", "frontmatter contains a duplicate property")
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
        parser = MarkdownIt("commonmark")
        parser.block.ruler.at("paragraph", _capture_paragraph)
        return parser.parse(body, {"line_starts": line_starts})

    def ticket(self, path: str) -> Ticket | None:
        if self.field("type") != "ticket":
            return None
        uid, status, order = (self.field(key) for key in ("id", "status", "order"))
        if uid is None or not _TICKET_ID.fullmatch(uid):
            self._diagnose("invalid_id", "ticket requires a UUID or a preserved 32-hex legacy UID")
        if status not in STATUSES:
            self._diagnose("invalid_status", "ticket status is missing or unsupported")
        try:
            rank_value(order)
        except ValueError:
            self._diagnose("invalid_order", "ticket order is missing or invalid")
        title = path.rsplit("/", 1)[-1].removesuffix(".md")
        tokens = self.tokens()
        for index, token in enumerate(tokens):
            if token.type == "heading_open" and token.tag == "h1" and token.level == 0:
                title = _inline_label(tokens[index + 1]) or title
                break
        return Ticket(uid, title, status, order)

    def todos(self) -> list[Todo]:
        tokens = self.tokens()
        result: list[Todo] = []
        depth = 0
        heading = None
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
            line = self.body_line + inline.map[0]
            column = inline.meta["source_column"]
            # A leading BOM is excluded from the parser but remains in the file.
            if line == 0 and self.body_start == 1:
                column += 1
            marker_char = self.char_starts[line] + column
            marker_byte = self.byte_offset(marker_char)
            if self.data[marker_byte:marker_byte + 3] != match.group(0).encode("ascii"):
                raise Refused("ambiguous_location", "Markdown source position did not match its checkbox")
            result.append(Todo(self.hash, marker_byte, line + 1, column + 1, match[1] != " ",
                               inline.content[3:].strip(), depth - 1, heading))
        return result

    def writable(self, expected_hash: str) -> None:
        if not isinstance(expected_hash, str) or expected_hash != self.hash:
            raise Refused("conflict", "source hash changed; reread before retrying")
        if self.diagnostics:
            raise Refused(self.diagnostics[0].code, self.diagnostics[0].message)

    def patch_scalar(self, key: str, value: str, expected_hash: str) -> bytes:
        self.writable(expected_hash)
        node = self.fields.get(key)
        if not isinstance(node, ScalarNode) or node.tag != _STRING_TAG or node.style not in (None, "'", '"'):
            raise Refused("unsupported_scalar", "only simple string properties can be updated in this spike")
        if node.start_mark.line != node.end_mark.line:
            raise Refused("unsupported_scalar", "multiline properties require repair before mutation")
        # The caller validates the alphabet (status/rank), so quoting cannot inject YAML.
        if not re.fullmatch(r"[a-z0-9_]+", value):
            raise Refused("bad_value", "property value is outside the supported alphabet")
        quote = node.style or ""
        replacement = f"{quote}{value}{quote}".encode("ascii")
        start = self.byte_offset(self.yaml_start + node.start_mark.index)
        end = self.byte_offset(self.yaml_start + node.end_mark.index)
        return self.data[:start] + replacement + self.data[end:]


def update_status(data: bytes, status: str, expected_hash: str) -> bytes:
    if status not in STATUSES:
        raise Refused("bad_status", "unsupported status")
    source = Source(data)
    if source.field("type") != "ticket":
        raise Refused("not_ticket", "note is not marked as a ticket")
    source.ticket("note.md")  # all required fields must be valid before mutation
    return source.patch_scalar("status", status, expected_hash)


def promote(data: bytes, uid: str, order: str, expected_hash: str) -> bytes:
    source = Source(data)
    source.writable(expected_hash)
    if not isinstance(uid, str) or not _TICKET_ID.fullmatch(uid):
        raise Refused("invalid_id", "invalid ticket identity")
    rank_value(order)
    if any(key in source.fields for key in _RESERVED):
        raise Refused("property_collision", "promotion would reuse an existing reserved property")
    if source.flow_mapping:
        raise Refused("unsupported_yaml", "promotion requires block-style frontmatter in this spike")
    newline = source.newline
    properties = newline.join((f'id: "{uid}"', "type: ticket", "status: backlog", f'order: "{order}"', ""))
    if source.yaml_end is not None:
        offset = source.byte_offset(source.yaml_end)
        return data[:offset] + properties.encode("utf-8") + data[offset:]
    offset = 3 if data.startswith(b"\xef\xbb\xbf") else 0
    header = f"---{newline}{properties}---{newline}".encode()
    return data[:offset] + header + data[offset:]


def toggle(data: bytes, target: Todo, checked: bool, expected_hash: str) -> bytes:
    source = Source(data)
    source.writable(expected_hash)
    if not isinstance(checked, bool):
        raise Refused("bad_checked", "checked must be a boolean")
    if target.source_hash != expected_hash or target not in source.todos():
        raise Refused("stale_location", "checkbox snapshot no longer identifies this source")
    if target.checked == checked:
        return data
    at = target.marker_start + 1
    return data[:at] + (b"x" if checked else b" ") + data[at + 1:]


def inspect_vault(files: Mapping[str, bytes]) -> dict[str, tuple[Ticket | None, list[Diagnostic]]]:
    """Inspect an explicit complete snapshot, retaining every path and duplicate."""
    result = {}
    identities: dict[str, list[str]] = defaultdict(list)
    for path, data in sorted(files.items()):
        try:
            source = Source(data)
            ticket = source.ticket(path)
            result[path] = ticket, source.diagnostics
            if ticket is not None and ticket.id is not None:
                identities[ticket.id].append(path)
        except Refused as err:
            result[path] = None, [Diagnostic(err.code, str(err))]
    for paths in identities.values():
        if len(paths) > 1:
            for path in paths:
                result[path][1].append(Diagnostic("duplicate_id", "ticket ID is also present in: " +
                                                  ", ".join(other for other in paths if other != path)))
    return result
