"""Real HTTP round-trips against backend/server.py running as its own process."""
from __future__ import annotations

import http.client
import json
import os
import socket
import subprocess
import sys
import tempfile
import time
import unittest

from tests.backend.signing import SERVER_PY, principal_header, proxy_header

SECRET = "round-trip-secret-0123456789"


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _start(secret: str | None, home: str | None = None):
    """Start the backend; its KIROCREW_HOME is *home* or a fresh temp dir, never the real one."""
    port = _free_port()
    env = {k: v for k, v in os.environ.items() if k != "KIROCREW_PROXY_SECRET"}
    env["PORT"] = str(port)
    tmp = None if home else tempfile.TemporaryDirectory(prefix="quartizo-home-")
    env["KIROCREW_HOME"] = home or tmp.name
    env["KIROCREW_APP_NAME"] = "quartizo"
    if secret is not None:
        env["KIROCREW_PROXY_SECRET"] = secret
    proc = subprocess.Popen([sys.executable, "-I", str(SERVER_PY)], env=env,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    deadline = time.time() + 10
    proc.tmp_home = tmp  # removed when the process object is collected
    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                return proc, port
        except OSError:
            if proc.poll() is not None:
                break
            time.sleep(0.05)
    proc.kill()
    raise RuntimeError(f"server did not start: {proc.stderr.read().decode()}")


def _request(port, method, target, *, body=b"", headers=None):
    conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
    try:
        conn.request(method, target, body=body or None, headers=headers or {})
        res = conn.getresponse()
        return res.status, json.loads(res.read() or b"null")
    finally:
        conn.close()


def _non_loopback_address() -> str | None:
    """This host's primary non-loopback IPv4 address, if it has one.

    A UDP connect() only selects a route; no packet is sent.
    """
    for probe in ("192.0.2.1", "10.255.255.255"):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect((probe, 9))
                addr = s.getsockname()[0]
        except OSError:
            continue
        if addr and not addr.startswith("127.") and addr != "0.0.0.0":
            return addr
    return None


def _signed(method, target, body=b"", **kw):
    return {
        "X-KiroCrew-Proxy": proxy_header(SECRET, method, target, body),
        "X-KiroCrew-Principal": principal_header(SECRET, method, target, body, **kw),
    }


class RoundTripTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.proc, cls.port = _start(SECRET)

    @classmethod
    def tearDownClass(cls):
        cls.proc.terminate()
        cls.proc.communicate(timeout=5)

    def test_health_is_unsigned(self):
        self.assertEqual(_request(self.port, "GET", "/health"), (200, {"status": "ok", "app": "quartizo"}))

    def test_status_requires_signature(self):
        status, body = _request(self.port, "GET", "/api/status")
        self.assertEqual((status, body["code"]), (401, "proxy_auth_failed"))

    def test_status_signed_round_trip(self):
        status, body = _request(self.port, "GET", "/api/status",
                                headers=_signed("GET", "/api/status", owner_id="owner-42"))
        self.assertEqual(status, 200)
        self.assertEqual(body["principal"], {"kind": "owner-session", "ownerId": "owner-42"})

    def test_non_owner_principal_forbidden(self):
        for kind in ("app-token", "agent-tool", "none"):
            with self.subTest(kind=kind):
                status, body = _request(self.port, "GET", "/api/status",
                                        headers=_signed("GET", "/api/status", kind=kind, owner_id=""))
                self.assertEqual((status, body["code"]), (403, "owner_session_required"))

    def test_slowloris_connection_is_dropped(self):
        with socket.create_connection(("127.0.0.1", self.port), timeout=30) as s:
            s.sendall(b"GET /health HTTP/1.1\r\nHost: x\r\n")  # never finishes the headers
            start = time.monotonic()
            self.assertEqual(s.recv(1024), b"")  # server closes without answering
            elapsed = time.monotonic() - start
        self.assertLess(elapsed, 15, "server held a stalled connection past its 10 s timeout")

    def test_proxy_signature_without_principal_refused(self):
        h = {"X-KiroCrew-Proxy": proxy_header(SECRET, "GET", "/api/status")}
        status, body = _request(self.port, "GET", "/api/status", headers=h)
        self.assertEqual((status, body["code"]), (401, "principal_auth_failed"))

    def test_replayed_request_refused(self):
        h = _signed("GET", "/api/status")
        self.assertEqual(_request(self.port, "GET", "/api/status", headers=h)[0], 200)
        self.assertEqual(_request(self.port, "GET", "/api/status", headers=h)[0], 401)

    def test_tampered_body_refused(self):
        h = _signed("POST", "/api/status", b'{"a":1}')
        h["Content-Type"] = "application/json"
        self.assertEqual(_request(self.port, "POST", "/api/status", body=b'{"a":2}', headers=h)[0], 401)

    def test_tampered_path_refused(self):
        h = _signed("GET", "/api/status")
        self.assertEqual(_request(self.port, "GET", "/api/status?x=1", headers=h)[0], 401)

    def test_expired_refused(self):
        old = int(time.time()) - 120
        h = {"X-KiroCrew-Proxy": proxy_header(SECRET, "GET", "/api/status", ts=old),
             "X-KiroCrew-Principal": principal_header(SECRET, "GET", "/api/status", issued_at=old)}
        self.assertEqual(_request(self.port, "GET", "/api/status", headers=h)[0], 401)

    def test_signed_unknown_route_is_404_unsigned_is_401(self):
        self.assertEqual(_request(self.port, "GET", "/api/nope", headers=_signed("GET", "/api/nope"))[0], 404)
        self.assertEqual(_request(self.port, "GET", "/api/nope")[0], 401)

    def test_signed_post_with_body_reaches_router(self):
        body = b'{"hello":"world"}'
        h = _signed("POST", "/api/status", body)
        self.assertEqual(_request(self.port, "POST", "/api/status", body=body, headers=h)[0], 404)

    def test_binds_loopback_only(self):
        checked = []
        try:
            out = subprocess.run(["ss", "-ltnH", f"sport = :{self.port}"], capture_output=True, text=True)
        except FileNotFoundError:
            out = None
        if out is not None and out.returncode == 0:
            self.assertIn(f"127.0.0.1:{self.port}", out.stdout)
            self.assertNotIn(f"0.0.0.0:{self.port}", out.stdout)
            checked.append("ss")
        addr = _non_loopback_address()
        if addr:
            with self.assertRaises(OSError, msg=f"backend reachable on {addr}"):
                socket.create_connection((addr, self.port), timeout=2).close()
            checked.append(addr)
        if not checked:
            self.skipTest("no `ss` and no non-loopback interface address to probe")


class LoggingTests(unittest.TestCase):
    def test_secret_never_logged_and_garbage_is_handled(self):
        proc, port = _start(SECRET)
        try:
            # The secret in a query string, a header and the signature header itself.
            _request(port, "GET", f"/health?leak={SECRET}")
            _request(port, "GET", f"/api/status?leak={SECRET}", headers={"X-Leak": SECRET})
            _request(port, "GET", "/api/status", headers={"X-KiroCrew-Proxy": f"1:{SECRET}"})
            q = f"/api/status?leak={SECRET}"
            self.assertEqual(_request(port, "GET", q, headers=_signed("GET", q))[0], 200)
            # A garbage request line must get a 400 and no traceback.
            with socket.create_connection(("127.0.0.1", port), timeout=5) as s:
                s.sendall(b"\x00\xff GARBAGE\r\n\r\n")
                self.assertIn(b" 400 ", s.recv(1024).split(b"\r\n", 1)[0] + b" ")
        finally:
            proc.terminate()
            _, err = proc.communicate(timeout=5)
        log = err.decode(errors="replace")
        self.assertIn("/api/status", log)  # requests were logged at all
        self.assertNotIn(SECRET, log)
        self.assertNotIn("Traceback", log)


class NoSecretTests(unittest.TestCase):
    def test_fails_closed_without_secret(self):
        proc, port = _start(None)
        try:
            self.assertEqual(_request(port, "GET", "/health")[0], 200)
            # A request signed with an empty key must not get through either.
            h = {"X-KiroCrew-Proxy": proxy_header("", "GET", "/api/status"),
                 "X-KiroCrew-Principal": principal_header("", "GET", "/api/status")}
            status, body = _request(port, "GET", "/api/status", headers=h)
            self.assertEqual((status, body["code"]), (503, "proxy_secret_missing"))
        finally:
            proc.terminate()
            proc.communicate(timeout=5)


if __name__ == "__main__":
    unittest.main()
