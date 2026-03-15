/**
 * @zpress/theme — Theme types and definitions for zpress
 *
 * This package provides theme-related types, built-in theme definitions,
 * and Zod schemas for theme configuration validation.
 */

// Types
export type {
  ThemeName,
  BuiltInThemeName,
  IconColor,
  BuiltInIconColor,
  ColorMode,
  ThemeColors,
  ThemeConfig,
} from './types.ts'

// Definitions and utilities
export {
  THEME_NAMES,
  COLOR_MODES,
  ICON_COLORS,
  resolveDefaultColorMode,
  resolveThemeDarkOnly,
  isBuiltInTheme,
  isBuiltInIconColor,
} from './definitions.ts'

// Zod schemas
export { colorModeSchema, themeColorsSchema, themeConfigSchema } from './schema.ts'
