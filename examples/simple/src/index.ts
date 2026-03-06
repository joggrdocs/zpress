/**
 * Clamp a number between a minimum and maximum value.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Create a debounced version of a function.
 */
export function debounce<T extends (...args: readonly unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  const state: { timer: ReturnType<typeof setTimeout> | undefined } = { timer: undefined }
  return (...args: Parameters<T>) => {
    clearTimeout(state.timer)
    state.timer = setTimeout(() => fn(...args), ms)
  }
}

/**
 * Group an array of items by a key derived from each item.
 */
export function groupBy<T>(
  items: readonly T[],
  keyFn: (item: T) => string
): Record<string, readonly T[]> {
  const keys = [...new Set(items.map(keyFn))]
  return Object.fromEntries(keys.map((key) => [key, items.filter((item) => keyFn(item) === key)]))
}
