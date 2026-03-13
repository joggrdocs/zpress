import type { IconId } from './icons.generated.ts'

// ── IconColor ────────────────────────────────────────────────

/**
 * Available icon color variants matching the design system.
 * Maps to `.home-card-icon--{color}` CSS classes.
 */
export type IconColor = 'purple' | 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'cyan' | 'pink'

/**
 * Rotating color palette applied to auto-generated icons.
 * Each section gets the next color in the cycle.
 */
export const ICON_COLORS: readonly IconColor[] = [
  'purple',
  'blue',
  'green',
  'amber',
  'cyan',
  'red',
  'pink',
  'slate',
]

// ── IconConfig ───────────────────────────────────────────────

/**
 * Unified icon configuration.
 *
 * - String form: just an icon identifier (e.g. `"devicon:hono"`)
 * - Object form: icon identifier with explicit color (e.g. `{ id: "devicon:hono", color: "blue" }`)
 */
export type IconConfig = IconId | { readonly id: IconId; readonly color: IconColor }

// ── Resolved icon ────────────────────────────────────────────

/**
 * Normalized icon output — always has both `id` and `color`.
 */
export interface ResolvedIcon {
  readonly id: string
  readonly color: IconColor
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
export function resolveIcon(icon: IconConfig): ResolvedIcon {
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
export function resolveOptionalIcon(icon: IconConfig | undefined): ResolvedIcon | undefined {
  if (icon === undefined) {
    return undefined
  }
  return resolveIcon(icon)
}
