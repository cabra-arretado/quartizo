/**
 * Polling freshness for the Agents tab (QTZ-012): when to poll, how to back
 * off, and what to say about data that may be out of date. Pure, so the
 * staleness rules are tested without timers.
 *
 * Rules:
 * - Poll every POLL_MS while the tab is active and the page is visible; stop
 *   otherwise (no timer runs while hidden).
 * - After a failure, wait POLL_MS * 2^failures, capped at MAX_BACKOFF_MS.
 * - A failure never changes what is shown, it marks it stale: "stale since"
 *   is the first failed poll after the last success. Nothing is inferred from
 *   silence; the last statuses received stay as they were, labelled stale.
 * - A change of the gateway's process generation (`turn_gen`) between two
 *   successful polls means the gateway restarted; it is reported, and cached
 *   transcript summaries are dropped.
 */
export const POLL_MS = 5000
export const MAX_BACKOFF_MS = 60000
/** Each request of a poll gives up after this long; a timeout counts as a failure. */
export const REQUEST_TIMEOUT_MS = 15000
/** A transcript read that failed is not retried for this long, doubling per failure up to the cap. */
export const DETAIL_BACKOFF_MS = 60000
export const DETAIL_MAX_BACKOFF_MS = 300000

/** Reject if `p` has not settled within `ms`; the late result is ignored. */
export function withTimeout<T>(p: Promise<T>, ms: number = REQUEST_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`request timed out after ${Math.round(ms / 1000)} s`)), ms)
  })
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer))
}

/** Wait before re-reading a transcript after its `failures`-th consecutive failure. */
export function detailBackoff(failures: number): number {
  if (!Number.isFinite(failures) || failures <= 0) return 0
  return Math.min(DETAIL_MAX_BACKOFF_MS, DETAIL_BACKOFF_MS * 2 ** Math.min(failures - 1, 30))
}

/**
 * When the tab becomes visible again: poll at once if healthy, else only when
 * the current backoff has run out (`sinceLastStart` = ms since the last poll began).
 */
export function resumeDelay(failures: number, sinceLastStart: number): number {
  if (!Number.isFinite(failures) || failures <= 0) return 0
  return Math.max(0, nextDelay(failures) - sinceLastStart)
}

export interface Freshness {
  /** Last successful poll (epoch ms). */
  lastOkAt: number | null
  /** First failed poll since the last success, or null while fresh. */
  staleSince: number | null
  failures: number
  lastError: string | null
  generation: string | null
  /** When a generation change (gateway restart) was last seen. */
  restartedAt: number | null
}

export const INITIAL_FRESHNESS: Freshness = {
  lastOkAt: null,
  staleSince: null,
  failures: 0,
  lastError: null,
  generation: null,
  restartedAt: null,
}

export function onPollSuccess(f: Freshness, now: number, generation?: string | null): Freshness {
  const gen = generation || null
  const restarted = gen !== null && f.generation !== null && gen !== f.generation
  return {
    lastOkAt: now,
    staleSince: null,
    failures: 0,
    lastError: null,
    generation: gen ?? f.generation,
    restartedAt: restarted ? now : f.restartedAt,
  }
}

export function onPollFailure(f: Freshness, now: number, message: string): Freshness {
  return { ...f, staleSince: f.staleSince ?? now, failures: f.failures + 1, lastError: message }
}

/** Delay before the next poll. */
export function nextDelay(failures: number, base = POLL_MS, max = MAX_BACKOFF_MS): number {
  if (!Number.isFinite(failures) || failures <= 0) return base
  return Math.min(max, base * 2 ** Math.min(failures, 30))
}

export function shouldPoll(opts: { active: boolean; hidden: boolean }): boolean {
  return opts.active && !opts.hidden
}

/** True when a generation change happened after `since` (a restart the cache predates). */
export function restartedSince(f: Freshness, since: number | null): boolean {
  return f.restartedAt !== null && (since === null || f.restartedAt >= since)
}

export type FreshnessView =
  | { kind: 'loading' }
  | { kind: 'fresh'; at: number }
  | { kind: 'stale'; since: number; dataAt: number | null; error: string; retryInMs: number }

export function freshnessView(f: Freshness): FreshnessView {
  if (f.staleSince !== null) {
    return { kind: 'stale', since: f.staleSince, dataAt: f.lastOkAt, error: f.lastError ?? 'request failed', retryInMs: nextDelay(f.failures) }
  }
  return f.lastOkAt === null ? { kind: 'loading' } : { kind: 'fresh', at: f.lastOkAt }
}
