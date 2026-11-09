# Browser regressions

From `ui/`, run `npm ci`, then `npm run test:browser`. The command builds the
production UI bundle and exercises it in headless Chromium with the real
Quartizo backend, signed HTTP requests, and disposable vaults. Only the host SDK
and navigation shell are replaced. It does not start or modify a KiroCrew
gateway, user profile, installed app, or user vault.

The Python interpreter defaults to the repository's `.venv/bin/python` when
present, otherwise `python3`. Override with `PYTHON=/path/to/python`.
On macOS the harness uses an existing Google Chrome installation if available.
Else install Playwright's browser with `npx playwright install chromium`, or set
`QUARTIZO_BROWSER_EXECUTABLE=/path/to/chrome`.

Scenarios cover drafts across tabs/modes/workspaces, navigation during an
in-flight write, real mouse self-drop, rank exhaustion and recovery for both
creation and promotion, renamed/edited interrupted migration, inert hostile
HTML, and the unfixed-host write prerequisite. A failure keeps a screenshot in
the printed temporary artifact directory; successful runs remove their
temporary bundle and fixtures.
