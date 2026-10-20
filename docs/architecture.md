# Architecture (M1)

```
dashboard page (ui/dist/index.mjs, rendered by the host)
  App.tsx        PageHeader + in-page tabs: Notes | Chat
  Notes.tsx      workspace picker/registration, note list + search, editor, preview
  Chat.tsx       the QTZ-003 ChatEmbed session (mounted on first visit, then kept)
  notesApi.ts    typed client for /apps/quartizo/api/workspaces/... (useAppApi)
  editorDoc.ts   open-note state: dirty, save base hash, 409 conflict rules
  lineEndings.ts LF editor text <-> the file's own line endings
  markdown.ts    untrusted Markdown -> sanitized HTML
  listNav.ts     keyboard navigation for the note list
        |
        | same-origin fetch, owner cookie (gateway signs + forwards)
        v
backend (python3 -I backend/server.py, stdlib only)
  server.py      HMAC + signed principal (owner-session only), routing
  workspace.py   root registry, path validation, fd-based no-follow opens
  notes.py       list/search, read, atomic create/update/rename, trash-delete
  db.py          sqlite3 registry + migrations ($KIROCREW_HOME/apps/quartizo/data)
        |
        v
plain .md files in the registered folders (readable by Obsidian or any editor)
```

Testable logic lives in the plain `.ts` modules and has vitest suites. The
`.tsx` components only wire state to elements.

## Pages and routing

`app.json` keeps its single `ui.pages` entry (`/apps/quartizo`). Every
builtin app in 0.10.0rc4 declares exactly one page. Extra pages would each
add a sidebar entry, and the host's handling of sub-routes was not verified.
So Notes and Chat are **in-page tabs** (`role="tablist"`, arrow keys switch).
No manifest change and no new permission was needed: the notes routes sit
under the already-granted `/apps/quartizo/api`.

## Editor: plain `<textarea>` (not CodeMirror 6)

Only the host's eight import-map modules are external (`HOST_MODULES` in
`ui/vite.config.ts`). Anything else we import is bundled into
`ui/dist/index.mjs`.

| | `<textarea>` | CodeMirror 6 |
|---|---|---|
| Bundle cost | 0 | Measured with esbuild (minified): `codemirror` 6.0.2 `basicSetup` + `@codemirror/lang-markdown` = **613 KB, 208 KB gzip**. A hand-trimmed setup is smaller but still several hundred KB. For scale, the whole M1 bundle with markdown-it is 173 KB (60 KB gzip) |
| Host sharing | n/a | Not in the import map, so every app that uses it ships its own copy |
| Line endings | Normalizes to LF (HTML "API value") | Also normalizes by default (`lineSeparator`) |
| IME, spellcheck, a11y, undo | Native | Good, but its own implementation |
| Markdown highlighting, folding, vim keys | No | Yes |

**Choice: `<textarea>`.** M1 needs correct editing of real files more than
rich editing. CodeMirror would more than quadruple the bundle for syntax
highlighting, and it would not fix the line-ending problem either. Line
endings are handled explicitly instead (`lineEndings.ts`): LF and CRLF files
are edited as LF and written back in their own style, so an edit round-trips
byte for byte. A file that **mixes** styles (or uses lone `\r`) cannot
survive any normalizing editor, so it opens read-only with a notice.
Revisit if highlighting becomes a requirement; the editor is one element in
`NoteEditor`.

## Markdown preview

`markdown-it` 15.0.2 (its prebuilt minified ESM build, `markdown-it/browser`),
configured for untrusted input. See [threat-model.md](threat-model.md) §3. It
was chosen over `marked` + DOMPurify because sanitization happens while the
HTML is generated (html disabled, URL allowlist), not by cleaning HTML after
the fact. It runs without a DOM, so the XSS tests run in plain Node.

## Conflict UX

Every save sends the hash of the content last read or saved. On 409 the
editor keeps the user's text and shows a notice with three choices:

- **Reload from disk**: discard mine and load the current file.
- **Keep editing**: hide the notice. The base hash is unchanged, so the next
  save conflicts again.
- **Overwrite with my version…**: an explicit decision that only *arms* the
  next Save with the hash now on disk (or re-creates a deleted note).

Nothing is ever overwritten automatically (`editorDoc.ts`, tested).
Delete asks for confirmation inline, and a rename onto an existing note asks
again before sending `overwrite` + `confirm`.
