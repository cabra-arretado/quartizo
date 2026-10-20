"""QTZ-008: task metadata per project (CRUD, refusals, ordering, import/export, 409, migration)."""
from __future__ import annotations

import http.client
import json
import shutil
import sqlite3
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

from tests.backend.signing import load_server
from tests.backend.signing import principal_header, proxy_header
from tests.backend.test_http import SECRET, _request, _start
from tests.backend.test_workspace import signed_json

srv = load_server()
import db  # noqa: E402
import tasks  # noqa: E402
from workspace import ApiError, Registry  # noqa: E402

UID_A = "a" * 32
SLOT_TAB = "quartizo-lx2k9a-abc123"


class StoreTest(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="quartizo-tasks-")).resolve()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        for name in ("v", "w"):
            (self.tmp / name).mkdir()
            (self.tmp / name).chmod(0o755)
        self.registry = Registry(self.tmp / "crew" / "apps" / "quartizo" / "data", protected=(str(self.tmp / "crew"),))
        self.ws = self.registry.register(str(self.tmp / "v"))
        self.other = self.registry.register(str(self.tmp / "w"))
        self.store = tasks.TaskStore(self.registry)

    def refused(self, fn, *args, status=None, code=None):
        with self.assertRaises(ApiError) as ctx:
            fn(*args)
        if status is not None:
            self.assertEqual(ctx.exception.status, status, ctx.exception.message)
        if code is not None:
            self.assertEqual(ctx.exception.code, code, ctx.exception.message)
        return ctx.exception

    def new(self, title="T", ws=None, **fields):
        return self.store.create((ws or self.ws).id, {"title": title, **fields})["task"]

    def board(self, ws=None):
        return [(t["title"], t["status"], t["order"]) for t in self.store.list((ws or self.ws).id)["tasks"]]

    def move(self, task, status, index, version=None):
        return self.store.move(self.ws.id, task["id"], {
            "expectedVersion": task["version"] if version is None else version, "status": status, "index": index})


class CrudTests(StoreTest):
    def test_create_read_update_delete(self):
        t = self.new("  First  ", description_markdown="# hi\n", note_ref="dir/a.md", slot_id=SLOT_TAB)
        self.assertEqual(t["title"], "First")
        self.assertEqual((t["status"], t["order"], t["version"]), ("backlog", 0, 1))
        self.assertEqual(t["project_id"], self.ws.uid)
        self.assertRegex(t["uid"], r"^[0-9a-f]{32}$")
        self.assertEqual((t["note_ref"], t["slot_id"]), ("dir/a.md", SLOT_TAB))
        self.assertEqual(t["created_at"], t["updated_at"])
        self.assertEqual(self.store.get(self.ws.id, t["id"])["task"], t)
        listed = self.store.list(self.ws.id)
        self.assertEqual(listed["project"], {"id": self.ws.uid, "workspaceId": self.ws.id, "name": self.ws.name})
        self.assertEqual(listed["statuses"], list(tasks.STATUSES))
        u = self.store.update(self.ws.id, t["id"], {"expectedVersion": 1, "title": "Renamed",
                                                    "note_ref": None, "slot_id": None})["task"]
        self.assertEqual((u["title"], u["note_ref"], u["slot_id"], u["version"]), ("Renamed", None, None, 2))
        self.assertEqual(u["description_markdown"], "# hi\n")
        self.assertGreaterEqual(u["updated_at"], t["updated_at"])
        self.refused(self.store.delete, self.ws.id, t["id"], {"expectedVersion": 2}, code="confirm_required")
        self.refused(self.store.delete, self.ws.id, t["id"], {"expectedVersion": 2, "confirm": "yes"},
                     code="confirm_required")
        self.assertEqual(self.store.delete(self.ws.id, t["id"], {"expectedVersion": 2, "confirm": True}), {"ok": True})
        self.refused(self.store.get, self.ws.id, t["id"], status=404, code="task_not_found")

    def test_tasks_are_scoped_to_their_project(self):
        t = self.new("mine")
        self.refused(self.store.get, self.other.id, t["id"], code="task_not_found")
        self.refused(self.store.update, self.other.id, t["id"], {"expectedVersion": 1, "title": "x"},
                     code="task_not_found")
        self.refused(self.store.move, self.other.id, t["id"], {"expectedVersion": 1, "status": "done", "index": 0},
                     code="task_not_found")
        self.assertEqual(self.board(self.other), [])
        self.refused(self.store.list, 999, code="workspace_not_found")
        self.refused(self.store.create, 999, {"title": "x"}, code="workspace_not_found")


