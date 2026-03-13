import type { IconConfig as ConfigIconConfig, IconColor as ConfigIconColor } from '@zpress/config'

// Re-export from @zpress/config to maintain backward compatibility
export type { IconConfig, IconColor } from '@zpress/config'

/**
 * Rotating color palette applied to auto-generated icons.
 * Each section gets the next color in the cycle.
 *
 * This array defines the order in which colors are assigned to
 * auto-generated section cards and feature icons.
 */
export const ICON_COLORS: readonly ConfigIconColor[] = [
  'purple',
  'blue',
  'green',
  'amber',
  'cyan',
  'red',
  'pink',
  'slate',
]

// ── Resolved icon ────────────────────────────────────────────

/**
 * Normalized icon output — always has both `id` and `color`.
 */
export interface ResolvedIcon {
  readonly id: string
  readonly color: ConfigIconColor
}

// ── Public API ───────────────────────────────────────────────

/**
 * Normalize an `IconConfig` value into a `ResolvedIcon`.
 *
 * - String → `{ id: string, color: "purple" }` (default color)
 * - Object → pass-through `{ id, color }`
 *
 * @param icon - Icon config value (string or object)
 * @returns Normalized `{ id, color }` pair
 */
export function resolveIcon(icon: ConfigIconConfig): ResolvedIcon {
  if (typeof icon === 'string') {
    return { id: icon, color: 'purple' }
  }
  return { id: icon.id, color: icon.color }
}

/**
 * Normalize an optional `IconConfig` value into a `ResolvedIcon | undefined`.
 *
 * Returns `undefined` when `icon` is `undefined`.
 *
 * @param icon - Optional icon config value
 * @returns Normalized `{ id, color }` pair, or `undefined`
 */
export function resolveOptionalIcon(icon: ConfigIconConfig | undefined): ResolvedIcon | undefined {
  if (icon === undefined) {
    return undefined
  }
  return resolveIcon(icon)
}
