"""Signed preferences API round trips and atomic persistence."""
from __future__ import annotations

import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor

from tests.backend.test_http import SECRET, _request, _start, _stop
from tests.backend.test_workspace import signed_json

PREFERENCES = "/api/preferences"


class PreferencesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        home = tempfile.TemporaryDirectory(prefix="quartizo-preferences-")
        cls.addClassCleanup(home.cleanup)
        proc, cls.port = _start(SECRET, home=home.name)
        cls.addClassCleanup(_stop, proc)

    def call(self, method, payload=None, owner_id=None):
        return signed_json(self.port, method, PREFERENCES, payload, owner_id=owner_id or self.id())

    def test_concurrent_changes_merge_and_migration_preserves_saved_values(self):
        self.assertEqual(self.call("GET"), (200, {"preferences": {}}))
        changes = [
            {"lastTab": "notes"},
            {"todoState": "done"},
            {"noteFolders": {"10": {"lastNote": "some/note.md", "pinned": ["other.md"]}}},
            {"noteFolders": {"20": {"lastNote": "in-a-different-folder.md"}}},
        ]
        with ThreadPoolExecutor(max_workers=len(changes)) as pool:
            statuses = list(pool.map(lambda change: self.call("PATCH", {"changes": change})[0], changes))
        self.assertEqual(statuses, [200, 200, 200, 200])
        expected = {key: value for change in changes for key, value in change.items()}
        expected["noteFolders"] = {**changes[2]["noteFolders"], **changes[3]["noteFolders"]}
        code, body = self.call("PATCH", {"changes": {"todoState": "open", "noteWidth": "wide"}, "onlyIfMissing": True})
        self.assertEqual((code, body), (200, {"preferences": {**expected, "noteWidth": "wide"}}))
        self.assertEqual(self.call("GET", owner_id="different-owner"), (200, {"preferences": {}}))
        self.assertEqual(self.call("GET"), (code, body))

    def test_restart_restores_preferences(self):
        with tempfile.TemporaryDirectory(prefix="quartizo-preferences-restart-") as home:
            proc, port = _start(SECRET, home=home)
            expected = {"preferences": {"folderAppearance": {"10": {"emoji": "📁", "color": "#123abc"}}}}
            try:
                code, body = signed_json(port, "PATCH", PREFERENCES, {"changes": expected["preferences"]})
                self.assertEqual((code, body), (200, expected))
            finally:
                _stop(proc)
            proc, port = _start(SECRET, home=home)
            try:
                self.assertEqual(signed_json(port, "GET", PREFERENCES), (200, expected))
            finally:
                _stop(proc)

    def test_invalid_and_oversized_changes_leave_saved_preferences_intact(self):
        for payload in (
            {"changes": []},
            {"changes": {"lastTab": "notes"}, "onlyIfMissing": 1},
            {"changes": {"__proto__": {}}},
            {"changes": {"nested": [[[[[[[[[]]]]]]]]]}},
            {"changes": {"value": float("nan")}},
            {"changes": {"value": "\ud800"}},
        ):
            with self.subTest(payload=payload):
                code, body = self.call("PATCH", payload)
                self.assertEqual((code, body["code"]), (400, "bad_preferences"))
        first = {"first": "a" * (40 << 10)}
        self.assertEqual(self.call("PATCH", {"changes": first}), (200, {"preferences": first}))
        code, body = self.call("PATCH", {"changes": {"second": "b" * (40 << 10)}})
        self.assertEqual((code, body["code"]), (413, "preferences_too_large"))
        self.assertEqual(self.call("GET"), (200, {"preferences": first}))

    def test_preferences_require_a_signed_owner(self):
        for method in ("GET", "PATCH"):
            with self.subTest(method=method):
                self.assertEqual(_request(self.port, method, PREFERENCES)[0], 401)
                code, body = signed_json(self.port, method, PREFERENCES, kind="app-token", owner_id="")
                self.assertEqual((code, body["code"]), (403, "owner_session_required"))
