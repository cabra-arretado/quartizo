"""Portable legacy-card conversion, crash recovery and the signed HTTP boundary."""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import sqlite3
import tempfile
import threading
import unittest
from pathlib import Path
from unittest import mock

from tests.backend.signing import load_server
from tests.backend.test_http import SECRET, _start, _stop
from tests.backend.test_workspace import signed_json

srv = load_server()
import companion  # noqa: E402
import companion_write  # noqa: E402
import db  # noqa: E402
import legacy_migration  # noqa: E402
import mdsource  # noqa: E402
from workspace import ApiError, Registry, Workspace  # noqa: E402


class MigrationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="quartizo-migrate-")).resolve()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.vault = self.tmp / "vault"
        self.vault.mkdir()
        (self.vault / "linked note.md").write_bytes(b"# Original\n- [ ] Never rewritten\n")
        self.registry = Registry(self.tmp / "data")
        self.ws = self.registry.register(str(self.vault), companion=True)
        self.index = companion.CompanionIndex(self.registry)
        self.writer = companion_write.CompanionWriter(self.registry, self.index)
        self.migration = legacy_migration.LegacyMigration(self.registry, self.writer)
        self.ids = ["1" * 32, "2" * 32, "3" * 32]
        conn = db.connect(self.registry.db_path)
        try:
            for i, uid in enumerate(self.ids):
                conn.execute("INSERT INTO tasks (uid,project_id,title,description_markdown,status,sort_order,"
                             "note_ref,slot_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                             (uid, self.ws.uid, f"Ticket {i}", f"Body {i}\n- [ ] Keep TODO", "ready", i,
                              "linked note.md", "quartizo-abc123-abcdef", 1, 1))
        finally:
            conn.close()

    def run_migration(self):
        return self.migration.run(self.ws, {"planHash": self.migration.preview(self.ws)["planHash"], "confirm": True})

    def test_preview_is_read_only_and_shows_every_relationship(self):
        before = {p.name: p.read_bytes() for p in self.vault.iterdir()}
        preview = self.migration.preview(self.ws)
        self.assertEqual(len(preview["tasks"]), 3)
        self.assertEqual(preview["tasks"][0]["noteRef"], "linked note.md")
        self.assertEqual(preview["tasks"][0]["slotId"], "quartizo-abc123-abcdef")
        self.assertEqual({p.name: p.read_bytes() for p in self.vault.iterdir()}, before)
        self.assertFalse(list(self.registry.data_dir.glob("migration-*")))

    def test_backup_identity_body_order_relationships_and_legacy_rows_survive(self):
        linked = (self.vault / "linked note.md").read_bytes()
        result = self.run_migration()
        self.assertTrue(result["complete"])
        notes = [mdsource.parse_note(row["path"], (self.vault / row["path"]).read_bytes()) for row in result["migrated"]]
        self.assertEqual([n.ticket_id for n in notes], self.ids)
        self.assertEqual([n.status for n in notes], ["ready"] * 3)
        self.assertEqual([n.order for n in notes], sorted(n.order for n in notes))
        for i, row in enumerate(result["migrated"]):
            text = (self.vault / row["path"]).read_text()
            self.assertIn(f"Body {i}\n- [ ] Keep TODO", text)
            self.assertIn("[Linked note](../linked%20note.md)", text)
            self.assertIn('quartizo_session: "quartizo-abc123-abcdef"', text)
        self.assertEqual((self.vault / "linked note.md").read_bytes(), linked)
        backup = result["backup"]
        self.assertEqual(len(json.loads(Path(backup["export"]).read_bytes())["tasks"]), 3)
        conn = sqlite3.connect(backup["database"])
        self.assertEqual(conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0], 3)
        conn.close()
        self.assertEqual(len(self.migration.export(self.ws)["tasks"]), 3)
        self.assertEqual(self.run_migration()["migrated"], result["migrated"])

    def test_retry_preserves_post_conversion_edits_and_external_rename(self):
        result = self.run_migration()
        row = result["migrated"][0]
        path = self.vault / row["path"]
        changed = path.read_bytes().replace(b"status: ready", b"status: done") + b"\nMy later writing\n"
        path.write_bytes(changed)
        renamed = self.vault / "renamed.md"
        path.rename(renamed)
        retried = self.run_migration()
        self.assertEqual(renamed.read_bytes(), changed)
        self.assertFalse(path.exists())
        self.assertEqual(retried["migrated"][0]["path"], "renamed.md")

    def test_crash_after_creation_before_journaling_recovers_without_duplicates(self):
        original = legacy_migration._save

        def crash(path, value):
            if path.name == f"migration-{self.ws.uid}.json" and value.get("completed"):
                raise OSError("simulated crash")
            return original(path, value)

        with mock.patch.object(legacy_migration, "_save", side_effect=crash), self.assertRaises(OSError):
            self.run_migration()
        self.assertEqual(len(list((self.vault / "Quartizo tickets").glob("*.md"))), 1)
        recovered = legacy_migration.LegacyMigration(self.registry, companion_write.CompanionWriter(self.registry, self.index))
        result = recovered.run(self.ws, {"planHash": recovered.preview(self.ws)["planHash"], "confirm": True})
        self.assertTrue(result["complete"])
        self.assertEqual(len(list((self.vault / "Quartizo tickets").glob("*.md"))), 3)

    def test_changed_legacy_snapshot_is_rejected_before_writes(self):
        preview = self.migration.preview(self.ws)
        conn = db.connect(self.registry.db_path)
        conn.execute("UPDATE tasks SET title='Changed' WHERE uid=?", (self.ids[0],))
        conn.close()
        with self.assertRaises(ApiError) as ctx:
            self.migration.run(self.ws, {"planHash": preview["planHash"], "confirm": True})
        self.assertEqual(ctx.exception.code, "migration_changed")
        self.assertFalse((self.vault / "Quartizo tickets").exists())

    def test_collision_preserves_original_and_keeps_progress_resumable(self):
        path = self.vault / "Quartizo tickets" / f"{self.ids[1]}.md"
        path.parent.mkdir()
        path.write_bytes(b"# Other person's note\n")
        with self.assertRaises(ApiError) as ctx:
            self.run_migration()
        self.assertEqual(ctx.exception.code, "migration_collision")
        self.assertEqual(path.read_bytes(), b"# Other person's note\n")
        journal = json.loads(self.migration._journal_path(self.ws).read_bytes())
        self.assertEqual(list(journal["completed"]), [self.ids[0]])
        self.assertFalse(journal["complete"])
        path.unlink()  # user repairs only the disposable conflicting fixture
        self.assertTrue(self.run_migration()["complete"])

    def test_duplicate_id_in_another_vault_refuses_conversion(self):
        other = self.tmp / "other"
        other.mkdir()
        ws = self.registry.register(str(other), companion=True)
        companion_write.create_file(ws, "duplicate.md", companion_write.promote_bytes(
            "duplicate.md", b"# Existing", self.ids[0], "7" * 32))
        with self.assertRaises(ApiError) as ctx:
            self.run_migration()
        self.assertEqual(ctx.exception.code, "duplicate_id")
        self.assertFalse((self.vault / "Quartizo tickets").exists())

    def test_migration_requires_explicit_confirmation(self):
        with self.assertRaises(ApiError) as ctx:
            self.migration.run(self.ws, {"planHash": self.migration.preview(self.ws)["planHash"]})
        self.assertEqual(ctx.exception.code, "confirmation_required")

    def test_changed_output_stops_final_verification_and_preserves_edits_on_explicit_resume(self):
        original_save = legacy_migration._save
        edited = False
        first = self.vault / "Quartizo tickets" / f"{self.ids[0]}.md"

        def edit_after_first_step(path, value):
            nonlocal edited
            original_save(path, value)
            if path.name == f"migration-{self.ws.uid}.json" and len(value.get("completed", {})) == 1 and not edited:
                first.write_bytes(first.read_bytes() + b"\nExternal writing during conversion\n")
                edited = True

        with mock.patch.object(legacy_migration, "_save", side_effect=edit_after_first_step), self.assertRaises(ApiError) as ctx:
            self.run_migration()
        self.assertEqual(ctx.exception.code, "migration_conflict")
        self.assertTrue(self.index.status(self.ws)["migrationPending"])
        with self.assertRaises(ApiError) as guarded:
            self.writer.create(self.ws, {"path": "blocked.md", "title": "Wait"})
        self.assertEqual(guarded.exception.code, "migration_pending")
        preview = self.migration.preview(self.ws)
        self.assertTrue(preview["tasks"][0]["changed"])
        self.assertTrue(all(task["migrated"] for task in preview["tasks"]))
        with self.assertRaises(ApiError):
            self.run_migration()
        result = self.migration.run(self.ws, {"planHash": preview["planHash"], "confirm": True, "acceptCurrent": True})
        self.assertTrue(result["complete"])
        self.assertTrue(first.read_bytes().endswith(b"External writing during conversion\n"))
        self.assertFalse(self.index.status(self.ws)["migrationPending"])

    def test_id_inventory_does_not_hold_raw_vault_contents_or_todo_lists(self):
        inventory = self.writer.snapshot()
        self.assertEqual(len(inventory), 1)
        self.assertEqual(len(inventory[0]), 3)
        self.assertFalse(inventory[0][2].todos)

    def test_conversion_normalizes_new_file_endings_and_preserves_legacy_sources(self):
        descriptions = ["First\r\n- [ ] CRLF task\r\n", "Second\r- [ ] CR task\r",
                        "Third\r\n- [ ] Mixed task\n"]
        conn = db.connect(self.registry.db_path)
        try:
            for uid, description in zip(self.ids, descriptions, strict=True):
                conn.execute("UPDATE tasks SET description_markdown=? WHERE uid=?", (description, uid))
        finally:
            conn.close()
        preview = self.migration.preview(self.ws)
        self.assertTrue(all(task["normalizedLineEndings"] for task in preview["tasks"]))
        self.assertEqual(sum("uses LF line endings" in warning for warning in preview["warnings"]), 3)
        result = self.run_migration()
        for item in result["migrated"]:
            data = (self.vault / item["path"]).read_bytes()
            self.assertNotIn(b"\r", data)
            parsed = mdsource.parse_note(item["path"], data)
            self.assertFalse(parsed.diagnostics)
            self.assertEqual(len(parsed.todos), 1)
        self.assertEqual([row["description_markdown"] for row in self.migration.export(self.ws)["tasks"]], descriptions)
        backed_up = json.loads(Path(result["backup"]["export"]).read_bytes())
        self.assertEqual([row["description_markdown"] for row in backed_up["tasks"]], descriptions)

    def test_generated_note_diagnostics_refuse_conversion_before_any_vault_write(self):
        conn = db.connect(self.registry.db_path)
        conn.execute("UPDATE tasks SET description_markdown=? WHERE uid=?",
                     ("- [ ] task\n" * (mdsource.MAX_TODOS_PER_NOTE + 1), self.ids[0]))
        conn.close()
        with self.assertRaises(ApiError) as ctx:
            self.migration.preview(self.ws)
        self.assertEqual(ctx.exception.code, "migration_invalid_output")
        self.assertIn("todo_limit", ctx.exception.extra["diagnostics"])
        self.assertFalse((self.vault / "Quartizo tickets").exists())
        self.assertFalse(list(self.registry.data_dir.glob("migration-*")))

    def interrupted_migration(self):
        """Create and journal one real output, then fail before the second one."""
        create = companion_write.create_file
        calls = 0

        def interrupt(*args):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise OSError("simulated interruption after a journaled step")
            return create(*args)

        with mock.patch.object(companion_write, "create_file", side_effect=interrupt), self.assertRaises(OSError):
            self.run_migration()
        journal = self.migration._journal(self.ws)
        self.assertEqual(list(journal["completed"]), [self.ids[0]])
        return self.vault / journal["completed"][self.ids[0]]["path"]

    def test_preview_resolves_renamed_edited_output_and_exposes_recovery_consent(self):
        first = self.interrupted_migration()
        renamed = self.vault / "renamed-and-edited.md"
        first.rename(renamed)
        external = renamed.read_bytes() + b"\nKeep my external edits\n"
        renamed.write_bytes(external)
        preview = self.migration.preview(self.ws)
        task = preview["tasks"][0]
        self.assertEqual(task["path"], "renamed-and-edited.md")
        self.assertTrue(task["migrated"])
        self.assertTrue(task["changed"])
        self.assertTrue(any("renamed-and-edited.md" in message for message in preview["warnings"]))
        with self.assertRaises(ApiError) as ctx:
            self.migration.run(self.ws, {"planHash": preview["planHash"], "confirm": True})
        self.assertEqual(ctx.exception.code, "migration_conflict")
        result = self.migration.run(self.ws, {"planHash": preview["planHash"], "confirm": True, "acceptCurrent": True})
        self.assertTrue(result["complete"])
        self.assertEqual(result["migrated"][0]["path"], "renamed-and-edited.md")
        self.assertEqual(renamed.read_bytes(), external)
        self.assertFalse(first.exists())
        self.assertEqual(len(list(self.vault.rglob("*.md"))), 4)  # linked original plus three converted cards

    def test_preview_refuses_ambiguous_renamed_migration_identity(self):
        first = self.interrupted_migration()
        renamed = self.vault / "renamed.md"
        first.rename(renamed)
        (self.vault / "duplicate.md").write_bytes(renamed.read_bytes())
        before = self.migration._journal_path(self.ws).read_bytes()
        with self.assertRaises(ApiError) as ctx:
            self.migration.preview(self.ws)
        self.assertEqual(ctx.exception.code, "duplicate_id")
        self.assertEqual(self.migration._journal_path(self.ws).read_bytes(), before)

    def test_queued_migration_rechecks_disabled_or_removed_workspace_under_lock(self):
        plan_hash = self.migration.preview(self.ws)["planHash"]
        for transition, code in (("disabled", "not_companion"), ("removed", "workspace_not_found")):
            with self.subTest(transition=transition):
                errors = []
                entered = threading.Event()

                def queued(entered=entered, errors=errors):
                    entered.set()
                    try:
                        self.migration.run(self.ws, {"planHash": plan_hash, "confirm": True})
                    except Exception as error:
                        errors.append(error)

                with self.writer.lock:
                    worker = threading.Thread(target=queued)
                    worker.start()
                    self.assertTrue(entered.wait(2))
                    if transition == "disabled":
                        self.registry.set_companion(self.ws.id, False)
                    else:
                        self.registry.unregister(self.ws.id, delete_old_tasks=True)
                worker.join(3)
                self.assertFalse(worker.is_alive())
                self.assertEqual(len(errors), 1)
                self.assertIsInstance(errors[0], ApiError)
                self.assertEqual(errors[0].code, code)
                self.assertFalse((self.vault / "Quartizo tickets").exists())
                self.assertFalse(list(self.registry.data_dir.glob("migration-*")))

    def test_migration_refuses_replaced_workspace_identity_before_writing(self):
        plan_hash = self.migration.preview(self.ws)["planHash"]
        replacement = Workspace(self.ws.id, "f" * 32, self.ws.name, self.ws.path, True)
        with mock.patch.object(self.registry, "get", return_value=replacement), self.assertRaises(ApiError) as ctx:
            self.migration.run(self.ws, {"planHash": plan_hash, "confirm": True})
        self.assertEqual(ctx.exception.code, "workspace_changed")
        self.assertFalse((self.vault / "Quartizo tickets").exists())


class WritesHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = Path(tempfile.mkdtemp(prefix="quartizo-write-http-")).resolve()
        cls.vault = cls.tmp / "vault"
        cls.vault.mkdir()
        cls.proc, cls.port = _start(SECRET, home=str(cls.tmp / "crew"))
        code, result = signed_json(cls.port, "POST", "/api/workspaces", {"path": str(cls.vault), "companion": True})
        assert code == 201, result
        cls.base = f"/api/workspaces/{result['workspace']['id']}"

    @classmethod
    def tearDownClass(cls):
        _stop(cls.proc)
        shutil.rmtree(cls.tmp, ignore_errors=True)

    def test_end_to_end_create_move_toggle_and_source(self):
        code, created = signed_json(self.port, "POST", self.base + "/tickets",
                                    {"path": "flow.md", "title": "A ticket", "body": "- [ ] Ship it"})
        self.assertEqual(code, 201, created)
        code, moved = signed_json(self.port, "POST", self.base + "/tickets/move",
                                  {"path": "flow.md", "expectedHash": created["hash"], "status": "done"})
        self.assertEqual(code, 200, moved)
        data = (self.vault / "flow.md").read_bytes()
        todo = mdsource.parse_note("flow.md", data).todos[0]
        code, toggled = signed_json(self.port, "POST", self.base + "/todos/toggle",
                                    {"path": "flow.md", "expectedHash": moved["hash"], "markerStart": todo.marker_start,
                                     "line": todo.line, "column": todo.column, "checked": True})
        self.assertEqual(code, 200, toggled)
        code, source = signed_json(self.port, "GET", self.base + "/source?path=flow.md")
        self.assertEqual(code, 200)
        self.assertIn("- [x] Ship it", source["content"])
        self.assertIn("status: done", source["content"])
        # Old snapshots fail even if an external writer restores the timestamp.
        st = (self.vault / "flow.md").stat()
        (self.vault / "flow.md").write_bytes(data + b"\nExternal writing")
        os.utime(self.vault / "flow.md", ns=(st.st_atime_ns, st.st_mtime_ns))
        code, refusal = signed_json(self.port, "POST", self.base + "/tickets/move",
                                    {"path": "flow.md", "expectedHash": toggled["hash"], "status": "ready"})
        self.assertEqual((code, refusal["code"]), (409, "conflict"))

    def test_every_new_route_remains_owner_only(self):
        for method, suffix in (("POST", "/tickets"), ("POST", "/tickets/move"), ("POST", "/tickets/promote"),
                               ("POST", "/tickets/demote"), ("POST", "/tickets/rebalance"),
                               ("POST", "/todos/toggle"), ("GET", "/source?path=flow.md"),
                               ("GET", "/migration"), ("POST", "/migration"), ("GET", "/legacy-tasks")):
            with self.subTest(suffix=suffix):
                for kind in ("app-token", "agent-tool", "none"):
                    code, refusal = signed_json(self.port, method, self.base + suffix,
                                                {} if method == "POST" else None, kind=kind, owner_id="")
                    self.assertEqual((code, refusal["code"]), (403, "owner_session_required"))

    def test_required_hash_is_never_optional_on_mutation(self):
        signed_json(self.port, "POST", self.base + "/tickets", {"path": "hash-required.md", "title": "Guarded"})
        before = (self.vault / "hash-required.md").read_bytes()
        for action in ("move", "demote"):
            code, error = signed_json(self.port, "POST", self.base + f"/tickets/{action}",
                                      {"path": "hash-required.md", "status": "done"})
            self.assertEqual((code, error["code"]), (400, "bad_hash"))
        self.assertEqual(hashlib.sha256(before).digest(), hashlib.sha256((self.vault / "hash-required.md").read_bytes()).digest())
