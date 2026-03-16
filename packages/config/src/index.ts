/**
 * @zpress/config — Configuration loading and validation for zpress
 *
 * This package provides config types, schemas, loading, and validation
 * for zpress configuration files.
 */

// Types
export type {
  ZpressConfig,
  ThemeName,
  IconColor,
  IconId,
  IconConfig,
  ColorMode,
  ThemeColors,
  ThemeConfig,
  Frontmatter,
  NavItem,
  CardConfig,
  Section,
  Workspace,
  WorkspaceCategory,
  TitleConfig,
  Discovery,
  RecursiveDiscoveryConfig,
  FlatDiscoveryConfig,
  SeoConfig,
  HeroAction,
  SidebarConfig,
  SidebarLink,
  ResolvedPage,
  ResolvedSection,
  Feature,
  OpenAPIConfig,
  Result,
} from './types.ts'

// Config helpers
export { defineConfig } from './define-config.ts'
export { loadConfig } from './loader.ts'
export type { LoadConfigOptions } from './loader.ts'

// Validation
export { validateConfig } from './validator.ts'

// Schemas
export { zpressConfigSchema, pathsSchema } from './schema.ts'

// Errors
export { configError, configErrorFromZod } from './errors.ts'
export type { ConfigError, ConfigErrorType, ConfigResult } from './errors.ts'

// Re-export theme utilities
export {
  THEME_NAMES,
  COLOR_MODES,
  ICON_COLORS,
  resolveDefaultColorMode,
  isBuiltInTheme,
  isBuiltInIconColor,
} from '@zpress/theme'
export type { BuiltInThemeName, BuiltInIconColor } from '@zpress/theme'
