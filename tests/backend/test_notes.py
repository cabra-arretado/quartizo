"""QTZ-005: Markdown list/search/read/create/update/rename/delete."""
from __future__ import annotations

import hashlib
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from tests.backend.signing import load_server
from tests.backend.test_http import SECRET, _start
from tests.backend.test_workspace import signed_json

srv = load_server()
import notes  # noqa: E402
from workspace import ApiError  # noqa: E402


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class NotesTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="quartizo-notes-")).resolve()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.root = self.tmp / "vault"
        (self.root / "daily").mkdir(parents=True)
        self.root_s = str(self.root)

    def put(self, rel, data: bytes):
        p = self.root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
        return p

    def refused(self, fn, *args, status=None, code=None, **kw):
        with self.assertRaises(ApiError) as ctx:
            fn(*args, **kw)
        if status is not None:
            self.assertEqual(ctx.exception.status, status, ctx.exception.message)
        if code is not None:
            self.assertEqual(ctx.exception.code, code, ctx.exception.message)
        return ctx.exception


class ReadTests(NotesTestCase):
    def test_bytes_and_line_endings_round_trip_exactly(self):
        samples = {
            "lf.md": b"# T\n\nbody\n",
            "crlf.md": b"# T\r\n\r\nbody\r\n",
            "mixed.md": b"a\r\nb\nc\rd",
            "bom.md": b"\xef\xbb\xbf# with BOM\n",
            "no-newline.md": b"last line",
            "unicode.md": "café ☃ \U0001f600\ttab\x00nul\n".encode(),
            "empty.md": b"",
        }
        for name, data in samples.items():
            with self.subTest(name=name):
                self.put(name, data)
                got = notes.read_note(self.root_s, name)
                self.assertEqual(got["content"].encode("utf-8"), data)
                self.assertEqual((got["hash"], got["size"]), (sha(data), len(data)))
                # Writing the same string back reproduces the same bytes.
                notes.update_note(self.root_s, name, got["content"], got["hash"])
                self.assertEqual((self.root / name).read_bytes(), data)

    def test_only_md(self):
        self.put("a.txt", b"x")
        for rel in ("a.txt", "a.md.txt", ".md", "a.MD", "a", "daily"):
            with self.subTest(rel=rel):
                self.refused(notes.read_note, self.root_s, rel, status=400)

    def test_size_limit(self):
        self.put("big.md", b"x" * (notes.MAX_FILE_BYTES + 1))
        self.refused(notes.read_note, self.root_s, "big.md", status=413, code="too_large")
        self.put("edge.md", b"x" * notes.MAX_FILE_BYTES)
        self.assertEqual(notes.read_note(self.root_s, "edge.md")["size"], notes.MAX_FILE_BYTES)

    def test_not_utf8_refused(self):
        self.put("latin1.md", "café".encode("latin-1"))
        self.refused(notes.read_note, self.root_s, "latin1.md", status=415, code="not_utf8")

    def test_traversal_and_symlinks(self):
        (self.tmp / "outside.md").write_text("secret")
        (self.root / "link.md").symlink_to(self.tmp / "outside.md")
        self.refused(notes.read_note, self.root_s, "../outside.md", status=400)
        self.refused(notes.read_note, self.root_s, "link.md", status=403, code="symlink_refused")
        self.refused(notes.read_note, self.root_s, "missing.md", status=404)


