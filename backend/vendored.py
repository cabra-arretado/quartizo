"""Load the vendored Markdown/YAML parsers, and only those.

``backend/_vendor`` holds unchanged copies of hash-pinned wheels (see
``scripts/vendor_parsers.py`` and ``_vendor/README.md``). The gateway runs the
backend with its own interpreter, whose site-packages may hold other versions
of the same packages (0.10.0rc4 ships markdown-it-py 4.2.0), so the vendor dir
goes first on ``sys.path`` and every import is checked for both its version and
its location. Source-position rules depend on the exact parser version.
"""
from __future__ import annotations

import importlib
import os
import sys

VENDOR_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_vendor")
PINS = {"ruamel.yaml": "0.19.1", "markdown_it": "4.0.0", "mdurl": "0.1.2"}


def activate() -> None:
    """Import the pinned parsers from VENDOR_DIR, or raise ImportError saying why."""
    if VENDOR_DIR not in sys.path:
        sys.path.insert(0, VENDOR_DIR)
    for name, version in PINS.items():
        module = importlib.import_module(name)
        where = os.path.abspath(getattr(module, "__file__", "") or "")
        if not where.startswith(VENDOR_DIR + os.sep):
            raise ImportError(f"{name} was loaded from outside the vendored copy")
        if getattr(module, "__version__", None) != version:
            raise ImportError(f"{name} is not the pinned version {version}")
