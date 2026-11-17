# Quartizo UI/UX QA report

## Round 2: full review (17 Nov 2026, commit 7043165)

**Build:** the installed Quartizo 0.12.4 bundle is byte-identical to `ui/dist` at `7043165`. KiroCrew gateway on :5476.
**How:** built-in browser, same disposable vault. Viewports 1280x800 and 375x812. Dark and light themes (light by switching `data-theme` to `kiro-light`). Contrast measured by script on every tab in both themes.
**Scope:** the items round 1 skipped (drag-and-drop, Settings sub-tabs, light theme, contrast, keyboard, the KiroCrew chat hand-off), plus a re-walk of every tab.

### Fix status

These are uncommitted changes in the working tree. The installed app was synced with `kirocrew app update quartizo --source`, and each item was re-checked live.

| Item | Status |
|---|---|
| R1 | Fixed. `GET /api/workspaces` now returns `missing` per folder (`workspace.root_missing`), and Settings merges it with the index errors. Live: all three gone folders are flagged. New backend test. |
| R2 | Fixed. While loading, no sub-tab is chosen and Settings shows "Loading settings…", then it opens Defaults directly. If loading fails, it falls back to Folders. |
| R3 | Fixed. New `--qz-link` token (accent mixed 70/30 with the text colour). Wikilinks and backlinks now measure 5.50:1 in dark and 7.17:1 in light. |
| R4 | Fixed. `lastTab` is a quiet field: saving it no longer sets "Saving…". |
| R5 | Fixed. On coarse pointers, `.qz-note-link` is 44 px tall (measured at 375 px). |
| R6 | Fixed. Index warnings start with the folder name, on both TODOs and Tasks. |
| X1 | Fixed. A shared `AskAgentButton` is now in the Tasks ⋯ menu, the Notes header and each Settings folder card. Its accessible name includes the folder ("Ask a Bot or agent about vault"). |
| X2 | Fixed. The chat draft starts with a one-line heading and ends with `My request: `. KiroCrew leaves the cursor at the end, so the user types right there (checked in the real composer). The copy-to-clipboard prompt is unchanged. |
| X10 | Fixed (trivial). The missing-folder notice is now `role="note"`. |
| X3–X9, X11 | Not done (low severity). |

Checks: backend 207 pass (3 skipped), UI vitest 43 pass (new `agentPrompt.test.ts`), ruff and tsc clean, and `make test-browser` passes all 12 scenarios (the chat-launch assertion was updated for the new label and message).

### Bugs

| # | Sev | Where | What happens | Cause / fix |
|---|---|---|---|---|
| R1 | Med | Settings → Folders | The red "This folder is missing" notice only shows for folders that are switched on. `qtz-notes` and `qtz-repo` are gone from disk but look healthy. Switching one on brings back the round-1 failure. | `Settings.tsx:107` reads `root_missing` from the index status, and the index only covers enabled folders. Have `/api/workspaces` return an `exists` flag per folder. |
| R2 | Med | Settings | While folders load, Settings shows the **Folders** sub-tab ("Loading folders…"), then jumps to **Defaults** about 2 s later. | `Settings.tsx:91` falls back to `'folders'` while `workspaces` is `null`. Treat `null` as "not decided yet" and only pick `'folders'` when the list is `[]`. |
| R3 | Med (a11y) | Notes | Wikilinks and backlinks use the raw accent `#8E48FF`. That is **3.57:1** on the dark surface; AA needs 4.5. Everything else passed in both themes. | `notes.css:146` uses `color: var(--qz-accent)`. Add a `--qz-link` token, e.g. `color-mix(in srgb, var(--qz-accent) 65%, var(--qz-text))`, and use it in dark mode. |
| R4 | Low | Settings header | Clicking any Quartizo tab writes `lastTab`. The Settings header then flashes "Saving…" then "Saved" (it is a `role=status`, so screen readers announce it) even though the user changed nothing. | `App.tsx:98`. Write `lastTab` without driving the shared preference status, or debounce it quietly. |
| R5 | Low (a11y) | Tasks, touch | Card title buttons are 177x**20** px, below the 24 px minimum (WCAG 2.5.8) and much smaller than the 44 px used elsewhere on touch. | Add block padding to the title button on `pointer: coarse`. |
| R6 | Low | TODOs | The banner says "Indexing failed: the workspace root no longer exists." It does not say which folder. B1 named the folder in write errors, but this warning still doesn't. | Prefix the folder name in `IndexWarnings`. |

