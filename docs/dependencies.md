# Dependencies and audit

Audited 2026-10-20 in `ui/` with npm (Node 26.11.1) against the committed
`package-lock.json`. Dev tooling (ruff 0.17.1) is not shipped.

## Backend: vendored Python parsers

The backend installs nothing: it runs under the gateway's interpreter with
`python -I`. Besides the standard library it uses three pure-Python packages,
copied **unchanged** from hash-pinned PyPI wheels into `backend/_vendor/`, for
the read-only Markdown ticket index only (`backend/mdsource.py`):

| Package | Version | Wheel sha256 | License | Role |
|---|---|---|---|---|
| ruamel.yaml | 0.19.1 | `27592957…c667c93` | MIT | Safe YAML parsing of frontmatter, by node and source position |
| markdown-it-py | 4.0.0 | `87327c59…d578147` | MIT (+ markdown-it's MIT) | CommonMark block parsing with line maps for checkboxes and headings |
| mdurl | 0.1.2 | `84008a41…196b8f8` | MIT | Required by markdown-it-py |

Full hashes and the wheel URLs are in `scripts/vendor_parsers.py`, which
verifies them before extracting anything. Left out: ruamel.yaml's
`clibz/` (the build script of its optional C extension, which imports
setuptools) and markdown-it-py's `cli/`. All three have no further runtime
dependencies. License texts: `backend/_vendor/licenses/` and
[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

Why vendored rather than a root `requirements.txt` (which the gateway would
`pip install --target` at spawn): the TODO source-position tests depend on the
exact markdown-it-py paragraph rule, so the shipped bytes must be the tested
bytes; first start must not need the network; and the host's provisioning path
had not been exercised live. The 0.10.0rc4 gateway venv itself contains
markdown-it-py **4.2.0**, so `backend/vendored.py` puts `_vendor` first on
`sys.path` and refuses a parser that was not loaded from there at the pinned
version (the companion views then report the index as unavailable; the rest of
the app keeps working). `tests/backend/test_vendor.py` (in the companion test
module) compares the tree with `backend/_vendor/MANIFEST.sha256`.

To update: change the pins in `scripts/vendor_parsers.py`, run it, rerun the
format and backend suites (`make check`), and review the diff. The spike in
`spikes/markdown_tickets/` keeps its own `requirements.txt` with the same pins
and is still tested separately (`make test-formats`).

## UI: bundled runtime dependencies

`ui/dist/index.mjs` is built by Vite. `react`, `react-dom` and the KiroCrew SDK
are Rollup externals resolved by the host's import map, so they are **not in
the bundle** (checked: the bundle imports only `react`, `react/jsx-runtime`,
`@kirocrew/app-sdk` and `@kirocrew/app-sdk/ui`). What is inlined is
`markdown-it` and the packages it imports:

| Package | Version | License | Role |
|---|---|---|---|
| markdown-it | 15.0.2 (pinned exactly) | MIT | Markdown renderer |
| linkify-it | 6.1.0 | MIT | Link detection |
| mdurl | 2.1.0 | MIT | URL parsing/encoding |
| uc.micro | 3.0.0 | MIT | Unicode character classes |
| entities | 8.1.0 | BSD-2-Clause | HTML entity decoding |
| punycode.js | 2.3.1 | MIT | IDN/punycode for link normalization |

Not bundled but listed by `npm ls --omit=dev`:

| Package | License | Why not shipped |
|---|---|---|
| react 18.3.1, react-dom 18.3.1 | MIT | Host-provided external |
| loose-envify 1.4.0, js-tokens 4.0.0, scheduler 0.23.2 | MIT | Only used by react/react-dom |
| argparse 3.0.3 | PSF-2.0 | Only the `markdown-it` CLI uses it; the library does not import it (no trace in the bundle) |

The inlined set is read from the imports of markdown-it's ESM entry
(`dist/markdown-it.mjs`: mdurl, uc.micro, entities, linkify-it, punycode.js).
The minified bundle has no module names, so it was not grepped for each;
`argparse` and `scheduler` have no trace in it.

The built bundle carries no per-package license notices. MIT and BSD-2-Clause
require the notice to accompany redistributed copies, so when the project
license is chosen, add a third-party notices file (or keep this table
alongside the bundle).

## `npm audit --omit=dev`

```
found 0 vulnerabilities
```

Nothing that ships to the browser or backend has a known advisory.

## `npm audit` (full, includes dev tooling)

6 vulnerabilities (3 moderate, 1 high, 2 critical), **all in the build/test
toolchain**, none in anything bundled:

| Package | Severity | Advisories | Exposure for Quartizo |
|---|---|---|---|
| vitest (<= 4.1.10; have ^2.1.8) | critical | GHSA-5xrq-8626-4rwp (Vitest UI server reads/executes files), GHSA-82fw-gwwq-j7x9 (`@vitest/mocker` redirect path traversal), plus transitive | Only when the Vitest UI server or mock redirects are used. The scripts run `vitest run` headless, with no UI server |
| tinypool (<= 2.1.1) | critical | GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr (prototype pollution in worker options) | Needs attacker-controlled worker options; vitest passes fixed ones |
| vite (<= 6.4.2; have ^5.4.11) | high | GHSA-4w7w-66w2-5vf9 (dev server `.map` traversal), GHSA-v6wh-96g9-6wx3, GHSA-fx2h-pf6j-xcff (Windows-only) | Dev-server issues. Quartizo only runs `vite build` (and `vite build --watch`), never the dev server |
| esbuild (<= 0.24.2) | moderate | GHSA-67mh-4wv8-2f99 (any website can query the dev server) | Same: the dev server is not used |
| @vitest/mocker, vite-node | moderate | follow vitest/vite | As above |

`npm audit fix --force` would move to vite 8 and vitest 5, both breaking
majors, with a risk to the committed `ui/dist` bundle and the host-externals
config. That upgrade is **not done in this release** and is the recommended
first follow-up. In CI the toolchain runs on ephemeral runners with a
read-only token.

## License compatibility note

The project license is **MIT** (chosen for 0.0.1; see LICENSE and THIRD_PARTY_NOTICES.md). This is
engineering context, not legal advice. All bundled code is permissive
(MIT, BSD-2-Clause), which can be redistributed inside a project under any of
the candidates, provided the notices are kept:

| Candidate | Compatible with the bundled MIT / BSD-2-Clause code? | Notes |
|---|---|---|
| **MIT** | Yes | Same family; keep each package's copyright notice. Simplest |
| **Apache-2.0** | Yes | Permissive code can be included in an Apache-2.0 work; keep the third-party notices. Adds an explicit patent grant and requires a NOTICE-style attribution of changes |
| **AGPL-3.0** | Yes, one-way | MIT/BSD code can be combined into an AGPL-3.0 work (the combined work is AGPL; the dependencies keep their own terms). The reverse does not hold: AGPL code cannot be relicensed under MIT. AGPL's network-use clause covers a served UI/backend, so anyone who modifies and hosts it must offer source |

Other points to weigh when choosing:

- Check KiroCrew's own license and App Kit terms before publishing; this
  review did not assess them. `@kirocrew/app-sdk` is not an npm package, and
  the repository carries only hand-written type declarations for it
  (`ui/src/kirocrew-sdk.d.ts`).
- The build-time tools (vite, vitest, typescript, ruff) are not redistributed.
- `argparse` (PSF-2.0) is permissive too and is not shipped.
