/**
 * zpress — public API
 *
 * Re-exports everything from @zpress/core and @zpress/ui
 * for convenience. Users install `zpress` and import from here.
 */
export {
  // Config
  defineConfig,
  loadConfig,

  // Sync engine
  sync,
  resolveEntries,
  loadManifest,

  // Paths
  createPaths,

  // Utilities
  hasGlobChars,
} from '@zpress/core'

// Rspress integration
export { createRspressConfig, zpressPlugin } from '@zpress/ui'

export type {
  // Config types
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

  // Path types
  Paths,

  // Sync types
  SyncResult,
  SyncOptions,
  SyncContext,
  PageData,
  ResolvedEntry,
  SidebarItem,
  Manifest,
  ManifestEntry,
} from '@zpress/core'
