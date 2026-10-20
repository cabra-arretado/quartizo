"""Recorded session keys (M5 review): validation, idempotence, owner-only, persistence."""
from __future__ import annotations

import shutil
import tempfile
import unittest
from pathlib import Path

from tests.backend.signing import load_server
from tests.backend.test_http import SECRET, _start, _stop
from tests.backend.test_workspace import signed_json

srv = load_server()
from workspace import ApiError, Registry  # noqa: E402

TAB = "quartizo-lx2k9a-0a1b2c"


class RegistrySlotTests(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="quartizo-slots-")).resolve()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        (self.tmp / "v").mkdir()
        (self.tmp / "v").chmod(0o755)
        self.data = self.tmp / "crew" / "apps" / "quartizo" / "data"
        self.registry = Registry(self.data, protected=(str(self.tmp / "crew"),))
        self.ws = self.registry.register(str(self.tmp / "v"))

    def test_records_tab_and_workspace_keys_idempotently(self):
        ws_key = f"quartizo-w{self.ws.uid}-lx2k9a-0a1b2c"
        first = self.registry.record_slot(TAB)
        self.assertEqual((first["key"], first["workspaceUid"]), (TAB, None))
        self.assertEqual(self.registry.record_slot(ws_key)["workspaceUid"], self.ws.uid)
        again = self.registry.record_slot(TAB)
        self.assertEqual(again, first)
        self.assertEqual([s["key"] for s in self.registry.created_slots()], [TAB, ws_key])

    def test_refuses_names_the_ui_does_not_generate(self):
        for bad in ("main", "dashboard:chat-1", "quartizo-it-1792504816", "quartizo-abc", "QUARTIZO-a-000000",
                    TAB + "\n", TAB + " ", "", None, 7, ["x"], f"quartizo-w{'A' * 32}-a-000000"):
            with self.subTest(bad=bad):
                with self.assertRaises(ApiError) as ctx:
                    self.registry.record_slot(bad)
                self.assertEqual((ctx.exception.status, ctx.exception.code), (400, "bad_slot_key"))
        self.assertEqual(self.registry.created_slots(), [])

    def test_workspace_uid_must_be_registered(self):
        with self.assertRaises(ApiError) as ctx:
            self.registry.record_slot(f"quartizo-w{'b' * 32}-lx2k9a-0a1b2c")
        self.assertEqual((ctx.exception.status, ctx.exception.code), (404, "workspace_not_found"))
        self.assertEqual(self.registry.created_slots(), [])

    def test_survives_restart_and_workspace_removal(self):
        ws_key = f"quartizo-w{self.ws.uid}-lx2k9a-0a1b2c"
        self.registry.record_slot(ws_key)
        self.registry.unregister(self.ws.id)
        again = Registry(self.data, protected=(str(self.tmp / "crew"),))
        self.assertEqual([s["key"] for s in again.created_slots()], [ws_key])


class SlotHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix="quartizo-slots-http-")
        root = Path(cls.tmp.name).resolve()
        (root / "v").mkdir()
        (root / "v").chmod(0o755)
        cls.proc, cls.port = _start(SECRET, home=str(root / "crew"))
        cls.addClassCleanup(_stop, cls.proc)
        status, body = signed_json(cls.port, "POST", "/api/workspaces", {"path": str(root / "v")})
        assert status == 201, body
        cls.uid = body["workspace"]["uid"]

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_post_and_list_round_trip(self):
        s1, b1 = signed_json(self.port, "POST", "/api/slots", {"key": TAB})
        s2, b2 = signed_json(self.port, "POST", "/api/slots", {"key": TAB})
        self.assertEqual((s1, s2), (200, 200))
        self.assertEqual(b1, b2)
        ws_key = f"quartizo-w{self.uid}-lx2k9a-0a1b2c"
        self.assertEqual(signed_json(self.port, "POST", "/api/slots", {"key": ws_key})[0], 200)
        status, body = signed_json(self.port, "GET", "/api/slots")
        self.assertEqual(status, 200)
        self.assertEqual({s["key"] for s in body["slots"]}, {TAB, ws_key})

    def test_refusals(self):
        self.assertEqual(signed_json(self.port, "POST", "/api/slots", {"key": "main"})[1]["code"], "bad_slot_key")
        self.assertEqual(signed_json(self.port, "POST", "/api/slots", {})[0], 400)
        status, body = signed_json(self.port, "POST", "/api/slots", {"key": f"quartizo-w{'c' * 32}-a-000000"})
        self.assertEqual((status, body["code"]), (404, "workspace_not_found"))
        self.assertEqual(signed_json(self.port, "DELETE", "/api/slots")[0], 404)

    def test_owner_only(self):
        for method, payload in (("GET", None), ("POST", {"key": TAB})):
            for kind in ("app-token", "agent-tool", "none"):
                with self.subTest(method=method, kind=kind):
                    status, body = signed_json(self.port, method, "/api/slots", payload, kind=kind, owner_id="")
                    self.assertEqual((status, body["code"]), (403, "owner_session_required"))
