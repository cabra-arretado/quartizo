"""M1 review fixes: moves that never lose a concurrent replace, errno mapping,
root ownership/mode, read-only notes, hard-link aliases, body limits,
connection cap and bounded directory scans."""
from __future__ import annotations

import contextlib
import os
import shutil
import socket
import stat
import tempfile
import time
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from tests.backend.signing import load_server, proxy_header
from tests.backend.test_http import SECRET, _start, _stop
from tests.backend.test_notes import sha
from tests.backend.test_workspace import signed_json

srv = load_server()
import notes  # noqa: E402
import workspace as wsmod  # noqa: E402
from workspace import ApiError, Registry  # noqa: E402

AS_ROOT = os.getuid() == 0


class Tree(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="quartizo-hard-")).resolve()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.root = self.tmp / "vault"
        self.root.mkdir()
        self.r = str(self.root)

    def put(self, rel, data: bytes) -> Path:
        p = self.root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
        return p

    def refused(self, fn, *args, code=None, status=None, **kw) -> ApiError:
        with self.assertRaises(ApiError) as ctx:
            fn(*args, **kw)
        if code is not None:
            self.assertEqual(ctx.exception.code, code, ctx.exception.message)
        if status is not None:
            self.assertEqual(ctx.exception.status, status, ctx.exception.message)
        return ctx.exception


def _replace_src_after_link(path: Path, data: bytes):
    """A `_link` that links, then lets an external editor atomically replace the source."""
    real_link = notes._link

    def link(src_dir, src, dst_dir, dst):
        real_link(src_dir, src, dst_dir, dst)
        tmp = path.with_name(".editor-tmp")
        tmp.write_bytes(data)
        os.replace(tmp, path)

    return link


class MoveRaceTests(Tree):
    """Probe: an external atomic replace of the source lands mid-move."""

    def test_renameat2_is_used_on_linux(self):
        if not os.uname().sysname == "Linux":
            self.skipTest("renameat2 is Linux-only")
        self.assertIsNotNone(notes._renameat2)

    def test_fallback_rename_rolls_back_when_source_replaced(self):
        src = self.put("a.md", b"old")
        with mock.patch.object(notes, "_renameat2", None), \
             mock.patch.object(notes, "_link", _replace_src_after_link(src, b"NEW external")):
            self.refused(notes.rename_note, self.r, "a.md", "b.md", code="conflict", status=409)
        self.assertEqual(src.read_bytes(), b"NEW external", "the concurrent edit must survive")
        self.assertFalse((self.root / "b.md").exists(), "the half-done move must be rolled back")

    def test_fallback_trash_rolls_back_when_source_replaced(self):
        src = self.put("a.md", b"old")
        with mock.patch.object(notes, "_renameat2", None), \
             mock.patch.object(notes, "_link", _replace_src_after_link(src, b"NEW external")):
            self.refused(notes.delete_note, self.r, "a.md", confirm=True, code="conflict")
        self.assertEqual(src.read_bytes(), b"NEW external")
        self.assertEqual(list((self.root / ".trash").iterdir()), [])

    def test_renameat2_carries_a_replace_that_lands_before_the_move(self):
        if notes._renameat2 is None:
            self.skipTest("no renameat2")
        src = self.put("a.md", b"old")
        real = notes._renameat2

        def racing(*args):
            tmp = self.root / ".editor-tmp"
            tmp.write_bytes(b"NEW external")
            os.replace(tmp, src)
            return real(*args)

        with mock.patch.object(notes, "_renameat2", racing):
            notes.rename_note(self.r, "a.md", "b.md")
        self.assertEqual((self.root / "b.md").read_bytes(), b"NEW external", "nothing lost: the new content moved")
        self.assertFalse(src.exists())

    def test_fallback_moves_normally(self):
        self.put("a.md", b"A")
        with mock.patch.object(notes, "_renameat2", None):
            notes.rename_note(self.r, "a.md", "d/b.md")
            self.put("c.md", b"C")
            self.assertEqual(notes.delete_note(self.r, "c.md", confirm=True)["trashed"], ".trash/c.md")
        self.assertEqual((self.root / "d" / "b.md").read_bytes(), b"A")
        self.assertFalse((self.root / "a.md").exists())

    def test_fallback_unlink_failure_rolls_back_trash_copy(self):
        self.put("a.md", b"A")
        real_unlink = os.unlink
        calls = []

        def unlink(name, *a, dir_fd=None, **kw):
            calls.append(name)
            if len(calls) == 1:  # the source unlink fails; the rollback must still work
                raise PermissionError(13, "denied")
            return real_unlink(name, *a, dir_fd=dir_fd, **kw)

        with mock.patch.object(notes, "_renameat2", None), mock.patch.object(notes.os, "unlink", unlink):
            self.refused(notes.delete_note, self.r, "a.md", confirm=True, code="permission_denied", status=403)
        self.assertEqual((self.root / "a.md").read_bytes(), b"A")
        self.assertEqual(list((self.root / ".trash").iterdir()), [], "no second copy left in .trash")

    def test_renameat2_never_replaces(self):
        if notes._renameat2 is None:
            self.skipTest("no renameat2")
        self.put("a.md", b"A")
        self.put("b.md", b"B")
        self.refused(notes.rename_note, self.r, "a.md", "b.md", code="exists")
        self.assertEqual((self.root / "b.md").read_bytes(), b"B")


