"""Writable companion round trips, conflict guards and resumable maintenance."""

from __future__ import annotations

import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from tests.backend.signing import load_server

load_server()
import companion  # noqa: E402
import companion_write as writes  # noqa: E402
import mdsource  # noqa: E402
from workspace import ApiError, Registry  # noqa: E402


class WriteTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="quartizo-writes-")
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name).resolve()
        self.vault = self.root / "vault"
        self.vault.mkdir()
        self.registry = Registry(self.root / "data")
        self.ws = self.registry.register(str(self.vault), companion=True)
        self.index = companion.CompanionIndex(self.registry)
        self.writer = writes.CompanionWriter(self.registry, self.index)

    def ticket(self, path="ticket.md", status="ready", rank="7" * 32, uid="a" * 32):
        data = (
            f"---\n# properties\nid: \"{uid}\"\ntype: ticket\nstatus: '{status}' # keep\n"
            f'order: "{rank}"\nother: [yes, 3] # unchanged\n---\n# Café ☕\n\n- [ ] same\n- [ ] same'
        ).encode()
        (self.vault / path).write_bytes(data)
        return data

    def body(self, path="ticket.md", **extra):
        return {"path": path, "expectedHash": writes.digest((self.vault / path).read_bytes()), **extra}

    def refuse(self, code, fn, *args):
        with self.assertRaises(ApiError) as ctx:
            fn(*args)
        self.assertEqual(ctx.exception.code, code)

    def test_move_only_changes_requested_scalar_spans(self):
        data = self.ticket()
        result = self.writer.move(self.ws, self.body(status="done"))
        expected = data.replace(b"status: 'ready'", b"status: 'done'").replace(b"7" * 32, result["order"].encode())
        self.assertEqual((self.vault / "ticket.md").read_bytes(), expected)
        self.assertEqual(result["id"], "a" * 32)
        self.assertTrue(self.index._queue)

    def test_preserved_mtime_external_edit_is_refused(self):
        self.ticket()
        request = self.body(status="done")
        path = self.vault / "ticket.md"
        st = path.stat()
        external = path.read_bytes().replace(b"same", b"EXTERNAL", 1)
        path.write_bytes(external)
        os.utime(path, ns=(st.st_atime_ns, st.st_mtime_ns))
        self.refuse("conflict", self.writer.move, self.ws, request)
        self.assertEqual(path.read_bytes(), external)

    def test_missing_hash_cannot_bypass_move_toggle_or_demote(self):
        data = self.ticket()
        for method, extra in (
            (self.writer.move, {"status": "done"}),
            (self.writer.toggle, {"checked": True}),
            (self.writer.demote, {}),
            (self.writer.promote, {}),
        ):
            self.refuse("bad_hash", method, self.ws, {"path": "ticket.md", **extra})
        self.assertEqual((self.vault / "ticket.md").read_bytes(), data)

    def test_toggle_repeated_unicode_source_changes_one_byte(self):
        data = self.ticket()
        note = mdsource.parse_note("ticket.md", data)
        second = note.todos[1]
        result = self.writer.toggle(
            self.ws, self.body(markerStart=second.marker_start, line=second.line, column=second.column, checked=True)
        )
        at = second.marker_start + 1
        self.assertEqual((self.vault / "ticket.md").read_bytes(), data[:at] + b"x" + data[at + 1 :])
        self.assertEqual(result["status"], "ready")
        path = self.vault / "ticket.md"
        stamp = path.stat().st_mtime_ns
        self.writer.toggle(
            self.ws, self.body(markerStart=second.marker_start, line=second.line, column=second.column, checked=True)
        )
        self.assertEqual(path.stat().st_mtime_ns, stamp)

    def test_forged_checkbox_location_refused(self):
        self.ticket()
        self.refuse(
            "stale_location", self.writer.toggle, self.ws, self.body(markerStart=1, line=1, column=1, checked=True)
        )

    def test_native_grammar_hidden_checkbox_is_not_mutable(self):
        data = b"# A\n```\n- [ ] hidden\n```\n* [ ] star\n- [ ] valid\n"
        path = self.vault / "ordinary.md"
        path.write_bytes(data)
        self.refuse(
            "stale_location",
            self.writer.toggle,
            self.ws,
            self.body("ordinary.md", markerStart=data.index(b"["), line=3, column=3, checked=True),
        )
        self.assertEqual(path.read_bytes(), data)

    def test_create_promote_and_demote_preserve_content(self):
        created = self.writer.create(
            self.ws, {"path": "nested/new.md", "title": "New task", "body": "- [ ] work", "status": "review"}
        )
        note = mdsource.parse_note("nested/new.md", (self.vault / "nested/new.md").read_bytes())
        self.assertEqual((note.ticket_id, note.status, note.title), (created["id"], "review", "New task"))
        original = b'\xef\xbb\xbf---\r\n# comment\r\ncustom: "same"\r\n---\r\n# Existing\r\nBody'
        (self.vault / "existing.md").write_bytes(original)
        result = self.writer.promote(self.ws, self.body("existing.md"))
        self.assertTrue(result["id"])
        self.writer.demote(self.ws, self.body("existing.md"))
        self.assertEqual((self.vault / "existing.md").read_bytes(), original)

    def test_promotion_preserves_explicit_yaml_terminator_and_original_bytes(self):
        for newline, bom in (("\n", ""), ("\r\n", "\ufeff")):
            with self.subTest(newline=repr(newline), bom=bool(bom)):
                original = (bom + newline.join(("---", 'custom: "keep" # properties', "... # end", "---", "# Ordinary", ""))).encode()
                target = self.vault / "ordinary.md"
                target.write_bytes(original)
                self.assertFalse(mdsource.parse_note("ordinary.md", original).diagnostics)
                result = self.writer.promote(self.ws, self.body("ordinary.md"))
                promoted = target.read_bytes()
                note = mdsource.parse_note("ordinary.md", promoted)
                self.assertFalse(note.diagnostics)
                self.assertEqual((note.ticket_id, note.status, note.order), (result["id"], "backlog", result["order"]))
                self.assertLess(promoted.index(b"type: ticket"), promoted.index(b"... # end"))
                self.writer.demote(self.ws, self.body("ordinary.md"))
                self.assertEqual(target.read_bytes(), original)

    def test_invalid_promotion_output_is_refused_before_publication(self):
        target = self.vault / "ordinary.md"
        original = b"---\ncustom: keep\n---\n# Original\n"
        target.write_bytes(original)
        real_parse = mdsource.parse_note

        def invalid_result(path, data):
            note = real_parse(path, data)
            if b"type: ticket" in data:
                note.diagnose("invalid_yaml", "simulated invalid transformed metadata")
            return note

        with mock.patch.object(mdsource, "parse_note", side_effect=invalid_result):
            self.refuse("invalid_metadata", self.writer.promote, self.ws, self.body("ordinary.md"))
        self.assertEqual(target.read_bytes(), original)

    def test_create_never_overwrites_an_existing_note(self):
        old = self.ticket()
        self.refuse("exists", self.writer.create, self.ws, {"path": "ticket.md", "title": "New"})
        self.assertEqual((self.vault / "ticket.md").read_bytes(), old)
        self.assertEqual(list(self.vault.glob(".quartizo-*")), [])

    def test_collision_and_invalid_metadata_are_not_rewritten(self):
        for data in (b"---\nstatus: custom\n---\nbody", b"---\na: 1\na: 2\n---\n- [ ] work", b"# Heading\r\n- [ ] x\n"):
            (self.vault / "ordinary.md").write_bytes(data)
            expected = "property_collision" if b"status:" in data else "invalid_metadata"
            self.refuse(expected, self.writer.promote, self.ws, self.body("ordinary.md"))
            self.assertEqual((self.vault / "ordinary.md").read_bytes(), data)

    def test_duplicate_ids_detected_from_live_files_across_workspaces(self):
        data = self.ticket()
        second = self.root / "second"
        second.mkdir()
        self.registry.register(str(second), companion=True)
        (second / "duplicate.md").write_bytes(data)
        # No index generation exists: duplicate detection cannot rely on it.
        self.refuse("duplicate_id", self.writer.move, self.ws, self.body(status="done"))
        self.refuse("duplicate_id", self.writer.demote, self.ws, self.body())

    def test_live_duplicate_blocks_append_and_incomplete_scope_blocks_writes(self):
        self.ticket()
        self.ticket("copy.md")
        self.refuse("duplicate_id", self.writer.create, self.ws, {"path": "new.md", "title": "New", "status": "ready"})
        (self.vault / "copy.md").unlink()
        with mock.patch.object(companion, "MAX_NOTES", 0):
            self.refuse("incomplete_scan", self.writer.move, self.ws, self.body(status="done"))

    def test_snapshot_reuses_matching_live_hash_metadata_without_reparsing(self):
        self.ticket()
        for i in range(20):
            metadata = "\n".join(f"property_{n}: 'value {n}'" for n in range(150))
            (self.vault / f"ordinary-{i}.md").write_text(f"---\n{metadata}\n---\n# Ordinary\n- [ ] Work\n")
        # An already-indexed vault must not pay YAML parsing again on the first
        # writer request, nor on the subsequent cache-hit request.
        self.index.scan(self.ws, companion._Scan(False))
        with mock.patch.object(mdsource, "parse_metadata", wraps=mdsource.parse_metadata) as parse:
            self.writer.snapshot()
            self.writer.snapshot()
            parse.assert_not_called()

    def test_cached_inventory_detects_preserved_mtime_edits_and_new_duplicate(self):
        data = self.ticket()
        ordinary = self.vault / "ordinary.md"
        ordinary.write_bytes(b"# Ordinary\n")
        self.writer.snapshot()
        stamp = ordinary.stat()
        ordinary.write_bytes(data)
        os.utime(ordinary, ns=(stamp.st_atime_ns, stamp.st_mtime_ns))
        with mock.patch.object(mdsource, "parse_metadata", wraps=mdsource.parse_metadata) as parse:
            self.refuse("duplicate_id", self.writer.move, self.ws, self.body(status="done"))
            self.assertEqual(parse.call_count, 1)

    def test_metadata_cache_is_bounded_and_parser_version_scoped(self):
        for i in range(3):
            (self.vault / f"ordinary-{i}.md").write_bytes(b"# Ordinary\n")
        self.writer._metadata_cache_limit = 2
        self.writer.snapshot()
        self.assertEqual(len(self.writer._metadata_cache), 2)
        self.writer._metadata_cache_limit = 8
        self.writer.snapshot()
        with mock.patch.object(companion, "INDEX_VERSION", companion.INDEX_VERSION + 1), mock.patch.object(
            mdsource, "parse_metadata", wraps=mdsource.parse_metadata
        ) as parse:
            self.writer.snapshot()
            self.assertEqual(parse.call_count, 3)

    def test_identity_only_parser_does_not_extract_todos_or_headings(self):
        data = self.ticket()
        with mock.patch.object(mdsource, "_todos", side_effect=AssertionError("body TODO parse")), mock.patch.object(
            mdsource, "_title", side_effect=AssertionError("body heading parse")
        ):
            note = mdsource.parse_metadata(data)
        self.assertEqual((note.ticket_id, note.status), ("a" * 32, "ready"))
        self.assertFalse(note.todos)
        self.assertEqual(note.title, "")

    def test_cold_inventory_budget_defers_without_publishing_and_requests_background_scan(self):
        (self.vault / "ordinary.md").write_bytes(b"# Ordinary\n")
        real_parse = mdsource.parse_metadata
        now = [0.0]

        def expensive_parse(data):
            result = real_parse(data)
            now[0] += writes.SNAPSHOT_SECONDS + 1
            return result

        with mock.patch.object(writes.time, "monotonic", side_effect=lambda: now[0]), mock.patch.object(
            mdsource, "parse_metadata", side_effect=expensive_parse
        ):
            self.refuse("index_not_ready", self.writer.create, self.ws, {"path": "new.md", "title": "Wait"})
        self.assertFalse((self.vault / "new.md").exists())
        self.assertIn(self.ws.uid, self.index._queue)

    def test_unshared_scope_after_inventory_refuses_publication(self):
        original = self.writer._snapshot

        def unshare():
            inventory = original()
            self.registry.set_companion(self.ws.id, False)
            return inventory

        with mock.patch.object(self.writer, "_snapshot", side_effect=unshare):
            self.refuse("not_companion", self.writer.create, self.ws, {"path": "nested/forbidden.md", "title": "No"})
        self.assertFalse((self.vault / "nested").exists())

    def test_unshared_scope_while_staging_refuses_late_publication(self):
        self.ticket()
        original = os.fsync
        changed = False

        def unshare_during_fsync(fd):
            nonlocal changed
            original(fd)
            if not changed:
                changed = True
                self.registry.set_companion(self.ws.id, False)

        before = (self.vault / "ticket.md").read_bytes()
        with mock.patch.object(writes.os, "fsync", side_effect=unshare_during_fsync):
            self.refuse("not_companion", self.writer.move, self.ws, self.body(status="done"))
        self.assertEqual((self.vault / "ticket.md").read_bytes(), before)
        self.assertEqual(list(self.vault.glob(".quartizo-*")), [])

    def test_move_validates_neighbor_adjacency_hash_and_order(self):
        self.ticket("a.md", rank="2" * 32, uid="a" * 32)
        self.ticket("b.md", rank="4" * 32, uid="b" * 32)
        self.ticket("c.md", status="done", uid="c" * 32)
        before = {"path": "a.md", "hash": self.body("a.md")["expectedHash"]}
        after = {"path": "b.md", "hash": self.body("b.md")["expectedHash"]}
        result = self.writer.move(self.ws, self.body("c.md", status="ready", before=before, after=after))
        self.assertTrue("2" * 32 < result["order"] < "4" * 32)
        before["hash"] = "0" * 64
        self.refuse(
            "conflict", self.writer.move, self.ws, self.body("c.md", status="ready", before=before, after=after)
        )

    def test_path_confinement_and_symlinks(self):
        self.refuse("bad_path", self.writer.create, self.ws, {"path": "../outside.md", "title": "No"})
        outside = self.root / "outside.md"
        outside.write_bytes(b"untouched")
        (self.vault / "link.md").symlink_to(outside)
        self.refuse("symlink_refused", writes.write_note, self.ws, "link.md", b"bad", writes.digest(b"untouched"))
        folder = self.root / "folder"
        folder.mkdir()
        (self.vault / "linkdir").symlink_to(folder, target_is_directory=True)
        self.refuse("symlink_refused", self.writer.create, self.ws, {"path": "linkdir/new.md", "title": "No"})
        self.assertEqual(outside.read_bytes(), b"untouched")
        self.assertFalse((folder / "new.md").exists())

    def test_late_hash_check_keeps_intervening_external_write(self):
        self.ticket()
        original = os.fsync
        external = b"# external\n"
        edited = False

        def edit_during_fsync(fd):
            nonlocal edited
            original(fd)
            if not edited:
                edited = True
                (self.vault / "ticket.md").write_bytes(external)

        with mock.patch.object(writes.os, "fsync", edit_during_fsync):
            self.refuse("conflict", self.writer.move, self.ws, self.body(status="done"))
        self.assertEqual((self.vault / "ticket.md").read_bytes(), external)
        self.assertEqual(list(self.vault.glob(".quartizo-*")), [])

    def test_rank_exhaustion_rebalances_and_resumes_after_restart(self):
        self.ticket("a.md", rank=f"{1:032x}", uid="a" * 32)
        self.ticket("b.md", rank=f"{2:032x}", uid="b" * 32)
        self.ticket("c.md", status="done", uid="c" * 32)
        args = self.body(
            "c.md",
            status="ready",
            before={"path": "a.md", "hash": self.body("a.md")["expectedHash"]},
            after={"path": "b.md", "hash": self.body("b.md")["expectedHash"]},
        )
        self.refuse("rank_exhausted", self.writer.move, self.ws, args)
        real = writes._write
        calls = 0

        def interrupt(*args, **kwargs):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise RuntimeError("interrupted")
            return real(*args, **kwargs)

        with mock.patch.object(writes, "_write", interrupt), self.assertRaises(RuntimeError):
            self.writer.rebalance(self.ws, {"status": "ready"})
        self.assertEqual(self.writer.maintenance(self.ws), ["ready"])
        self.refuse("maintenance_pending", self.writer.move, self.ws, self.body("c.md", status="ready"))
        restarted = writes.CompanionWriter(self.registry, self.index)
        result = restarted.rebalance(self.ws, {"status": "ready"})
        self.assertEqual(result["updated"], 2)
        self.assertEqual(restarted.maintenance(self.ws), [])
        a = mdsource.parse_note("a.md", (self.vault / "a.md").read_bytes())
        b = mdsource.parse_note("b.md", (self.vault / "b.md").read_bytes())
        self.assertLess(a.order, b.order)

    def test_external_edit_stops_rebalance_without_overwrite(self):
        self.ticket("a.md", uid="a" * 32)
        with (
            mock.patch.object(writes, "_write", side_effect=RuntimeError("interrupted")),
            self.assertRaises(RuntimeError),
        ):
            self.writer.rebalance(self.ws, {"status": "ready"})
        path = self.vault / "a.md"
        external = path.read_bytes() + b"\nEXTERNAL"
        path.write_bytes(external)
        self.refuse("conflict", self.writer.rebalance, self.ws, {"status": "ready"})
        self.assertEqual(path.read_bytes(), external)
        self.assertEqual(self.writer.maintenance(self.ws), ["ready"])
        self.writer.rebalance(self.ws, {"status": "ready", "reconcile": True})
        self.assertTrue(path.read_bytes().endswith(b"\nEXTERNAL"))
        self.assertEqual(self.writer.maintenance(self.ws), [])

    def test_interrupted_rebalance_resolves_renamed_ticket_by_stable_identity(self):
        self.ticket("a.md", rank="2" * 32, uid="a" * 32)
        self.ticket("b.md", rank="4" * 32, uid="b" * 32)
        real_write = writes._write
        calls = 0

        def interrupt(*args, **kwargs):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise RuntimeError("interrupted")
            return real_write(*args, **kwargs)

        with mock.patch.object(writes, "_write", interrupt), self.assertRaises(RuntimeError):
            self.writer.rebalance(self.ws, {"status": "ready"})
        original_b = (self.vault / "b.md").read_bytes()
        (self.vault / "b.md").rename(self.vault / "renamed.md")
        restarted = writes.CompanionWriter(self.registry, self.index)
        self.assertEqual(restarted.rebalance(self.ws, {"status": "ready"})["updated"], 2)
        self.assertFalse((self.vault / "b.md").exists())
        self.assertEqual(restarted.maintenance(self.ws), [])
        renamed = mdsource.parse_note("renamed.md", (self.vault / "renamed.md").read_bytes())
        self.assertEqual(renamed.ticket_id, "b" * 32)
        self.assertEqual((self.vault / "renamed.md").read_bytes().split(b"---\n", 2)[-1], original_b.split(b"---\n", 2)[-1])

    def test_renamed_edited_maintenance_ticket_reconciles_without_losing_writing(self):
        self.ticket("a.md", uid="a" * 32)
        with mock.patch.object(writes, "_write", side_effect=RuntimeError("interrupted")), self.assertRaises(RuntimeError):
            self.writer.rebalance(self.ws, {"status": "ready"})
        old = self.vault / "a.md"
        old.rename(self.vault / "renamed.md")
        target = self.vault / "renamed.md"
        target.write_bytes(target.read_bytes() + b"\nExternal writing\n")
        self.refuse("conflict", self.writer.rebalance, self.ws, {"status": "ready"})
        journal = json.loads(self.writer._journal_path(self.ws, "ready").read_bytes())
        self.assertEqual(journal["steps"][0]["path"], "renamed.md")
        self.writer.rebalance(self.ws, {"status": "ready", "reconcile": True})
        self.assertTrue(target.read_bytes().endswith(b"\nExternal writing\n"))

    def test_ambiguous_renamed_maintenance_identity_is_refused_without_changes(self):
        self.ticket("a.md", uid="a" * 32)
        with mock.patch.object(writes, "_write", side_effect=RuntimeError("interrupted")), self.assertRaises(RuntimeError):
            self.writer.rebalance(self.ws, {"status": "ready"})
        target = self.vault / "a.md"
        target.rename(self.vault / "renamed.md")
        data = (self.vault / "renamed.md").read_bytes()
        target.write_bytes(data)
        self.refuse("duplicate_id", self.writer.rebalance, self.ws, {"status": "ready", "reconcile": True})
        self.assertEqual(target.read_bytes(), data)
        self.assertEqual((self.vault / "renamed.md").read_bytes(), data)

    def test_rank_patch_keeps_numeric_looking_rank_a_yaml_string(self):
        original = self.ticket(rank="a" * 32).replace(b'order: "' + b"a" * 32 + b'"', b"order: " + b"a" * 32)
        changed = writes.patch_scalar("ticket.md", original, "order", "1" * 32)
        parsed = mdsource.parse_note("ticket.md", changed)
        self.assertEqual(parsed.order, "1" * 32)
        self.assertFalse(parsed.diagnostics)

    def test_read_only_note_and_companion_disabled_refused(self):
        self.ticket()
        path = self.vault / "ticket.md"
        path.chmod(0o400)
        self.addCleanup(path.chmod, 0o600)
        self.refuse("read_only", self.writer.move, self.ws, self.body(status="done"))
        self.registry.set_companion(self.ws.id, False)
        self.refuse("not_companion", self.writer.move, self.ws, self.body(status="done"))

    def test_writes_and_external_rename_survive_rebuilding_only_the_derived_index(self):
        created = self.writer.create(self.ws, {"path": "created.md", "title": "Persisted", "body": "- [ ] Finish"})
        self.writer.move(self.ws, {"path": "created.md", "expectedHash": created["hash"], "status": "done"})
        note = mdsource.parse_note("created.md", (self.vault / "created.md").read_bytes())
        todo = note.todos[0]
        self.writer.toggle(self.ws, self.body("created.md", markerStart=todo.marker_start, line=todo.line,
                                              column=todo.column, checked=True))
        (self.vault / "created.md").rename(self.vault / "renamed.md")
        self.index.scan(self.ws, companion._Scan(False))
        before = self.index.board(self.ws)["tickets"]
        self.assertEqual((before[0]["path"], before[0]["id"], before[0]["status"], before[0]["todos"]),
                         ("renamed.md", created["id"], "done", {"total": 1, "done": 1}))
        self.index.forget(self.ws.uid)
        self.index.scan(self.ws, companion._Scan(True))
        self.assertEqual(self.index.board(self.ws)["tickets"], before)
