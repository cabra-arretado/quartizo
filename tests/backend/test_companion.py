"""Kiro Notes companion: read-only Markdown ticket/TODO index and its HTTP boundary."""
from __future__ import annotations

import os
import shutil
import sqlite3
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

from spikes.markdown_tickets.fixtures import TICKET_ID, fixture_files
from tests.backend.signing import load_server
from tests.backend.test_http import SECRET, _start, _stop
from tests.backend.test_workspace import signed_json

srv = load_server()
import companion  # noqa: E402
import db  # noqa: E402
from workspace import ApiError, Registry  # noqa: E402

BOM_ID = "11111111-1111-4111-8111-111111111111"


def snapshot(root: Path) -> dict:
    """Every entry under *root* (hidden ones too) with its bytes and timestamps."""
    out = {}
    for dirpath, dirnames, filenames in os.walk(root):
        for name in dirnames + filenames:
            path = Path(dirpath) / name
            st = path.lstat()
            out[str(path.relative_to(root))] = (path.read_bytes() if path.is_file() else None,
                                                st.st_mtime_ns, st.st_mode)
    return out


class IndexTestCase(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="quartizo-companion-")).resolve()
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.vault = self.tmp / "vault"
        for name, data in fixture_files().items():
            self.put(name, data)
        self.registry = Registry(self.tmp / "data", protected=())
        ws = self.registry.register(str(self.vault))
        self.ws = self.registry.set_companion(ws.id, True)
        self.index = companion.CompanionIndex(self.registry)

    def put(self, rel: str, data: bytes) -> Path:
        path = self.vault / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return path

    def scan(self, *, rebuild: bool = False) -> None:
        self.index.scan(self.ws, companion._Scan(rebuild))

    def tickets(self) -> dict:
        return {t["path"]: t for t in self.index.board(self.ws)["tickets"]}

    def codes(self, item: dict) -> list[str]:
        return [d["code"] for d in item["diagnostics"]]

    def todo_texts(self, state: str = "all") -> dict:
        groups = self.index.todos([self.ws], state)["groups"]
        return {g["path"]: [i["text"] for i in g["items"]] for g in groups}


class BoardTests(IndexTestCase):
    def test_tickets_are_placed_by_status_with_diagnostics_kept_visible(self):
        self.scan()
        tickets = self.tickets()
        ticket = tickets["ticket.md"]
        self.assertEqual((ticket["id"], ticket["title"], ticket["status"], ticket["lane"]),
                         (TICKET_ID, "Fix café login ☕", "ready", "ready"))
        self.assertEqual(ticket["todos"], {"total": 3, "done": 0})
        self.assertEqual(tickets["bom-crlf.md"]["id"], BOM_ID)
        for path in ("diagnostics/invalid-yaml.md", "diagnostics/duplicate-key.md", "diagnostics/missing-fields.md"):
            with self.subTest(path=path):
                self.assertEqual(tickets[path]["lane"], "repair")
                self.assertTrue(tickets[path]["diagnostics"])
        self.assertEqual(self.codes(tickets["diagnostics/invalid-yaml.md"]), ["invalid_yaml"])
        self.assertEqual(self.codes(tickets["diagnostics/missing-fields.md"]),
                         ["invalid_id", "invalid_status", "invalid_order"])
        self.assertNotIn("ordinary.md", tickets)
        self.assertNotIn("diagnostics/property-collision.md", tickets)
        other = {n["path"]: self.codes(n) for n in self.index.board(self.ws)["notes"]}
        self.assertEqual(other, {"diagnostics/alias.md": ["yaml_reference"], "mixed.md": ["mixed_endings"]})

    def test_duplicate_ids_are_reported_on_every_copy_and_never_merged(self):
        self.scan()
        tickets = self.tickets()
        for path, other in (("ticket.md", "diagnostics/duplicate.md"), ("diagnostics/duplicate.md", "ticket.md")):
            dup = next(d for d in tickets[path]["diagnostics"] if d["code"] == "duplicate_id")
            self.assertEqual([o["path"] for o in dup["others"]], [other])
        self.assertEqual(sum(t["id"] == TICKET_ID for t in tickets.values()), 2)

    def test_duplicates_are_checked_across_companion_workspaces(self):
        second = self.tmp / "second"
        second.mkdir()
        (second / "copy.md").write_bytes(fixture_files()["ticket.md"].replace(TICKET_ID.encode(), BOM_ID.encode()))
        other = self.registry.set_companion(self.registry.register(str(second)).id, True)
        self.scan()
        self.index.scan(other, companion._Scan(False))
        dup = next(d for d in self.tickets()["bom-crlf.md"]["diagnostics"] if d["code"] == "duplicate_id")
        self.assertEqual(dup["others"], [{"workspaceId": other.id, "workspace": "second", "path": "copy.md"}])
        # Leaving companion mode takes a workspace out of the duplicate check.
        self.registry.set_companion(other.id, False)
        self.assertNotIn("duplicate_id", self.codes(self.tickets()["bom-crlf.md"]))

    def test_order_is_ascii_rank_then_id_and_invalid_ranks_last(self):
        for i, (uid, rank) in enumerate((("b" * 32, "8" + "0" * 31), ("a" * 32, "8" + "0" * 31),
                                         ("c" * 32, "1" + "0" * 31), ("d" * 32, "nope"))):
            self.put(f"order/{i}.md", f'---\nid: "{uid}"\ntype: ticket\nstatus: review\norder: "{rank}"\n---\n'.encode())
        self.scan()
        review = [t["id"] for t in self.index.board(self.ws)["tickets"] if t["lane"] == "review"]
        self.assertEqual(review, ["c" * 32, "a" * 32, "b" * 32, "d" * 32])