class ValidationTests(StoreTest):
    def test_title_rules(self):
        self.assertEqual(self.new("é" * 200)["title"], "é" * 200)  # characters, not bytes
        for bad in (None, 7, "", "   ", "x" * 201, "a\nb", "a\tb", "a\x00b", "a\x85b", "a\u2028b", "\ud800",
                    "a\u202eb", "a\u202ab", "a\u202cb", "a\u2066b", "a\u2069b"):
            with self.subTest(title=bad):
                self.refused(self.store.create, self.ws.id, {"title": bad}, status=400, code="bad_title")

    def test_description_cap(self):
        ok = "é" * (tasks.MAX_DESCRIPTION_BYTES // 2)
        self.assertEqual(len(self.new(description_markdown=ok)["description_markdown"]), len(ok))
        self.refused(self.store.create, self.ws.id, {"title": "t", "description_markdown": ok + "x"},
                     status=413, code="description_too_large")
        for bad in (7, ["x"], "a\x00b", "\udc00"):
            with self.subTest(description=bad):
                self.refused(self.store.create, self.ws.id, {"title": "t", "description_markdown": bad},
                             code="bad_description")

    def test_status_and_unknown_fields(self):
        self.assertEqual(self.new(status="review")["status"], "review")
        for bad in ("Done", "running", "", None, 3):
            with self.subTest(status=bad):
                self.refused(self.store.create, self.ws.id, {"title": "t", "status": bad}, code="bad_status")
        self.refused(self.store.create, self.ws.id, {"title": "t", "order": 3}, code="bad_field")
        t = self.new()
        # Status, order and anything runtime-like are not editable through update.
        for key in ("status", "order", "runtime", "version", "project_id"):
            with self.subTest(key=key):
                self.refused(self.store.update, self.ws.id, t["id"], {"expectedVersion": 1, key: "done"},
                             code="bad_field")
        self.refused(self.store.update, self.ws.id, t["id"], {"expectedVersion": 1}, code="nothing_to_update")

    def test_note_ref_uses_note_path_rules_and_is_never_opened(self):
        self.assertEqual(self.new(note_ref="missing/not-there.md")["note_ref"], "missing/not-there.md")
        for bad in ("/etc/passwd.md", "../x.md", "a/../b.md", ".obsidian/x.md", "a//b.md", "a\\b.md", "x.txt",
                    ".md", "a\x00.md", "", 7):
            with self.subTest(note_ref=bad):
                self.refused(self.store.create, self.ws.id, {"title": "t", "note_ref": bad},
                             status=400, code="bad_note_ref")
        with mock.patch("os.open", side_effect=AssertionError("tasks must not touch files")):
            t = self.new(note_ref="a/b.md")
            self.store.update(self.ws.id, t["id"], {"expectedVersion": 1, "note_ref": "c.md"})

    def test_slot_id_rules(self):
        own = f"quartizo-w{self.ws.uid}-lx2k9a-abc123"
        self.assertEqual(self.new(slot_id=own)["slot_id"], own)
        self.assertEqual(self.new(slot_id=SLOT_TAB)["slot_id"], SLOT_TAB)
        for bad in ("main", "quartizo-", "quartizo-ABC-abc123", f"{SLOT_TAB}\n", " " + SLOT_TAB, 5,
                    f"quartizo-w{self.other.uid}-lx2k9a-abc123"):
            with self.subTest(slot_id=bad):
                self.refused(self.store.create, self.ws.id, {"title": "t", "slot_id": bad}, code="bad_slot_id")

    def test_three_segment_slot_of_another_workspace_is_refused(self):
        # `quartizo-w<uid>-abcdef` matches SLOT_NAME_RE with the uid group skipped.
        other = f"quartizo-w{self.other.uid}-abcdef"
        own = f"quartizo-w{self.ws.uid}-abcdef"
        self.assertEqual(self.new(slot_id=own)["slot_id"], own)
        self.refused(self.store.create, self.ws.id, {"title": "t", "slot_id": other}, status=400, code="bad_slot_id")
        t = self.new()
        self.refused(self.store.update, self.ws.id, t["id"], {"expectedVersion": 1, "slot_id": other},
                     status=400, code="bad_slot_id")
        data = {"format": "quartizo.tasks", "version": 1,
                "tasks": [{"title": "t", "status": "backlog", "slot_id": other}]}
        err = self.refused(self.store.import_, self.ws.id, {"data": data, "replace": True, "confirm": True},
                           status=400, code="bad_slot_id")
        self.assertEqual(err.extra["taskIndex"], 0)

    def test_version_and_index_types(self):
        t = self.new()
        for bad in (None, "1", 1.0, True, 0, -1):
            with self.subTest(version=bad):
                self.refused(self.store.update, self.ws.id, t["id"], {"expectedVersion": bad, "title": "x"},
                             status=400)
        for bad in (-1, "0", None, 1.5, True):
            with self.subTest(index=bad):
                self.refused(self.store.move, self.ws.id, t["id"],
                             {"expectedVersion": 1, "status": "ready", "index": bad}, code="bad_index")

    def test_task_count_cap(self):
        with mock.patch.object(tasks, "MAX_TASKS_PER_PROJECT", 2):
            self.new()
            self.new()
            self.refused(self.new, code="too_many_tasks")


class OrderingTests(StoreTest):
    def setUp(self):
        super().setUp()
        self.a, self.b, self.c = (self.new(n) for n in "ABC")

    def fresh(self, task):
        return self.store.get(self.ws.id, task["id"])["task"]

    def test_create_appends_to_its_column(self):
        self.assertEqual(self.board(), [("A", "backlog", 0), ("B", "backlog", 1), ("C", "backlog", 2)])
        self.new("R", status="ready")
        self.assertEqual(self.board()[-1], ("R", "ready", 0))

    def test_reorder_within_a_column(self):
        res = self.move(self.c, "backlog", 0)
        self.assertTrue(res["moved"])
        self.assertEqual([t["title"] for t in res["tasks"]], ["C", "A", "B"])
        self.assertEqual(self.board(), [("C", "backlog", 0), ("A", "backlog", 1), ("B", "backlog", 2)])
        self.move(self.fresh(self.c), "backlog", 99)  # clamped to the end
        self.assertEqual([t[0] for t in self.board()], ["A", "B", "C"])

    def test_move_across_columns_reindexes_both(self):
        self.move(self.b, "in_progress", 0)
        self.move(self.a, "in_progress", 1)
        self.assertEqual(self.board(), [("C", "backlog", 0), ("B", "in_progress", 0), ("A", "in_progress", 1)])
        self.move(self.fresh(self.a), "in_progress", 0)
        self.assertEqual(self.board()[1:], [("A", "in_progress", 0), ("B", "in_progress", 1)])

    def test_move_bumps_only_the_moved_task(self):
        res = self.move(self.c, "done", 0)
        self.assertEqual(res["task"]["version"], 2)
        self.assertEqual(self.fresh(self.a)["version"], 1)  # reindexed siblings keep their version
        self.assertEqual(self.fresh(self.a)["updated_at"], self.a["updated_at"])

    def test_noop_move_changes_nothing(self):
        res = self.move(self.b, "backlog", 1)
        self.assertFalse(res["moved"])
        self.assertEqual(res["task"], self.b)

    def test_delete_reindexes_its_column(self):
        self.store.delete(self.ws.id, self.a["id"], {"expectedVersion": 1, "confirm": True})
        self.assertEqual(self.board(), [("B", "backlog", 0), ("C", "backlog", 1)])

    def test_move_never_touches_slots_or_the_chat_api(self):
        t = self.new("linked", slot_id=SLOT_TAB, note_ref="n.md")
        # No outbound connection of any kind, and slot_id / note_ref untouched.
        with mock.patch("socket.socket", side_effect=AssertionError("no network from a move")), \
             mock.patch("socket.create_connection", side_effect=AssertionError("no network from a move")):
            res = self.move(t, "in_progress", 0)
            res = self.store.move(self.ws.id, t["id"], {"expectedVersion": res["task"]["version"],
                                                        "status": "done", "index": 0})
        self.assertEqual((res["task"]["slot_id"], res["task"]["note_ref"]), (SLOT_TAB, "n.md"))
        self.assertIn(res["task"]["status"], tasks.STATUSES)
        self.assertEqual(res["task"]["status"], "done")
        self.assertEqual(res["task"]["slot_id"], SLOT_TAB)  # unchanged by both moves


class ConcurrencyTests(StoreTest):
    def test_stale_update_move_and_delete_are_409(self):
        t = self.new("T")
        self.store.update(self.ws.id, t["id"], {"expectedVersion": 1, "title": "other tab"})
        for call, body in (
            (self.store.update, {"expectedVersion": 1, "title": "mine"}),
            (self.store.move, {"expectedVersion": 1, "status": "done", "index": 0}),
            (self.store.delete, {"expectedVersion": 1, "confirm": True}),
        ):
            with self.subTest(call=call.__name__):
                err = self.refused(call, self.ws.id, t["id"], body, status=409, code="stale")
                self.assertEqual(err.extra["currentVersion"], 2)
                self.assertEqual(err.extra["task"]["title"], "other tab")
        current = self.store.get(self.ws.id, t["id"])["task"]
        self.assertEqual((current["title"], current["status"], current["version"]), ("other tab", "backlog", 2))

    def test_failed_transaction_rolls_back(self):
        a, b = self.new("A"), self.new("B")
        with mock.patch.object(tasks.TaskStore, "_rows", side_effect=RuntimeError("boom")):
            with self.assertRaises(RuntimeError):
                self.store.move(self.ws.id, b["id"], {"expectedVersion": 1, "status": "done", "index": 0})
        self.assertEqual(self.board(), [("A", "backlog", 0), ("B", "backlog", 1)])
        self.assertEqual(self.store.get(self.ws.id, b["id"])["task"]["version"], 1)


class ImportExportTests(StoreTest):
    def seed(self):
        self.new("one", description_markdown="**x**", note_ref="a.md", slot_id=f"quartizo-w{self.ws.uid}-a-abc123")
        two = self.new("two")
        self.new("three", status="review")
        self.move(two, "backlog", 0)

    def test_export_shape_and_round_trip(self):
        self.seed()
        exported = self.store.export(self.ws.id)
        self.assertEqual((exported["format"], exported["version"]), ("quartizo.tasks", 1))
        self.assertEqual(exported["project"], {"id": self.ws.uid, "name": self.ws.name})
        self.assertEqual([t["title"] for t in exported["tasks"]], ["two", "one", "three"])
        self.assertEqual(set(exported["tasks"][0]), tasks._EXPORT_TASK_KEYS)
        before = self.store.list(self.ws.id)["tasks"]
        # Same project: replace needs replace + confirm; identity and order survive.
        res = self.store.import_(self.ws.id, {"data": json.loads(json.dumps(exported)), "replace": True, "confirm": True})
        self.assertEqual((res["imported"], res["replaced"]), (3, 3))
        again = self.store.export(self.ws.id)
        self.assertEqual(again["tasks"], exported["tasks"])
        after = self.store.list(self.ws.id)["tasks"]
        self.assertEqual([t["uid"] for t in after], [t["uid"] for t in before])

    def test_import_into_an_empty_project(self):
        self.new("x", ws=self.other)
        data = self.store.export(self.other.id)
        self.refused(self.store.import_, self.ws.id, {"data": data}, status=409, code="uid_conflict")
        res = self.store.import_(self.ws.id, {"data": data, "newUids": True})
        self.assertEqual(res["imported"], 1)
        self.assertNotEqual(res["tasks"][0]["uid"], data["tasks"][0]["uid"])
        self.assertEqual(res["tasks"][0]["project_id"], self.ws.uid)

    def test_never_overwrites_silently(self):
        self.seed()
        data = self.store.export(self.ws.id)
        err = self.refused(self.store.import_, self.ws.id, {"data": data}, status=409, code="project_not_empty")
        self.assertEqual(err.extra["taskCount"], 3)
        self.refused(self.store.import_, self.ws.id, {"data": data, "replace": True}, code="confirm_required")
        self.assertEqual(len(self.board()), 3)

    def test_rejections_are_all_or_nothing(self):
        good = {"title": "ok", "status": "ready"}
        cases = {
            "not an object": [],
            "wrong format": {"format": "other", "version": 1, "tasks": []},
            "wrong version": {"format": "quartizo.tasks", "version": 2, "tasks": []},
            "unknown top key": {"format": "quartizo.tasks", "version": 1, "tasks": [], "x": 1},
            "tasks not a list": {"format": "quartizo.tasks", "version": 1, "tasks": {}},
            "bad title": [good, {"title": "", "status": "ready"}],
            "bad status": [good, {"title": "t", "status": "doing"}],
            "unknown task key": [good, {"title": "t", "status": "ready", "id": 4}],
            "bad note_ref": [good, {"title": "t", "status": "ready", "note_ref": "../x.md"}],
            "foreign slot": [good, {"title": "t", "status": "ready",
                                    "slot_id": f"quartizo-w{self.other.uid}-a-abc123"}],
            "bad uid": [good, {"title": "t", "status": "ready", "uid": "XYZ"}],
            "duplicate uid": [{**good, "uid": UID_A}, {"title": "t", "status": "ready", "uid": UID_A}],
            "bad timestamp": [good, {"title": "t", "status": "ready", "created_at": -1}],
            "huge description": [good, {"title": "t", "status": "ready",
                                        "description_markdown": "x" * (tasks.MAX_DESCRIPTION_BYTES + 1)}],
        }
        for name, data in cases.items():
            if isinstance(data, list) and name != "not an object":
                data = {"format": "quartizo.tasks", "version": 1, "tasks": data}
            with self.subTest(case=name):
                err = self.refused(self.store.import_, self.ws.id, {"data": data})
                self.assertIn(err.status, (400, 413))
                self.assertEqual(self.board(), [], "nothing may be written by a refused import")
        self.refused(self.store.import_, self.ws.id, {"data": {}, "replace": "yes"}, code="bad_import")
        self.refused(self.store.import_, self.ws.id, {"tasks": []}, code="bad_field")

    def test_task_count_cap_on_import(self):
        data = {"format": "quartizo.tasks", "version": 1,
                "tasks": [{"title": f"t{i}", "status": "backlog"} for i in range(3)]}
        with mock.patch.object(tasks, "MAX_TASKS_PER_PROJECT", 2):
            self.refused(self.store.import_, self.ws.id, {"data": data}, status=413, code="too_many_tasks")
        self.assertEqual(self.board(), [])

    def test_order_from_file_and_defaults(self):
        data = {"format": "quartizo.tasks", "version": 1, "tasks": [
            {"title": "late", "status": "done", "order": 5},
            {"title": "early", "status": "done", "order": 1},
            {"title": "plain", "status": "backlog"},
        ]}
        self.store.import_(self.ws.id, {"data": data})
        self.assertEqual(self.board(), [("plain", "backlog", 0), ("early", "done", 0), ("late", "done", 1)])


class WorkspaceRemovalTests(StoreTest):
    def test_unregister_with_tasks_needs_explicit_delete(self):
        self.new("keep me")
        err = self.refused(self.registry.unregister, self.ws.id, status=409, code="project_has_tasks")
        self.assertEqual(err.extra["taskCount"], 1)
        self.assertEqual(len(self.board()), 1)
        self.registry.unregister(self.ws.id, delete_tasks=True)
        with self.registry._conn() as conn:
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0], 0)
        self.registry.unregister(self.other.id)  # no tasks: no flag needed