class WriteTests(NotesTestCase):
    def test_create_new_note_and_parents(self):
        meta = notes.create_note(self.root_s, "projects/q1/plan.md", "# Plan\r\n")
        p = self.root / "projects" / "q1" / "plan.md"
        self.assertEqual(p.read_bytes(), b"# Plan\r\n")
        self.assertEqual(meta["hash"], sha(b"# Plan\r\n"))
        self.assertEqual(meta["path"], "projects/q1/plan.md")

    def test_create_never_clobbers(self):
        self.put("a.md", b"original")
        self.refused(notes.create_note, self.root_s, "a.md", "new", status=409, code="exists")
        self.assertEqual((self.root / "a.md").read_bytes(), b"original")

    def test_create_refusals(self):
        (self.tmp / "elsewhere").mkdir()
        (self.root / "out").symlink_to(self.tmp / "elsewhere")
        for rel, content, code in (
            ("x.txt", "", "not_markdown"),
            ("../x.md", "", "bad_path"),
            (".trash/x.md", "", "bad_path"),
            ("out/x.md", "", "symlink_refused"),
            ("ok.md", 7, "bad_content"),
            ("ok.md", "\ud800", "bad_content"),
            ("ok.md", "x" * (notes.MAX_FILE_BYTES + 1), "too_large"),
        ):
            with self.subTest(rel=rel, code=code):
                self.refused(notes.create_note, self.root_s, rel, content, code=code)
        self.assertEqual(list((self.tmp / "elsewhere").iterdir()), [])

    def test_update_with_matching_hash(self):
        self.put("a.md", b"v1\n")
        meta = notes.update_note(self.root_s, "a.md", "v2\r\n", sha(b"v1\n"))
        self.assertEqual((self.root / "a.md").read_bytes(), b"v2\r\n")
        self.assertEqual(meta["hash"], sha(b"v2\r\n"))

    def test_update_conflict_on_external_edit(self):
        self.put("a.md", b"v1")
        read = notes.read_note(self.root_s, "a.md")
        self.put("a.md", b"edited elsewhere")  # concurrent external edit
        e = self.refused(notes.update_note, self.root_s, "a.md", "mine", read["hash"], status=409, code="conflict")
        self.assertEqual(e.extra["currentHash"], sha(b"edited elsewhere"))
        self.assertIsInstance(e.extra["currentMtimeMs"], int)
        self.assertEqual((self.root / "a.md").read_bytes(), b"edited elsewhere")

    def test_update_conflict_when_edit_lands_during_write(self):
        # The external edit happens after the first check, while the temp file
        # is being written: the late re-check must still refuse.
        self.put("a.md", b"v1")
        real_write_temp = notes._write_temp

        def racing(parent_fd, data, mode):
            tmp = real_write_temp(parent_fd, data, mode)
            (self.root / "a.md").write_bytes(b"raced")
            return tmp

        with mock.patch.object(notes, "_write_temp", racing):
            self.refused(notes.update_note, self.root_s, "a.md", "mine", sha(b"v1"), status=409, code="conflict")
        self.assertEqual((self.root / "a.md").read_bytes(), b"raced")
        self.assertEqual(sorted(os.listdir(self.root)), ["a.md", "daily"], "temp file left behind")

    def test_update_conflict_when_deleted_externally(self):
        self.put("a.md", b"v1")
        (self.root / "a.md").unlink()
        e = self.refused(notes.update_note, self.root_s, "a.md", "x", sha(b"v1"), status=409, code="conflict")
        self.assertIsNone(e.extra["currentHash"])
        self.assertFalse((self.root / "a.md").exists(), "a conflicting update must not re-create the note")

    def test_update_requires_well_formed_hash(self):
        self.put("a.md", b"v1")
        for bad in (None, "", "abc", sha(b"v1").upper(), 7):
            with self.subTest(hash=bad):
                self.refused(notes.update_note, self.root_s, "a.md", "x", bad, status=400, code="bad_hash")

    def test_update_is_atomic_replace_and_keeps_mode(self):
        p = self.put("a.md", b"v1")
        os.chmod(p, 0o600)
        hard = self.tmp / "hardlink.md"
        os.link(p, hard)  # someone else's name for the old inode
        old_inode = p.stat().st_ino
        notes.update_note(self.root_s, "a.md", "v2", sha(b"v1"))
        st = p.stat()
        self.assertNotEqual(st.st_ino, old_inode, "update must replace, not write in place")
        self.assertEqual(st.st_mode & 0o777, 0o600)
        self.assertEqual(hard.read_bytes(), b"v1", "write must not go through a hard link")
        self.assertEqual(sorted(os.listdir(self.root)), ["a.md", "daily"])

    def test_update_refuses_symlink_target(self):
        (self.tmp / "outside.md").write_bytes(b"secret")
        (self.root / "l.md").symlink_to(self.tmp / "outside.md")
        self.refused(notes.update_note, self.root_s, "l.md", "pwn", sha(b"secret"), status=403)
        self.assertEqual((self.tmp / "outside.md").read_bytes(), b"secret")


