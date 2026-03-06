import type { CardConfig, ZpressConfig, Frontmatter } from '../types.ts'
import type { SourceMap } from './rewrite-links.ts'

/**
 * Context threaded through all sync operations.
 */
export interface SyncContext {
  /**
   * Absolute path to repo root.
   */
  readonly repoRoot: string
  /**
   * Absolute path to .content/ output directory.
   */
  readonly outDir: string
  /**
   * Resolved config.
   */
  readonly config: ZpressConfig
  /**
   * Previous manifest (for incremental sync).
   */
  readonly previousManifest: Manifest | null
  /**
   * Current manifest being built.
   *
   * @remarks Mutable during the sync pass — entries are added as pages are copied.
   * Will be refactored to an immutable accumulator pattern in a future pass.
   */
  manifest: Manifest
  /**
   * When true, suppress all log output during sync.
   */
  readonly quiet: boolean
  /**
   * Mapping from repo-relative source paths to content-relative output paths.
   * Used by the copy step to rewrite relative markdown links.
   */
  readonly sourceMap?: SourceMap
}

/**
 * Tracks output files for incremental sync and stale file cleanup.
 */
export interface Manifest {
  /**
   * Map of output relative path to entry metadata.
   *
   * @remarks Mutable — entries are accumulated during the sync pass as pages
   * are copied. The manifest is built incrementally and then persisted to disk.
   * Will be refactored to an immutable accumulator pattern alongside `SyncContext.manifest`.
   */
  files: Record<string, ManifestEntry>
  /**
   * Timestamp of last sync.
   */
  readonly timestamp: number
}

/**
 * Metadata for a single output file tracked in the manifest.
 */
export interface ManifestEntry {
  /**
   * Repo-relative path to source file (undefined for virtual pages).
   */
  readonly source?: string
  /**
   * Source file mtime in ms (for quick-check).
   */
  readonly sourceMtime?: number
  /**
   * SHA-256 hex of the written output.
   */
  readonly contentHash: string
  /**
   * Output path relative to .content/.
   */
  readonly outputPath: string
}

/**
 * Internal resolved node — produced by the resolver, consumed by copy + sidebar/nav generators.
 */
export interface ResolvedEntry {
  readonly text: string
  readonly link?: string
  readonly collapsible?: boolean
  readonly hidden?: boolean
  /**
   * @remarks Mutable — `injectLandingPages` may reassign items when
   * promoting an overview child to section page. Will be refactored
   * to immutable tree rebuild.
   */
  items?: readonly ResolvedEntry[]
  /**
   * Present on leaf pages (and section headers that are also pages).
   *
   * @remarks Mutable — `injectLandingPages` assigns virtual pages to sections
   * that have a link but no page. Will be refactored to immutable tree rebuild
   * when landing pages move to Vue components.
   */
  page?: PageData
  readonly card?: CardConfig
  /**
   * When true, this section gets its own sidebar namespace keyed by `link`.
   */
  readonly isolated?: boolean
}

/**
 * Data for a single page to be written to the output directory.
 */
export interface PageData {
  /**
   * Absolute path to source .md (undefined for virtual pages).
   */
  readonly source?: string
  /**
   * Inline content for virtual pages.
   */
  readonly content?: string | (() => string | Promise<string>)
  /**
   * Relative path inside .content/ (e.g. "guides/add-api-route.md").
   */
  readonly outputPath: string
  /**
   * Merged frontmatter to inject.
   */
  readonly frontmatter: Frontmatter
}

/**
 * Rspress sidebar item shape.
 *
 * Constructed immutably by sidebar generators, then serialized to JSON.
 */
export interface SidebarItem {
  readonly text: string
  readonly link?: string
  /**
   * Rspress `collapsed` — set by sidebar generator from `collapsible`.
   */
  readonly collapsed?: boolean
  readonly items?: readonly SidebarItem[]
  /**
   * Iconify identifier for sidebar icon rail. Only present on top-level sections.
   */
  readonly icon?: string
}