class MigrationTests(unittest.TestCase):
    def test_m2_database_gains_tasks_and_keeps_workspaces(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / db.DB_FILENAME
            conn = sqlite3.connect(path, isolation_level=None)
            conn.execute("CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at INTEGER NOT NULL)")
            conn.execute(db.MIGRATIONS[0])
            conn.execute("INSERT INTO schema_migrations VALUES (1, 0)")
            conn.execute("INSERT INTO workspaces (id, name, path, created_at) VALUES (2, 'a', '/x/a', 5)")
            for statement in filter(str.strip, db.MIGRATIONS[1].split(";")):
                conn.execute(statement)
            conn.execute("INSERT INTO schema_migrations VALUES (2, 0)")
            uid = conn.execute("SELECT uid FROM workspaces").fetchone()[0]
            self.assertIsNone(conn.execute("SELECT name FROM sqlite_master WHERE name = 'tasks'").fetchone())
            conn.close()

            conn = db.connect(path)
            self.assertEqual([r[0] for r in conn.execute("SELECT version FROM schema_migrations ORDER BY 1")],
                             list(range(1, len(db.MIGRATIONS) + 1)))
            rows = [dict(r) for r in db.list_workspaces(conn)]
            self.assertEqual([(r["id"], r["uid"], r["name"]) for r in rows], [(2, uid, "a")])
            cols = {r[1] for r in conn.execute("PRAGMA table_info(tasks)")}
            self.assertEqual(cols, {"id", "uid", "project_id", "title", "description_markdown", "status",
                                    "sort_order", "version", "note_ref", "slot_id", "created_at", "updated_at"})
            conn.execute("INSERT INTO tasks (uid, project_id, title, status, sort_order, created_at, updated_at) "
                         "VALUES (?, ?, 't', 'backlog', 0, 0, 0)", (UID_A, uid))
            with self.assertRaises(sqlite3.IntegrityError):  # FK to workspaces(uid)
                conn.execute("INSERT INTO tasks (uid, project_id, title, status, sort_order, created_at, "
                             "updated_at) VALUES (?, ?, 't', 'backlog', 0, 0, 0)", ("b" * 32, "c" * 32))
            with self.assertRaises(sqlite3.IntegrityError):  # CHECK on status
                conn.execute("INSERT INTO tasks (uid, project_id, title, status, sort_order, created_at, "
                             "updated_at) VALUES (?, ?, 't', 'running', 0, 0, 0)", ("d" * 32, uid))
            conn.close()
            db.connect(path).close()  # idempotent


class TaskHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix="quartizo-tasks-http-")
        root = Path(cls.tmp.name).resolve()
        cls.vault = root / "vault"
        cls.vault.mkdir()
        cls.vault.chmod(0o755)
        cls.vault2 = root / "vault2"
        cls.vault2.mkdir()
        cls.vault2.chmod(0o755)
        cls.proc, cls.port = _start(SECRET, home=str(root / "crew"))
        status, body = signed_json(cls.port, "POST", "/api/workspaces", {"path": str(cls.vault)})
        assert status == 201, body
        cls.ws = body["workspace"]
        cls.base = f"/api/workspaces/{cls.ws['id']}/tasks"

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        cls.proc.communicate(timeout=5)
        cls.tmp.cleanup()

    def call(self, method, target, payload=None, **kw):
        return signed_json(self.port, method, target, payload, **kw)

    def test_crud_move_and_409_over_http(self):
        status, body = self.call("POST", self.base, {"title": "http task", "note_ref": "n.md"})
        self.assertEqual(status, 201, body)
        t = body["task"]
        status, body = self.call("PATCH", f"{self.base}/{t['id']}", {"expectedVersion": 1, "title": "edited"})
        self.assertEqual((status, body["task"]["version"]), (200, 2))
        status, body = self.call("POST", f"{self.base}/{t['id']}/move",
                                 {"expectedVersion": 1, "status": "done", "index": 0})
        self.assertEqual((status, body["code"], body["currentVersion"]), (409, "stale", 2))
        status, body = self.call("POST", f"{self.base}/{t['id']}/move",
                                 {"expectedVersion": 2, "status": "done", "index": 0})
        self.assertEqual((status, body["task"]["status"]), (200, "done"))
        status, body = self.call("GET", self.base)
        self.assertIn(t["uid"], [x["uid"] for x in body["tasks"]])
        status, body = self.call("GET", f"{self.base}/export")
        self.assertEqual((status, body["format"]), (200, "quartizo.tasks"))
        status, body = self.call("POST", f"{self.base}/import", {"data": body})
        self.assertEqual((status, body["code"]), (409, "project_not_empty"))
        status, body = self.call("DELETE", f"/api/workspaces/{self.ws['id']}")
        self.assertEqual((status, body["code"], body["taskCount"]), (409, "project_has_tasks", len(self.call("GET", self.base)[1]["tasks"])))
        status, _ = self.call("POST", f"{self.base}/{t['id']}/delete", {"expectedVersion": 3, "confirm": True})
        self.assertEqual(status, 200)
        self.assertEqual(self.call("GET", f"{self.base}/{t['id']}")[0], 404)

    def test_unknown_routes_and_bad_ids(self):
        for method, target in (("GET", f"{self.base}/abc"), ("PUT", self.base), ("GET", f"{self.base}/1/move"),
                               ("POST", f"{self.base}/1/x"), ("GET", f"{self.base}/1/move/2"),
                               ("GET", "/api/workspaces/999/tasks")):
            with self.subTest(method=method, target=target):
                self.assertEqual(self.call(method, target, {} if method != "GET" else None)[0], 404)

    def test_import_body_limit(self):
        big = {"data": {"format": "quartizo.tasks", "version": 1, "tasks": [
            {"title": f"t{i}", "status": "backlog", "description_markdown": "x" * 60000} for i in range(30)]}}
        size = len(json.dumps(big))
        self.assertGreater(size, srv.MAX_BODY_BYTES)
        self.assertLess(size, tasks.MAX_IMPORT_BODY_BYTES)
        # Over 1 MiB is accepted for an import (it may still be refused as project_not_empty)...
        status, body = self.call("POST", f"/api/workspaces/{self.ws['id']}/tasks/import", big)
        self.assertIn(status, (200, 409), body)
        # ...but not for any other task route.
        status, body = self.call("POST", self.base, {"title": "t", "description_markdown": "x" * (srv.MAX_BODY_BYTES + 1)})
        self.assertEqual((status, body.get("code")), (413, "too_large"))
        # Over the import limit itself is refused, even with a fresh timestamp.
        # The server answers from the declared Content-Length, without reading the body.
        target = f"/api/workspaces/{self.ws['id']}/tasks/import"
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        try:
            conn.putrequest("POST", target)
            conn.putheader("X-KiroCrew-Proxy", proxy_header(SECRET, "POST", target, b""))
            conn.putheader("X-KiroCrew-Principal", principal_header(SECRET, "POST", target, b""))
            conn.putheader("Content-Type", "application/json")
            conn.putheader("Content-Length", str(tasks.MAX_IMPORT_BODY_BYTES + 1))
            conn.endheaders()
            res = conn.getresponse()
            self.assertEqual((res.status, json.loads(res.read()).get("code")), (413, "too_large"))
        finally:
            conn.close()

    def test_import_with_stale_proxy_timestamp_gets_the_1mib_limit(self):
        target = f"/api/workspaces/{self.ws['id']}/tasks/import"
        body = json.dumps({"data": {"format": "quartizo.tasks", "version": 1, "tasks": [],
                                    "pad": "x" * (srv.MAX_BODY_BYTES + 1024)}}).encode()
        self.assertLess(len(body), tasks.MAX_IMPORT_BODY_BYTES)
        stale = int(time.time()) - srv.MAX_SKEW_SECONDS - 60
        headers = {"X-KiroCrew-Proxy": proxy_header(SECRET, "POST", target, body, ts=stale),
                   "X-KiroCrew-Principal": principal_header(SECRET, "POST", target, body),
                   "Content-Type": "application/json"}
        status, res = _request(self.port, "POST", target, body=body, headers=headers)
        self.assertEqual((status, res.get("code")), (413, "too_large"))

    def test_non_owner_cannot_delete_a_workspace_and_its_tasks(self):
        status, body = signed_json(self.port, "POST", "/api/workspaces", {"path": str(self.vault2)})
        self.assertEqual(status, 201, body)
        ws_id = body["workspace"]["id"]
        status, body = self.call("POST", f"/api/workspaces/{ws_id}/tasks", {"title": "keep"})
        self.assertEqual(status, 201, body)
        for kind in ("app-token", "agent-tool", "none"):
            with self.subTest(kind=kind):
                status, body = self.call("DELETE", f"/api/workspaces/{ws_id}?deleteTasks=1", kind=kind, owner_id="")
                self.assertEqual((status, body["code"]), (403, "owner_session_required"))
        status, body = self.call("GET", f"/api/workspaces/{ws_id}/tasks")
        self.assertEqual([t["title"] for t in body["tasks"]], ["keep"])

    def test_deeply_nested_json_is_a_400_bad_json(self):
        deep = "[" * 100000 + "]" * 100000
        for target, method in ((self.base, "POST"), ("/api/workspaces", "POST")):
            with self.subTest(target=target):
                body = deep.encode()
                headers = {"X-KiroCrew-Proxy": proxy_header(SECRET, method, target, body),
                           "X-KiroCrew-Principal": principal_header(SECRET, method, target, body),
                           "Content-Type": "application/json"}
                status, res = _request(self.port, method, target, body=body, headers=headers)
                self.assertEqual((status, res.get("code")), (400, "bad_json"))
        self.assertEqual(self.call("GET", self.base)[0], 200)  # the server survived

    def test_every_task_route_needs_auth_and_owner(self):
        for method, target in (("GET", self.base), ("POST", self.base), ("PATCH", f"{self.base}/1"),
                               ("POST", f"{self.base}/1/move"), ("POST", f"{self.base}/1/delete"),
                               ("GET", f"{self.base}/export"), ("POST", f"{self.base}/import")):
            with self.subTest(method=method, target=target):
                for kind in ("app-token", "agent-tool", "none"):
                    status, body = self.call(method, target, kind=kind, owner_id="")
                    self.assertEqual((status, body["code"]), (403, "owner_session_required"))


if __name__ == "__main__":
    unittest.main()