class TodoTests(IndexTestCase):
    def test_checkboxes_are_the_ones_kiro_notes_shows(self):
        self.scan()
        texts = self.todo_texts()
        # Kiro Notes only renders "- [ ]" / "- [x]" lines outside ``` fences: not "*", "+", "[X]" or fenced examples,
        # but an indented "- [ ]" line, which CommonMark would call code.
        self.assertEqual(texts["ticket.md"], ["Reproduce the timeout", "Reproduce the timeout", "An indented example"])
        self.assertNotIn("ordinary.md", texts)
        self.assertEqual(texts["no-newline.md"], ["café", "café"])
        group = next(g for g in self.index.todos([self.ws], "all")["groups"] if g["path"] == "ticket.md")
        self.assertEqual((group["ticket"], group["ticketId"], group["title"]), (True, TICKET_ID, "Fix café login ☕"))
        first = group["items"][0]
        self.assertEqual((first["line"], first["column"], first["heading"], first["depth"]), (20, 3, "Reproduction", 0))
        self.assertEqual([i["heading"] for i in group["items"]], ["Reproduction", "Reproduction", "Examples"])

    def test_kiro_notes_line_rule(self):
        self.put("rule.md", "\n".join((
            "- [ ] open", "  - [x] nested done", "- [X] upper case", "* [ ] star", "+ [ ] plus", "1. [ ] numbered",
            "> - [ ] quoted", "- [ ]no space", "~~~", "- [ ] tilde fence", "~~~", "```", "- [ ] backtick fence", "```",
            "\ufeff", "- [x] after", "",
        )).encode())
        self.scan()
        group = next(g for g in self.index.todos([self.ws], "all")["groups"] if g["path"] == "rule.md")
        items = [(i["text"], i["checked"], i["depth"]) for i in group["items"]]
        self.assertEqual(items, [("open", False, 0), ("nested done", True, 1), ("tilde fence", False, 0), ("after", True, 0)])

    def test_state_filter_and_counts(self):
        self.scan()
        everything = self.index.todos([self.ws], "all")
        open_ = self.index.todos([self.ws], "open")
        done = self.index.todos([self.ws], "done")
        self.assertEqual(everything["counts"], open_["counts"])
        total = sum(len(g["items"]) for g in everything["groups"])
        self.assertEqual(total, everything["counts"]["open"] + everything["counts"]["done"])
        self.assertTrue(all(not i["checked"] for g in open_["groups"] for i in g["items"]))
        self.assertTrue(all(i["checked"] for g in done["groups"] for i in g["items"]))
        with self.assertRaises(ApiError):
            self.index.todos([self.ws], "maybe")

    def test_results_are_bounded(self):
        self.scan()
        with mock.patch.object(companion, "MAX_TODO_RESULTS", 3):
            result = self.index.todos([self.ws], "all")
        self.assertTrue(result["truncated"])
        self.assertEqual(sum(len(g["items"]) for g in result["groups"]), 3)


