"""Gateway integration checks. They need a real, running KiroCrew gateway with
quartizo installed, trusted and enabled, so they SKIP unless configured.

Two groups:

* App-token CONTRACT tests (SessionOwnershipTests, ToolApprovalTests). They
  pin what the gateway does for a caller holding a quartizo APP TOKEN. They do
  NOT reflect the shipped UI: the page's useAppApi() calls carry the dashboard
  owner's cookie, not an app token (website/src/app-sdk/scopedApi.ts,
  dashboard/token_auth.py at the pinned SHA). They matter only if a
  backend-mediated app-token path is ever built.
* Owner-cookie tests (OwnerCookieTests). They assert what the page actually
  gets: an owner session (no app owner) and Approve not refused for the grant.

  KIROCREW_GATEWAY_URL   e.g. http://127.0.0.1:7777
  KIROCREW_APP_SECRET_FILE  path to quartizo's generated .app_secret; tests
                         exchange it at POST /api/apps/quartizo/token
                         (X-App-Secret) for fresh app tokens. Preferred.
  KIROCREW_APP_TOKEN     alternatively, one ready app token (single use for
                         app-namespaced routes; see app_token())
  KIROCREW_OWNER_TOKEN   (owner-cookie tests) the dashboard owner's session
                         token, sent as the mc_token_<port> cookie
  KIROCREW_FOREIGN_SLOT  (ownership test) a slot key quartizo does NOT own
  KIROCREW_PENDING_SLOT / KIROCREW_PENDING_REQUEST_ID
                         (resolution test) a pending tool approval on a slot
                         the app token owns, with sessionApproval granted

  KIROCREW_BACKEND_URL   (direct-hit test) the quartizo backend's own loopback
                         URL, e.g. http://127.0.0.1:9100 (see `kirocrew app info`)

Run against kirocrew 0.10.0rc4 (see docs/compatibility.md for measured
results). The slot row names its owning app in the `app` field ("" for owner
sessions, "quartizo" for app-token slots), with `origin` "app" for the latter.
"""
from __future__ import annotations

import json
import os
import time
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
OWNER_TOKEN = os.environ.get("KIROCREW_OWNER_TOKEN", "")
NO_GATEWAY = ("no gateway: set KIROCREW_GATEWAY_URL and KIROCREW_APP_SECRET_FILE "
              "(or KIROCREW_APP_TOKEN) to run")
NO_OWNER = "no gateway: set KIROCREW_GATEWAY_URL and KIROCREW_OWNER_TOKEN to run"
# Well-formed (32 lowercase hex) but never pending.
UNKNOWN_REQUEST_ID = "0123456789abcdef0123456789abcdef"


def call(method: str, path: str, body: dict | None = None, *, owner: bool = False,
         token: str | None = None) -> tuple[int, dict]:
    headers = {"Content-Type": "application/json"}
    if owner:
        # The page's credential: the owner's session cookie, named by port.
        port = urllib.parse.urlsplit(GATEWAY).port or 80
        url = f"{GATEWAY}{path}"
        headers["Cookie"] = f"mc_token_{port}={OWNER_TOKEN}"
    else:
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
class SessionOwnershipTests(unittest.TestCase):
    def test_create_then_reopen_own_slot(self):
        name = f"quartizo-it-{int(time.time())}"
        status, body = call("POST", "/api/chat/slots", {"name": name})
        self.assertEqual(status, 200, body)
        key = body["key"]
        self.assertEqual((body.get("app"), body.get("origin")), ("quartizo", "app"), body)
        status, body = call("POST", "/api/chat/slots", {"name": key})
        self.assertEqual((status, body.get("key")), (200, key))
        self.assertEqual(call("GET", f"/api/chat/slots/{urllib.parse.quote(key)}?limit=1")[0], 200)

    def test_foreign_slot_is_slot_not_found(self):
        foreign = os.environ.get("KIROCREW_FOREIGN_SLOT")
        if not foreign:
            self.skipTest("set KIROCREW_FOREIGN_SLOT to a slot quartizo does not own")
        status, body = call("POST", "/api/chat/slots", {"name": foreign})
        self.assertEqual((status, body.get("code")), (404, "slot_not_found"))


@unittest.skipUnless(GATEWAY and TOKEN, NO_GATEWAY)
class ToolApprovalTests(unittest.TestCase):
    def _own_slot(self) -> str:
        status, body = call("POST", "/api/chat/slots", {"name": f"quartizo-ap-{int(time.time())}"})
        self.assertEqual(status, 200, body)
        return body["key"]

    def test_approve_and_reject_refused_without_grant(self):
        # quartizo does not declare permissions.sessionApproval, so the gateway
        # must refuse both decisions with 403 even on the app's own slot.
        key = self._own_slot()
        for action in ("approved", "rejected"):
            with self.subTest(action=action):
                status, body = call("POST", f"/api/chat/slots/{urllib.parse.quote(key)}/approve",
                                    {"action": action, "request_id": UNKNOWN_REQUEST_ID})
                self.assertEqual((status, body.get("code")), (403, "session_approval_not_granted"))

    def test_approve_reject_resolves_pending_request(self):
        slot = os.environ.get("KIROCREW_PENDING_SLOT")
        rid = os.environ.get("KIROCREW_PENDING_REQUEST_ID")
        if not (slot and rid):
            self.skipTest("needs a pending tool approval and a build with permissions.sessionApproval; "
                          "set KIROCREW_PENDING_SLOT and KIROCREW_PENDING_REQUEST_ID")
        action = os.environ.get("KIROCREW_PENDING_ACTION", "rejected")
        status, body = call("POST", f"/api/chat/slots/{urllib.parse.quote(slot)}/approve",
                            {"action": action, "request_id": rid})
        self.assertEqual(status, 200, body)


@unittest.skipUnless(GATEWAY and OWNER_TOKEN, NO_OWNER)
class OwnerCookieTests(unittest.TestCase):
    """What the shipped page gets: it calls with the owner's cookie."""

    def _create(self) -> dict:
        status, body = call("POST", "/api/chat/slots", {"name": f"quartizo-{int(time.time()):x}-0it000"}, owner=True)
        self.assertEqual(status, 200, body)
        return body

    def test_slot_has_no_app_owner(self):
        row = self._create()
        # Measured on 0.10.0rc4: the owner field is `app` ("quartizo" on app-token slots).
        self.assertIn("app", row, sorted(row))
        self.assertEqual(row["app"], "", "an owner-created slot has no app owner")

    def test_approve_is_not_refused_for_the_grant(self):
        key = self._create()["key"]
        for action in ("approved", "rejected"):
            with self.subTest(action=action):
                status, body = call("POST", f"/api/chat/slots/{urllib.parse.quote(key)}/approve",
                                    {"action": action, "request_id": UNKNOWN_REQUEST_ID}, owner=True)
                # Nothing is pending, so success is not expected; only the grant refusal is ruled out.
                self.assertNotEqual(body.get("code"), "session_approval_not_granted", (status, body))
                self.assertNotEqual(status, 403, body)


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
