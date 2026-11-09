"""Enforce the native Notes save-guard prerequisite, including RC versions.

The gateway's manifest comparator ignores prerelease suffixes. Derive the
version from its Python environment instead of trusting that admission check
or a caller-provided request/environment override.
"""
from __future__ import annotations

import re
from importlib.metadata import PackageNotFoundError, version

MINIMUM = "0.12.0rc7"
_VERSION = re.compile(
    r"v?(\d+)\.(\d+)\.(\d+)(?:[-.]?(dev|a|b|rc)[.-]?(\d+))?"
    r"(?:\.post\d+)?(?:\+[a-z0-9.-]+)?", re.IGNORECASE,
)


def detect_host_version() -> str | None:
    try:
        return version("kirocrew")
    except PackageNotFoundError:
        return None


def supports_shared_writes(value: object) -> bool:
    match = _VERSION.fullmatch(value.strip()) if isinstance(value, str) else None
    if match is None:
        return False
    major, minor, patch = (int(match[i]) for i in (1, 2, 3))
    phase = {"dev": -3, "a": -2, "b": -1, "rc": 0, None: 1}[match[4].lower() if match[4] else None]
    serial = int(match[5] or 0)
    return (major, minor, patch, phase, serial) >= (0, 12, 0, 0, 7)


def write_blocked(value: object) -> dict | None:
    if supports_shared_writes(value):
        return None
    installed = f"The gateway runtime reports {value}." if isinstance(value, str) and value else "The gateway runtime version is unknown."
    return {
        "code": "host_upgrade_required",
        "message": f"Shared editing requires KiroCrew {MINIMUM} or newer. {installed} Upgrade KiroCrew and reload native Notes.",
    }
