/** Pieces shared by the views: styles, the error line and browser storage. */
import type { ApiFailure } from './companionApi'

export const S = {
  column: { display: 'flex', flexDirection: 'column' as const, gap: 8, minHeight: 0, minWidth: 0 },
  row: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const },
  input: { padding: '4px 6px', border: '1px solid rgba(128,128,128,.4)', borderRadius: 4, background: 'transparent', color: 'inherit' },
  box: { padding: 8, borderRadius: 4, border: '1px solid rgba(128,128,128,.35)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  notice: { padding: 8, borderRadius: 4, border: '1px solid rgba(220,120,0,.6)', display: 'flex', flexDirection: 'column' as const, gap: 6 },
  badge: { fontSize: 11, padding: '0 4px', borderRadius: 3, border: '1px solid rgba(220,120,0,.7)' },
  mono: { fontFamily: 'ui-monospace, monospace', fontSize: 12, wordBreak: 'break-all' as const },
}

export function ErrorLine({ failure }: { failure: ApiFailure | null }) {
  if (!failure) return null
  return (
    <div role="alert" className="text-sm text-danger" data-code={failure.code}>
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
