"""QTZ-004: workspace root registry and path confinement (refusal-heavy)."""
from __future__ import annotations

import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from tests.backend.signing import load_server, principal_header, proxy_header
from tests.backend.test_http import SECRET, _request, _start

srv = load_server()
import db  # noqa: E402  (importable once server.py has put backend/ on sys.path)
import workspace as wsmod  # noqa: E402
from workspace import ApiError, Registry  # noqa: E402


def signed_json(port, method, target, payload=None, **kw):
    body = json.dumps(payload).encode() if payload is not None else b""
    headers = {
        "X-KiroCrew-Proxy": proxy_header(SECRET, method, target, body),
        "X-KiroCrew-Principal": principal_header(SECRET, method, target, body, **kw),
    }
    if body:
        headers["Content-Type"] = "application/json"
    return _request(port, method, target, body=body, headers=headers)


class TmpTree(unittest.TestCase):
    """A temp tree: <tmp>/crew (protected KiroCrew home), <tmp>/a/..."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="quartizo-ws-")).resolve()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.crew = self.tmp / "crew"
        self.registry = Registry(self.crew / "apps" / "quartizo" / "data", protected=(str(self.crew),))
        self.a = self.tmp / "a"
        (self.a / "notes" / "sub").mkdir(parents=True)
        (self.a / "notes-private").mkdir()
        (self.a / "notes" / "n.md").write_text("in root\n")
        (self.a / "notes-private" / "secret.md").write_text("private\n")
        (self.tmp / "outside.md").write_text("outside\n")

    def refused(self, fn, *args, status=None, code=None):
        with self.assertRaises(ApiError) as ctx:
            fn(*args)
        if status is not None:
            self.assertEqual(ctx.exception.status, status, ctx.exception.message)
        if code is not None:
            self.assertEqual(ctx.exception.code, code, ctx.exception.message)
        return ctx.exception


class MigrationTests(unittest.TestCase):
    def test_migrations_apply_once_and_record_versions(self):
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / db.DB_FILENAME
            conn = db.connect(path)
            self.assertEqual(db.migrate(conn), len(db.MIGRATIONS))  # idempotent
            versions = [r[0] for r in conn.execute("SELECT version FROM schema_migrations ORDER BY version")]
            self.assertEqual(versions, list(range(1, len(db.MIGRATIONS) + 1)))
            conn.close()
            db.connect(path).close()  # reopen: nothing re-applied, no error


class RegistrationTests(TmpTree):
    def test_register_list_get_unregister(self):
        ws = self.registry.register(str(self.a / "notes"))
        self.assertEqual((ws.name, ws.path), ("notes", str(self.a / "notes")))
        self.assertEqual([w.id for w in self.registry.list()], [ws.id])
        self.assertEqual(self.registry.get(ws.id), ws)
        self.registry.unregister(ws.id)
        self.assertEqual(self.registry.list(), [])
        self.assertTrue((self.a / "notes" / "n.md").exists(), "unregister must not touch files")
        self.refused(self.registry.get, ws.id, status=404, code="workspace_not_found")
        self.refused(self.registry.unregister, ws.id, status=404)

    def test_registration_persists_across_instances(self):
        ws = self.registry.register(str(self.a / "notes"), "My vault")
        again = Registry(self.registry.data_dir)
        self.assertEqual(again.list(), [ws])

    def test_custom_and_bad_names(self):
        self.assertEqual(self.registry.register(str(self.a / "notes"), "  Vault ").name, "Vault")
        for bad in ("x" * 81, "a\nb", 7, ["n"]):
            with self.subTest(name=bad):
                self.refused(self.registry.register, str(self.a / "notes-private"), bad, code="bad_name")

    def test_refuses_bad_inputs(self):
        for bad in (None, "", "   ", 7, "relative/dir", "notes", "~/notes", "a\x00b", f"{self.a}/notes\x00"):
            with self.subTest(path=bad):
                self.refused(self.registry.register, bad, status=400)

    def test_refuses_missing_and_non_directories(self):
        self.refused(self.registry.register, str(self.tmp / "missing"), code="bad_root")
        self.refused(self.registry.register, str(self.tmp / "outside.md"), code="bad_root")

    def test_refuses_filesystem_root(self):
        for root in ("/", "//", "/.", "/tmp/.."):
            with self.subTest(root=root):
                self.refused(self.registry.register, root, code="root_refused")

    def test_refuses_home_itself_but_allows_inside(self):
        self.refused(self.registry.register, os.path.expanduser("~"), code="root_refused")
        fake_home = self.tmp / "home"
        (fake_home / "vault").mkdir(parents=True)
        with mock.patch.dict(os.environ, {"HOME": str(fake_home)}):
            self.refused(self.registry.register, str(fake_home), code="root_refused")
            self.refused(self.registry.register, str(fake_home) + "/", code="root_refused")
            self.assertEqual(self.registry.register(str(fake_home / "vault")).path, str(fake_home / "vault"))

    def test_refuses_kirocrew_home_and_data_dir_overlap(self):
        (self.crew / "agents").mkdir(parents=True)
        for p in (self.crew, self.crew / "agents", self.registry.data_dir, self.tmp):
            with self.subTest(path=p):
                self.refused(self.registry.register, str(p), code="root_refused")

    def test_overlap_refused_both_directions(self):
        ws = self.registry.register(str(self.a / "notes"))
        e = self.refused(self.registry.register, str(self.a / "notes" / "sub"), status=409, code="root_overlaps")
        self.assertEqual(e.extra["workspaceId"], ws.id)
        self.refused(self.registry.register, str(self.a), status=409, code="root_overlaps")
        self.refused(self.registry.register, str(self.a / "notes"), status=409, code="root_overlaps")
        self.refused(self.registry.register, str(self.a / "notes") + "/", status=409)
        self.refused(self.registry.register, str(self.a / "notes" / "sub" / ".."), status=409)

    def test_shared_prefix_sibling_is_not_an_overlap(self):
        self.registry.register(str(self.a / "notes"))
        private = self.registry.register(str(self.a / "notes-private"))
        self.assertEqual(private.path, str(self.a / "notes-private"))
        self.assertFalse(wsmod._inside(str(self.a / "notes-private"), str(self.a / "notes")))
        self.assertTrue(wsmod._inside(str(self.a / "notes" / "x"), str(self.a / "notes")))

    def test_symlinked_root_is_stored_as_its_realpath(self):
        link = self.tmp / "link-to-notes"
        link.symlink_to(self.a / "notes")
        ws = self.registry.register(str(link))
        self.assertEqual(ws.path, str(self.a / "notes"))
        # The same directory through the link or by its own name is an overlap.
        self.refused(self.registry.register, str(self.a / "notes"), status=409)

    def test_symlink_into_a_registered_root_is_an_overlap(self):
        self.registry.register(str(self.a / "notes"))
        (self.tmp / "sneaky").symlink_to(self.a / "notes" / "sub")
        self.refused(self.registry.register, str(self.tmp / "sneaky"), status=409, code="root_overlaps")

    def test_symlink_to_home_or_fs_root_refused(self):
        (self.tmp / "slash").symlink_to("/")
        self.refused(self.registry.register, str(self.tmp / "slash"), code="root_refused")
        (self.tmp / "homelink").symlink_to(os.path.expanduser("~"))
        self.refused(self.registry.register, str(self.tmp / "homelink"), code="root_refused")

    def test_alias_missed_by_realpath_is_caught_by_inode(self):
        # On a case-insensitive filesystem realpath may keep the caller's
        # spelling (`/a/NOTES` for `/a/notes`). Simulate that alias: realpath
        # returns a non-canonical spelling that still names the same directory.
        self.registry.register(str(self.a / "notes"))
        alias = str(self.a / "notes-private" / ".." / "notes")
        self.assertFalse(wsmod._inside(alias, str(self.a / "notes")))  # the string check alone misses it
        with mock.patch.object(wsmod.os.path, "realpath", side_effect=lambda p: p):
            self.refused(self.registry.register, alias, status=409, code="root_overlaps")

    def test_case_variants(self):
        probe = self.tmp / "CaseProbe"
        probe.mkdir()
        case_insensitive = (self.tmp / "caseprobe").exists()
        self.registry.register(str(self.a / "notes"))
        upper = self.a / "NOTES"
        if case_insensitive:
            # Same directory under another spelling: must be an overlap.
            self.refused(self.registry.register, str(upper), status=409)
        else:
            # Case-sensitive filesystem: a different spelling is a different
            # (here: missing) directory, and a real one is a separate root.
            self.refused(self.registry.register, str(upper), code="bad_root")
            upper.mkdir()
            self.assertEqual(self.registry.register(str(upper)).path, str(upper))


class RelPathTests(unittest.TestCase):
    def test_accepts_plain_relative_paths(self):
        self.assertEqual(wsmod.validate_relpath("a/b c/Ünï.md"), ["a", "b c", "Ünï.md"])

    def test_refuses_traversal_and_odd_forms(self):
        for bad in (
            None, "", 7, "..", "../x.md", "a/../../x.md", "a/..", "./a.md", "a/./b.md", "a//b.md",
            "/etc/passwd", "//x.md", "a/", "a\\..\\b.md", "..\\x.md", "a\x00.md", "a\nb.md", "a\x7fb.md",
            ".trash/x.md", ".obsidian/a.md", "a/.git/x.md", ".hidden.md", "x" * 1025, ("y" * 256) + ".md",
            "\ud800.md",
        ):
            with self.subTest(path=bad):
                with self.assertRaises(ApiError) as ctx:
                    wsmod.validate_relpath(bad)
                self.assertEqual(ctx.exception.status, 400)

    def test_percent_encoding_is_not_decoded_again(self):
        # The HTTP layer decodes the query once; a literal "%2e%2e" is a name.
        self.assertEqual(wsmod.validate_relpath("%2e%2e/x.md"), ["%2e%2e", "x.md"])

    def test_unicode_is_not_normalized(self):
        # NFC "é" and NFD "e + U+0301" are different names on Linux filesystems
        # (macOS APFS/HFS+ may treat them as the same file). Quartizo never
        # normalizes; either form is confined by the same fd walk.
        nfc, nfd = "café.md", "café.md"
        self.assertNotEqual(wsmod.validate_relpath(nfc), wsmod.validate_relpath(nfd))


class ConfinedOpenTests(TmpTree):
    def setUp(self):
        super().setUp()
        self.root = str(self.a / "notes")

    def read(self, rel):
        segments = wsmod.validate_relpath(rel)
        with wsmod.open_parent(self.root, segments) as parent:
            fd, _ = wsmod.open_file_at(parent, segments[-1])
            with os.fdopen(fd, "rb") as fh:
                return fh.read()

    def test_reads_inside_root(self):
        self.assertEqual(self.read("n.md"), b"in root\n")

    def test_symlink_out_of_root_refused(self):
        (self.a / "notes" / "out.md").symlink_to(self.tmp / "outside.md")
        (self.a / "notes" / "priv").symlink_to(self.a / "notes-private")
        with self.assertRaises(ApiError) as ctx:
            self.read("out.md")
        self.assertEqual(ctx.exception.code, "symlink_refused")
        with self.assertRaises(ApiError) as ctx:
            self.read("priv/secret.md")
        self.assertEqual(ctx.exception.code, "symlink_refused")

    def test_symlink_inside_root_also_refused(self):
        (self.a / "notes" / "alias.md").symlink_to("n.md")
        (self.a / "notes" / "subalias").symlink_to("sub")
        for rel in ("alias.md", "subalias/x.md"):
            with self.subTest(rel=rel), self.assertRaises(ApiError) as ctx:
                self.read(rel)
            self.assertEqual(ctx.exception.code, "symlink_refused")

    def test_dangling_symlink_refused(self):
        (self.a / "notes" / "dangling.md").symlink_to(self.tmp / "nope.md")
        with self.assertRaises(ApiError) as ctx:
            self.read("dangling.md")
        self.assertEqual(ctx.exception.code, "symlink_refused")

    def test_root_swapped_for_symlink_after_registration(self):
        ws = self.registry.register(self.root)
        moved = self.a / "notes-moved"
        os.rename(self.root, moved)
        os.symlink(self.a / "notes-private", self.root)  # attacker points the root elsewhere
        with self.assertRaises(ApiError) as ctx:
            wsmod.open_root(ws.path)
        self.assertEqual((ctx.exception.status, ctx.exception.code), (409, "root_changed"))

    def test_root_parent_swapped_for_symlink(self):
        nested = self.tmp / "p" / "vault"
        nested.mkdir(parents=True)
        ws = self.registry.register(str(nested))
        os.rename(self.tmp / "p", self.tmp / "p-old")
        (self.tmp / "p").symlink_to(self.tmp / "p-old")
        with self.assertRaises(ApiError) as ctx:
            wsmod.open_root(ws.path)
        self.assertEqual(ctx.exception.code, "root_changed")

    def test_missing_root(self):
        ws = self.registry.register(self.root)
        shutil.rmtree(self.root)
        with self.assertRaises(ApiError) as ctx:
            wsmod.open_root(ws.path)
        self.assertEqual(ctx.exception.code, "root_missing")

    def test_directory_and_fifo_are_not_files(self):
        os.mkfifo(self.a / "notes" / "pipe.md")
        (self.a / "notes" / "dir.md").mkdir()
        for rel in ("pipe.md", "dir.md"):
            with self.subTest(rel=rel), self.assertRaises(ApiError) as ctx:
                self.read(rel)
            self.assertEqual(ctx.exception.code, "not_a_file")

    def test_file_used_as_directory(self):
        with self.assertRaises(ApiError) as ctx:
            self.read("n.md/x.md")
        self.assertEqual(ctx.exception.status, 404)

    def test_missing_file(self):
        with self.assertRaises(ApiError) as ctx:
            self.read("sub/none.md")
        self.assertEqual(ctx.exception.code, "not_found")


class RegistryHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix="quartizo-http-")
        root = Path(cls.tmp.name).resolve()
        cls.vault = root / "vault"
        cls.vault.mkdir()
        cls.proc, cls.port = _start(SECRET, home=str(root / "crew"))

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        cls.proc.communicate(timeout=5)
        cls.tmp.cleanup()

    def test_register_list_unregister_round_trip(self):
        status, body = signed_json(self.port, "POST", "/api/workspaces", {"path": str(self.vault), "name": "V"})
        self.assertEqual(status, 201, body)
        ws = body["workspace"]
        self.assertEqual((ws["name"], ws["path"]), ("V", str(self.vault)))
        status, body = signed_json(self.port, "GET", "/api/workspaces")
        self.assertIn(ws, body["workspaces"])
        self.assertEqual(signed_json(self.port, "GET", f"/api/workspaces/{ws['id']}")[1]["workspace"], ws)
        status, body = signed_json(self.port, "POST", "/api/workspaces", {"path": str(self.vault)})
        self.assertEqual((status, body["code"]), (409, "root_overlaps"))
        self.assertEqual(signed_json(self.port, "DELETE", f"/api/workspaces/{ws['id']}")[0], 200)
        self.assertEqual(signed_json(self.port, "GET", f"/api/workspaces/{ws['id']}")[0], 404)

    def test_refusals_over_http(self):
        for payload, code in (
            ({"path": "/"}, "root_refused"),
            ({"path": "../etc"}, "bad_root"),
            ({"path": "/no/such/dir"}, "bad_root"),
            ({}, "bad_root"),
        ):
            with self.subTest(payload=payload):
                status, body = signed_json(self.port, "POST", "/api/workspaces", payload)
                self.assertEqual((status, body["code"]), (400, code))

    def test_bad_json_and_ids(self):
        target = "/api/workspaces"
        raw = b"not json"
        headers = {"X-KiroCrew-Proxy": proxy_header(SECRET, "POST", target, raw),
                   "X-KiroCrew-Principal": principal_header(SECRET, "POST", target, raw)}
        self.assertEqual(_request(self.port, "POST", target, body=raw, headers=headers)[1]["code"], "bad_json")
        self.assertEqual(signed_json(self.port, "POST", target, ["x"])[1]["code"], "bad_json")
        for bad_id in ("abc", "-1", "1.0", "%31", "9" * 13):
            with self.subTest(id=bad_id):
                self.assertEqual(signed_json(self.port, "GET", f"/api/workspaces/{bad_id}")[0], 404)

    def test_every_workspace_route_needs_auth_and_owner(self):
        for method, target in (("GET", "/api/workspaces"), ("POST", "/api/workspaces"),
                               ("GET", "/api/workspaces/1"), ("DELETE", "/api/workspaces/1")):
            with self.subTest(method=method, target=target):
                self.assertEqual(_request(self.port, method, target)[0], 401)
                for kind in ("app-token", "agent-tool", "none"):
                    status, body = signed_json(self.port, method, target, kind=kind, owner_id="")
                    self.assertEqual((status, body["code"]), (403, "owner_session_required"))


if __name__ == "__main__":
    unittest.main()
