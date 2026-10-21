"""Gateway integration checks. They need a real, running KiroCrew gateway with
quartizo installed, trusted and enabled, so they SKIP unless configured.

They check the signed proxy: the gateway signs /apps/quartizo/api/* and the
backend verifies it, and the backend refuses a direct, unsigned hit.

  KIROCREW_GATEWAY_URL   e.g. http://127.0.0.1:7777
  KIROCREW_APP_SECRET_FILE  path to quartizo's generated .app_secret; tests
                         exchange it at POST /api/apps/quartizo/token
                         (X-App-Secret) for fresh app tokens. Preferred.
  KIROCREW_APP_TOKEN     alternatively, one ready app token (single use for
                         app-namespaced routes; see app_token())
  KIROCREW_BACKEND_URL   (direct-hit test) the quartizo backend's own loopback
                         URL, e.g. http://127.0.0.1:9100 (see `kirocrew app info`)

Run against kirocrew 0.10.0rc4 (see docs/compatibility.md for measured results).
"""
from __future__ import annotations

import json
import os
import unittest
import urllib.error
import urllib.parse
import urllib.request

GATEWAY = os.environ.get("KIROCREW_GATEWAY_URL", "").rstrip("/")
# Path to quartizo's own generated secret (~/.kiro/crew/apps/quartizo/.app_secret).
# When set, each test class exchanges a fresh app token; the token is never printed.
SECRET_FILE = os.environ.get("KIROCREW_APP_SECRET_FILE", "")


def exchange_app_token() -> str:
    """POST /api/apps/quartizo/token with X-App-Secret -> {"token": ...}."""
    with open(SECRET_FILE, encoding="utf-8") as fh:
        secret = fh.read().strip()
    req = urllib.request.Request(f"{GATEWAY}/api/apps/quartizo/token", data=b"", method="POST",
                                 headers={"X-App-Secret": secret})
    with urllib.request.urlopen(req, timeout=15) as res:
        token = json.loads(res.read()).get("token", "")
    if not isinstance(token, str) or not token:
        raise RuntimeError("token exchange returned no token")
    return token


TOKEN = os.environ.get("KIROCREW_APP_TOKEN", "") or ("exchange" if GATEWAY and SECRET_FILE else "")
_token_cache: list[str] = []


def app_token(fresh: bool = False) -> str:
    # Measured on 0.10.0rc4: after a ?token= request to an app-namespaced route
    # (/apps/quartizo/... or /api/apps/quartizo/...), that same app token is refused
    # on later calls (403 "forbidden", audit: "cookie auth failed: session revoked").
    # So tests that hit those routes take a fresh token.
    if not SECRET_FILE:
        return os.environ.get("KIROCREW_APP_TOKEN", "")
    if fresh or not _token_cache:
        _token_cache[:] = [exchange_app_token()]
    return _token_cache[0]
NO_GATEWAY = ("no gateway: set KIROCREW_GATEWAY_URL and KIROCREW_APP_SECRET_FILE "
              "(or KIROCREW_APP_TOKEN) to run")


def call(method: str, path: str, body: dict | None = None, *, token: str | None = None) -> tuple[int, dict]:
    headers = {"Content-Type": "application/json"}
    sep = "&" if "?" in path else "?"
    url = f"{GATEWAY}{path}{sep}token={urllib.parse.quote(token or app_token())}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.status, json.loads(res.read() or b"{}")
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            return err.code, json.loads(raw or b"{}")
        except ValueError:
            return err.code, {"raw": raw.decode(errors="replace")}


@unittest.skipUnless(GATEWAY and TOKEN, NO_GATEWAY)
class SignedProxyTests(unittest.TestCase):
    """The gateway signs /apps/quartizo/api/* and the backend verifies it."""

    def test_status_reaches_backend_as_app_token_principal(self):
        status, body = call("GET", "/apps/quartizo/api/status", token=app_token(fresh=True))
        app_token(fresh=True)  # the one just used is spent
        if body.get("code") == "app_not_enabled":
            self.skipTest("quartizo is installed but not enabled (needs trust)")
        # 401 would mean the backend refused the gateway's signature. The backend
        # verified it and then refused the app-token principal on an owner-only route.
        self.assertEqual((status, body.get("code")), (403, "owner_session_required"), body)

    def test_direct_unsigned_backend_hit_is_refused(self):
        backend = os.environ.get("KIROCREW_BACKEND_URL", "").rstrip("/")
        if not backend:
            self.skipTest("set KIROCREW_BACKEND_URL to the quartizo backend's loopback URL")
        with urllib.request.urlopen(f"{backend}/health", timeout=5) as res:
            self.assertEqual(res.status, 200)
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(f"{backend}/api/status", timeout=5)
        self.assertEqual(ctx.exception.code, 401)
        ctx.exception.close()


if __name__ == "__main__":
    unittest.main()
