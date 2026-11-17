import { useChatLauncher } from '@kirocrew/app-sdk'
import { agentChatMessage } from './agentPrompt'
import type { Workspace } from './companionApi'
import { Icon } from './ui'

/** The `name` in agents/quartizo-notes.json. */
export const NOTES_AGENT = 'quartizo-notes'

/**
 * Opens a new KiroCrew chat with Quartizo's notes agent (agents/quartizo-notes.json, which loads
 * the quartizo-notes skill) and a short draft naming the folder. Nothing is sent: the composer
 * leaves the cursor at the end, on the "My request:" line.
 */
export function AskAgentButton({ workspace, variant, onOpen }: {
  workspace: Pick<Workspace, 'name' | 'path' | 'columns' | 'companion'>
  variant?: 'primary' | 'quiet'
  onOpen?: () => void
}) {
  const { openChat } = useChatLauncher()
  return <button type="button" className="qz-button" data-variant={variant} disabled={!workspace.companion}
    aria-label={`Ask a Bot or agent about ${workspace.name}`}
    title={`Opens a KiroCrew chat with the Quartizo notes agent for ${workspace.name}. Nothing is sent until you press Send.`}
    onClick={() => { onOpen?.(); openChat({ agent: NOTES_AGENT, message: agentChatMessage(workspace.path, workspace.columns), autoSend: false }) }}>
    <Icon name="external" />Ask a Bot or agent
  </button>
}
