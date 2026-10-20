import { describe, expect, it } from 'vitest'
import { nextIndex } from '../src/listNav'

describe('nextIndex', () => {
  it('moves within bounds', () => {
    expect(nextIndex(-1, 'ArrowDown', 3)).toBe(0)
    expect(nextIndex(0, 'ArrowDown', 3)).toBe(1)
    expect(nextIndex(2, 'ArrowDown', 3)).toBe(2)
    expect(nextIndex(-1, 'ArrowUp', 3)).toBe(2)
    expect(nextIndex(0, 'ArrowUp', 3)).toBe(0)
    expect(nextIndex(1, 'Home', 3)).toBe(0)
    expect(nextIndex(1, 'End', 3)).toBe(2)
    expect(nextIndex(0, 'PageDown', 25)).toBe(10)
    expect(nextIndex(24, 'PageDown', 25)).toBe(24)
    expect(nextIndex(5, 'PageUp', 25)).toBe(0)
  })

  it('ignores other keys and empty lists', () => {
    expect(nextIndex(0, 'a', 3)).toBeNull()
    expect(nextIndex(0, 'ArrowDown', 0)).toBeNull()
  })
})