### UX issues

| # | Sev | Where | What I saw | Suggestion |
|---|---|---|---|---|
| X1 | Med | KiroCrew hand-off | "Ask a Bot or agent" is the main KiroCrew integration, but it sits in Settings → Folders → *each folder card* → Advanced. There are four identical buttons with the same accessible name. | Add it to the Tasks "More actions" menu and the Notes toolbar, scoped to the current folder. Name it "Ask an agent about vault". |
| X2 | Med | KiroCrew chat | It works: the new chat session opens with "Prompt pre-filled — add context, then Send". But the composer holds a ~2.5k-character instruction block with the cursor at the end, so the user's actual request goes below a wall of rules. | Put a `Request:` line first and the instructions after it, with the cursor on that line. Or send the instructions as attached context if the chat launcher supports it. |
| X3 | Low | Return from chat | Coming back to Quartizo lands on Settings → Defaults with the folder's Advanced section collapsed, so the user loses their place. | Remember the Settings sub-tab like `lastTab`. |
| X4 | Low | Settings → Board | Two scopes on one page: "Board view / Column order in vault" follows the header picker, but "Board columns" lists every folder, starting with the missing Phase 1 vault. | Scope both to the picked folder, or show which folder each section applies to. Hide missing folders from column editing. |
| X5 | Low | Layout | Each tab starts its content at a different left edge. TODOs is centred at `max-width: 1100px` (`quartizo.css:395`); at 1280 px its heading sits 55 px right of Tasks and Notes. Settings is different again. | Use one content width for all tabs, or left-align capped ones. |
| X6 | Low | Consistency | "Open Kiro Notes" is a header button on TODOs but sits in the ⋯ menu on Tasks. | Put it in the same place on both tabs. |
| X7 | Low | Tasks | "Scroll sideways for more columns" shows even when all five columns fit. | Show it only when `data-more-end` is set. |
| X8 | Low | Notes | The toolbar's Rendered/Raw toggle quietly changes the global "Note view" default in Settings → Notes. My one Raw click made every note open in Raw. | Either say it ("Raw is now the default") or keep the toolbar choice for this note only. |
| X9 | Low | Tasks first open | Once, Tasks showed "Loading folders…" for about 4 s while the header already had the folder list. Each view fetches its own list (`App.tsx:53`, `Settings.tsx:101`, Companion). I could not reproduce it. | Pass App's list down instead of fetching it again. |
| X10 | Low (a11y) | Settings → Folders | The missing-folder notice is `role="alert"`, so it is announced on every visit, not only when something changes. | Use `role="note"`, or put the status in the folder heading. |
| X11 | Low | Mobile Tasks | The KiroCrew bar, Quartizo header, workspace picker, tabs, title, subtitle, actions and meta row push the board down to about y=500 of 812. | Hide the subtitle on narrow screens and put View, ⋯ and Refresh on one row. |

### Verified working

- Notes: a checkbox in Rendered view writes `- [x]` to disk and shows "Note saved."; Raw view autosaves on blur; the editor still shows the edit afterwards.
- Drag-and-drop, tested with synthetic DragEvents because CDP pointer drags don't fire HTML5 DnD: the target lane gets an accent border, the card moves, focus returns to the moved card, and a success notice appears and clears itself. Moving with the card's column select also works.
- Light theme: no contrast failures on any tab. Dark theme: only R3.
- Keyboard: the tablist uses a roving tabindex with arrows, Home and End; there is a visible offset focus ring, including on primary buttons.
- 375 px: no horizontal page overflow.
- Polling: `/api/companion` every 3 s, about 10 ms each, and it stops while on Settings.

### Not covered

- Real pointer drag (only synthetic events were possible), screen-reader output, rebalance and legacy migration, and the native Kiro Notes side of a shared folder.

### Left on this machine

- An empty "Untitled session" in KiroCrew chat, created by the hand-off test. I cleared its composer and sent nothing.
- In the disposable vault, `projects/launch.md` is restored. "Polish onboarding" is back in Backlog but now sorts below "Review: B1 fix & more!".

