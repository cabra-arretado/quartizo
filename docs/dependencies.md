# Dependencies and audit

Audited 2026-10-20 in `ui/` with npm (Node 26.11.1) against the committed
`package-lock.json`. Dev tooling (ruff 0.17.1) is not shipped.

## Backend: vendored Python parser

The backend installs nothing: it runs under the gateway's interpreter with
`python -I`. Besides the standard library it uses one pure-Python package,
copied **unchanged** from a hash-pinned PyPI wheel into `backend/_vendor/`, to
read ticket frontmatter (`backend/mdsource.py`):

| Package | Version | Wheel sha256 | License | Role |
|---|---|---|---|---|
| ruamel.yaml | 0.19.1 | `27592957…c667c93` | MIT | Safe YAML parsing of frontmatter, by node and source position |

The full hash and the wheel URL are in `scripts/vendor_parsers.py`, which
verifies them before extracting anything. Left out: ruamel.yaml's `clibz/`
(the build script of its optional C extension, which imports setuptools). It
has no further runtime dependencies. License text: `backend/_vendor/licenses/`
and [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).

Checkboxes and headings need no Markdown parser: they follow native Kiro Notes'
own line rules (see the README). markdown-it-py and mdurl were vendored until
that change and are gone.

Why vendored rather than a root `requirements.txt` (which the gateway would
`pip install --target` at spawn): the shipped bytes must be the tested bytes,
first start must not need the network, and the host's provisioning path had
not been exercised live. `backend/vendored.py` puts `_vendor` first on
`sys.path` and refuses a copy that was not loaded from there at the pinned
version (the companion views then report the index as unavailable).
`tests/backend/test_vendor.py` compares the tree with
`backend/_vendor/MANIFEST.sha256`.

To update: change the pin in `scripts/vendor_parsers.py`, run it, rerun
`make check`, and review the diff. The spike in `spikes/markdown_tickets/`
keeps its own `requirements.txt` and is tested separately (`make test-formats`).

## UI: bundled runtime dependencies

`ui/dist/index.mjs` is built by Vite. `react`, `react-dom` and the KiroCrew SDK
are Rollup externals resolved by the host's import map, so they are **not in
the bundle** (`ui/test/bundle.test.ts` checks the bundle imports only
`react`, `react/jsx-runtime`, `@kirocrew/app-sdk` and `@kirocrew/app-sdk/ui`).
Nothing else is inlined: the bundle contains no third-party code. (Earlier
versions inlined markdown-it for the removed note preview.)

Listed by `npm ls --omit=dev`, none shipped: react 18.3.1, react-dom 18.3.1
(host-provided), and loose-envify, js-tokens, scheduler (used only by them).

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
the candidates, provided the notices are kept. (Since the UI bundle no longer
inlines markdown-it, the only redistributed third-party code is the vendored
ruamel.yaml, MIT.)

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
