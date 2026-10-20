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
  KIROCREW_APP_TOKEN     an app token for quartizo (exchanged from the app
                         secret at POST /api/apps/quartizo/token, X-App-Secret)
  KIROCREW_OWNER_TOKEN   (owner-cookie tests) the dashboard owner's session
                         token, sent as the mc_token_<port> cookie
  KIROCREW_FOREIGN_SLOT  (ownership test) a slot key quartizo does NOT own
  KIROCREW_PENDING_SLOT / KIROCREW_PENDING_REQUEST_ID
                         (resolution test) a pending tool approval on a slot
                         the app token owns, with sessionApproval granted

None of this has been run: no gateway was available when it was written.
Token transport (?token= query) and the request/response shapes are read from
kirodotdev/KiroCrew@f62ab4fd source (token_auth.py, chat_api/slot_create.py,
chat_api/slot_approval.py, slot_ownership.py).
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
TOKEN = os.environ.get("KIROCREW_APP_TOKEN", "")
OWNER_TOKEN = os.environ.get("KIROCREW_OWNER_TOKEN", "")
NO_GATEWAY = "no gateway: set KIROCREW_GATEWAY_URL and KIROCREW_APP_TOKEN to run"
NO_OWNER = "no gateway: set KIROCREW_GATEWAY_URL and KIROCREW_OWNER_TOKEN to run"
# Well-formed (32 lowercase hex) but never pending.
UNKNOWN_REQUEST_ID = "0123456789abcdef0123456789abcdef"


def call(method: str, path: str, body: dict | None = None, *, owner: bool = False) -> tuple[int, dict]:
    headers = {"Content-Type": "application/json"}
    if owner:
        # The page's credential: the owner's session cookie, named by port.
        port = urllib.parse.urlsplit(GATEWAY).port or 80
        url = f"{GATEWAY}{path}"
        headers["Cookie"] = f"mc_token_{port}={OWNER_TOKEN}"
    else:
        sep = "&" if "?" in path else "?"
        url = f"{GATEWAY}{path}{sep}token={urllib.parse.quote(TOKEN)}"
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
        # The serialized row's owner field name is unverified; check whichever exists.
        fields = [f for f in ("app", "_app", "owner_app") if f in row]
        if not fields:
            self.skipTest(f"slot row exposes no app-owner field (keys: {sorted(row)})")
        for f in fields:
            self.assertEqual(row[f], "", f"{f} should be empty for an owner-created slot")

    def test_approve_is_not_refused_for_the_grant(self):
        key = self._create()["key"]
        for action in ("approved", "rejected"):
            with self.subTest(action=action):
                status, body = call("POST", f"/api/chat/slots/{urllib.parse.quote(key)}/approve",
                                    {"action": action, "request_id": UNKNOWN_REQUEST_ID}, owner=True)
                # Nothing is pending, so success is not expected; only the grant refusal is ruled out.
                self.assertNotEqual(body.get("code"), "session_approval_not_granted", (status, body))
                self.assertNotEqual(status, 403, body)


if __name__ == "__main__":
    unittest.main()