---

## Round 1

**Build under test:** Quartizo 0.12.4 (`main` at the pull on 17 Nov 2026), installed into KiroCrew 0.12.2 via `kirocrew app update quartizo --source <checkout>`.
**How:** driven in the built-in browser against a disposable vault (7 notes: 4 tickets, 2 notes with TODOs, 1 README with a wikilink).
**Viewports:** desktop (1440x900 and the 1024x768 pane) and mobile (375x812). Dark theme only.

This replaces my earlier source-only review. The app changed a lot in the latest pull, so many of those findings no longer apply (see "Already fixed").

---

## Fix status (17 Nov 2026)

Uncommitted changes in the working tree; installed app synced; each item re-checked in the browser unless noted.

| Item | Status |
|---|---|
| B1 missing folder blocks writes | Fixed in `companion_write.py` (a missing root is skipped in the ID snapshot, and the error now names the folder). New regression test fails without the fix. Verified live with the dead folder still enabled: ticket created (POST 201) and a card moved. |
| B2 stale error, no success feedback | Fixed: a later success clears the old error and shows a self-clearing confirmation (create, add, move, remove). |
| B3 Rendered/Raw clipped on mobile | **Not reproduced.** Measured width equals text width with and without a CSS change, so the clipped frames were most likely the control's mount animation. No change kept. |
| U1 View panel and Escape | Fixed: Escape closes it; opening a form closes it. |
| U2 path typed by hand | Fixed: path follows the title until edited; the disabled button says what is missing. |
| U3 mobile Notes list/note | Fixed: narrow screens show the list or the note, with an "All notes" button. |
| U4 tab bar shifting | Fixed: tab bar now moves at most 3px between tabs (was tens of px). |
| U5 two scope controls | Fixed: the folder picker is hidden on TODOs when scope is "All folders". |
| U6 keyboard tip on phones | Fixed: hidden on touch screens. |
| U7 width button label | **Reverted.** The browser suite expects a toggle named "Full width" with a pressed state, which is the accessible pattern. Only a clearer tooltip was kept. |
| U8 wikilink shows path | Fixed: path links show the note title (unit test added). |
| U9 TODO list dims while saving | Fixed: only the row being saved is disabled. Not separately re-checked in the browser. |
| U10 warning with no next step | Fixed: failed-scan warnings have a "Check folders in Settings" button. Not triggered in the browser after the fix. |
| Settings: missing folder looks normal | Fixed: red "This folder is missing" notice on the folder card (verified). |

Checks run: backend tests (206 pass), UI tests (42 pass), ruff, tsc. Playwright suite (`make test-browser`): all 12 scenarios pass (it first caught the U7 regression, now reverted).

## Bugs

### B1 (High): one missing folder blocks writes in every other folder

- **Repro:**
  1. Have a connected folder, enabled for Tasks, whose path no longer exists. In my install this was the leftover "Phase 1 disposable vault".
  2. Add or select a healthy folder.
  3. On Tasks, click New ticket, fill a title and path, and click Create ticket. Or change a card's column.
- **Result:** the red error "the workspace root no longer exists" appears. Nothing is created or moved. The card's select snaps back. The backend log shows `POST /api/workspaces/4/tickets 404`.
- **Expected:** the healthy folder works, and the message names the broken folder.
- **Cause (confirmed in code):** `companion_write._snapshot()` walks every enabled folder to check IDs. `companion._walk()` calls `open_root()`, which raises 404 `root_missing` for the dead one. The error is then shown as if it came from the folder you were editing.
- **Workaround that worked:** Settings → Folders → switch the dead folder's "Include in Tasks, Notes, and TODOs" off. The ticket was created right after.
- **Suggested fix:**
  - Skip or flag unavailable folders in the snapshot, and degrade the duplicate-ID check rather than failing the write.
  - Name the folder in the error ("Phase 1 disposable vault is missing").
  - Show a "Folder missing" badge in Settings → Folders, with Disable and Remove actions. Today the card for a missing folder looks completely normal.
  - Consider doing the same in the workspace picker.

### B2 (Medium): a stale error stays after the action succeeded

