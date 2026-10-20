/**
 * Hand-written types for the host-provided SDK. There is no npm package
 * (`@kirocrew/app-sdk` 404s on the registry; the host serves it via its import
 * map), so this is the ONE place Quartizo asserts the SDK's shape.
 *
 * Transcribed from kirodotdev/KiroCrew@f62ab4fd (export names and ChatEmbed
 * props rechecked against the kirocrew 0.10.0rc4 bundled host assets):
 *   website/src/app-sdk/scopedApi.ts   (AppApi, AppApiError)
 *   website/src/app-sdk/ChatEmbed.tsx  (ChatEmbedProps, ChatEmbedSendMeta)
 *   website/public/vendor/kirocrew-ui.mjs + website/src/components/AppHost.tsx
 *                                      (PageHeader, Card, CardTitle, Btn usage)
 * Only the members Quartizo uses are declared. UI component props are inferred
 * from upstream call sites, not from a published type: UNVERIFIED.
 */
declare module '@kirocrew/app-sdk' {
  import type { ReactNode, ReactElement } from 'react'

  export interface AppApi {
    raw(path: string, init?: RequestInit): Promise<Response>
    request<T = unknown>(path: string, init?: RequestInit): Promise<T>
    get<T = unknown>(path: string, init?: RequestInit): Promise<T>
    post<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T>
    put<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T>
    patch<T = unknown>(path: string, body?: unknown, init?: RequestInit): Promise<T>
    del<T = unknown>(path: string, init?: RequestInit): Promise<T>
  }

  /** Non-2xx from AppApi: name 'AppApiError', message `API <status>: <body>`. */
  export interface AppApiError extends Error {
    readonly status: number
    readonly body: string
  }

  export function useAppApi(): AppApi

  export interface ChatEmbedSendMeta {
    files?: string[]
  }

  export interface ChatEmbedProps {
    slotKey: string
    agent?: string
    placeholder?: string
    frameless?: boolean
    startAtBottom?: boolean
    onSend?: (message: string, meta?: ChatEmbedSendMeta) => Promise<unknown> | void
    aboveComposer?: ReactNode
    composerMaxHeight?: number
    onFileOpen?: (path: string, opts?: { line?: number; endLine?: number }) => void
    onArtifactOpen?: (slug: string) => void
  }

  export function ChatEmbed(props: ChatEmbedProps): ReactElement | null
}

declare module '@kirocrew/app-sdk/ui' {
  import type { ReactNode, ReactElement } from 'react'

  export function PageHeader(props: { title: string; subtitle?: string }): ReactElement
  export function Card(props: { children?: ReactNode; className?: string }): ReactElement
  export function CardTitle(props: { children?: ReactNode }): ReactElement
  export function Btn(props: { children?: ReactNode; onClick?: () => void; disabled?: boolean }): ReactElement
}
