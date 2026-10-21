from __future__ import annotations

import os
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path

from .fixtures import TICKET_ID, fixture_files
from .ranks import between
from .source import Refused, Source, digest, inspect_vault, promote, toggle, update_status


class SourceTests(unittest.TestCase):
    def setUp(self):
        self.files = fixture_files()

    def refused(self, code, fn, *args):
        with self.assertRaises(Refused) as caught:
            fn(*args)
        self.assertEqual(caught.exception.code, code)

    def test_recognize_ticket_and_ordinary_note(self):
        source = Source(self.files["ticket.md"])
        ticket = source.ticket("fallback.md")
        self.assertEqual((ticket.id, ticket.title, ticket.status, ticket.order),
                         (TICKET_ID, "Fix café login ☕", "ready", between()))
        self.assertEqual(source.diagnostics, [])
        self.assertIsNone(Source(self.files["ordinary.md"]).ticket("ordinary.md"))

    def test_status_changes_only_scalar_bytes_including_bom_and_crlf(self):
        for name in ("ticket.md", "bom-crlf.md"):
            original = self.files[name]
            with self.subTest(name=name):
                updated = update_status(original, "in_progress", digest(original))
                self.assertEqual(updated, original.replace(b'status: "ready"', b'status: "in_progress"', 1))
                self.assertEqual(Source(updated).ticket(name).status, "in_progress")

    def test_single_quoted_plain_and_flow_properties(self):
        original = self.files["ticket.md"]
        for representation in (b"ready", b"'ready'", b'"ready"'):
            with self.subTest(representation=representation):
                raw = original.replace(b'"ready"', representation)
                self.assertEqual(update_status(raw, "done", digest(raw)),
                                 raw.replace(b"status: " + representation,
                                             b"status: " + representation.replace(b"ready", b"done")))
        raw = (f'---\n{{type: ticket, id: "{TICKET_ID}", status: ready, order: "{between()}"}}\n---\n').encode()
        self.assertEqual(update_status(raw, "done", digest(raw)), raw.replace(b"status: ready", b"status: done"))

    def test_real_checkboxes_exclude_code_and_frontmatter(self):
        todos = Source(self.files["ticket.md"]).todos()
        self.assertEqual([t.text for t in todos],
                         ["Reproduce the timeout", "Check the logs", "Check the clock", "Reproduce the timeout"])
        self.assertEqual([t.checked for t in todos], [False, True, True, False])
        self.assertEqual([t.depth for t in todos], [0, 1, 1, 0])
        self.assertEqual({t.heading for t in todos}, {"Reproduction"})

    def test_alternate_list_markers_blockquotes_and_continuations(self):
        todos = Source(self.files["ordinary.md"]).todos()
        self.assertEqual([t.text for t in todos],
                         ["Ordered item", "Alternate ordered marker", "Quoted list item", "Marker on the next line"])
        for todo in todos:
            raw = self.files["ordinary.md"]
            self.assertEqual(toggle(raw, todo, not todo.checked, digest(raw))[todo.marker_start + 1],
                             ord(" ") if todo.checked else ord("x"))

    def test_source_locations_and_exact_one_byte_toggle(self):
        for name in ("ticket.md", "bom-crlf.md", "no-newline.md"):
            raw = self.files[name]
            source = Source(raw)
            for target in source.todos():
                with self.subTest(name=name, line=target.line):
                    physical = source.lines[target.line - 1]
                    self.assertIn(physical[target.column - 1:target.column + 2], ("[ ]", "[x]", "[X]"))
                    actual = toggle(raw, target, not target.checked, source.hash)
                    at = target.marker_start + 1
                    self.assertEqual(actual[:at], raw[:at])
                    self.assertEqual(actual[at + 1:], raw[at + 1:])
                    self.assertNotEqual(actual[at], raw[at])
                    self.assertEqual(len(actual), len(raw))

    def test_checked_uppercase_is_idempotent_and_status_is_independent(self):
        raw = self.files["ticket.md"]
        target = Source(raw).todos()[2]
        self.assertEqual(toggle(raw, target, True, digest(raw)), raw)
        while pending := [target for target in Source(raw).todos() if not target.checked]:
            target = pending[0]
            raw = toggle(raw, target, True, digest(raw))
        self.assertTrue(all(target.checked for target in Source(raw).todos()))
        self.assertEqual(Source(raw).ticket("ticket.md").status, "ready")

    def test_stale_and_forged_locations_are_refused(self):
        raw = self.files["no-newline.md"]
        target = Source(raw).todos()[1]
        changed = b"preface\n\n" + raw
        self.refused("conflict", toggle, changed, target, True, digest(raw))
        self.refused("stale_location", toggle, changed, target, True, digest(changed))
        self.refused("stale_location", toggle, raw, replace(target, marker_start=target.marker_start - 1), True, digest(raw))
        self.refused("stale_location", toggle, raw, replace(target, text="different"), True, digest(raw))

    def test_repeated_identical_text_selects_only_requested_occurrence(self):
        raw = self.files["no-newline.md"]
        first, second = Source(raw).todos()
        self.assertEqual(first.text, second.text)
        updated = toggle(raw, second, True, digest(raw))
        self.assertEqual([t.checked for t in Source(updated).todos()], [False, True])

    def test_mixed_endings_are_readable_but_mutations_refused(self):
        raw = self.files["mixed.md"]
        source = Source(raw)
        self.assertEqual(len(source.todos()), 1)
        self.refused("mixed_endings", toggle, raw, source.todos()[0], True, source.hash)
        self.refused("mixed_endings", promote, raw, TICKET_ID, between(), source.hash)

    def test_malformed_and_ambiguous_yaml_never_rewritten(self):
        examples = {
            b"status: [ready\n": "invalid_yaml",
            b"status: ready\nstatus: done\n": "duplicate_yaml_key",
            b"other: {key: a, key: b}\n": "duplicate_yaml_key",
            b"key: &a value\ncopy: *a\n": "yaml_reference",
            b"key: !custom value\n": "unsupported_yaml",
            b"key: !!python/object/apply:os.system ['id']\n": "unsupported_yaml",
            b"? [a, b]\n: complex\n": "unsupported_yaml",
            b"- sequence\n": "metadata_not_mapping",
            b"key: " + b"[" * 70 + b"0" + b"]" * 70 + b"\n": "yaml_limit",
        }
        for metadata, code in examples.items():
            with self.subTest(metadata=metadata[:70]):
                raw = b"---\n" + metadata + b"---\n# Readable\n- [ ] task\n"
                source = Source(raw)
                self.assertIn(code, [d.code for d in source.diagnostics])
                self.assertEqual(len(source.todos()), 1)
                self.refused(code, toggle, raw, source.todos()[0], True, source.hash)

    def test_unclosed_frontmatter_does_not_create_false_todos(self):
        source = Source(b"---\ntype: ticket\nexamples:\n- [ ] metadata\n")
        self.assertEqual(source.todos(), [])
        self.assertEqual(source.diagnostics[0].code, "unclosed_frontmatter")

    def test_invalid_ticket_fields_remain_visible_and_duplicate_ids_do_not_merge(self):
        result = inspect_vault(self.files)
        self.assertEqual(len(result), len(self.files))
        for path in ("ticket.md", "diagnostics/duplicate.md"):
            self.assertIn("duplicate_id", [d.code for d in result[path][1]])
            self.assertIsNotNone(result[path][0])
        ticket, diagnostics = result["diagnostics/missing-fields.md"]
        self.assertEqual(ticket.title, "Repair ticket")
        self.assertEqual({d.code for d in diagnostics}, {"invalid_id", "invalid_status", "invalid_order"})

    def test_filename_fallback_and_legacy_uid(self):
        raw = self.files["ticket.md"].replace(b"# Fix caf\xc3\xa9 login \xe2\x98\x95", b"No H1 title")
        raw = raw.replace(TICKET_ID.encode(), b"0123456789abcdef0123456789abcdef")
        source = Source(raw)
        self.assertEqual(source.ticket("folder/fallback.md").title, "fallback")
        self.assertEqual(source.diagnostics, [])

    def test_title_uses_real_h1_and_inline_text(self):
        raw = self.files["ticket.md"]
        raw = raw.replace(b"# Fix caf\xc3\xa9 login \xe2\x98\x95", b"```\n# Code example\n```\n\n# **Fix** [login](https://example.com) `timeout`")
        self.assertEqual(Source(raw).ticket("fallback.md").title, "Fix login timeout")

    def test_tabs_empty_labels_bom_and_lone_cr_locations(self):
        raw = b"\xef\xbb\xbf-\t[ ] tab\r\t- [X] child\r>\t1) [ ]\r"
        source = Source(raw)
        todos = source.todos()
        self.assertEqual([(t.text, t.depth) for t in todos], [("tab", 0), ("child", 1), ("", 0)])
        for target in todos:
            changed = toggle(raw, target, not target.checked, source.hash)
            self.assertEqual(sum(a != b for a, b in zip(raw, changed, strict=True)), 1)

    def test_promotion_preserves_existing_properties_body_and_bom(self):
        for raw in (b"# Body\n", b"\xef\xbb\xbf# Body\r\n", b"---\n# keep\naliases: ['a', b]\n---\n# Body\n"):
            with self.subTest(raw=raw):
                source = Source(raw)
                updated = promote(raw, TICKET_ID, between(), source.hash)
                promoted = Source(updated)
                self.assertEqual(promoted.ticket("a.md").id, TICKET_ID)
                self.assertEqual(promoted.text[promoted.body_start:], source.text[source.body_start:])
                self.assertEqual(promoted.diagnostics, [])
                if b"aliases" in raw:
                    self.assertIn(b"# keep\naliases: ['a', b]\n", updated)
                self.assertEqual(updated.startswith(b"\xef\xbb\xbf"), raw.startswith(b"\xef\xbb\xbf"))
        raw = self.files["diagnostics/property-collision.md"]
        self.refused("property_collision", promote, raw, TICKET_ID, between(), digest(raw))
        raw = b"---\n{}\n---\n# Body\n"
        self.refused("unsupported_yaml", promote, raw, TICKET_ID, between(), digest(raw))

    def test_limits_encoding_and_status_validation(self):
        self.refused("not_utf8", Source, b"\xff")
        self.refused("too_large", Source, b"x" * (2 * 1024 * 1024 + 1))
        raw = b"---\nkey: " + b"x" * 65536 + b"\n---\n"
        self.assertEqual(Source(raw).diagnostics[0].code, "metadata_too_large")
        raw = self.files["ticket.md"]
        self.refused("bad_status", update_status, raw, "complete", digest(raw))
        self.refused("conflict", update_status, raw, "done", "0" * 64)

    def test_existing_confined_file_writer_accepts_patch_and_refuses_external_change(self):
        from tests.backend.signing import load_server

        load_server()
        import notes
        from workspace import ApiError

        with tempfile.TemporaryDirectory(prefix="quartizo-format-") as tmp:
            root = os.path.realpath(tmp)  # macOS: /var is a symlink, and roots must be canonical
            raw = self.files["bom-crlf.md"]
            notes.create_note(root, "ticket.md", raw.decode())
            changed = update_status(raw, "done", digest(raw))
            result = notes.update_note(root, "ticket.md", changed.decode(), digest(raw))
            self.assertEqual(Path(root, "ticket.md").read_bytes(), changed)
            target = Source(changed).todos()[0]
            patched = toggle(changed, target, True, result["hash"])
            notes.update_note(root, "ticket.md", patched.decode(), result["hash"])
            self.assertEqual(Path(root, "ticket.md").read_bytes(), patched)
            Path(root, "ticket.md").write_bytes(patched + b"external\r\n")
            with self.assertRaises(ApiError) as caught:
                notes.update_note(root, "ticket.md", changed.decode(), digest(patched))
            self.assertEqual((caught.exception.status, caught.exception.code), (409, "conflict"))
            self.assertEqual(Path(root, "ticket.md").read_bytes(), patched + b"external\r\n")


if __name__ == "__main__":
    unittest.main()
