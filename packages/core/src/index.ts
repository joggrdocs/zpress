// Re-export types and utilities from @zpress/config
export type {
  ZpressConfig,
  Entry,
  Feature,
  WorkspaceItem,
  WorkspaceGroup,
  Frontmatter,
  NavItem,
  CardConfig,
  OpenAPIConfig,
  ResolvedPage,
  ResolvedSection,
  Result,
  ThemeConfig,
  ThemeName,
  ColorMode,
  ThemeColors,
  IconColor,
  Paths,
} from '@zpress/config'

export {
  defineConfig,
  loadConfig,
  validateConfig,
  resolveDefaultColorMode,
  configError,
  THEME_NAMES,
  COLOR_MODES,
  ICON_COLORS,
} from '@zpress/config'

export type { ConfigError, ConfigResult, ConfigErrorType, LoadConfigOptions } from '@zpress/config'

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
export type { SyncError, SyncOutcome } from './sync/errors.ts'
export { syncError } from './sync/errors.ts'

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

// Utilities
export { hasGlobChars } from './glob.ts'
