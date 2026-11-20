"""The quartizo-notes skill's helper: folder discovery and card order."""
from __future__ import annotations

import io
import json
import sqlite3
import sys
import tempfile
import unittest
import uuid
from contextlib import closing, redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock

from tests.backend.signing import load_server

load_server()
import preferences  # noqa: E402  (importable once server.py has put backend/ on sys.path)
from workspace import Registry  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "skills" / "quartizo-notes" / "scripts"))
import quartizo_ticket as helper  # noqa: E402


class FoldersTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name).resolve()
        self.registry = Registry(root / "data")
        self.db = self.registry.db_path
        self.dirs = {}
        for name in ("Work", "Journal", "Archive"):
            self.dirs[name] = root / name.lower()
            self.dirs[name].mkdir()
        self.work = self.registry.register(str(self.dirs["Work"]), "Work", True)
        self.journal = self.registry.register(str(self.dirs["Journal"]), "Journal", True)
        self.registry.register(str(self.dirs["Archive"]), "Archive", False)  # not enabled

    def _set_default(self, ws_id):
        preferences.update(self.db, "owner", {"changes": {"workspaceId": ws_id}})

    def test_lists_enabled_folders_by_name_with_the_first_as_default(self):
        found = helper.folders(self.db)
        self.assertEqual([f["name"] for f in found], ["Journal", "Work"])
        self.assertEqual([f["default"] for f in found], [True, False])
        self.assertEqual(found[0]["columns"], list(helper.DEFAULT_COLUMN_IDS))

    def test_saved_default_comes_first(self):
        self._set_default(self.work.id)
        found = helper.folders(self.db)
        self.assertEqual([(f["name"], f["default"]) for f in found], [("Work", True), ("Journal", False)])

    def test_a_saved_default_that_is_no_longer_enabled_falls_back(self):
        self._set_default(self.work.id)
        self.registry.set_companion(self.work.id, False)
        self.assertEqual([f["name"] for f in helper.folders(self.db) if f["default"]], ["Journal"])

    def test_custom_columns_and_missing_folders(self):
        with closing(sqlite3.connect(self.db)) as conn, conn:
            conn.execute("UPDATE workspaces SET board_columns = ? WHERE id = ?",
                         (json.dumps([{"id": "todo", "label": "To do"}, {"id": "done", "label": "Done"}]), self.work.id))
        self.dirs["Journal"].rmdir()
        by_name = {f["name"]: f for f in helper.folders(self.db)}
        self.assertEqual(by_name["Work"]["columns"], ["todo", "done"])
        self.assertTrue(by_name["Journal"]["missing"])
        self.assertFalse(by_name["Work"]["missing"])

    def test_command_output_and_refusals(self):
        self._set_default(self.work.id)
        out = io.StringIO()
        with mock.patch.object(helper, "DB_PATH", self.db), redirect_stdout(out):
            self.assertEqual(helper.main(["folders"]), 0)
        first = out.getvalue().splitlines()[0].split("\t")
        self.assertEqual(first, ["Work", str(self.dirs["Work"]), " ".join(helper.DEFAULT_COLUMN_IDS), "default"])
        with mock.patch.object(helper, "DB_PATH", Path(self.tmp.name) / "none.sqlite3"), redirect_stderr(io.StringIO()):
            self.assertEqual(helper.main(["folders"]), 1)

    def test_database_is_opened_read_only(self):
        before = self.db.read_bytes()
        helper.folders(self.db)
        self.assertEqual(self.db.read_bytes(), before)


class OrderTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.folder = Path(self.tmp.name).resolve()

    def _ticket(self, name, status, order):
        (self.folder / f"{name}.md").write_text(
            f'---\nid: "{uuid.uuid4()}"\ntype: ticket\nstatus: "{status}"\n'
            f'order: "{order}"\n---\n\n# {name}\n', encoding="utf-8")

    def test_places_cards_at_the_end_and_between_neighbours(self):
        self._ticket("a", "backlog", "4" + "0" * 31)
        self._ticket("b", "backlog", "8" + "0" * 31)
        self.assertEqual(helper.order(self.folder, "backlog", None, None), "b" + "f" * 31)
        self.assertEqual(helper.order(self.folder, "backlog", "b.md", None), "6" + "0" * 31)
        self.assertEqual(helper.order(self.folder, "ready", None, None), "7" + "f" * 31)
        self.assertEqual(helper.check(self.folder, "a.md"), [])


if __name__ == "__main__":
    unittest.main()
