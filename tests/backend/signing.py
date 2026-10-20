"""Test-side signer, written from the gateway's side of the contract
(kirodotdev/KiroCrew@f62ab4fd apps/routes.py::handle_app_api_proxy and
apps/proxy_auth.py::sign_proxy_principal_claim)."""
from __future__ import annotations

import base64
import hashlib
import hmac
import importlib.util
import json
import secrets
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SERVER_PY = ROOT / "backend" / "server.py"


def load_server():
    spec = importlib.util.spec_from_file_location("quartizo_server", SERVER_PY)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod  # dataclasses need the module registered
    spec.loader.exec_module(mod)
    return mod


def _h(secret: str, msg: str) -> str:
    return hmac.new(secret.encode(), msg.encode(), hashlib.sha256).hexdigest()


def proxy_header(secret: str, method: str, target: str, body: bytes = b"", ts: int | None = None) -> str:
    ts = int(time.time()) if ts is None else ts
    return f"{ts}:{_h(secret, f'{ts}:{method}:{target}:{hashlib.sha256(body).hexdigest()}')}"


def encode_claim(claim: dict) -> str:
    raw = json.dumps(claim, sort_keys=True, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def principal_header(
    secret: str, method: str, target: str, body: bytes = b"", *, kind: str = "owner-session",
    owner_id: str = "owner-1", issued_at: int | None = None, request_id: str | None = None,
    claim: dict | None = None,
) -> str:
    if claim is None:
        claim = {
            "version": 1, "kind": kind, "ownerId": owner_id,
            "issuedAt": int(time.time()) if issued_at is None else issued_at,
            "requestId": request_id or secrets.token_hex(16),
        }
    encoded = encode_claim(claim)
    msg = "\n".join(("kirocrew-proxy-principal-v1", str(claim["issuedAt"]), method, target,
                     hashlib.sha256(body).hexdigest(), encoded))
    return f"{encoded}.{_h(secret, msg)}"