class AliasAndReadOnlyTests(Tree):
    def test_hard_link_is_not_a_spelling_alias(self):
        a = self.put("a.md", b"A")
        os.link(a, self.root / "b.md")
        (self.root / "sub").mkdir()
        os.link(a, self.root / "sub" / "a.md")
        for dst in ("b.md", "sub/a.md"):
            with self.subTest(dst=dst):
                self.refused(notes.rename_note, self.r, "a.md", dst, code="exists", status=409)
                self.refused(notes.rename_note, self.r, "a.md", dst, overwrite=True, confirm=True, code="exists")
        self.assertTrue(a.exists())

    def test_read_only_note_is_not_replaced(self):
        if AS_ROOT:
            self.skipTest("root ignores modes")
        p = self.put("a.md", b"A")
        os.chmod(p, 0o444)
        self.refused(notes.update_note, self.r, "a.md", "B", sha(b"A"), code="read_only", status=403)
        self.assertEqual(p.read_bytes(), b"A")
        self.assertEqual(sorted(os.listdir(self.root)), ["a.md"], "no temp file left")


class RootPolicyTests(Tree):
    def setUp(self):
        super().setUp()
        self.registry = Registry(self.tmp / "crew" / "apps" / "quartizo" / "data", protected=(str(self.tmp / "crew"),))

    def test_group_or_world_writable_root_refused(self):
        for mode in (0o757, 0o777, 0o1777):
            with self.subTest(mode=oct(mode)):
                os.chmod(self.root, mode)
                self.refused(self.registry.register, self.r, code="root_writable_by_others")
        os.chmod(self.root, 0o750)
        self.assertEqual(self.registry.register(self.r).path, self.r)

    def _with_groups(self, name, members, *, gid=None):
        gid = os.stat(self.root).st_gid if gid is None else gid
        stack = contextlib.ExitStack()
        for p in (mock.patch.object(wsmod.os, "getgid", return_value=gid),
                  mock.patch.object(wsmod.pwd, "getpwuid", return_value=SimpleNamespace(pw_name="felipe", pw_dir=os.path.expanduser("~"))),
                  mock.patch.object(wsmod.grp, "getgrgid",
                                    return_value=SimpleNamespace(gr_name=name, gr_mem=members))):
            stack.enter_context(p)
        return stack

    def test_group_writable_root_allowed_only_for_a_private_group(self):
        os.chmod(self.root, 0o775)
        with self._with_groups("devs", []):
            self.refused(self.registry.register, self.r, code="root_writable_by_others")
        with self._with_groups("felipe", ["mallory"]):
            self.refused(self.registry.register, self.r, code="root_writable_by_others")
        with self._with_groups("felipe", [], gid=os.stat(self.root).st_gid + 1):
            self.refused(self.registry.register, self.r, code="root_writable_by_others")
        os.chmod(self.root, 0o777)
        with self._with_groups("felipe", []):
            self.refused(self.registry.register, self.r, code="root_writable_by_others")
        os.chmod(self.root, 0o775)
        with self._with_groups("felipe", []):
            self.assertEqual(self.registry.register(self.r).path, self.r)

    def test_root_owned_by_someone_else_refused(self):
        with mock.patch.object(wsmod.os, "getuid", return_value=os.getuid() + 1):
            self.refused(self.registry.register, self.r, code="root_not_owned")
        if not AS_ROOT and os.path.isdir("/usr/share"):
            self.refused(self.registry.register, "/usr/share", code="root_not_owned")

    def test_pseudo_filesystems_refused(self):
        for p in ("/proc", "/proc/self", "/sys", "/sys/kernel", "/dev", "/dev/shm"):
            if os.path.isdir(p):
                with self.subTest(path=p):
                    self.refused(self.registry.register, p, code="root_refused")

    def test_subfolder_owned_by_someone_else_refused(self):
        self.put("sub/x.md", b"x")
        segs = wsmod.validate_relpath("sub/x.md")
        real_fstat = os.fstat

        def fstat(fd):
            st = real_fstat(fd)
            if stat.S_ISDIR(st.st_mode) and os.readlink(f"/proc/self/fd/{fd}").endswith("/sub"):
                return os.stat_result((st.st_mode, st.st_ino, st.st_dev, st.st_nlink, st.st_uid + 1,
                                       st.st_gid, st.st_size, st.st_atime, st.st_mtime, st.st_ctime))
            return st

        if not os.path.isdir("/proc/self/fd"):
            self.skipTest("needs /proc/self/fd")
        with mock.patch.object(wsmod.os, "fstat", fstat):
            with self.assertRaises(ApiError) as ctx, wsmod.open_parent(self.r, segs):
                pass
        self.assertEqual((ctx.exception.status, ctx.exception.code), (403, "not_owned"))


