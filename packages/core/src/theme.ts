/**
 * Theme types and default resolution.
 *
 * Defines the built-in theme palette system: theme names, color modes,
 * per-theme color overrides, and the top-level ThemeConfig shape.
 */

import { match } from 'ts-pattern'

// ── Theme name ──────────────────────────────────────────────

/**
 * Built-in theme identifiers.
 */
export type ThemeName = 'base' | 'midnight' | 'arcade'

/**
 * All valid theme names — used for validation.
 */
export const THEME_NAMES: readonly ThemeName[] = ['base', 'midnight', 'arcade'] as const

// ── Color mode ──────────────────────────────────────────────

/**
 * How dark/light mode is controlled.
 */
export type ColorMode = 'dark' | 'light' | 'toggle'

/**
 * All valid color modes — used for validation.
 */
export const COLOR_MODES: readonly ColorMode[] = ['dark', 'light', 'toggle'] as const

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
   * Built-in theme to use.
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

// ── Resolution ──────────────────────────────────────────────

/**
 * Resolve the default color mode for a given theme name.
 *
 * @param theme - Built-in theme identifier
 * @returns The theme's natural color mode
 */
export function resolveDefaultColorMode(theme: ThemeName): ColorMode {
  return match(theme)
    .with('base', () => 'toggle' as const)
    .with('midnight', () => 'dark' as const)
    .with('arcade', () => 'dark' as const)
    .exhaustive()
}
