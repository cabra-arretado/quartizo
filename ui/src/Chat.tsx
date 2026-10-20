import { type AppApi, ChatEmbed, useNavigate } from '@kirocrew/app-sdk'
import { Btn, Card, CardTitle } from '@kirocrew/app-sdk/ui'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BACKEND_BASE,
  classifyError,
  createSender,
  type Failure,
  loadSlot,
  newSlotName,
  openStoredSlot,
  saveSlot,
  slotDetailPath,
  type SlotStatus,
  type SlotStore,
  slotStatus,
  transcriptPath,
} from './slots'

export type { SlotStore }

export type SlotState =
  | { status: 'opening' }
  | { status: 'ready'; key: string }
  | { status: 'error'; failure: Failure }

interface BackendStatus {
  version: string
  principal: { kind: string; ownerId: string }
}

export function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

export function Alert({ failure }: { failure: Failure }) {
  return (
    <div role="alert" className="text-sm text-danger my-2" data-kind={failure.kind}>
      {failure.message}
    </div>
  )
}

/** Open (create or reopen) the store's slot; `restart` forgets it and opens a fresh one. */
export function useSlot(api: AppApi, store: SlotStore): { slot: SlotState; restart: () => void } {
  const [slot, setSlot] = useState<SlotState>({ status: 'opening' })
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    let cancelled = false
    setSlot({ status: 'opening' })
    openStoredSlot(api, store)
      .then(key => {
        if (cancelled) return
        store.save(key)
        setSlot({ status: 'ready', key })
      })
      .catch(err => !cancelled && setSlot({ status: 'error', failure: classifyError(err) }))
    return () => {
      cancelled = true
    }
  }, [api, store, generation])

  const restart = useCallback(() => {
    store.save(null)
    setGeneration(g => g + 1)
  }, [store])

  return { slot, restart }
}

/** Poll the slot's own status (what GET /api/chat/slots/{key} exposes) while `active`. */
export function useSlotStatus(
  api: AppApi,
  slotKey: string | null,
  active = true,
): { status: SlotStatus | null; failure: Failure | null } {
  const [state, setState] = useState<{ status: SlotStatus | null; failure: Failure | null }>({
    status: null,
    failure: null,
  })
  useEffect(() => {
    setState({ status: null, failure: null })
    if (!slotKey || !active) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      if (!document.hidden) {
        try {
          const row = await api.get(slotDetailPath(slotKey))
          if (!cancelled) setState({ status: slotStatus(row).status, failure: null })
        } catch (err) {
          if (!cancelled) setState({ status: null, failure: classifyError(err, { missingIsSlotNotFound: true }) })
        }
      }
      if (!cancelled) timer = setTimeout(tick, 5000)
    }
    void tick()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [api, slotKey, active])
  return state
}

/** Session status plus a link to the transcript in KiroCrew's own chat page. */
export function SlotStatusLine(props: {
  slot: SlotState
  status: SlotStatus | null
  confirmLeave?: () => boolean
}) {
  const navigate = useNavigate()
  const { slot, status } = props
  const key = slot.status === 'ready' ? slot.key : null
  return (
    <p className="text-sm text-muted" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <span>
        Chat: {key ? `${key} (${status ?? '…'})` : slot.status}
      </span>
      {key && (
        <a
          href={transcriptPath(key)}
          onClick={e => {
            e.preventDefault()
            if (!props.confirmLeave || props.confirmLeave()) navigate(transcriptPath(key))
          }}
        >
          Open transcript in KiroCrew chat
        </a>
      )}
    </p>
  )
}

const TAB_STORE: SlotStore = {
  load: () => loadSlot(storage()),
  save: key => saveSlot(storage(), key),
  fresh: () => newSlotName(),
}

/** The Quartizo-created chat session (QTZ-003), in its own tab. */
export default function Chat({ api }: { api: AppApi }) {
  const { slot, restart } = useSlot(api, TAB_STORE)
  const [sendFailure, setSendFailure] = useState<Failure | null>(null)
  const [backend, setBackend] = useState<string>('checking…')
  const readyKey = slot.status === 'ready' ? slot.key : null
  const live = useSlotStatus(api, readyKey)

  useEffect(() => {
    let cancelled = false
    api
      .get<BackendStatus>(`${BACKEND_BASE}/status`)
      .then(s => !cancelled && setBackend(`ok (v${s.version}, caller: ${s.principal.kind})`))
      .catch(err => !cancelled && setBackend(classifyError(err).message))
    return () => {
      cancelled = true
    }
  }, [api])

  useEffect(() => setSendFailure(null), [readyKey])

  const onSend = useMemo(
    () => (readyKey ? createSender(api, readyKey, { onError: setSendFailure }) : undefined),
    [api, readyKey],
  )

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        <Card>
          <CardTitle>Status</CardTitle>
          <p className="text-sm text-muted">Backend: {backend}</p>
          <SlotStatusLine slot={slot} status={live.status} />
          {slot.status === 'error' && <Alert failure={slot.failure} />}
          {live.failure && <Alert failure={live.failure} />}
          {sendFailure && <Alert failure={sendFailure} />}
          <Btn onClick={restart} disabled={slot.status === 'opening'}>
            Start new chat
          </Btn>
        </Card>
        {readyKey && onSend && (
          <div className="flex-1 min-h-0 flex flex-col">
            <ChatEmbed key={readyKey} slotKey={readyKey} onSend={onSend} startAtBottom />
          </div>
        )}
      </div>
    </>
  )
}