class RenameDeleteTests(NotesTestCase):
    def test_rename(self):
        self.put("a.md", b"A")
        out = notes.rename_note(self.root_s, "a.md", "folder/b.md")
        self.assertEqual(out, {"path": "folder/b.md", "trashed": None})
        self.assertFalse((self.root / "a.md").exists())
        self.assertEqual((self.root / "folder" / "b.md").read_bytes(), b"A")

    def test_rename_onto_existing_needs_overwrite_and_confirm(self):
        self.put("a.md", b"A")
        self.put("b.md", b"B")
        for kw in ({}, {"overwrite": True}, {"confirm": True}, {"overwrite": True, "confirm": "yes"}):
            with self.subTest(kw=kw):
                self.refused(notes.rename_note, self.root_s, "a.md", "b.md", status=409, code="exists", **kw)
                self.assertEqual((self.root / "b.md").read_bytes(), b"B")
        out = notes.rename_note(self.root_s, "a.md", "b.md", overwrite=True, confirm=True)
        self.assertEqual(out["trashed"], ".trash/b.md")
        self.assertEqual((self.root / "b.md").read_bytes(), b"A")
        self.assertEqual((self.root / ".trash" / "b.md").read_bytes(), b"B", "the displaced note is kept in .trash")

    def test_rename_expected_hash(self):
        self.put("a.md", b"A")
        self.refused(notes.rename_note, self.root_s, "a.md", "b.md", expected_hash=sha(b"old"), status=409)
        self.assertTrue((self.root / "a.md").exists())

    def test_rename_refusals(self):
        self.put("a.md", b"A")
        self.refused(notes.rename_note, self.root_s, "a.md", "a.md", code="same_path")
        self.refused(notes.rename_note, self.root_s, "a.md", "../a.md", code="bad_path")
        self.refused(notes.rename_note, self.root_s, "a.md", "a.txt", code="not_markdown")
        self.refused(notes.rename_note, self.root_s, "a.md", ".trash/a.md", code="bad_path")
        self.refused(notes.rename_note, self.root_s, "nope.md", "b.md", status=404)
        (self.root / "l.md").symlink_to("a.md")
        self.refused(notes.rename_note, self.root_s, "l.md", "b.md", code="symlink_refused")

    def test_delete_moves_to_trash_and_needs_confirm(self):
        self.put("daily/2026-10-20.md", b"today")
        for confirm in (None, False, "true", 1):
            with self.subTest(confirm=confirm):
                self.refused(notes.delete_note, self.root_s, "daily/2026-10-20.md", confirm=confirm,
                             code="confirm_required")
        self.assertTrue((self.root / "daily" / "2026-10-20.md").exists())
        out = notes.delete_note(self.root_s, "daily/2026-10-20.md", confirm=True)
        self.assertEqual(out, {"trashed": ".trash/daily/2026-10-20.md"})
        self.assertFalse((self.root / "daily" / "2026-10-20.md").exists())
        self.assertEqual((self.root / ".trash" / "daily" / "2026-10-20.md").read_bytes(), b"today")

    def test_delete_collisions_get_suffixes(self):
        for i in range(3):
            self.put("a.md", f"v{i}".encode())
            notes.delete_note(self.root_s, "a.md", confirm=True)
        self.assertEqual(sorted(os.listdir(self.root / ".trash")), ["a 1.md", "a 2.md", "a.md"])
        self.assertEqual((self.root / ".trash" / "a 2.md").read_bytes(), b"v2")

    def test_delete_expected_hash_and_refusals(self):
        self.put("a.md", b"A")
        self.refused(notes.delete_note, self.root_s, "a.md", confirm=True, expected_hash=sha(b"x"), status=409)
        self.refused(notes.delete_note, self.root_s, "missing.md", confirm=True, status=404)
        (self.root / "l.md").symlink_to("a.md")
        self.refused(notes.delete_note, self.root_s, "l.md", confirm=True, code="symlink_refused")
        self.assertTrue((self.root / "l.md").is_symlink())

    def test_trash_that_is_a_symlink_is_refused(self):
        (self.tmp / "elsewhere").mkdir()
        (self.root / ".trash").symlink_to(self.tmp / "elsewhere")
        self.put("a.md", b"A")
        self.refused(notes.delete_note, self.root_s, "a.md", confirm=True, code="symlink_refused")
        self.assertTrue((self.root / "a.md").exists())
        self.assertEqual(list((self.tmp / "elsewhere").iterdir()), [])


