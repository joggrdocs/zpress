import type { IconId } from './icons.generated.ts'

// ── IconColor ────────────────────────────────────────────────

/**
 * Available icon color variants matching the design system.
 *
 * Each color maps to `.home-card-icon--{color}` CSS classes.
 *
 * Palette order for auto-rotation:
 * 1. purple (default)
 * 2. blue
 * 3. green
 * 4. amber
 * 5. cyan
 * 6. red
 * 7. pink
 * 8. slate
 */
export type IconColor = 'purple' | 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'cyan' | 'pink'

/**
 * Rotating color palette applied to auto-generated icons.
 * Each section gets the next color in the cycle.
 *
 * This array defines the order in which colors are assigned to
 * auto-generated section cards and feature icons.
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
 * Accepts either:
 * - **String**: Iconify identifier (e.g. `"devicon:hono"`, `"pixelarticons:device-mobile"`)
 *   - Color defaults to purple (first in rotation)
 *   - Find icons at https://icon-sets.iconify.design/
 * - **Object**: `{ id: IconId, color: IconColor }`
 *   - Explicit color from 8-color palette
 *
 * Auto-generated section cards rotate through these colors:
 * purple → blue → green → amber → cyan → red → pink → slate
 *
 * @example
 * ```ts
 * icon: 'devicon:react'  // Uses purple (default)
 * icon: { id: 'devicon:nextjs', color: 'blue' }  // Explicit blue
 * ```
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
