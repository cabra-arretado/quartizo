"""Probe the installed Notes save function on disposable files, without a gateway.

Run with the interpreter that already has kirocrew installed. This is a backend
probe, not proof of editor-buffer or navigation behaviour. It uses the upstream
test-only state-directory hook and never changes installed source or real vaults.
"""
from __future__ import annotations

import asyncio
import hashlib
import inspect
import json
import os
import tempfile
from importlib.metadata import version
from pathlib import Path


async def probe() -> dict:
    from kiro_crew.apps.builtins.md_notebook import server

    original_home = server._HOME
    source_path = Path(inspect.getfile(server))
    report = {
        "kirocrew_version": version("kirocrew"),
        "notes_source_sha256": hashlib.sha256(source_path.read_bytes()).hexdigest(),
        "scope": "installed backend save function; no browser/editor validation",
    }
    with tempfile.TemporaryDirectory(prefix="quartizo-native-probe-") as directory:
        root = Path(directory) / "vault"
        root.mkdir()
        server._HOME = Path(directory) / "state"
        vault = {"id": "quartizo-format-probe", "localPath": str(root), "readOnly": False}
        target = root / "ticket.md"
        original = "---\ntype: ticket\nstatus: ready\n---\n# Original\n- [ ] Keep me\n"
        external = original.replace("status: ready", "status: done")
        stale_buffer = original + "\nUnsaved editor text\n"
        try:
            target.write_text(original, encoding="utf-8")
            initial = target.stat()
            base_mtime = initial.st_mtime * 1000
            target.write_text(external, encoding="utf-8")
            os.utime(target, ns=(initial.st_atime_ns, initial.st_mtime_ns + 10_000_000))
            try:
                await server._save_note_contents(vault, target, "ticket.md", stale_buffer, base_mtime)
            except server.ApiError as err:
                report["advanced_mtime_stale_save"] = {"status": err.status, "disk_preserved": target.read_text() == external}
            else:
                report["advanced_mtime_stale_save"] = {"status": 200, "disk_preserved": target.read_text() == external}

            # An external tool can preserve timestamps; this also models a
            # coarse timestamp clock. The content differs but the token does not.
            target.write_text(external, encoding="utf-8")
            os.utime(target, ns=(initial.st_atime_ns, initial.st_mtime_ns))
            try:
                await server._save_note_contents(vault, target, "ticket.md", stale_buffer, base_mtime)
            except server.ApiError as err:
                report["preserved_mtime_stale_save"] = {"status": err.status, "external_status_preserved": target.read_text() == external}
            else:
                report["preserved_mtime_stale_save"] = {"status": 200, "external_status_preserved": target.read_text() == external}
            report["companion_write_gate"] = (
                "blocked: native stale save can overwrite external metadata without a conflict"
                if not report["preserved_mtime_stale_save"]["external_status_preserved"] else
                "backend probe passed; browser and shared-folder checks still required"
            )
        finally:
            server._HOME = original_home
    return report


if __name__ == "__main__":
    print(json.dumps(asyncio.run(probe()), indent=2))
