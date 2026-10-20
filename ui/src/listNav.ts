/** Keyboard navigation for the note list (a listbox): pure index arithmetic. */
export function nextIndex(current: number, key: string, length: number): number | null {
  if (length <= 0) return null
  switch (key) {
    case 'ArrowDown':
      return current < 0 ? 0 : Math.min(current + 1, length - 1)
    case 'ArrowUp':
      return current < 0 ? length - 1 : Math.max(current - 1, 0)
    case 'Home':
      return 0
    case 'End':
      return length - 1
    case 'PageDown':
      return Math.min(Math.max(current, 0) + 10, length - 1)
    case 'PageUp':
      return Math.max(current - 10, 0)
    default:
      return null
  }
}
