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
  // New base Entry type
  Entry,
  // Section (renamed from old Entry)
  Section,
  // New types
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
  // Backward compatibility aliases
  WorkspaceItem,
  WorkspaceGroup,
  ResolvedPage,
  ResolvedSection,
  Feature,
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
