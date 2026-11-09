"""Disposable browser fixture and signing proxy; never starts a user gateway."""
from __future__ import annotations

import argparse
import http.client
import json
import signal
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
from tests.backend.signing import load_server, principal_header, proxy_header  # noqa: E402

server_module = load_server()
import companion_write  # noqa: E402
import db  # noqa: E402
from workspace import Registry  # noqa: E402


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bundle", type=Path, required=True)
    parser.add_argument("--host-version", default="0.12.0")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="quartizo-browser-") as temporary:
        directory = Path(temporary).resolve()
        vault, other = directory / "vault", directory / "other"
        vault.mkdir()
        other.mkdir()
        registry = Registry(directory / "data")
        ws = registry.register(str(vault), "Browser vault", companion=True)
        registry.register(str(other), "Other vault", companion=True)
        for name, uid, rank in (("First", "a" * 32, "2" * 32), ("Second", "b" * 32, "4" * 32)):
            path = f"{name.lower()}.md"
            (vault / path).write_bytes(companion_write.promote_bytes(
                path, f"# {name}\n\n- [ ] {name} TODO\n".encode(), uid, rank, "ready"))
        (vault / "ordinary.md").write_bytes(
            b'---\ncustom: "keep" # comment\n---\n# Ordinary\n\n- [ ] Ordinary TODO\n'
            b'<img src=x onerror="window.hostileExecuted=true">')
        conn = db.connect(registry.db_path)
        conn.execute("INSERT INTO tasks (uid,project_id,title,description_markdown,status,sort_order,created_at,updated_at)"
                     " VALUES (?,?,?,?,?,?,?,?)", ("d" * 32, ws.uid, "Legacy browser card", "Legacy body\n- [ ] Legacy TODO", "review", 0, 1, 1))
        conn.close()
        secret = "disposable-browser-signing-secret"
        backend = server_module.make_server(0, secret, registry, host_version=args.host_version)
        threading.Thread(target=backend.serve_forever, daemon=True).start()

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self):
                self.dispatch()

            def do_POST(self):
                self.dispatch()

            def do_PUT(self):
                self.dispatch()

            def do_DELETE(self):
                self.dispatch()

            def dispatch(self):
                if self.path.startswith("/apps/quartizo/api"):
                    target = "/api" + self.path[len("/apps/quartizo/api"):]
                    payload = self.rfile.read(int(self.headers.get("Content-Length", "0")))
                    headers = {"X-KiroCrew-Proxy": proxy_header(secret, self.command, target, payload),
                               "X-KiroCrew-Principal": principal_header(secret, self.command, target, payload),
                               "Content-Type": "application/json"}
                    conn = http.client.HTTPConnection("127.0.0.1", backend.server_address[1], timeout=30)
                    try:
                        conn.request(self.command, target, payload, headers)
                        response = conn.getresponse()
                        self.respond(response.status, response.read(), "application/json")
                    finally:
                        conn.close()
                elif self.path == "/app.js":
                    self.respond(200, args.bundle.read_bytes(), "text/javascript")
                else:
                    self.respond(200, b'<!doctype html><meta charset="utf-8"><style>'
                                 b'*{box-sizing:border-box}body{font:14px system-ui;margin:24px}'
                                 b'button{padding:5px}input,textarea,select{font:inherit}'
                                 b'.flex{display:flex}.flex-col{flex-direction:column}.flex-1{flex:1}'
                                 b'.min-h-0{min-height:0}.gap-3{gap:12px}</style>'
                                 b'<div id="root"></div><script type="module" src="/app.js"></script>', "text/html")

            def respond(self, status, data, content_type):
                self.send_response(status)
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def log_message(self, *_args):
                pass

        bridge = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
        print(json.dumps({"origin": f"http://127.0.0.1:{bridge.server_address[1]}",
                          "vault": str(vault), "other": str(other), "data": str(directory / "data"),
                          "workspaceId": ws.id}), flush=True)
        try:
            bridge.serve_forever()
        finally:
            bridge.server_close()
            backend.shutdown()
            backend.server_close()


if __name__ == "__main__":
    main()
