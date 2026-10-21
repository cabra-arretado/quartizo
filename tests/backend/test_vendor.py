"""The vendored parsers: unchanged from their manifest, and the only copies loaded."""
from __future__ import annotations

import hashlib
import os
import types
import unittest
from pathlib import Path
from unittest import mock

from tests.backend.signing import load_server

load_server()
import mdsource  # noqa: E402,F401  (activates the vendored parsers)
import vendored  # noqa: E402


class VendorTests(unittest.TestCase):
    def test_vendored_tree_matches_its_manifest(self):
        vendor = Path(vendored.VENDOR_DIR)
        listed = {}
        for line in (vendor / "MANIFEST.sha256").read_text(encoding="utf-8").splitlines():
            digest, rel = line.split("  ", 1)
            listed[rel] = digest
        actual = {}
        for path in vendor.rglob("*"):
            rel = path.relative_to(vendor).as_posix()
            if path.is_file() and "__pycache__" not in rel.split("/") and rel not in ("MANIFEST.sha256", "README.md"):
                actual[rel] = hashlib.sha256(path.read_bytes()).hexdigest()
        self.assertEqual(actual, listed)

    def test_parsers_are_loaded_from_the_vendored_copy(self):
        import markdown_it
        import ruamel.yaml
        for module in (markdown_it, ruamel.yaml):
            self.assertTrue(os.path.abspath(module.__file__).startswith(vendored.VENDOR_DIR + os.sep))

    def test_a_shadowing_copy_is_refused(self):
        fake = types.ModuleType("markdown_it")
        fake.__file__ = "/elsewhere/markdown_it/__init__.py"
        fake.__version__ = "4.0.0"
        with mock.patch.dict("sys.modules", {"markdown_it": fake}):
            with self.assertRaises(ImportError):
                vendored.activate()


if __name__ == "__main__":
    unittest.main()
