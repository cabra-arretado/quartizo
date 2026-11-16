"""Signed Notes editor routes share the source files and index with the board."""

from __future__ import annotations

import hashlib
import os
import tempfile
import time
import unittest
from pathlib import Path
from urllib.parse import urlencode

from tests.backend.test_http import SECRET, _request, _start, _stop
from tests.backend.test_workspace import signed_json


class NotesHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        tmp = tempfile.TemporaryDirectory(prefix="quartizo-notes-http-")
        cls.addClassCleanup(tmp.cleanup)
        cls.root = Path(tmp.name).resolve()
        proc, cls.port = _start(SECRET, home=str(cls.root / "crew"))
        cls.addClassCleanup(_stop, proc)

    def setUp(self):
        self.vault = self.root / self._testMethodName
        self.vault.mkdir()
        status, body = self.call("POST", "/api/workspaces", {"path": str(self.vault), "companion": True})
        self.assertEqual(status, 201, body)
        self.ws_id = body["workspace"]["id"]
        self.base = f"/api/workspaces/{self.ws_id}"
        self.addCleanup(self.call, "DELETE", self.base)

    def call(self, method, target, payload=None, **kw):
        return signed_json(self.port, method, target, payload, **kw)

    def wait_for(self, target, predicate):
        deadline = time.monotonic() + 10
        while True:
            status, body = self.call("GET", target)
            self.assertEqual(status, 200, body)
            if predicate(body):
                return body
            if time.monotonic() >= deadline:
                self.fail(f"index did not update: {body}")
            time.sleep(0.05)

    def test_signed_routes_require_the_owner_session(self):
        for method, path in (("GET", "notes"), ("GET", "backlinks"), ("POST", "notes"), ("PUT", "source")):
            with self.subTest(method=method, path=path):
                target = f"{self.base}/{path}"
                self.assertEqual(_request(self.port, method, target)[0], 401)
                status, body = self.call(method, target, kind="agent-tool", owner_id="")
                self.assertEqual((status, body.get("code")), (403, "owner_session_required"))

    def test_create_list_read_and_save_preserve_the_markdown(self):
        path = "projects/Café + roadmap.md"
        source = f"{self.base}/source?{urlencode({'path': path})}"
        original = "\ufeff# Café ☕\r\n[[Target|Alias]]\r\n"
        status, created = self.call("POST", f"{self.base}/notes", {"path": path, "content": original})
        self.assertEqual((status, created), (201, {"path": path, "hash": hashlib.sha256(original.encode()).hexdigest()}))
        self.assertEqual(self.call("GET", source), (200, {**created, "content": original}))
        # The list is shared with Tasks and TODOs, including ordinary notes.
        self.wait_for(f"{self.base}/notes", lambda body: body["notes"] == [{"path": path, "title": "Café ☕"}])
        updated = original.replace("Café ☕", "Renamed heading")
        status, saved = self.call("PUT", f"{self.base}/source",
                                  {"path": path, "content": updated, "expectedHash": created["hash"]})
        self.assertEqual((status, saved), (200, {"path": path, "hash": hashlib.sha256(updated.encode()).hexdigest()}))
        self.assertEqual((self.vault / path).read_bytes(), updated.encode())
        self.wait_for(f"{self.base}/notes", lambda body: body["notes"] == [{"path": path, "title": "Renamed heading"}])
        status, target = self.call("POST", f"{self.base}/notes", {"path": "target.md", "content": "# Target\n"})
        self.assertEqual(status, 201, target)
        self.wait_for(f"{self.base}/backlinks?path=target.md", lambda body: body == {
            "notes": [{"path": path, "title": "Renamed heading"}], "truncated": False})

    def test_editing_a_ticket_updates_the_same_board_and_todos(self):
        path = "ticket.md"
        original = (f'---\nid: "{"a" * 32}"\ntype: ticket\nstatus: ready\norder: "{"7" * 32}"\n---\n'
                    "# First\n- [ ] original\n")
        status, created = self.call("POST", f"{self.base}/notes", {"path": path, "content": original})
        self.assertEqual(status, 201, created)
        self.wait_for(f"{self.base}/board", lambda body: any(t["status"] == "ready" for t in body["tickets"]))

        updated = original.replace("status: ready", "status: done").replace("[ ] original", "[x] updated")
        status, body = self.call("PUT", f"{self.base}/source",
                                 {"path": path, "content": updated, "expectedHash": created["hash"]})
        self.assertEqual(status, 200, body)
        board = self.wait_for(f"{self.base}/board", lambda body: any(t["status"] == "done" for t in body["tickets"]))
        self.assertEqual(board["tickets"][0]["todos"], {"done": 1, "total": 1})
        status, todos = self.call("GET", f"/api/companion/todos?workspace={self.ws_id}&state=all")
        self.assertEqual(status, 200, todos)
        self.assertEqual(todos["groups"][0]["items"][0]["text"], "updated")

    def test_note_save_respects_custom_board_columns(self):
        columns = [{"id": "backlog", "label": "Backlog"}, {"id": "qa", "label": "Quality review"}]
        status, result = self.call("PUT", f"{self.base}/columns", {"columns": columns, "columnsVersion": 0})
        self.assertEqual(status, 200, result)
        path = "custom.md"
        original = (f'---\nid: "{"b" * 32}"\ntype: ticket\nstatus: backlog\norder: "{"7" * 32}"\n---\n'
                    "# Custom column\n- [ ] Review\n")
        status, created = self.call("POST", f"{self.base}/notes", {"path": path, "content": original})
        self.assertEqual(status, 201, created)
        self.wait_for(f"{self.base}/board", lambda body: any(t["lane"] == "backlog" for t in body["tickets"]))

        updated = original.replace("status: backlog", 'status: "qa"').replace("[ ] Review", "[x] Reviewed")
        status, saved = self.call("PUT", f"{self.base}/source",
                                  {"path": path, "content": updated, "expectedHash": created["hash"]})
        self.assertEqual(status, 200, saved)
        board = self.wait_for(f"{self.base}/board", lambda body: any(t["lane"] == "qa" for t in body["tickets"]))
        self.assertEqual(board["tickets"][0]["todos"], {"done": 1, "total": 1})
        status, todos = self.call("GET", f"/api/companion/todos?workspace={self.ws_id}&state=all")
        self.assertEqual(status, 200, todos)
        self.assertEqual(todos["groups"][0]["statusLabel"], "Quality review")

        status, removed = self.call("PUT", f"{self.base}/columns",
                                    {"columns": columns[:1], "columnsVersion": result["workspace"]["columnsVersion"]})
        self.assertEqual(status, 200, removed)
        board = self.wait_for(f"{self.base}/board", lambda body: any(t["lane"] == "repair" for t in body["tickets"]))
        ticket = board["tickets"][0]
        self.assertEqual(ticket["status"], "qa")
        self.assertIn("unconfigured_status", [diagnostic["code"] for diagnostic in ticket["diagnostics"]])
        self.assertEqual((self.vault / path).read_bytes(), updated.encode())

    def test_stale_save_and_create_collision_leave_live_file_untouched(self):
        path = self.vault / "note.md"
        path.write_bytes(b"# First\n")
        _, opened = self.call("GET", f"{self.base}/source?path=note.md")
        stamp = path.stat()
        external = b"# Other\n"
        path.write_bytes(external)
        os.utime(path, ns=(stamp.st_atime_ns, stamp.st_mtime_ns))

        status, body = self.call("PUT", f"{self.base}/source",
                                 {"path": "note.md", "content": "overwrite", "expectedHash": opened["hash"]})
        self.assertEqual((status, body["code"], body["currentHash"]),
                         (409, "conflict", hashlib.sha256(external).hexdigest()))
        status, body = self.call("POST", f"{self.base}/notes", {"path": "note.md"})
        self.assertEqual((status, body["code"]), (409, "exists"))
        self.assertEqual(path.read_bytes(), external)

        path.unlink()
        status, body = self.call("PUT", f"{self.base}/source",
                                 {"path": "note.md", "content": "recreate", "expectedHash": opened["hash"]})
        self.assertEqual((status, body["code"]), (409, "conflict"))
        self.assertFalse(path.exists())

    def test_bad_paths_content_and_missing_hash_are_refused(self):
        outside = self.root / "outside"
        outside.mkdir()
        (self.vault / "shortcut").symlink_to(outside, target_is_directory=True)
        for method, route, body, expected in (
            ("POST", "notes", {"path": "../escape.md"}, (400, "bad_path")),
            ("POST", "notes", {"path": ".hidden/note.md"}, (400, "bad_path")),
            ("POST", "notes", {"path": "shortcut/note.md"}, (403, "symlink_refused")),
            ("POST", "notes", {"path": "folder/" * 33 + "note.md"}, (400, "bad_path")),
            ("POST", "notes", {"path": "note.txt"}, (400, "not_markdown")),
            ("POST", "notes", {"path": "note.md", "content": ["text"]}, (400, "bad_content")),
            ("POST", "notes", {"path": "note.md", "content": "\ud800"}, (400, "bad_content")),
            ("PUT", "source", {"path": "note.md", "content": "recreate"}, (400, "bad_hash")),
        ):
            with self.subTest(method=method, route=route, body=body):
                status, response = self.call(method, f"{self.base}/{route}", body)
                self.assertEqual((status, response.get("code")), expected)
        self.assertFalse((self.vault / "note.md").exists())
        self.assertEqual(list(outside.iterdir()), [])

    def test_note_content_can_exceed_the_standard_request_limit(self):
        content = "# Large\n" + "a" * (64 << 10)
        status, created = self.call("POST", f"{self.base}/notes", {"path": "large.md", "content": content})
        self.assertEqual(status, 201, created)
        status, body = self.call("PUT", f"{self.base}/source",
                                 {"path": "large.md", "content": content + "!", "expectedHash": created["hash"]})
        self.assertEqual(status, 200, body)
        status, body = self.call("POST", f"{self.base}/notes",
                                 {"path": "oversized.md", "content": "a" * ((2 << 20) + 1)})
        self.assertEqual((status, body.get("code")), (413, "too_large"))
        self.assertFalse((self.vault / "oversized.md").exists())
