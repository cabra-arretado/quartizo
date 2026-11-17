import { useChatLauncher } from '@kirocrew/app-sdk'
import { agentChatMessage } from './agentPrompt'
import type { Workspace } from './companionApi'
import { Icon } from './ui'

/**
 * Opens a KiroCrew chat draft with the folder's agent instructions. Nothing is sent:
 * the composer leaves the cursor at the end, on the "My request:" line.
 */
export function AskAgentButton({ workspace, variant, onOpen }: {
  workspace: Pick<Workspace, 'name' | 'path' | 'columns' | 'companion'>
  variant?: 'primary' | 'quiet'
  onOpen?: () => void
}) {
  const { openChat } = useChatLauncher()
  return <button type="button" className="qz-button" data-variant={variant} disabled={!workspace.companion}
    aria-label={`Ask a Bot or agent about ${workspace.name}`}
    title={`Opens a KiroCrew chat draft with instructions for ${workspace.name}. Nothing is sent until you press Send.`}
    onClick={() => { onOpen?.(); openChat({ message: agentChatMessage(workspace.path, workspace.columns), autoSend: false }) }}>
    <Icon name="external" />Ask a Bot or agent
  </button>
}
