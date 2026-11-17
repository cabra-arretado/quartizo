# Quartizo UI/UX QA report

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
