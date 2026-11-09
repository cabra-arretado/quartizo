/** Icons, error feedback, and browser storage shared by the views. */
import type { ApiFailure } from './companionApi'

const icons = {
  gem: <path d="M8 4h8l4.5 5L12 21 3.5 9 8 4Zm-4.5 5h17M8 4l1 5 3 12 3-12 1-5" />,
  board: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16m6-16v16M6 8h.1M12 8h.1m6 0h.1" /></>,
  checklist: <path d="m3 6 2 2 3-4m3 3h10M3 13l2 2 3-4m3 3h10M3 20h5m3 0h10" />,
  settings: <><path d="M4 6h7m4 0h5M4 12h3m4 0h9M4 18h11m4 0h1" /><circle cx="13" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  note: <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8m-8 4h6" />,
  external: <path d="M13 5h6v6m0-6-9 9m8-1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  refresh: <path d="M20 11a8 8 0 1 0-2.2 6.6M20 4v7h-7" />,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 4H6a2 2 0 0 0-2 2v10" /></>,
  search: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 5 5" /></>,
  up: <path d="m6 14 6-6 6 6" />,
  down: <path d="m6 10 6 6 6-6" />,
  check: <path d="m5 12 4 4L19 6" />,
  minus: <path d="M5 12h14" />,
}

export type IconName = keyof typeof icons

export function Icon({ name }: { name: IconName }) {
  return <svg className="qz-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icons[name]}</svg>
}

export function ErrorLine({ failure }: { failure: ApiFailure | null }) {
  if (!failure) return null
  return (
    <div role="alert" className="qz-notice qz-error" data-code={failure.code}>
      {failure.message}
    </div>
  )
}

/** localStorage, or nothing where the browser refuses it. */
export function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}
