"""Quartizo backend: a tiny stdlib HTTP server behind the KiroCrew gateway proxy.

The gateway spawns this file (app.json ``backend.entryPoint``) with ``PORT`` and,
when the app has a secret, ``KIROCREW_PROXY_SECRET`` in the environment. It
forwards ``/apps/quartizo/api/<path>`` here as ``/api/<path>`` and signs every
request. Signature format, read at kirodotdev/KiroCrew@f62ab4fd and rechecked
unchanged against the installed kirocrew 0.10.0rc4
(``src/kiro_crew/apps/proxy_auth.py`` and ``apps/routes.py::handle_app_api_proxy``):

    X-KiroCrew-Proxy: <unix-seconds>:<hex hmac_sha256(secret, "<ts>:<METHOD>:<target>:<hex sha256(body)>")>

``<target>`` is the raw request-target this server receives (``self.path``,
query included). With ``backend.signedPrincipal: true`` the gateway also sends

    X-KiroCrew-Principal: <base64url canonical JSON claim>.<hex hmac_sha256(secret, lines)>

where ``lines`` = "\\n".join(["kirocrew-proxy-principal-v1", issuedAt, METHOD,
target, sha256(body), encoded_claim]).

Only ``GET /health`` is unsigned (the gateway probes it directly). Every other
request must carry both valid headers, or it is refused before routing, and
every route is dashboard-owner only (``owner-session`` principal).

Workspace registry state lives in ``<KIROCREW_HOME>/apps/<KIROCREW_APP_NAME>/data``
(the gateway injects both; ``manager.py::app_data_dir`` in 0.10.0rc4).
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import sqlite3
import sys
import threading
import time
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

# The gateway runs this file with `python -I`, which leaves the script's own
# directory off sys.path; put it back (first) so the sibling modules load.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import notes  # noqa: E402
import tasks  # noqa: E402
from workspace import ApiError, Registry, os_error  # noqa: E402

APP_NAME = "quartizo"
APP_VERSION = "0.1.0"
SECRET_ENV = "KIROCREW_PROXY_SECRET"
PROXY_HEADER = "X-KiroCrew-Proxy"
PRINCIPAL_HEADER = "X-KiroCrew-Principal"
MAX_SKEW_SECONDS = 60
MAX_BODY_BYTES = 1 << 20
# Note writes only: a note may be 2 MiB, and JSON escaping can grow it (worst
# case \u00XX, 6x). Allowed only after a cheap freshness check of the proxy
# header, so an unsigned client cannot make us read 12 MiB.
MAX_NOTE_BODY_BYTES = 6 * (2 << 20) + (64 << 10)
MAX_IN_FLIGHT = 16
_NOTE_WRITE_RE = re.compile(r"/api/workspaces/[0-9]{1,12}/note")
# Task import only (QTZ-008): up to tasks.MAX_IMPORT_BODY_BYTES, same freshness rule.
_TASK_IMPORT_RE = re.compile(r"/api/workspaces/[0-9]{1,12}/tasks/import")
MAX_PRINCIPAL_HEADER_BYTES = 4096

_TS_RE = re.compile(r"[0-9]{1,12}")
_HEX64_RE = re.compile(r"[0-9a-f]{64}")
_REQUEST_ID_RE = re.compile(r"[0-9a-f]{32}")
_PRINCIPAL_KINDS = frozenset({"owner-session", "app-token", "agent-tool", "none"})
_PRINCIPAL_KEYS = frozenset({"version", "kind", "ownerId", "issuedAt", "requestId"})
_PRINCIPAL_DOMAIN = "kirocrew-proxy-principal-v1"


def _sha256_hex(body: bytes) -> str:
    return hashlib.sha256(body or b"").hexdigest()


def _hmac_hex(secret: str, message: str) -> str:
    return hmac.new(secret.encode("utf-8"), message.encode("utf-8"), hashlib.sha256).hexdigest()


def _same(expected: str, given: str) -> bool:
    # Bytes, not str: compare_digest raises TypeError on non-ASCII str input.
    return hmac.compare_digest(
        expected.encode("utf-8", "surrogatepass"), given.encode("utf-8", "surrogatepass")
    )


def verify_proxy_signature(
    header: str | None, *, method: str, target: str, body: bytes, secret: str, now: float
) -> bool:
    """True iff *header* is a fresh gateway signature over this exact request."""
    if not secret or not header:
        return False
    ts, sep, sig = header.partition(":")
    if not sep or not _TS_RE.fullmatch(ts) or not _HEX64_RE.fullmatch(sig):
        return False
    if abs(now - int(ts)) > MAX_SKEW_SECONDS:
        return False
    expected = _hmac_hex(secret, f"{ts}:{method}:{target}:{_sha256_hex(body)}")
    return _same(expected, sig)


@dataclass(frozen=True)
class Principal:
    kind: str
    owner_id: str
    issued_at: int
    request_id: str


class ReplayCache:
    """Accepted principal request ids, held until their freshness window closes.

    One instance per process. When full it refuses rather than evicting a live
    id (eviction would make that request replayable).
    """

    def __init__(self, max_entries: int = 4096) -> None:
        self._max = max_entries
        self._seen: dict[str, float] = {}
        self._lock = threading.Lock()

    def accept(self, request_id: str, *, expires_at: float, now: float) -> bool:
        with self._lock:
            for key in [k for k, exp in self._seen.items() if exp < now]:
                del self._seen[key]
            if request_id in self._seen or len(self._seen) >= self._max:
                return False
            self._seen[request_id] = expires_at
            return True


def _decode_claim(encoded: str) -> Principal | None:
    try:
        raw = base64.b64decode(encoded + "=" * (-len(encoded) % 4), altchars=b"-_", validate=True)
        claim = json.loads(raw)
    except (ValueError, UnicodeError):
        return None
    if not isinstance(claim, dict) or set(claim) != _PRINCIPAL_KEYS:
        return None
    kind, owner, issued, rid = claim["kind"], claim["ownerId"], claim["issuedAt"], claim["requestId"]
    if claim["version"] != 1 or not isinstance(kind, str) or kind not in _PRINCIPAL_KINDS:
        return None
    if isinstance(issued, bool) or not isinstance(issued, int):
        return None
    if not isinstance(owner, str) or len(owner) > 256 or any(ord(c) < 32 or ord(c) == 127 for c in owner):
        return None
    if (kind == "owner-session") != bool(owner):
        return None
    if not isinstance(rid, str) or not _REQUEST_ID_RE.fullmatch(rid):
        return None
    return Principal(kind=kind, owner_id=owner, issued_at=issued, request_id=rid)


def verify_principal(
    header: str | None,
    *,
    method: str,
    target: str,
    body: bytes,
    secret: str,
    now: float,
    replay_cache: ReplayCache,
) -> Principal | None:
    """Verify and consume one X-KiroCrew-Principal value; None on any failure."""
    if not secret or not header or "." not in header:
        return None
    if len(header.encode("utf-8", "surrogatepass")) > MAX_PRINCIPAL_HEADER_BYTES:
        return None
    encoded, _, sig = header.rpartition(".")
    if not encoded or not _HEX64_RE.fullmatch(sig):
        return None
    claim = _decode_claim(encoded)
    if claim is None:
        return None
    if not now - MAX_SKEW_SECONDS <= claim.issued_at <= now + MAX_SKEW_SECONDS:
        return None
    message = "\n".join(
        (_PRINCIPAL_DOMAIN, str(claim.issued_at), method, target, _sha256_hex(body), encoded)
    )
    if not _same(_hmac_hex(secret, message), sig):
        return None
    # Last, so only an otherwise-valid claim takes a cache slot.
    if not replay_cache.accept(claim.request_id, expires_at=claim.issued_at + MAX_SKEW_SECONDS, now=now):
        return None
    return claim


class Handler(BaseHTTPRequestHandler):
    server_version = "quartizo"
    # Per-socket read timeout: a client that stalls mid-request (slowloris) is
    # dropped instead of holding a thread forever.
    timeout = 10
    sys_version = ""
    protocol_version = "HTTP/1.1"

    # Set on the server instance by make_server().
    @property
    def _secret(self) -> str:
        return self.server.proxy_secret  # type: ignore[attr-defined]

    def do_GET(self) -> None:
        self._dispatch()

    def do_POST(self) -> None:
        self._dispatch()

    def do_PUT(self) -> None:
        self._dispatch()

    def do_PATCH(self) -> None:
        self._dispatch()

    def do_DELETE(self) -> None:
        self._dispatch()

    def _dispatch(self) -> None:
        if self.command == "GET" and self.path == "/health":
            self._json(200, {"status": "ok", "app": APP_NAME})
            return
        body = self._read_body()
        if body is None:
            return
        self._body = body
        if not self._secret:
            # Fail closed: without a secret no request can be authenticated.
            self._json(503, {"error": "proxy secret not configured", "code": "proxy_secret_missing"})
            return
        now = time.time()
        if not verify_proxy_signature(
            self.headers.get(PROXY_HEADER),
            method=self.command, target=self.path, body=body, secret=self._secret, now=now,
        ):
            self._json(401, {"error": "unauthorized", "code": "proxy_auth_failed"})
            return
        principal = verify_principal(
            self.headers.get(PRINCIPAL_HEADER),
            method=self.command, target=self.path, body=body, secret=self._secret, now=now,
            replay_cache=self.server.replay_cache,  # type: ignore[attr-defined]
        )
        if principal is None:
            self._json(401, {"error": "unauthorized", "code": "principal_auth_failed"})
            return
        self._route(principal)

    def _route(self, principal: Principal) -> None:
        # Dashboard-owner only: agents, app tokens and unclassified callers get
        # nothing from any route.
        if principal.kind != "owner-session":
            self._json(403, {"error": "owner session required", "code": "owner_session_required"})
            return
        split = urlsplit(self.path)
        parts = split.path.split("/")[1:]  # ["api", ...]
        try:
            query = parse_qs(split.query, keep_blank_values=True, strict_parsing=False,
                             max_num_fields=20)
        except ValueError:
            self._json(400, {"error": "bad query string", "code": "bad_query"})
            return
        try:
            result = self._handle(principal, parts, query)
        except ApiError as err:
            self._json(err.status, err.body())
            return
        except OSError as err:
            # Anything the file layer did not classify; the message never names a path.
            refusal = os_error(err)
            self._json(refusal.status, refusal.body())
            return
        except sqlite3.OperationalError as err:
            # Typically "database is locked" past the 10 s busy timeout. Never echo SQL.
            busy = "locked" in str(err) or "busy" in str(err)
            self._json(503 if busy else 500, {"error": "database busy" if busy else "database error",
                                              "code": "db_busy" if busy else "db_error"})
            return
        except sqlite3.Error:
            self._json(500, {"error": "database error", "code": "db_error"})
            return
        if result is None:
            self._json(404, {"error": "not found"})
        else:
            self._json(*result)

    def _handle(self, principal: Principal, parts: list[str], query: dict) -> tuple[int, dict] | None:
        method = self.command
        registry: Registry = self.server.registry  # type: ignore[attr-defined]
        if parts == ["api", "status"] and method == "GET":
            return 200, {
                "app": APP_NAME,
                "version": APP_VERSION,
                "principal": {"kind": principal.kind, "ownerId": principal.owner_id},
            }
        if parts == ["api", "workspaces"]:
            if method == "GET":
                return 200, {"workspaces": [w.to_json() for w in registry.list()]}
            if method == "POST":
                body = self._json_body()
                return 201, {"workspace": registry.register(body.get("path"), body.get("name")).to_json()}
            return None
        if len(parts) >= 3 and parts[:2] == ["api", "workspaces"]:
            ws_id = _parse_id(parts[2])
            if ws_id is None:
                return None
            if len(parts) == 3:
                if method == "GET":
                    return 200, {"workspace": registry.get(ws_id).to_json()}
                if method == "DELETE":
                    # A workspace is also a task project: its tasks go with it,
                    # so that needs ?deleteTasks=1 (409 project_has_tasks otherwise).
                    registry.unregister(ws_id, delete_tasks=_q(query, "deleteTasks") == "1")
                    return 200, {"ok": True}
                return None
            if parts[3] == "tasks":
                return self._handle_tasks(ws_id, parts[4:])
            if len(parts) == 4:
                return self._handle_notes(registry, ws_id, parts[3], query)
        return None

    def _handle_tasks(self, ws_id: int, rest: list[str]) -> tuple[int, dict] | None:
        """/api/workspaces/{id}/tasks[...]: the Kanban board of that workspace's project."""
        method = self.command
        store: tasks.TaskStore = self.server.tasks  # type: ignore[attr-defined]
        if rest == []:
            if method == "GET":
                return 200, store.list(ws_id)
            if method == "POST":
                return 201, store.create(ws_id, self._json_body())
            return None
        if rest == ["export"] and method == "GET":
            return 200, store.export(ws_id)
        if rest == ["import"] and method == "POST":
            return 200, store.import_(ws_id, self._json_body())
        task_id = _parse_id(rest[0])
        if task_id is None or len(rest) > 2:
            return None
        if len(rest) == 1:
            if method == "GET":
                return 200, store.get(ws_id, task_id)
            if method == "PATCH":
                return 200, store.update(ws_id, task_id, self._json_body())
            return None
        if rest[1] == "move" and method == "POST":
            return 200, store.move(ws_id, task_id, self._json_body())
        if rest[1] == "delete" and method == "POST":
            return 200, store.delete(ws_id, task_id, self._json_body())
        return None

    def _handle_notes(self, registry: Registry, ws_id: int, action: str, query: dict) -> tuple[int, dict] | None:
        method = self.command
        if (method, action) not in _NOTE_ROUTES:
            return None
        root = registry.get(ws_id).path
        if method == "GET" and action == "notes":
            return 200, notes.list_notes(root, _q(query, "q"), _q(query, "content") in ("1", "true"))
        if method == "GET":  # note
            return 200, notes.read_note(root, _q(query, "path", None))
        body = self._json_body()
        if action == "note" and method == "POST":
            return 201, notes.create_note(root, body.get("path"), body.get("content"))
        if action == "note":  # PUT
            return 200, notes.update_note(root, body.get("path"), body.get("content"), body.get("expectedHash"))
        if action == "rename":
            return 200, notes.rename_note(root, body.get("from"), body.get("to"),
                                          overwrite=body.get("overwrite", False), confirm=body.get("confirm", False),
                                          expected_hash=body.get("expectedHash"))
        return 200, notes.delete_note(root, body.get("path"), confirm=body.get("confirm"),
                                      expected_hash=body.get("expectedHash"))

    def _json_body(self) -> dict:
        try:
            data = json.loads(self._body or b"{}")
        except (ValueError, UnicodeDecodeError, RecursionError):
            raise ApiError(400, "bad_json", "request body must be JSON") from None
        if not isinstance(data, dict):
            raise ApiError(400, "bad_json", "request body must be a JSON object")
        return data

    def _body_limit(self) -> int:
        """1 MiB, or the note / task-import limit for those writes with a fresh proxy timestamp.

        The full HMAC needs the body, so only the timestamp can be checked
        before reading; the signature is still verified afterwards.
        """
        if self.command in ("POST", "PUT") and _NOTE_WRITE_RE.fullmatch(self.path):
            larger = MAX_NOTE_BODY_BYTES
        elif self.command == "POST" and _TASK_IMPORT_RE.fullmatch(self.path):
            larger = tasks.MAX_IMPORT_BODY_BYTES
        else:
            return MAX_BODY_BYTES
        ts = (self.headers.get(PROXY_HEADER) or "").partition(":")[0]
        if _TS_RE.fullmatch(ts) and abs(time.time() - int(ts)) <= MAX_SKEW_SECONDS:
            return larger
        return MAX_BODY_BYTES

    def _read_body(self) -> bytes | None:
        if self.headers.get("Transfer-Encoding"):
            self._json(400, {"error": "chunked bodies are not supported"})
            return None
        raw_len = self.headers.get("Content-Length", "0") or "0"
        if not raw_len.isascii() or not raw_len.isdigit():
            self._json(400, {"error": "bad content-length"})
            return None
        length = int(raw_len)
        if length > self._body_limit():
            self._json(413, {"error": "body too large", "code": "too_large"})
            return None
        return self.rfile.read(length) if length else b""

    def _json(self, code: int, data: dict) -> None:
        payload = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        if code >= 400:
            self.send_header("Connection", "close")
            self.close_connection = True
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        # Request line only (method + path without query); never headers or secret.
        # Also called for timeouts and unparseable request lines, before (or
        # without) command/path being set.
        command = getattr(self, "command", "") or ""
        path = (getattr(self, "path", "") or "").split("?", 1)[0]
        status = args[1] if format.startswith('"%s"') and len(args) > 1 else "-"
        sys.stderr.write(f"{APP_NAME}: {command} {path} {status}\n")


