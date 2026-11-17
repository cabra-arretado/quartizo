import { describe, expect, it } from 'vitest'
import { agentChatMessage, agentPrompt } from '../src/agentPrompt'

const columns = [{ id: 'backlog', label: 'Backlog' }, { id: 'done', label: 'Done' }]

describe('agent chat message', () => {
  it('keeps the full instructions and ends on the request line, where the composer leaves the cursor', () => {
    const message = agentChatMessage('/notes', columns)
    expect(message).toContain(agentPrompt('/notes', columns))
    expect(message.startsWith('Quartizo folder instructions')).toBe(true)
    expect(message.endsWith('\n\nMy request: ')).toBe(true)
  })
})