class KiroNotesEdgeCaseTests(IndexTestCase):
    def items(self, name: str, data: bytes) -> list:
        self.put(name, data)
        self.scan()
        group = next((g for g in self.index.todos([self.ws], "all")["groups"] if g["path"] == name), None)
        return [(i["text"], i["line"], i["column"], i["depth"], i["heading"]) for i in group["items"]] if group else []

    def test_crlf_lines_are_not_checkboxes(self):
        # Kiro Notes splits on \n only, and its "." stops at the remaining \r.
        self.assertEqual(self.items("crlf.md", b"- [ ] one\r\n- [ ] two\r\n- [ ] last"), [("last", 3, 3, 0, None)])

    def test_a_lone_cr_file_is_one_line(self):
        self.assertEqual(self.items("cr.md", b"- [ ] one\r- [ ] two\r"), [])

    def test_unclosed_frontmatter_is_body(self):
        self.assertEqual(self.items("open.md", b"---\ntitle: x\n- [ ] in yaml\n"), [("in yaml", 3, 3, 0, None)])

    def test_closed_frontmatter_is_skipped_but_a_bom_breaks_it(self):
        self.assertEqual(self.items("fm.md", b"---\n- [ ] yaml\n---\n- [ ] body\n"), [("body", 4, 3, 0, None)])
        bom = self.items("bom.md", "\ufeff---\n- [ ] yaml\n---\n- [ ] body\n".encode())
        self.assertEqual([i[0] for i in bom], ["yaml", "body"])

    def test_depth_follows_indentation_with_tab_stops_and_headings(self):
        data = b"# Top\n- [ ] a\n\t- [ ] b\n    - [ ] c\n  - [ ] d\n## Next\n- [x] e\n"
        self.assertEqual([(t, d, h) for t, _, _, d, h in self.items("depth.md", data)],
                         [("a", 0, "Top"), ("b", 1, "Top"), ("c", 1, "Top"), ("d", 1, "Top"), ("e", 0, "Next")])