_NOTE_ROUTES = frozenset({
    ("GET", "notes"), ("GET", "note"), ("POST", "note"), ("PUT", "note"),
    ("POST", "rename"), ("POST", "delete"),
})


def _q(query: dict, key: str, default: str | None = "") -> str | None:
    values = query.get(key)
    return values[0] if values else default


def _parse_id(raw: str) -> int | None:
    return int(raw) if raw.isascii() and raw.isdigit() and len(raw) <= 12 else None


class Server(ThreadingHTTPServer):
    # Upstream scaffold note: on Windows SO_REUSEADDR would let a second copy
    # bind a live port; the gateway detects collisions by a failed bind.
    allow_reuse_address = not sys.platform.startswith("win")
    daemon_threads = True

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        # At most MAX_IN_FLIGHT connections are served at once; the next one
        # waits (briefly) in the accept loop, then is dropped.
        self._slots = threading.BoundedSemaphore(MAX_IN_FLIGHT)

    def process_request(self, request, client_address) -> None:
        if not self._slots.acquire(timeout=5):
            self.shutdown_request(request)
            return
        try:
            super().process_request(request, client_address)
        except BaseException:
            self._slots.release()
            raise

    def process_request_thread(self, request, client_address) -> None:
        try:
            super().process_request_thread(request, client_address)
        finally:
            self._slots.release()


