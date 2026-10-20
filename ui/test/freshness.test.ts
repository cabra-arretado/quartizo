import { describe, expect, it, vi } from 'vitest'
import {
  DETAIL_MAX_BACKOFF_MS,
  detailBackoff,
  freshnessView,
  INITIAL_FRESHNESS,
  MAX_BACKOFF_MS,
  nextDelay,
  onPollFailure,
  onPollSuccess,
  POLL_MS,
  REQUEST_TIMEOUT_MS,
  resumeDelay,
  restartedSince,
  shouldPoll,
  withTimeout,
} from '../src/freshness'

describe('nextDelay (backoff)', () => {
  it('polls every 5 s when healthy', () => {
    expect(POLL_MS).toBe(5000)
    expect(nextDelay(0)).toBe(5000)
  })
  it('doubles per consecutive failure, capped', () => {
    expect([1, 2, 3, 4].map(n => nextDelay(n))).toEqual([10000, 20000, 40000, MAX_BACKOFF_MS])
    expect(nextDelay(50)).toBe(MAX_BACKOFF_MS)
    expect(nextDelay(10000)).toBe(MAX_BACKOFF_MS)
  })
  it('treats odd inputs as healthy', () => {
    expect(nextDelay(-1)).toBe(POLL_MS)
    expect(nextDelay(Number.NaN)).toBe(POLL_MS)
  })
})

describe('shouldPoll', () => {
  it('only while the tab is active and the page visible', () => {
    expect(shouldPoll({ active: true, hidden: false })).toBe(true)
    expect(shouldPoll({ active: true, hidden: true })).toBe(false)
    expect(shouldPoll({ active: false, hidden: false })).toBe(false)
  })
})

describe('staleness', () => {
  it('starts loading, then fresh', () => {
    expect(freshnessView(INITIAL_FRESHNESS)).toEqual({ kind: 'loading' })
    const f = onPollSuccess(INITIAL_FRESHNESS, 1000, 'g1')
    expect(freshnessView(f)).toEqual({ kind: 'fresh', at: 1000 })
  })

  it('a failure marks stale since the first failed poll and keeps the last good time', () => {
    let f = onPollSuccess(INITIAL_FRESHNESS, 1000, 'g1')
    f = onPollFailure(f, 6000, 'API 502')
    f = onPollFailure(f, 16000, 'API 503')
    expect(f.failures).toBe(2)
    expect(freshnessView(f)).toEqual({ kind: 'stale', since: 6000, dataAt: 1000, error: 'API 503', retryInMs: 20000 })
  })

  it('a failure before any success is stale with no data time', () => {
    const v = freshnessView(onPollFailure(INITIAL_FRESHNESS, 5, 'down'))
    expect(v).toMatchObject({ kind: 'stale', since: 5, dataAt: null })
  })

  it('recovers on the next success and resets the backoff', () => {
    let f = onPollFailure(onPollFailure(onPollSuccess(INITIAL_FRESHNESS, 1, 'g1'), 2, 'x'), 3, 'y')
    f = onPollSuccess(f, 4, 'g1')
    expect(f).toMatchObject({ lastOkAt: 4, staleSince: null, failures: 0, lastError: null })
    expect(nextDelay(f.failures)).toBe(POLL_MS)
  })

  it('detects a gateway restart by generation change, across a failure gap', () => {
    let f = onPollSuccess(INITIAL_FRESHNESS, 1, 'g1')
    expect(f.restartedAt).toBeNull()
    f = onPollFailure(f, 2, 'connection refused')
    f = onPollSuccess(f, 3, 'g2')
    expect(f.restartedAt).toBe(3)
    expect(f.generation).toBe('g2')
    expect(restartedSince(f, 2)).toBe(true)
    expect(restartedSince(f, 4)).toBe(false)
    // same generation again: no new restart
    f = onPollSuccess(f, 9, 'g2')
    expect(f.restartedAt).toBe(3)
  })

  it('an empty generation neither counts as a restart nor forgets the known one', () => {
    let f = onPollSuccess(INITIAL_FRESHNESS, 1, 'g1')
    f = onPollSuccess(f, 2, '')
    expect(f.generation).toBe('g1')
    f = onPollSuccess(f, 3, 'g1')
    expect(f.restartedAt).toBeNull()
  })
})

describe('detailBackoff', () => {
  it('is 60 s after the first failure, doubling, capped at 5 min', () => {
    expect([0, 1, 2, 3, 4, 5, 50].map(detailBackoff)).toEqual([0, 60000, 120000, 240000, 300000, 300000, 300000])
    expect(DETAIL_MAX_BACKOFF_MS).toBe(300000)
    expect(detailBackoff(Number.NaN)).toBe(0)
  })
})

describe('resumeDelay (tab visible again)', () => {
  it('polls at once when healthy', () => {
    expect(resumeDelay(0, 0)).toBe(0)
  })
  it('waits out the rest of the current backoff instead of polling at once', () => {
    expect(resumeDelay(2, 5000)).toBe(15000)
    expect(resumeDelay(2, 25000)).toBe(0)
    expect(resumeDelay(10, 1000)).toBe(MAX_BACKOFF_MS - 1000)
  })
})

describe('withTimeout', () => {
  it('passes a result through and clears its timer', async () => {
    vi.useFakeTimers()
    try {
      await expect(withTimeout(Promise.resolve(7), 1000)).resolves.toBe(7)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects a get that never resolves, so the poll fails and releases inFlight', async () => {
    vi.useFakeTimers()
    try {
      const never = new Promise<never>(() => {})
      const get = vi.fn(() => never)
      let inFlight = true
      const poll = withTimeout(get()).finally(() => (inFlight = false))
      const outcome = poll.then(() => 'ok', (e: Error) => e.message)
      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - 1)
      expect(inFlight).toBe(true)
      await vi.advanceTimersByTimeAsync(1)
      await expect(outcome).resolves.toMatch(/timed out after 15 s/)
      expect(inFlight).toBe(false)
      // A timeout is a failure like any other: stale banner and backoff apply.
      const f = onPollFailure(onPollSuccess(INITIAL_FRESHNESS, 0, 'g'), 1, 'request timed out after 15 s')
      expect(freshnessView(f)).toMatchObject({ kind: 'stale', retryInMs: 10000 })
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects with the original error when the request fails first', async () => {
    await expect(withTimeout(Promise.reject(new Error('API 502')), 1000)).rejects.toThrow('API 502')
  })
})
