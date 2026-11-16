# Quartizo Notes and shared index

Add a Notes tab that uses the same registered Markdown folders as Tasks and TODOs. Existing note files, workspace IDs, and ticket metadata are the data model. The first implementation was built on Quartizo 0.0.4 on `feat/quartizo-notes`. This branch brings it into the verified writable companion and retains per-folder board columns.

## Workstreams

1. **Index and file events.** Keep one SQLite index for all three views. Populate it at startup, batch changed paths from a native filesystem watcher, and update their note and checklist rows together. Keep bounded reconciliation for missed events, unavailable watchers, and the existing Refresh and Rebuild controls.
2. **Note API.** List indexed note paths and titles. Read the selected Markdown on demand. Create and save notes through the existing authenticated, root-confined writer. Reject saves with stale content hashes and tell the index which paths changed.
3. **Notes tab.** Show a folder tree with path and title search, Markdown editing and preview, and creation at a relative path. Open the exact source file from Tasks and TODOs. Preserve unsaved text during navigation and when a save conflicts. Keep the native Kiro Crew Bot handoff.
4. **Integration.** Verify upgrades with existing workspace data, an external edit, a note save that changes TODOs, and navigation from a card to its source. Run the backend and UI suites and rebuild the shipped bundle.

## First version

A plain local directory is sufficient. The Notes tab uses the configured roots and displays folders that contain indexed Markdown notes. Full-text search, wikilinks, Git sync, and Knowledge integration are outside this version.

An ordinary edit should read only the affected file. With a working watcher, leaving a view open should query the index without repeatedly reading all notes. A full reconciliation remains available when a watcher misses a change. A stale save should leave the file and the user's draft intact.
