import type { BuiltInThemeName } from '@zpress/config'

import { readCss } from './head/read.ts'

/**
 * Theme CSS injected inline in <head> to prevent FOUC.
 *
 * Contains the :root fallback variables needed for initial paint
 * and the loading overlay styles.
 */

const THEME_CSS_MAP: Record<BuiltInThemeName, string> = {
  base: readCss('css/themes/base.css'),
  midnight: readCss('css/themes/midnight.css'),
  arcade: readCss('css/themes/arcade.css'),
}

const BACKDROP_CSS = readCss('css/loader-backdrop.css')
const DOTS_LOADER_CSS = readCss('css/loader-dots.css')
const LOADER_CSS = BACKDROP_CSS + DOTS_LOADER_CSS

/**
 * Generate inline CSS for a given theme.
 *
 * Always includes the loading overlay CSS. For built-in themes, also includes
 * the theme-specific color variables for correct first paint. Custom themes
 * should provide their own :root fallback in their external CSS.
 */
export function getThemeCss(themeName: string): string {
  const theme = themeName as BuiltInThemeName
  const themeColors = THEME_CSS_MAP[theme]
  if (themeColors) {
    return themeColors + LOADER_CSS
  }
  return LOADER_CSS
}
