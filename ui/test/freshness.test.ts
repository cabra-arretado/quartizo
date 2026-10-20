import { describe, expect, it } from 'vitest'
import {
  freshnessView,
  INITIAL_FRESHNESS,
  MAX_BACKOFF_MS,
  nextDelay,
  onPollFailure,
  onPollSuccess,
  POLL_MS,
  restartedSince,
  shouldPoll,
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
