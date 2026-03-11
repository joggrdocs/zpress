// Types
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
} from './types.ts'

// Config
export { defineConfig } from './define-config.ts'
export { loadConfig } from './config.ts'

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
