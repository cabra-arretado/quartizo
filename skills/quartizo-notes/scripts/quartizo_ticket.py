#!/usr/bin/env python3
"""Ticket helpers for agents editing a Quartizo folder.

It reads notes with Quartizo's own parser (backend/mdsource.py), so the answers match
what the board will show. It never writes files: the agent edits the note itself.

  quartizo_ticket.py new-id
      Print a fresh ticket ID (UUID).
  quartizo_ticket.py order FOLDER STATUS [--before PATH | --after PATH]
      Print the `order` value that places a card last in STATUS, or just before/after
      the ticket at PATH (relative to FOLDER) in that column.
  quartizo_ticket.py column FOLDER STATUS
      List the tickets in STATUS in board order (order, path, title).
  quartizo_ticket.py check FOLDER PATH
      Validate one note's ticket metadata and look for duplicate IDs in the folder.

Exit status: 0 on success, 1 when the request cannot be satisfied safely (the reason is
printed; report it and suggest repairing or rebalancing in Quartizo), 2 on bad usage or
when Quartizo's parser cannot be loaded.
"""
from __future__ import annotations

import argparse
import os
import sys
import uuid
from pathlib import Path

# skills/quartizo-notes/scripts/ -> app root. KiroCrew links the skill directory, so
# resolve() lands in the installed app, next to backend/ and its provisioned packages.
APP_ROOT = Path(__file__).resolve().parents[3]
for extra in (APP_ROOT / "data" / ".kirocrew-deps", APP_ROOT / "backend"):
    if extra.is_dir() and str(extra) not in sys.path:
        sys.path.insert(0, str(extra))

try:
    import mdsource  # noqa: E402
except Exception as exc:  # noqa: BLE001 -- any import failure means "cannot read notes safely"
    print(f"cannot load Quartizo's note parser from {APP_ROOT / 'backend'}: {exc}", file=sys.stderr)
    sys.exit(2)

MAX_RANK = mdsource.MAX_RANK


class Refusal(Exception):
    pass


def _notes(folder: Path):
    """Yield (relative path, parsed note) for every Markdown note, as Quartizo scans them."""
    for dirpath, dirnames, filenames in os.walk(folder, followlinks=False):
        dirnames[:] = sorted(d for d in dirnames if not d.startswith("."))
        for name in sorted(filenames):
            if name.startswith(".") or not name.lower().endswith(".md"):
                continue
            full = Path(dirpath) / name
            if full.is_symlink():
                continue
            rel = full.relative_to(folder).as_posix()
            try:
                data = full.read_bytes()
            except OSError:
                continue
            if len(data) > mdsource.MAX_FILE_BYTES:
                continue
            yield rel, mdsource.parse_note(rel, data)


def _column(folder: Path, status: str) -> list[tuple[str, mdsource.Note]]:
    tickets = [(rel, note) for rel, note in _notes(folder) if note.ticket and note.status == status]
    broken = [rel for rel, note in tickets if note.diagnostics or not mdsource.valid_rank(note.order)]
    if broken:
        raise Refusal(f"column {status!r} has tickets with invalid metadata: {', '.join(broken)}. "
                      "Repair them in Quartizo before placing cards.")
    # Board order: rank, then ID (ties are possible after concurrent edits).
    return sorted(tickets, key=lambda item: (item[1].order, item[1].ticket_id or ""))


def _between(lower: str | None, upper: str | None) -> str:
    left = int(lower, 16) if lower else 0
    right = int(upper, 16) if upper else MAX_RANK
    if right - left <= 1:
        raise Refusal("no space left between these cards. Rebalance the column in Quartizo "
                      "(Tasks → More actions → Rebalance…).")
    return f"{(left + right) // 2:032x}"


def order(folder: Path, status: str, before: str | None, after: str | None) -> str:
    tickets = [(rel, note) for rel, note in _column(folder, status)]
    paths = [rel for rel, _ in tickets]
    ranks = [note.order for _, note in tickets]
    anchor = before or after
    if anchor is None:
        return _between(ranks[-1] if ranks else None, None)
    if anchor not in paths:
        raise Refusal(f"{anchor} is not a ticket in column {status!r}")
    i = paths.index(anchor)
    if before:
        return _between(ranks[i - 1] if i > 0 else None, ranks[i])
    return _between(ranks[i], ranks[i + 1] if i + 1 < len(ranks) else None)


def check(folder: Path, path: str) -> list[str]:
    target = folder / path
    note = mdsource.parse_note(path, target.read_bytes())
    problems = [f"{d.code}: {d.message}" for d in note.diagnostics]
    if not note.ticket:
        return problems + ["not a ticket (no `type: ticket` in the frontmatter)"]
    if note.ticket_id:
        clashes = [rel for rel, other in _notes(folder) if rel != path and other.ticket_id == note.ticket_id]
        problems += [f"duplicate ticket id also used by {rel}" for rel in clashes]
    return problems


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("new-id")
    p_order = sub.add_parser("order")
    p_order.add_argument("folder", type=Path)
    p_order.add_argument("status")
    where = p_order.add_mutually_exclusive_group()
    where.add_argument("--before")
    where.add_argument("--after")
    p_column = sub.add_parser("column")
    p_column.add_argument("folder", type=Path)
    p_column.add_argument("status")
    p_check = sub.add_parser("check")
    p_check.add_argument("folder", type=Path)
    p_check.add_argument("path")
    args = parser.parse_args(argv)

    if args.command == "new-id":
        print(uuid.uuid4())
        return 0
    folder = args.folder.expanduser().resolve()
    if not folder.is_dir():
        print(f"not a folder: {folder}", file=sys.stderr)
        return 2
    try:
        if args.command == "order":
            print(order(folder, args.status, args.before, args.after))
        elif args.command == "column":
            for rel, note in _column(folder, args.status):
                print(f"{note.order}\t{rel}\t{note.title}")
        else:
            problems = check(folder, args.path)
            for problem in problems:
                print(problem)
            if problems:
                return 1
            print("ok")
    except Refusal as refusal:
        print(refusal, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
