import { ChatEmbed, useAppApi } from '@kirocrew/app-sdk'
import { Btn, Card, CardTitle, PageHeader } from '@kirocrew/app-sdk/ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BACKEND_BASE,
  classifyError,
  createSender,
  type Failure,
  loadSlot,
  newSlotName,
  openSlot,
  saveSlot,
} from './slots'

type SlotState =
  | { status: 'opening' }
  | { status: 'ready'; key: string }
  | { status: 'error'; failure: Failure }

interface BackendStatus {
  version: string
  principal: { kind: string; ownerId: string }
}

function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function Alert({ failure }: { failure: Failure }) {
  return (
    <div role="alert" className="text-sm text-danger my-2" data-kind={failure.kind}>
      {failure.message}
    </div>
  )
}

// Default export is what the host renders (AppHost lazy-imports ui.entry and
// mounts its default export inside its AppApiProvider + QueryClient).
export default function Quartizo() {
  const api = useAppApi()
  const [slot, setSlot] = useState<SlotState>({ status: 'opening' })
  const [sendFailure, setSendFailure] = useState<Failure | null>(null)
  const [backend, setBackend] = useState<string>('checking…')
  const [generation, setGeneration] = useState(0)
  // One slot name per generation. StrictMode runs the effect twice; both runs
  // must open the SAME name, or the discarded run leaves an orphan session.
  const nameFor = useRef<{ generation: number; name: string } | null>(null)

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

  useEffect(() => {
    let cancelled = false
    setSlot({ status: 'opening' })
    setSendFailure(null)
    if (nameFor.current?.generation !== generation) {
      nameFor.current = { generation, name: loadSlot(storage()) ?? newSlotName() }
    }
    const { name } = nameFor.current
    openSlot(api, name)
      .then(key => {
        if (cancelled) return
        saveSlot(storage(), key)
        setSlot({ status: 'ready', key })
      })
      .catch(err => !cancelled && setSlot({ status: 'error', failure: classifyError(err) }))
    return () => {
      cancelled = true
    }
  }, [api, generation])

  const startNewChat = useCallback(() => {
    saveSlot(storage(), null)
    setGeneration(g => g + 1)
  }, [])

  const readyKey = slot.status === 'ready' ? slot.key : null
  const onSend = useMemo(
    () => (readyKey ? createSender(api, readyKey, { onError: setSendFailure }) : undefined),
    [api, readyKey],
  )

  return (
    <>
      <PageHeader title="Quartizo" subtitle="Quartizo-created session" />
      <div className="px-6 pb-8 flex-1 min-h-0 flex flex-col gap-3">
        <Card>
          <CardTitle>Status</CardTitle>
          <p className="text-sm text-muted">Backend: {backend}</p>
          <p className="text-sm text-muted">
            Chat: {slot.status === 'ready' ? slot.key : slot.status}
          </p>
          {slot.status === 'error' && <Alert failure={slot.failure} />}
          {sendFailure && <Alert failure={sendFailure} />}
          <Btn onClick={startNewChat} disabled={slot.status === 'opening'}>
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
