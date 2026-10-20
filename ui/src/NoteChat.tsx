import { type AppApi, ChatEmbed, useChatLauncher } from '@kirocrew/app-sdk'
import { Btn } from '@kirocrew/app-sdk/ui'
import { type MutableRefObject, useMemo, useState } from 'react'
import { Alert, SlotStatusLine, type SlotStore, storage, useSlot, useSlotStatus } from './Chat'
import { attachingSender, CONTEXT_MAX_BYTES, formatContext, type NoteContext } from './context'
import type { Workspace } from './notesApi'
import {
  createSender,
  type Failure,
  isWorkspaceUid,
  loadWorkspaceSlot,
  newWorkspaceSlotName,
  saveWorkspaceSlot,
} from './slots'

const S = {
  column: { display: 'flex', flexDirection: 'column' as const, gap: 8, minHeight: 0, minWidth: 0, flex: 1 },
  row: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const },
  panel: { padding: 8, borderRadius: 4, border: '1px solid rgba(80,140,255,.5)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  pre: { margin: 0, maxHeight: 220, overflow: 'auto', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const, fontSize: 12, fontFamily: 'ui-monospace, monospace', padding: 6, border: '1px solid rgba(128,128,128,.25)', borderRadius: 4 },
  dl: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px', margin: 0 },
}

function kb(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

function Summary({ ctx }: { ctx: NoteContext }) {
  return (
    <dl className="text-sm" style={S.dl}>
      <dt className="text-muted">Workspace</dt>
      <dd style={{ margin: 0 }}>{ctx.workspaceName}</dd>
      <dt className="text-muted">Note</dt>
      <dd style={{ margin: 0, wordBreak: 'break-all' }}>{ctx.notePath}</dd>
      <dt className="text-muted">Lines</dt>
      <dd style={{ margin: 0 }}>
        {ctx.startLine}-{ctx.endLine} of {ctx.totalLines}
        {ctx.wholeNote && ' (whole note)'}
        {ctx.unsaved && ' · includes unsaved edits'}
      </dd>
      <dt className="text-muted">Size</dt>
      <dd style={{ margin: 0 }}>
        {kb(ctx.bytes)}
        {ctx.truncated && (
          <strong className="text-danger">
            {' '}
            truncated to the {kb(CONTEXT_MAX_BYTES)} cap ({kb(ctx.truncated.originalBytes)} in lines {ctx.startLine}-
            {ctx.truncated.originalEndLine} were selected)
          </strong>
        )}
      </dd>
    </dl>
  )
}

/**
 * The workspace's own chat beside its notes (QTZ-007). One Quartizo-created
 * session per workspace, remembered under `quartizo:slot:ws:<id>`. Note
 * context is never sent unless the user attached it, and then only once.
 */
type Props = {
  api: AppApi
  workspace: Workspace
  active: boolean
  candidate: NoteContext | null
  contextError: string | null
  onDiscardCandidate: () => void
  attached: NoteContext | null
  holder: MutableRefObject<NoteContext | null>
  onAttach: (ctx: NoteContext) => void
  onDetach: () => void
  confirmLeave: () => boolean
}

export default function NoteChat(props: Props) {
  // The session is keyed by the workspace's uid; without one (an older backend) there is no chat.
  if (!isWorkspaceUid(props.workspace.uid)) {
    return (
      <div role="alert" className="text-sm text-danger">
        The backend did not return a workspace uid, so this workspace has no chat. Update Quartizo's backend.
      </div>
    )
  }
  return <WorkspaceChat {...props} />
}

function WorkspaceChat(props: Props) {
  const { api, workspace, candidate, attached, holder } = props
  const wsId = workspace.id
  const uid = workspace.uid
  const store = useMemo<SlotStore>(
    () => ({
      load: () => loadWorkspaceSlot(storage(), uid),
      save: key => saveWorkspaceSlot(storage(), uid, key),
      fresh: () => newWorkspaceSlotName(uid),
    }),
    [uid],
  )
  const { slot, restart } = useSlot(api, store)
  const readyKey = slot.status === 'ready' ? slot.key : null
  const live = useSlotStatus(api, readyKey, props.active)
  const [sendFailure, setSendFailure] = useState<{ key: string; failure: Failure } | null>(null)
  const { openChat } = useChatLauncher()
  const { onDetach } = props

  const onSend = useMemo(() => {
    if (!readyKey) return undefined
    const send = createSender(api, readyKey, { onError: failure => setSendFailure({ key: readyKey, failure }) })
    return attachingSender(
      async (message: string, meta?: Parameters<typeof send>[1]) => {
        setSendFailure(null)
        return send(message, meta)
      },
      holder,
      wsId,
      onDetach,
    )
  }, [api, readyKey, holder, wsId, onDetach])

  const openAsDraft = (ctx: NoteContext) => {
    if (!readyKey || !props.confirmLeave()) return
    // Verified in the 0.10.0rc4 host: slotKey + autoSend:false appends to that
    // session's unsent draft on the full chat page; nothing is sent.
    openChat({ slotKey: readyKey, message: `${formatContext(ctx)}\n\n`, autoSend: false })
  }

  return (
    <div style={S.column} aria-label={`Chat for ${workspace.name}`}>
      <SlotStatusLine slot={slot} status={live.status} confirmLeave={props.confirmLeave} />
      {slot.status === 'error' && <Alert failure={slot.failure} />}
      {live.failure && <Alert failure={live.failure} />}
      {sendFailure && sendFailure.key === readyKey && <Alert failure={sendFailure.failure} />}
      <div style={S.row}>
        <Btn onClick={restart} disabled={slot.status === 'opening'}>
          Start new chat for this workspace
        </Btn>
      </div>

      {props.contextError && (
        <div role="alert" className="text-sm text-danger">
          {props.contextError}
        </div>
      )}
      {candidate && (
        <section aria-label="Context to attach" style={S.panel}>
          <strong className="text-sm">Context preview (not attached yet)</strong>
          <Summary ctx={candidate} />
          <span className="text-sm text-muted">Exactly this block is put before your next message:</span>
          <pre style={S.pre} data-testid="qz-context-block">
            {formatContext(candidate)}
          </pre>
          <div style={S.row}>
            <Btn onClick={() => props.onAttach(candidate)}>Attach to message</Btn>
            <Btn onClick={() => openAsDraft(candidate)} disabled={!readyKey}>
              Open in full chat as draft
            </Btn>
            <Btn onClick={props.onDiscardCandidate}>Discard</Btn>
          </div>
        </section>
      )}

      {readyKey && onSend && (
        <div style={{ ...S.column, minHeight: 320 }}>
          <ChatEmbed
            key={readyKey}
            slotKey={readyKey}
            onSend={onSend}
            startAtBottom
            placeholder={`Ask about ${workspace.name}…`}
            aboveComposer={
              attached ? (
                <div className="text-sm" role="status" style={{ ...S.row, padding: '4px 8px' }}>
                  <span>
                    Attached: {attached.notePath} lines {attached.startLine}-{attached.endLine} ({kb(attached.bytes)}
                    {attached.truncated ? ', truncated' : ''}). Sent with your next message only.
                  </span>
                  <button
                    type="button"
                    onClick={onDetach}
                    style={{ background: 'transparent', color: 'inherit', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                </div>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  )
}
