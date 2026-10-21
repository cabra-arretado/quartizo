"""Hardening: root ownership/mode policy, confined opens, body limits and the connection cap."""
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
from tests.backend.test_workspace import signed_json

srv = load_server()
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
        root_fd = wsmod.open_root(self.r)
        self.addCleanup(os.close, root_fd)
        with mock.patch.object(wsmod.os, "fstat", fstat), self.assertRaises(ApiError) as ctx:
            wsmod.open_dir_at(root_fd, segs[0])
        self.assertEqual((ctx.exception.status, ctx.exception.code), (403, "not_owned"))


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

    def test_a_large_body_is_refused_before_it_is_read(self):
        fresh = proxy_header(SECRET, "POST", "/api/workspaces", b"")
        for header in (None, fresh):
            with self.subTest(header=bool(header)):
                head = f"POST /api/workspaces HTTP/1.1\r\nHost: x\r\nContent-Length: {srv.MAX_BODY_BYTES + 1}\r\n"
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
                try:
                    reply = s.recv(1024)  # Linux: orderly close; macOS: reset
                except ConnectionResetError:
                    reply = b""
                self.assertEqual(reply, b"", "the 17th connection must be dropped, not served")
            self.assertLess(time.monotonic() - start, 9)
        finally:
            for s in holders:
                s.close()
        time.sleep(0.3)
        reply = _raw(self.port, b"GET /health HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n")
        self.assertIn(b" 200 ", reply)


if __name__ == "__main__":
    unittest.main()
