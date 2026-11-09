"""Runtime prerequisite and registry/write ordering over the real HTTP boundary."""
from __future__ import annotations

import tempfile
import threading
import unittest
from pathlib import Path
from unittest import mock

from tests.backend.signing import load_server
from tests.backend.test_http import SECRET, _start, _stop
from tests.backend.test_workspace import signed_json

srv = load_server()
import host_compat  # noqa: E402
from workspace import Registry  # noqa: E402


class PrerequisiteTests(unittest.TestCase):
    def test_rejects_unfixed_releases_and_unknown_versions(self):
        for value in (None, "", "unknown", "0.11.0", "0.12.0rc6", "0.12.0-rc.6", "0.12.0b99", "0.12.0.dev9"):
            with self.subTest(value=value):
                self.assertFalse(host_compat.supports_shared_writes(value))
                self.assertEqual(host_compat.write_blocked(value)["code"], "host_upgrade_required")

    def test_accepts_fixed_rcs_and_newer_releases(self):
        for value in ("0.12.0rc7", "v0.12.0-rc.7", "0.12.0rc10", "0.12.0", "0.12.0.post1", "0.12.1rc1", "1.0.0+build.1"):
            with self.subTest(value=value):
                self.assertTrue(host_compat.supports_shared_writes(value))
                self.assertIsNone(host_compat.write_blocked(value))

    def test_runtime_discovery_fails_closed_without_the_host_package(self):
        with mock.patch.object(host_compat, "version", side_effect=host_compat.PackageNotFoundError):
            self.assertIsNone(host_compat.detect_host_version())

    def test_old_or_unknown_runtime_refuses_every_file_mutation_but_keeps_reading(self):
        for version in ("0.12.0rc6", None):
            with self.subTest(version=version), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp).resolve()
                vault = root / "vault"
                vault.mkdir()
                (vault / "ordinary.md").write_bytes(b"# Ordinary\n- [ ] Work\n")
                proc, port = _start(SECRET, home=str(root / "crew"), host_version=version)
                try:
                    code, result = signed_json(port, "POST", "/api/workspaces", {"path": str(vault), "companion": True})
                    self.assertEqual(code, 201)
                    base = f"/api/workspaces/{result['workspace']['id']}"
                    for endpoint in ("tickets", "tickets/promote", "tickets/move", "tickets/demote", "tickets/rebalance", "todos/toggle", "migration"):
                        code, error = signed_json(port, "POST", base + "/" + endpoint,
                                                  {"path": "new.md", "title": "No", "confirm": True, "status": "ready"})
                        self.assertEqual((code, error["code"]), (409, "host_upgrade_required"), endpoint)
                    code, status = signed_json(port, "GET", "/api/companion")
                    self.assertEqual((code, status["writeBlocked"]["code"]), (200, "host_upgrade_required"))
                    code, source = signed_json(port, "GET", base + "/source?path=ordinary.md")
                    self.assertEqual((code, source["content"]), (200, "# Ordinary\n- [ ] Work\n"))
                    self.assertEqual([p.name for p in vault.iterdir()], ["ordinary.md"])
                finally:
                    _stop(proc)


class RegistryWriteOrderingTests(unittest.TestCase):
    def test_unshare_and_unregister_wait_for_the_active_write(self):
        for operation in ("unshare", "unregister"):
            with self.subTest(operation=operation):
                self._exercise(operation)

    def _exercise(self, operation):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            vault = root / "vault"
            vault.mkdir()
            registry = Registry(root / "data")
            ws = registry.register(str(vault), companion=True)
            backend = srv.make_server(0, SECRET, registry, host_version="0.12.0")
            thread = threading.Thread(target=backend.serve_forever, daemon=True)
            thread.start()
            port = backend.server_address[1]
            entered, release, changed = threading.Event(), threading.Event(), threading.Event()
            results, errors = {}, []
            original = backend.writer._snapshot

            def paused_snapshot():
                result = original()
                entered.set()
                if not release.wait(5):
                    raise RuntimeError("test did not release the active write")
                return result

            def create():
                try:
                    results["create"] = signed_json(port, "POST", f"/api/workspaces/{ws.id}/tickets",
                                                     {"path": "created.md", "title": "Created before revocation"})
                except Exception as error:
                    errors.append(error)

            def revoke():
                try:
                    base = f"/api/workspaces/{ws.id}"
                    results["revoke"] = (signed_json(port, "PUT", base + "/companion", {"enabled": False})
                                         if operation == "unshare" else signed_json(port, "DELETE", base))
                except Exception as error:
                    errors.append(error)
                finally:
                    changed.set()

            try:
                with mock.patch.object(backend.writer, "_snapshot", side_effect=paused_snapshot):
                    writer = threading.Thread(target=create)
                    writer.start()
                    self.assertTrue(entered.wait(5))
                    revoker = threading.Thread(target=revoke)
                    revoker.start()
                    self.assertFalse(changed.wait(0.15), "registry changed before its active write finished")
                    release.set()
                    writer.join(5)
                    revoker.join(5)
                self.assertFalse(errors, errors)
                self.assertEqual(results["create"][0], 201)
                self.assertEqual(results["revoke"][0], 200)
                code, _ = signed_json(port, "POST", f"/api/workspaces/{ws.id}/tickets", {"path": "after.md", "title": "No"})
                self.assertIn(code, (404, 409))
                self.assertFalse((vault / "after.md").exists())
            finally:
                release.set()
                backend.shutdown()
                backend.server_close()
                thread.join(5)