def kirocrew_home() -> Path:
    return Path(os.environ.get("KIROCREW_HOME") or os.path.expanduser("~/.kiro/crew"))


def data_dir() -> Path:
    """``<KIROCREW_HOME>/apps/<app>/data``, the dir installs preserve across updates."""
    name = os.environ.get("KIROCREW_APP_NAME") or APP_NAME
    return kirocrew_home() / "apps" / name / "data"


def make_server(port: int, secret: str, registry: Registry) -> Server:
    server = Server(("127.0.0.1", port), Handler)
    server.proxy_secret = secret  # type: ignore[attr-defined]
    server.replay_cache = ReplayCache()  # type: ignore[attr-defined]
    server.registry = registry  # type: ignore[attr-defined]
    server.tasks = tasks.TaskStore(registry)  # type: ignore[attr-defined]
    return server


def main() -> None:
    port = int(os.environ.get("PORT", "9100"))
    secret = os.environ.get(SECRET_ENV, "")
    if not secret:
        sys.stderr.write(f"{APP_NAME}: {SECRET_ENV} not set; all /api routes will refuse (503)\n")
    registry = Registry(data_dir(), protected=(str(kirocrew_home()),))
    server = make_server(port, secret, registry)
    sys.stderr.write(f"{APP_NAME} backend on 127.0.0.1:{server.server_address[1]}\n")
    server.serve_forever()


if __name__ == "__main__":
    main()
