import type { BuiltInThemeName } from '@zpress/config'

import { readCss } from './head/read.ts'

/**
 * Critical CSS injected inline in <head> to prevent FOUC.
 *
 * Contains only the :root fallback variables needed for initial paint.
 * Full theme CSS loads asynchronously from external stylesheet.
 *
 * These values must match the :root blocks in theme CSS files but are
 * duplicated here for inline injection during SSG build.
 */

const CRITICAL_CSS_MAP: Record<BuiltInThemeName, string> = {
  base: readCss('css/critical-base.css'),
  midnight: readCss('css/critical-midnight.css'),
  arcade: readCss('css/critical-arcade.css'),
}

const BACKDROP_CSS = readCss('css/loader-backdrop.css')
const DOTS_LOADER_CSS = readCss('css/loader-dots.css')

/**
 * Build the loader CSS (backdrop + dots animation).
 */
function getLoaderCss(): string {
  return BACKDROP_CSS + DOTS_LOADER_CSS
}

/**
 * Generate minified critical CSS for a given theme.
 *
 * Always includes the loading overlay CSS. For built-in themes, also includes
 * the theme-specific color variables for correct first paint. Custom themes
 * should provide their own :root fallback in their external CSS.
 */
export function getCriticalCss(themeName: string): string {
  const theme = themeName as BuiltInThemeName
  const themeColors = CRITICAL_CSS_MAP[theme]
  const loader = getLoaderCss()
  if (themeColors) {
    return themeColors + loader
  }
  return loader
}