class ListTests(NotesTestCase):
    def setUp(self):
        super().setUp()
        self.put("Inbox.md", b"Buy milk\n")
        self.put("daily/2026-10-20.md", b"# Today\nMet Alice about the Quartz plan\n")
        self.put("projects/quartizo.md", b"plan\n")
        self.put("notes.txt", b"quartz")
        self.put(".obsidian/workspace.md", b"quartz")
        self.put(".trash/old.md", b"quartz")
        (self.tmp / "outside").mkdir()
        (self.tmp / "outside" / "x.md").write_text("quartz")
        (self.root / "linked").symlink_to(self.tmp / "outside")
        (self.root / "alias.md").symlink_to("Inbox.md")

    def paths(self, **kw):
        return [f["path"] for f in notes.list_notes(self.root_s, **kw)["files"]]

    def test_lists_md_only_skipping_hidden_and_symlinks(self):
        self.assertEqual(self.paths(), ["Inbox.md", "daily/2026-10-20.md", "projects/quartizo.md"])
        item = notes.list_notes(self.root_s)["files"][0]
        self.assertEqual(set(item), {"path", "size", "mtimeMs"})

    def test_filename_search_is_case_insensitive(self):
        self.assertEqual(self.paths(query="QUART"), ["projects/quartizo.md"])
        self.assertEqual(self.paths(query="daily/"), ["daily/2026-10-20.md"])

    def test_content_search(self):
        out = notes.list_notes(self.root_s, query="alice", content=True)["files"]
        self.assertEqual([(f["path"], f["match"]) for f in out], [("daily/2026-10-20.md", "content")])
        self.assertIn("Alice", out[0]["snippet"])
        self.assertEqual(self.paths(query="alice"), [], "content search is opt-in")
        both = notes.list_notes(self.root_s, query="quart", content=True)["files"]
        self.assertEqual([(f["path"], f["match"]) for f in both],
                         [("daily/2026-10-20.md", "content"), ("projects/quartizo.md", "name")])

    def test_bounds(self):
        with mock.patch.object(notes, "MAX_LIST_FILES", 2):
            out = notes.list_notes(self.root_s)
        self.assertEqual((len(out["files"]), out["truncated"]), (2, True))
        self.put("a/b/c/deep.md", b"")
        with mock.patch.object(notes, "MAX_LIST_DEPTH", 1):
            out = notes.list_notes(self.root_s)
        self.assertNotIn("a/b/c/deep.md", [f["path"] for f in out["files"]])
        self.assertTrue(out["truncated"])
        with mock.patch.object(notes, "MAX_SCAN_ENTRIES", 1):
            self.assertTrue(notes.list_notes(self.root_s)["truncated"])
        self.refused(notes.list_notes, self.root_s, query="x" * 201, code="bad_query")

    def test_large_files_are_listed_but_not_content_searched(self):
        self.put("big.md", b"needle" + b"x" * notes.MAX_FILE_BYTES)
        self.assertEqual(self.paths(query="needle", content=True), [])
        self.assertIn("big.md", self.paths())


class NotesHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix="quartizo-nhttp-")
        base = Path(cls.tmp.name).resolve()
        cls.vault = base / "vault"
        cls.vault.mkdir()
        cls.proc, cls.port = _start(SECRET, home=str(base / "crew"))
        status, body = signed_json(cls.port, "POST", "/api/workspaces", {"path": str(cls.vault)})
        assert status == 201, body
        cls.base = f"/api/workspaces/{body['workspace']['id']}"

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        cls.proc.communicate(timeout=5)
        cls.tmp.cleanup()

    def call(self, method, action, payload=None, query=""):
        return signed_json(self.port, method, f"{self.base}/{action}{query}", payload)

    def test_full_lifecycle_with_external_edit_conflict(self):
        status, created = self.call("POST", "note", {"path": "life/a b+c.md", "content": "one\r\n"})
        self.assertEqual(status, 201, created)
        self.assertEqual((self.vault / "life" / "a b+c.md").read_bytes(), b"one\r\n")

        status, listing = self.call("GET", "notes", query="?q=B%2BC")
        self.assertEqual([f["path"] for f in listing["files"]], ["life/a b+c.md"])

        status, read = self.call("GET", "note", query="?path=life%2Fa%20b%2Bc.md")
        self.assertEqual((status, read["content"], read["hash"]), (200, "one\r\n", created["hash"]))

        (self.vault / "life" / "a b+c.md").write_bytes(b"external\n")
        status, body = self.call("PUT", "note", {"path": "life/a b+c.md", "content": "mine", "expectedHash": read["hash"]})
        self.assertEqual((status, body["code"], body["currentHash"]), (409, "conflict", sha(b"external\n")))
        self.assertEqual((self.vault / "life" / "a b+c.md").read_bytes(), b"external\n")

        status, body = self.call("PUT", "note", {"path": "life/a b+c.md", "content": "mine", "expectedHash": body["currentHash"]})
        self.assertEqual(status, 200, body)

        status, body = self.call("POST", "rename", {"from": "life/a b+c.md", "to": "life/renamed.md"})
        self.assertEqual((status, body["path"]), (200, "life/renamed.md"))

        status, body = self.call("POST", "delete", {"path": "life/renamed.md"})
        self.assertEqual((status, body["code"]), (400, "confirm_required"))
        status, body = self.call("POST", "delete", {"path": "life/renamed.md", "confirm": True})
        self.assertEqual((status, body["trashed"]), (200, ".trash/life/renamed.md"))
        self.assertEqual((self.vault / ".trash" / "life" / "renamed.md").read_bytes(), b"mine")

    def test_large_note_body_accepted_up_to_limit(self):
        content = "x" * notes.MAX_FILE_BYTES
        status, body = self.call("POST", "note", {"path": "big.md", "content": content})
        self.assertEqual(status, 201, body)
        status, body = self.call("POST", "note", {"path": "big2.md", "content": content + "y"})
        self.assertEqual((status, body["code"]), (413, "too_large"))

    def test_http_refusals(self):
        for method, action, payload, query, expect in (
            ("GET", "note", None, "?path=..%2Fx.md", (400, "bad_path")),
            ("GET", "note", None, "?path=%2Fetc%2Fpasswd", (400, "bad_path")),
            ("GET", "note", None, "", (400, "bad_path")),
            ("GET", "note", None, "?path=x.md%00.md", (400, "bad_path")),
            ("POST", "note", {"path": "a.txt", "content": ""}, "", (400, "not_markdown")),
            ("PUT", "note", {"path": "nope.md", "content": "", "expectedHash": "0" * 64}, "", (409, "conflict")),
            ("POST", "rename", {"from": "nope.md", "to": "b.md"}, "", (404, "not_found")),
        ):
            with self.subTest(method=method, action=action, query=query):
                status, body = self.call(method, action, payload, query)
                self.assertEqual((status, body.get("code")), expect, body)
        for method, action in (("DELETE", "note"), ("GET", "rename"), ("PUT", "delete"), ("GET", "bogus")):
            with self.subTest(method=method, action=action):
                self.assertEqual(self.call(method, action)[0], 404)
        status, body = signed_json(self.port, "GET", "/api/workspaces/999/notes")
        self.assertEqual((status, body["code"]), (404, "workspace_not_found"))

    def test_note_routes_need_auth_and_owner(self):
        from tests.backend.test_http import _request
        for method, action in (("GET", "notes"), ("GET", "note?path=a.md"), ("POST", "note"),
                               ("PUT", "note"), ("POST", "rename"), ("POST", "delete")):
            with self.subTest(method=method, action=action):
                target = f"{self.base}/{action}"
                self.assertEqual(_request(self.port, method, target)[0], 401)
                payload = {"path": "a.md", "confirm": True}
                status, body = signed_json(self.port, method, target, payload, kind="agent-tool", owner_id="")
                self.assertEqual((status, body["code"]), (403, "owner_session_required"))


if __name__ == "__main__":
    unittest.main()