class ScanBoundTests(Tree):
    def test_scan_stops_while_iterating(self):
        for i in range(50):
            self.put(f"n{i:02}.md", b"")
        with mock.patch.object(notes, "MAX_SCAN_ENTRIES", 5):
            out = notes.list_notes(self.r)
        self.assertTrue(out["truncated"])
        self.assertLessEqual(len(out["files"]), 5)
        self.assertEqual([f["path"] for f in out["files"]], sorted(f["path"] for f in out["files"]))

    def test_deadline_applies_while_iterating(self):
        for i in range(10):
            self.put(f"n{i}.md", b"")
        with mock.patch.object(notes, "SEARCH_SECONDS", -1):
            out = notes.list_notes(self.r)
        self.assertEqual((out["files"], out["truncated"]), ([], True))


def _raw(port, data: bytes, timeout=5.0) -> bytes:
    with socket.create_connection(("127.0.0.1", port), timeout=timeout) as s:
        s.sendall(data)
        return s.recv(4096)


class HttpHardeningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix="quartizo-hhttp-")
        base = Path(cls.tmp.name).resolve()
        cls.vault = base / "vault"
        cls.vault.mkdir()
        cls.proc, cls.port = _start(SECRET, home=str(base / "crew"))
        cls.addClassCleanup(_stop, cls.proc)
        status, body = signed_json(cls.port, "POST", "/api/workspaces", {"path": str(cls.vault)})
        assert status == 201, body
        cls.base = f"/api/workspaces/{body['workspace']['id']}"

    @classmethod
    def tearDownClass(cls):
        for p in cls.vault.rglob("*"):
            if p.is_dir():
                os.chmod(p, 0o755)
        cls.tmp.cleanup()

    def test_read_only_dir_maps_to_403_without_the_path(self):
        if AS_ROOT:
            self.skipTest("root ignores modes")
        ro = self.vault / "ro"
        ro.mkdir()
        (ro / "in.md").write_bytes(b"x")
        os.chmod(ro, 0o555)
        try:
            for method, action, payload in (
                ("POST", "note", {"path": "ro/new.md", "content": "x"}),
                ("PUT", "note", {"path": "ro/in.md", "content": "y", "expectedHash": sha(b"x")}),
                ("POST", "delete", {"path": "ro/in.md", "confirm": True}),
                ("POST", "rename", {"from": "ro/in.md", "to": "out.md"}),
            ):
                with self.subTest(method=method, action=action):
                    status, body = signed_json(self.port, method, f"{self.base}/{action}", payload)
                    self.assertEqual((status, body.get("code")), (403, "permission_denied"), body)
                    self.assertNotIn(str(self.vault), body["error"])
                    self.assertNotIn("ro/", body["error"])
            self.assertEqual(sorted(os.listdir(ro)), ["in.md"])
            self.assertEqual((ro / "in.md").read_bytes(), b"x")
        finally:
            os.chmod(ro, 0o755)

    def test_large_body_only_for_fresh_note_writes(self):
        big = 2 << 20  # over the 1 MiB default, under the note limit
        fresh = proxy_header(SECRET, "POST", f"{self.base}/note", b"")
        stale = proxy_header(SECRET, "POST", f"{self.base}/note", b"", ts=int(time.time()) - 600)
        for target, header in (
            (f"{self.base}/note", None),       # no proxy header at all
            (f"{self.base}/note", stale),      # stale timestamp
            ("/api/workspaces", fresh),        # fresh, but not a note write
            (f"{self.base}/rename", fresh),
        ):
            with self.subTest(target=target, header=bool(header)):
                head = f"POST {target} HTTP/1.1\r\nHost: x\r\nContent-Length: {big}\r\n"
                if header:
                    head += f"X-KiroCrew-Proxy: {header}\r\n"
                # Headers only: the server must refuse before reading any body.
                reply = _raw(self.port, (head + "\r\n").encode())
                self.assertIn(b" 413 ", reply.split(b"\r\n", 1)[0] + b" ")

    def test_in_flight_connections_are_capped(self):
        holders = []
        try:
            for _ in range(srv.MAX_IN_FLIGHT):
                s = socket.create_connection(("127.0.0.1", self.port), timeout=10)
                s.sendall(b"GET /health HTTP/1.1\r\nHost: x\r\n")  # never finishes
                holders.append(s)
            time.sleep(0.3)
            start = time.monotonic()
            with socket.create_connection(("127.0.0.1", self.port), timeout=10) as s:
                s.sendall(b"GET /health HTTP/1.1\r\nHost: x\r\n\r\n")
                self.assertEqual(s.recv(1024), b"", "the 17th connection must be dropped, not served")
            self.assertLess(time.monotonic() - start, 9)
        finally:
            for s in holders:
                s.close()
        time.sleep(0.3)
        reply = _raw(self.port, b"GET /health HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n")
        self.assertIn(b" 200 ", reply)


if __name__ == "__main__":
    unittest.main()