class ReconcileTests(IndexTestCase):
    def test_browsing_refreshing_and_rebuilding_leave_vault_bytes_unchanged(self):
        before = snapshot(self.vault)
        self.scan()
        self.index.board(self.ws)
        self.index.todos([self.ws], "all")
        self.scan()
        self.scan(rebuild=True)
        self.assertEqual(snapshot(self.vault), before)

    def test_timestamp_preserving_external_edit_is_detected(self):
        self.scan()
        path = self.vault / "ticket.md"
        st = path.stat()
        path.write_bytes(path.read_bytes().replace(b'status: "ready"', b'status: "done"').replace(b"- [ ] Reproduce", b"- [x] Reproduce", 1))
        os.utime(path, ns=(st.st_atime_ns, st.st_mtime_ns))
        self.scan()
        self.assertEqual(self.tickets()["ticket.md"]["status"], "done")
        self.assertEqual(self.tickets()["ticket.md"]["todos"], {"total": 3, "done": 1})

    def test_new_deleted_and_renamed_notes_follow_a_complete_scan(self):
        self.scan()
        (self.vault / "ticket.md").rename(self.vault / "renamed.md")
        (self.vault / "ordinary.md").unlink()
        self.put("fresh.md", b"- [ ] new\n")
        self.scan()
        tickets = self.tickets()
        self.assertNotIn("ticket.md", tickets)
        self.assertEqual(tickets["renamed.md"]["id"], TICKET_ID)
        texts = self.todo_texts()
        self.assertNotIn("ordinary.md", texts)
        self.assertEqual(texts["fresh.md"], ["new"])
        self.assertTrue(self.index.status(self.ws)["complete"])

    def test_incomplete_scan_retains_unseen_notes(self):
        self.scan()
        with mock.patch.object(companion, "MAX_SCAN_ENTRIES", 3):
            self.scan()
        status = self.index.status(self.ws)
        self.assertFalse(status["complete"])
        self.assertGreater(status["retained"], 0)
        tickets = self.tickets()
        self.assertIn("diagnostics/duplicate.md", tickets)
        self.assertTrue(tickets["diagnostics/duplicate.md"]["retained"])
        # A later complete scan clears the retained state.
        self.scan()
        self.assertEqual(self.index.status(self.ws)["retained"], 0)
        self.assertFalse(self.tickets()["diagnostics/duplicate.md"]["retained"])

    @unittest.skipIf(os.geteuid() == 0, "root can read a 000 file")
    def test_unreadable_note_keeps_its_last_known_rows(self):
        self.scan()
        path = self.vault / "ticket.md"
        path.chmod(0)
        self.addCleanup(path.chmod, 0o644)
        self.scan()
        ticket = self.tickets()["ticket.md"]
        self.assertEqual((ticket["status"], ticket["retained"]), ("ready", True))
        self.assertIn("unreadable", self.codes(ticket))
        self.assertEqual(len(self.todo_texts()["ticket.md"]), 3)

    def test_missing_root_keeps_the_previous_generation_and_reports_it(self):
        self.scan()
        before = self.tickets()
        self.vault.rename(self.tmp / "moved")
        self.scan()
        status = self.index.status(self.ws)
        self.assertEqual((status["state"], status["error"]["code"]), ("stale", "root_missing"))
        self.assertEqual(self.tickets().keys(), before.keys())

    def test_discarding_derived_tables_rebuilds_equivalent_results(self):
        self.scan()
        board, todos = self.index.board(self.ws), self.index.todos([self.ws], "all")
        with db.connect(self.registry.db_path) as conn:
            for table in ("companion_todos", "companion_notes", "companion_index", "companion_generations"):
                conn.execute(f"DELETE FROM {table}")
        self.assertEqual(self.index.status(self.ws)["state"], "unindexed")
        self.scan(rebuild=True)
        self.assertEqual(self.index.board(self.ws)["tickets"], board["tickets"])
        self.assertEqual(self.index.todos([self.ws], "all")["groups"], todos["groups"])
        self.assertEqual(self.registry.get(self.ws.id), self.ws)  # registrations untouched

    def test_interrupted_generations_are_discarded_at_start(self):
        self.scan()
        with db.connect(self.registry.db_path) as conn:
            conn.execute("INSERT INTO companion_notes (workspace_uid, generation, path, title, ticket, diagnostics)"
                         " VALUES (?, 999999, 'ghost.md', 'ghost', 1, '[]')", (self.ws.uid,))
        fresh = companion.CompanionIndex(self.registry)
        with mock.patch.object(fresh, "request"):
            fresh.start()
        with db.connect(self.registry.db_path) as conn:
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM companion_notes WHERE generation = 999999").fetchone()[0], 0)
        self.assertIn("ticket.md", self.tickets())

    def test_unchanged_notes_are_not_parsed_again(self):
        self.scan()
        with mock.patch.object(self.index, "parse_note", wraps=self.index.parse_note) as parse:
            self.scan()
            self.assertEqual(parse.call_count, 0)
            self.put("ordinary.md", b"- [ ] changed\n")
            self.scan()
            self.assertEqual([c.args[0] for c in parse.call_args_list], ["ordinary.md"])
            self.scan(rebuild=True)
            self.assertGreater(parse.call_count, 2)

    def test_hidden_folders_and_symlinks_are_not_indexed(self):
        self.put(".trash/old.md", b"- [ ] trashed\n")
        self.put(".obsidian/x.md", b"- [ ] config\n")
        os.symlink(self.vault / "ordinary.md", self.vault / "link.md")
        self.scan()
        self.assertFalse({".trash/old.md", ".obsidian/x.md", "link.md"} & set(self.todo_texts()))

    def test_leaving_companion_mode_forgets_the_index_and_refuses_queries(self):
        self.scan()
        ws = self.registry.set_companion(self.ws.id, False)
        self.index.forget(ws.uid)
        self.assertEqual(self.index.status(ws), {"state": "off"})
        with self.assertRaises(ApiError) as ctx:
            self.index.board(ws)
        self.assertEqual(ctx.exception.code, "not_companion")
        with db.connect(self.registry.db_path) as conn:
            self.assertEqual(conn.execute("SELECT COUNT(*) FROM companion_notes").fetchone()[0], 0)

    def test_scan_stops_when_companion_mode_is_switched_off_meanwhile(self):
        self.scan()
        self.registry.set_companion(self.ws.id, False)
        self.scan()  # the stale Workspace object still says companion
        with db.connect(self.registry.db_path) as conn:
            gens = {r[0] for r in conn.execute("SELECT DISTINCT generation FROM companion_notes")}
            active = conn.execute("SELECT generation FROM companion_index").fetchone()[0]
        self.assertEqual(gens, {active})

    def test_unregistering_the_workspace_drops_its_index(self):
        self.scan()
        self.registry.unregister(self.ws.id)
        with db.connect(self.registry.db_path) as conn:
            for table in ("companion_notes", "companion_todos", "companion_index"):
                self.assertEqual(conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0], 0, table)
        self.assertTrue((self.vault / "ticket.md").exists())

    def test_worker_queue_throttles_automatic_refreshes(self):
        self.index.start()
        self.assertTrue(self.index.wait_idle())
        self.assertFalse(self.index.request(self.ws))  # just finished: automatic request skipped
        self.assertTrue(self.index.request(self.ws, manual=True))
        self.assertTrue(self.index.wait_idle())
        self.assertEqual(self.index.status(self.ws)["state"], "ready")

    def test_unavailable_parsers_refuse_queries_without_breaking_the_app(self):
        with mock.patch.dict("sys.modules", {"mdsource": None}):
            broken = companion.CompanionIndex(self.registry)
        self.assertIsNotNone(broken.unavailable)
        self.assertEqual(broken.status(self.ws)["state"], "unavailable")
        self.assertFalse(broken.request(self.ws, manual=True))
        with self.assertRaises(ApiError) as ctx:
            broken.board(self.ws)
        self.assertEqual(ctx.exception.status, 503)


