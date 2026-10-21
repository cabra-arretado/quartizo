# Vendored parsers

An unchanged copy of one pure-Python, MIT-licensed package, used only by the
read-only Markdown ticket index (`backend/mdsource.py`) to read ticket
frontmatter. The backend runs under the gateway's interpreter and installs
nothing, so it lives here.

| Package | Version | Wheel sha256 | License |
|---|---|---|---|
| ruamel.yaml | 0.19.1 | `27592957fedf6e0b62f281e96effd28043345e0e66001f97683aa9a40c667c93` | MIT, © 2014-2026 Anthon van der Neut, Ruamel bvba |

License texts are in `licenses/` and in `THIRD_PARTY_NOTICES.md`. Not vendored:
`ruamel/yaml/clibz/` (the build script of an optional C extension). Nothing
else is changed or removed.

To change a pin, edit `scripts/vendor_parsers.py`, run
`python3 scripts/vendor_parsers.py`, rerun `make check`, and review the diff.
`MANIFEST.sha256` lists every vendored file; `tests/backend/test_vendor.py`
fails when the tree drifts from it. `backend/vendored.py` refuses to use a
parser that was not loaded from this directory at the pinned version.
