// Types
export type {
  ZpressConfig,
  Section,
  Feature,
  Workspace,
  WorkspaceCategory,
  Frontmatter,
  NavItem,
  CardConfig,
  ResolvedPage,
  ResolvedSection,
  Result,
  TitleConfig,
  Discovery,
  RecursiveDiscoveryConfig,
  FlatDiscoveryConfig,
  SeoConfig,
  HeroAction,
  SidebarConfig,
  SidebarLink,
} from './types.ts'

// Icon system
export type { IconConfig, IconColor, ResolvedIcon } from './icon.ts'
export { resolveIcon, resolveOptionalIcon, ICON_COLORS } from './icon.ts'
export type { IconId, IconPrefix } from './icons.generated.ts'
export { ICON_PREFIXES } from './icons.generated.ts'

// Config
export { defineConfig, validateConfig } from './define-config.ts'
export { loadConfig } from './config.ts'

// Theme
export type { ThemeConfig, ThemeName, ColorMode, ThemeColors } from './theme.ts'
export { resolveDefaultColorMode, THEME_NAMES, COLOR_MODES } from './theme.ts'

// Sync engine
export { sync, type SyncResult, type SyncOptions } from './sync/index.ts'
export { resolveEntries } from './sync/resolve/index.ts'
export { loadManifest } from './sync/manifest.ts'
export type {
  SyncContext,
  PageData,
  ResolvedEntry,
  SidebarItem,
  Manifest,
  ManifestEntry,
} from './sync/types.ts'
export type { SyncError, SyncOutcome, ConfigError, ConfigResult } from './sync/errors.ts'
export { syncError, configError } from './sync/errors.ts'

// Banner / asset generation
export {
  generateAssets,
  generateBannerSvg,
  generateIconSvg,
  generateLogoSvg,
} from './banner/index.ts'
export type { AssetConfig, AssetError, AssetResult, GeneratedAsset } from './banner/index.ts'

// Paths
export { createPaths } from './paths.ts'
export type { Paths } from './paths.ts'

// Utilities
export { hasGlobChars } from './glob.ts'