- After the workaround, the ticket was created and the form closed. The red banner "the workspace root no longer exists" stayed above the board until a later action.
- There is also no success feedback: the form just disappears and a card appears at the bottom of Backlog, off-screen when the view panel is open.
- **Fix:** clear action errors on the next successful write or refresh, and add a short confirmation ("Ticket created · View") or scroll and highlight the new card.

### B3 (Medium, mobile): Rendered/Raw switch is clipped at 375px

- In the note toolbar the segmented control renders as "Ren…" and "Ra" because it is squeezed by the neighbouring buttons.
- **Fix:** let the toolbar wrap before shrinking the control, or collapse it to an icon pair.

---

## UX issues

| # | Sev | Where | What I saw | Suggestion |
|---|---|---|---|---|
| U1 | Med | Tasks → View | Pressing Escape closes the "More actions" and card menus but not the View panel. View, More and New ticket can all be open at once. With View and the form open, the board starts far below the fold. | Make View a popover that closes on Escape and outside click, or collapse it when another panel opens. |
| U2 | Med | Tasks → New ticket | The path field is still typed by hand. Typing a title does not suggest `tickets/<slug>.md`. Create ticket stays disabled with no explanation until a path is typed. | Derive an editable path from the title and say what is missing next to the disabled button. |
| U3 | Med | Mobile → Notes | The folder tree takes the first screen and the editor sits below it. Opening a note shows no visible change at the top. | Switch to a list → note view with a "← Notes" back control on narrow widths. |
| U4 | Med | Header | The tab bar shifts sideways between tabs because the workspace control changes width (Tasks, TODOs, Notes, Settings each landed in a different place). The next click target moves. | Pin the tab bar position, or put the workspace picker on a fixed row. |
| U5 | Low | TODOs | The header says "Workspace: vault" while the filter row says "Folder scope: All folders". Two scope controls that disagree. | Use one control, and show which scope is active in the result count. |
| U6 | Low | Tasks (mobile) | The tip "focus a card title, then use the arrow keys…" shows on a phone. | Hide it on coarse pointers. |
| U7 | Low | Notes | The width button reads "Full width", which could be the current state or an action. | Icon with tooltip and `aria-pressed`. |
| U8 | Low | Notes (rendered) | A wikilink to `tickets/fix-login` shows the path, not the note's title "Fix login redirect". | Show the target title and keep the path in a tooltip. |
| U9 | Low | TODOs | While one checkbox is saving, the whole list dims and Refresh is disabled. | Disable only the row being written. |
| U10 | Low | Startup | The app opened on a workspace with two warnings stacked ("last scan failed", "wait for a complete, current index"). Both are correct but give no next step. | Add a "Fix in Settings" action to the first warning. |

---

## What worked

- Card actions menu and More menu close on Escape. Move up/down are disabled correctly at the ends of a lane.
- A failed move reverted the card's select instead of showing the wrong column.
- "Start on: Last used tab" works. Mobile reopened on Notes.
- The new-ticket draft survived switching tabs and coming back.
- Checking a TODO wrote `- [x]` into the file within about two seconds.
- Notes: tree with folders, search hint "press / to focus", rendered wikilinks, backlinks, and a block editor that tells you "Esc cancels · Ctrl+Enter saves".
- The board scrolls sideways on mobile and the next lane peeks in, which hints at more content.

## Already fixed since my first review

The header is slimmer, there is a Start-on preference, the card menu closes on Escape, Settings has sub-tabs with a Saved indicator, the board has a View panel for density and ordering, and Notes has a "/" search shortcut and an editing hint.

## Not covered

- Drag-and-drop between lanes and drop-target feedback.
- A successful column move. B1 blocked it in the first run and I did not repeat it after the workaround.
- Rebalance, legacy migration, "Use existing note", and the agent prompt.
- Settings → Appearance, Notes and Board sub-tabs in detail.
- Light theme, contrast measurement, screen-reader behaviour, and keyboard navigation of the board.

## What I changed on this machine

- Updated the installed Quartizo from 0.0.1 to 0.12.4 and started `kirocrew gateway` (still running).
- Added a disposable folder `…/scratchpad/vault` in Settings, created the ticket "Polish onboarding" in it, and checked one TODO in its README.
- Temporarily switched the Phase 1 folder off to test the workaround, then back on.
