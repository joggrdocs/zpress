/**
 * Theme types for zpress.
 *
 * Uses LiteralUnion to provide autocomplete for built-in themes
 * while allowing custom theme names.
 */

import type { LiteralUnion } from 'type-fest'

// ── Theme name ──────────────────────────────────────────────

/**
 * Theme name with autocomplete for built-in themes and support for custom themes.
 *
 * Built-in themes: 'base', 'midnight', 'arcade', 'arcade-fx'
 * Custom themes: any string value
 */
export type ThemeName = LiteralUnion<'base' | 'midnight' | 'arcade' | 'arcade-fx', string>

/**
 * Built-in theme names for validation and iteration.
 */
export type BuiltInThemeName = 'base' | 'midnight' | 'arcade' | 'arcade-fx'

// ── Icon color ──────────────────────────────────────────────

/**
 * Icon color with autocomplete for built-in colors and support for custom colors.
 *
 * Built-in colors: 'blue', 'purple', 'green', 'amber', 'cyan', 'red', 'pink', 'slate'
 * Custom colors: any string value
 */
export type IconColor = LiteralUnion<
  'blue' | 'purple' | 'green' | 'amber' | 'cyan' | 'red' | 'pink' | 'slate',
  string
>

/**
 * Built-in icon colors for validation and iteration.
 */
export type BuiltInIconColor = 'blue' | 'purple' | 'green' | 'amber' | 'cyan' | 'red' | 'pink' | 'slate'

// ── Color mode ──────────────────────────────────────────────

/**
 * How dark/light mode is controlled.
 */
export type ColorMode = 'dark' | 'light' | 'toggle'

// ── Theme colors ────────────────────────────────────────────

/**
 * Optional color overrides keyed to CSS custom properties.
 *
 * Each key maps to one or more `--zp-c-*` / `--rp-c-*` variables.
 * Values must be valid CSS color strings (hex or rgba).
 */
export interface ThemeColors {
  readonly brand?: string
  readonly brandLight?: string
  readonly brandDark?: string
  readonly brandSoft?: string
  readonly bg?: string
  readonly bgAlt?: string
  readonly bgElv?: string
  readonly bgSoft?: string
  readonly text1?: string
  readonly text2?: string
  readonly text3?: string
  readonly divider?: string
  readonly border?: string
  readonly homeBg?: string
}

// ── Theme config ────────────────────────────────────────────

/**
 * Top-level theme configuration for `zpress.config.ts`.
 */
export interface ThemeConfig {
  /**
   * Theme to use. Built-in themes get autocomplete, custom themes are also supported.
   * @default 'base'
   */
  readonly name?: ThemeName
  /**
   * Color mode behavior. Defaults to the theme's natural mode.
   */
  readonly colorMode?: ColorMode
  /**
   * Show the theme switcher dropdown in the nav bar.
   * @default false
   */
  readonly switcher?: boolean
  /**
   * Partial color overrides applied in light mode (or base mode).
   */
  readonly colors?: ThemeColors
  /**
   * Partial color overrides applied only in dark mode.
   */
  readonly darkColors?: ThemeColors
}
