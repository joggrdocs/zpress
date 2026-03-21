/**
 * Resolved icon with id and color.
 */
export interface ResolvedCardIcon {
  readonly id: string
  readonly color: string
}

/**
 * Resolve a unified icon config into id + color.
 *
 * String icons get the default `'purple'` color. Object icons pass through.
 * Returns `undefined` for undefined input.
 *
 * @param icon - Icon config (string, object, or undefined)
 * @returns Resolved icon or undefined
 */
export function resolveCardIcon(
  icon: string | { readonly id: string; readonly color: string } | undefined
): ResolvedCardIcon | undefined {
  if (icon === undefined) {
    return undefined
  }
  if (typeof icon === 'string') {
    return { id: icon, color: 'purple' }
  }
  return icon
}
