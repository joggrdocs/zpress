/**
 * Built-in theme definitions and utilities.
 */

import { match } from 'ts-pattern'

import type { BuiltInIconColor, BuiltInThemeName, ColorMode } from './types.ts'

/**
 * All built-in theme names — used for validation and iteration.
 */
export const THEME_NAMES: readonly BuiltInThemeName[] = ['base', 'midnight', 'arcade'] as const

/**
 * All valid color modes — used for validation.
 */
export const COLOR_MODES: readonly ColorMode[] = ['dark', 'light', 'toggle'] as const

/**
 * All built-in icon colors — used for validation and iteration.
 */
export const ICON_COLORS: readonly BuiltInIconColor[] = [
  'purple',
  'blue',
  'green',
  'amber',
  'cyan',
  'red',
  'pink',
  'slate',
] as const

/**
 * Resolve the default color mode for a given built-in theme.
 *
 * @param theme - Built-in theme identifier
 * @returns The theme's natural color mode
 */
export function resolveDefaultColorMode(theme: BuiltInThemeName): ColorMode {
  return match(theme)
    .with('base', () => 'toggle' as const)
    .with('midnight', () => 'dark' as const)
    .with('arcade', () => 'dark' as const)
    .exhaustive()
}

/**
 * Resolve the supported color modes for a given built-in theme.
 *
 * @param theme - Built-in theme identifier
 * @returns The color modes the theme supports
 */
export function resolveThemeModes(theme: BuiltInThemeName): readonly ('dark' | 'light')[] {
  return match(theme)
    .with('base', () => ['dark', 'light'] as const)
    .with('midnight', () => ['dark'] as const)
    .with('arcade', () => ['dark'] as const)
    .exhaustive()
}

/**
 * Check if a theme name is a built-in theme.
 *
 * @param name - Theme name to check
 * @returns True if the theme is built-in
 */
export function isBuiltInTheme(name: string): name is BuiltInThemeName {
  return THEME_NAMES.includes(name as BuiltInThemeName)
}

/**
 * Check if an icon color is a built-in color.
 *
 * @param color - Icon color to check
 * @returns True if the color is built-in
 */
export function isBuiltInIconColor(color: string): color is BuiltInIconColor {
  return ICON_COLORS.includes(color as BuiltInIconColor)
}
