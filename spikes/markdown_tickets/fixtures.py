"""Create a new disposable vault; never edit or overwrite an existing directory."""
from __future__ import annotations

import argparse
from pathlib import Path

from .ranks import between

TICKET_ID = "8423e295-12ce-4b61-a281-d719c1fa86f6"


def fixture_files() -> dict[str, bytes]:
    ticket = f'''---
# Existing comments and formatting must survive a board move.
id: {TICKET_ID}
type: ticket
status: "ready"  # human assigned
order: '{between()}'
aliases: ["Café", '登录']
details:
  summary: |-
    Keep this indentation.
    - [ ] This is YAML text, not a TODO.
---

# Fix café login ☕

Keep **this body**, [the ordinary note](ordinary.md), and its spacing.\x20\x20

## Reproduction

- [ ] Reproduce the timeout
  * [x] Check the logs
  + [X] Check the clock
- [ ] Reproduce the timeout

## Examples

```markdown
- [ ] A fenced example
```

    - [ ] An indented example

~~~
* [ ] Another fenced example
~~~
'''.encode()
    ordinary = br'''# Ordinary note

No ticket properties are required for TODOs.

1. [ ] Ordered item
2) [x] Alternate ordered marker

> - [ ] Quoted list item

-
  [ ] Marker on the next line

- Paragraph first

  [ ] This second paragraph is not a checkbox list item.

\- [ ] Escaped marker, not a list

`- [ ] Inline code`

- [/] Unsupported state
- [ ]no separator
'''
    return {
        "ticket.md": ticket,
        "ordinary.md": ordinary,
        "bom-crlf.md": b"\xef\xbb\xbf" + ticket.replace(TICKET_ID.encode(), b"11111111-1111-4111-8111-111111111111").replace(b"\n", b"\r\n"),
        "no-newline.md": "# 日本語 😀\n\n- [ ] café\n- [ ] café".encode(),
        "mixed.md": b"# Mixed\r\n\r\n- [ ] Keep read-only\n",
        "diagnostics/duplicate.md": ticket,
        "diagnostics/invalid-yaml.md": b"---\ntype: ticket\nstatus: [ready\n---\n# Still readable\n",
        "diagnostics/duplicate-key.md": b"---\ntype: ticket\nstatus: ready\nstatus: done\n---\n# Repair properties\n",
        "diagnostics/missing-fields.md": b"---\ntype: ticket\n---\n# Repair ticket\n",
        "diagnostics/property-collision.md": b"---\nid: customer-123\ntype: person\n---\n# Ordinary metadata\n",
        "diagnostics/alias.md": b"---\nproperties: &props {status: ready}\ncopy: *props\n---\n# Read only\n",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path, help="a new directory; existing paths are refused")
    root = parser.parse_args().directory.resolve()
    root.mkdir(parents=True, exist_ok=False)
    files = fixture_files()
    for name, data in files.items():
        target = root / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    print(f"Created {len(files)} fixture notes in {root}")
    print("Duplicate IDs and malformed metadata under diagnostics/ are intentional.")


if __name__ == "__main__":
    main()
