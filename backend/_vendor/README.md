# Vendored parsers

Unchanged copies of three pure-Python, MIT-licensed packages, used only by the
read-only Markdown ticket index (`backend/mdsource.py`). The backend runs under
the gateway's interpreter and installs nothing, so they live here.

| Package | Version | Wheel sha256 | License |
|---|---|---|---|
| ruamel.yaml | 0.19.1 | `27592957fedf6e0b62f281e96effd28043345e0e66001f97683aa9a40c667c93` | MIT, © 2014-2026 Anthon van der Neut, Ruamel bvba |
| markdown-it-py | 4.0.0 | `87327c59b172c5011896038353a81343b6754500a08cd7a4973bb48c6d578147` | MIT, © 2020 ExecutableBookProject; port of markdown-it, MIT, © 2014 Vitaly Puzrin, Alex Kocharin |
| mdurl | 0.1.2 | `84008a41e51615a49fc9966191ff91509e3c40b939176e643fd50a5c2196b8f8` | MIT, © 2015 Vitaly Puzrin, Alex Kocharin; © 2021 Taneli Hukkinen |

License texts are in `licenses/` and in `THIRD_PARTY_NOTICES.md`. Not vendored:
`ruamel/yaml/clibz/` (the build script of an optional C extension) and
`markdown_it/cli/`. Nothing else is changed or removed.

To change a pin, edit `scripts/vendor_parsers.py`, run
`python3 scripts/vendor_parsers.py`, rerun `make check`, and review the diff.
`MANIFEST.sha256` lists every vendored file; `tests/backend/test_vendor.py`
fails when the tree drifts from it. `backend/vendored.py` refuses to use a
parser that was not loaded from this directory at the pinned version.
