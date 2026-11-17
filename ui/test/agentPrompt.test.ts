import { describe, expect, it } from 'vitest'
import { agentChatMessage } from '../src/agentPrompt'

const columns = [{ id: 'backlog', label: 'Backlog' }, { id: 'done', label: 'Done' }]

describe('agent chat message', () => {
  it('names the folder and column IDs, and ends on the request line, where the composer leaves the cursor', () => {
    expect(agentChatMessage('/notes', columns)).toBe(
      'Folder: /notes\nBoard columns, in order: backlog ("Backlog"), done ("Done")\n\nMy request: ')
  })
})
