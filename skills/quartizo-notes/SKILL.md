---
name: quartizo-notes
description: "Read and edit a Quartizo folder: Markdown notes, ticket cards on the Tasks board, and TODO checkboxes. Covers the vault's own AGENTS.md, ticket frontmatter, card order, TODO syntax and safe edits. Load before touching any file in a folder connected to Quartizo."
triggers: quartizo, my vault, my notes, ticket, board card, kanban, todo list, add a todo, new ticket, move ticket, daily note
---

# Working in a Quartizo folder

Quartizo shows plain Markdown files in a local folder as **Notes**, a **Tasks**
board and a **TODOs** list. There is no database to update: you edit the files,
and Quartizo picks up the changes within seconds. The same folder may also be
open in Kiro Notes or a text editor, so the person can be editing at the same
time.

## 1. Know the folder before you touch it

1. Confirm the folder's absolute path. It is in the request or the chat draft
   ("Folder: …"). If it is missing, ask. Never guess a vault.
2. Read `AGENTS.md` at the folder root if it exists. It is the person's own
   description of the vault: what lives where, naming habits, what each column
   means, and what you must not do. It overrides the defaults below, except for
   the file-safety rules in section 6.
3. If there is no `AGENTS.md`, work from the defaults below. Once the task is
   done, offer to create one from [vault-template.md](vault-template.md),
   filling it in from what you saw in the folder and from the person's answers.
   Do not create it without asking.
4. Look before you write: list the folder, and read the notes you plan to
   change.

## 2. Notes

- A note is any `.md` file. Its title is the first `# Heading`, or the file
  name if there is none.
- For a new note, use an unused path inside the folder. Follow the folder's
  existing layout (for example `daily/2026-11-17.md`), then `AGENTS.md`.
- Use UTF-8 with LF line endings for new files.
- Link notes with `[[path/without-extension]]`, as the folder already does.
  Quartizo shows backlinks from these.
- Folders and files that start with `.` are ignored by Quartizo. Leave them
  alone.

## 3. Tickets (Tasks board cards)

A ticket is a note whose YAML frontmatter, at the very start of the file, says
`type: ticket`:

```markdown
---
id: "8423e295-12ce-4b61-a281-d719c1fa86f6"
type: ticket
status: "backlog"
order: "7fffffffffffffffffffffffffffffff"
---

# Ticket title

- [ ] An actionable TODO
```

- **`status`** is a column ID. The defaults are `backlog`, `ready`,
  `in_progress`, `review` and `done`, but each folder can have its own columns.
  Use the IDs listed in the chat draft or `AGENTS.md`. Otherwise run `column`
  with a likely ID, or read existing tickets. Use the first column unless the
  person names another.
- **`id`** is a fresh UUID for each new ticket. Never change an existing ID, and
  never copy one from another note.
- **`order`** places the card within its column. Do not work it out by hand:
  use the helper (section 4).
- Only create a ticket when the person asks for a card. A regular note needs no
  frontmatter.
- To move a card, change only `status` and `order`. On ordinary edits, keep
  `id`, `type`, `status` and `order` exactly as they are, along with any other
  YAML properties.
- Checklist completion is independent of status: finishing every TODO does not
  move a card to Done.

## 4. The ticket helper

The helper uses Quartizo's own parser, so its answers match the board. It only
reads files.

```bash
H=~/.kiro/crew/skills/quartizo/quartizo-notes/scripts/quartizo_ticket.py
python3 "$H" new-id                                  # fresh ticket id
python3 "$H" column "<folder>" backlog               # cards in board order
python3 "$H" order  "<folder>" backlog               # order for the end of a column
python3 "$H" order  "<folder>" ready --before tickets/fix-login.md
python3 "$H" check  "<folder>" tickets/new-thing.md  # validate after writing
```

- Run `order` immediately before writing, because the person may be moving
  cards at the same time.
- Exit code 1 means it is not safe: invalid metadata in the column, or no space
  left between cards. Stop, tell the person what it printed, and point them to
  **Tasks → More actions → Rebalance…** in Quartizo. Do not try to repair
  orders yourself.
- Exit code 2 means the helper could not load Quartizo's parser. Report that,
  and do not invent an order value.
- Always run `check` on a ticket you created or moved. It must print `ok`.

## 5. TODOs

- A TODO is a `- [ ] text` line, or `- [x] text` (lowercase `x`) when done.
- Do not put TODOs inside tables or code fences; Quartizo ignores them there.
- To complete or reopen a TODO, change only that checkbox marker. Keep the text
  as it is.
- Add new TODOs to the note they belong to, under a fitting heading if the note
  has headings. Quartizo shows each TODO with its nearest heading.

## 6. File safety (always applies)

- Stay inside the confirmed folder. If you hand work to another agent, give it
  the absolute path and have it check that its changes land there.
- Edit in place and preserve everything you were not asked to change: other
  text, YAML properties and their order, blank lines, and line endings.
- If a note uses CRLF line endings, its TODOs need LF. Explain this and ask
  before converting the note.
- Re-read a note right before saving it if time has passed, and stop if it
  changed underneath you. Tell the person rather than overwrite their edit.
- Never delete notes or folders unless explicitly asked, and then name each file
  first.
- Finish by listing the paths you created or changed, and anything you skipped
  and why.
