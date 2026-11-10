export function agentPrompt(path: string, columns: readonly { id: string; label: string }[]): string {
  const first = columns[0].id
  const statuses = columns.map(c => `- ${c.id} (${JSON.stringify(c.label)})`).join('\n')
  return `Work with Quartizo and Kiro Notes by editing Markdown files in the connected folder ${JSON.stringify(path)}.

- Keep note operations within this exact folder. If you delegate, pass the absolute path to the worker and have it verify that its changes land in that folder.
- Find and read the current note before updating it. Use a new, unused .md path inside the folder for new notes. Use UTF-8 with LF line endings for new files. Preserve existing line endings, unrelated text, and YAML properties when editing. Re-read before saving if the file may have changed, and stop if the edit conflicts with another writer.
- A regular note can start with a # Title heading and needs no ticket metadata. Create a ticket only when asked for a board card. Put its YAML frontmatter at the very start of the file. Generate a fresh UUID for each new ticket and preserve existing ticket IDs.

Use these ticket status IDs, listed in board order.
${statuses}

Use this template for a new ticket. Replace the example UUID and calculate the order before saving.

\`\`\`markdown
---
id: "8423e295-12ce-4b61-a281-d719c1fa86f6"
type: ticket
status: "${first}"
order: "7fffffffffffffffffffffffffffffff"
---

# Ticket title

- [ ] An actionable TODO
\`\`\`

- Use the first status unless the user specifies a column. Append a new or moved card by inspecting the destination column's current ticket notes. With exact integer arithmetic, take the floor of (largest order + 0xffffffffffffffffffffffffffffffff) / 2, using 0 as the largest order for an empty column. Write the result as a quoted, zero-padded, 32-character lowercase hex string. If the midpoint equals the largest order or the column has invalid metadata, stop and report that it needs repair or rebalancing in Quartizo. Preserve status and order on ordinary note edits.
- Add TODOs to the relevant note as \`- [ ] text\` lines outside tables and code fences. Use lowercase \`- [x] text\` for completed items. To complete or reopen an existing TODO, change only that item's checkbox marker. Keep checklist completion independent of ticket status. If an existing note uses CRLF, explain that its TODOs need LF and ask before converting the note.
- Verify the resulting Markdown and report the note paths you changed. Quartizo picks up file edits on its next scan or when the user clicks Refresh.`
}