class WorkerTests(IndexTestCase):
    def test_a_failure_that_cannot_be_recorded_does_not_stop_the_worker(self):
        broken = mock.patch.object(self.index, "scan", side_effect=RuntimeError("boom"))
        unrecorded = mock.patch.object(self.index, "_record_failure", side_effect=sqlite3.OperationalError("locked"))
        self.index.start()
        with broken, unrecorded:
            self.index.request(self.ws, manual=True)
            self.assertTrue(self.index.wait_idle(10))
        # The worker is still alive: the next request is scanned.
        self.index.request(self.ws, manual=True)
        self.assertTrue(self.index.wait_idle(10))
        self.assertEqual(self.tickets()["ticket.md"]["status"], "ready")


class CompanionHttpTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix="quartizo-chttp-")
        base = Path(cls.tmp.name).resolve()
        cls.vault = base / "vault"
        for name, data in fixture_files().items():
            path = cls.vault / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
        cls.proc, cls.port = _start(SECRET, home=str(base / "crew"))
        cls.addClassCleanup(_stop, cls.proc)
        status, body = signed_json(cls.port, "POST", "/api/workspaces", {"path": str(cls.vault)})
        assert status == 201, body
        cls.ws_id = body["workspace"]["id"]
        cls.base = f"/api/workspaces/{cls.ws_id}"

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def call(self, method, target, payload=None):
        return signed_json(self.port, method, target, payload)

    def set_mode(self, enabled):
        status, body = self.call("PUT", f"{self.base}/companion", {"enabled": enabled})
        self.assertEqual(status, 200, body)
        return body

    def wait_indexed(self):
        deadline = time.time() + 20
        while time.time() < deadline:
            status, body = self.call("GET", "/api/companion")
            index = next(w["index"] for w in body["workspaces"] if w["workspace"]["id"] == self.ws_id)
            if index["state"] == "ready":
                return index
            time.sleep(0.05)
        self.fail(f"index not ready: {index}")

    def test_a_folder_can_be_added_already_shared_with_kiro_notes(self):
        second = Path(self.tmp.name).resolve() / "second"
        second.mkdir()
        (second / "t.md").write_bytes(b"- [ ] one\n")
        status, body = self.call("POST", "/api/workspaces", {"path": str(second), "companion": True})
        self.assertEqual(status, 201, body)
        self.assertTrue(body["workspace"]["companion"])
        status, _ = self.call("DELETE", f"/api/workspaces/{body['workspace']['id']}")
        self.assertEqual(status, 200)

    def test_companion_mode_is_read_only_end_to_end(self):
        before = snapshot(self.vault)
        body = self.set_mode(True)
        self.assertTrue(body["workspace"]["companion"])
        self.wait_indexed()
        status, board = self.call("GET", f"{self.base}/board")
        self.assertEqual(status, 200, board)
        self.assertIn("ticket.md", {t["path"] for t in board["tickets"]})
        status, todos = self.call("GET", f"/api/companion/todos?workspace={self.ws_id}&state=all")
        self.assertEqual(status, 200, todos)
        self.assertIn("ticket.md", {g["path"] for g in todos["groups"]})
        status, todos_all = self.call("GET", "/api/companion/todos")
        self.assertEqual((status, todos_all["counts"]["open"] > 0), (200, True))
        status, body = self.call("POST", "/api/companion/refresh", {"workspaceId": self.ws_id, "rebuild": True})
        self.assertEqual((status, body["requested"]), (202, [self.ws_id]))
        self.wait_indexed()

        # The existing note writers refuse a companion folder; reading still works.
        status, read = self.call("GET", f"{self.base}/note?path=ticket.md")
        self.assertEqual(status, 200, read)
        for method, action, payload in (
            ("POST", "note", {"path": "new.md", "content": "x"}),
            ("PUT", "note", {"path": "ticket.md", "content": "x", "expectedHash": read["hash"]}),
            ("POST", "rename", {"from": "ticket.md", "to": "moved.md"}),
            ("POST", "delete", {"path": "ticket.md", "confirm": True}),
        ):
            with self.subTest(method=method, action=action):
                status, body = self.call(method, f"{self.base}/{action}", payload)
                self.assertEqual((status, body.get("code")), (409, "companion_read_only"), body)
        # There is no companion write route at all.
        for method, target in (("POST", f"{self.base}/board"), ("PATCH", f"{self.base}/board"),
                               ("POST", "/api/companion/todos"), ("PUT", "/api/companion/todos")):
            with self.subTest(method=method, target=target):
                self.assertEqual(self.call(method, target, {})[0], 404)
        self.assertEqual(snapshot(self.vault), before)

        # Switching off restores the editor and drops only the derived index.
        body = self.set_mode(False)
        self.assertEqual(body["index"], {"state": "off"})
        status, body = self.call("GET", f"{self.base}/board")
        self.assertEqual((status, body["code"]), (409, "not_companion"))
        status, body = self.call("POST", f"{self.base}/note", {"path": "allowed.md", "content": "ok\n"})
        self.assertEqual(status, 201, body)
        (self.vault / "allowed.md").unlink()

    def test_status_reports_capabilities(self):
        status, body = self.call("GET", "/api/companion")
        self.assertEqual((status, body["available"], body["writes"]), (200, True, False))

    def test_refusals(self):
        for method, target, payload, expect in (
            ("PUT", f"{self.base}/companion", {"enabled": "yes"}, (400, "bad_companion")),
            ("PUT", "/api/workspaces/999/companion", {"enabled": True}, (404, "workspace_not_found")),
            ("POST", "/api/companion/refresh", {"workspaceId": "1"}, (400, "bad_refresh")),
            ("POST", "/api/companion/refresh", {"rebuild": 1}, (400, "bad_refresh")),
            ("GET", "/api/companion/todos?workspace=x", None, (400, "bad_query")),
            ("GET", "/api/workspaces/999/board", None, (404, "workspace_not_found")),
        ):
            with self.subTest(method=method, target=target):
                status, body = self.call(method, target, payload)
                self.assertEqual((status, body.get("code")), expect, body)

    def test_routes_need_auth_and_owner(self):
        from tests.backend.test_http import _request
        for method, target in (("GET", "/api/companion"), ("POST", "/api/companion/refresh"),
                               ("GET", "/api/companion/todos"), ("GET", f"{self.base}/board"),
                               ("PUT", f"{self.base}/companion")):
            with self.subTest(method=method, target=target):
                self.assertEqual(_request(self.port, method, target)[0], 401)
                status, body = signed_json(self.port, method, target, {"enabled": True}, kind="agent-tool", owner_id="")
                self.assertEqual((status, body["code"]), (403, "owner_session_required"))


if __name__ == "__main__":
    unittest.main()
