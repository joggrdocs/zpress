/**
 * Configuration types for zpress.
 *
 * Re-exports types from @zpress/theme and defines config-specific types.
 */

import type { ThemeConfig } from '@zpress/theme'

// Re-export theme types
export type { ThemeName, IconColor, ColorMode, ThemeColors, ThemeConfig } from '@zpress/theme'

/**
 * Result type for error handling without exceptions.
 *
 * Success: `[null, value]`
 * Failure: `[error, null]`
 */
export type Result<T, E = Error> = readonly [E, null] | readonly [null, T]

// ── Basic types ──────────────────────────────────────────────

type GlobPattern = string
type UrlPath = string
type FilePath = string

// ── Frontmatter ──────────────────────────────────────────────

export interface Frontmatter {
  readonly title?: string
  readonly titleTemplate?: string | boolean
  readonly description?: string
  readonly layout?: 'doc' | 'page' | 'home' | string
  readonly sidebar?: boolean
  readonly aside?: boolean | 'left'
  readonly outline?: false | number | readonly [number, number] | 'deep'
  readonly navbar?: boolean
  readonly editLink?: boolean
  readonly lastUpdated?: boolean
  readonly footer?: boolean
  readonly pageClass?: string
  readonly head?: readonly [string, Record<string, string>][]
  readonly [key: string]: unknown
}

// ── Nav ──────────────────────────────────────────────────────

export interface NavItem {
  readonly text: string
  readonly link?: UrlPath
  readonly items?: readonly NavItem[]
  readonly activeMatch?: string
}

// ── Card ─────────────────────────────────────────────────────

export interface CardConfig {
  readonly icon?: string
  readonly iconColor?: string
  readonly scope?: string
  readonly description?: string
  readonly tags?: string[]
  readonly badge?: { readonly src: string; readonly alt: string }
}

// ── Workspace ────────────────────────────────────────────────

export interface WorkspaceItem {
  readonly text: string
  readonly icon?: string
  readonly iconColor?: string
  readonly description: string
  readonly tags?: readonly string[]
  readonly badge?: { readonly src: string; readonly alt: string }
  readonly docsPrefix: string
  readonly from?: string
  readonly items?: readonly Entry[]
  readonly sort?: 'alpha' | 'filename' | ((a: ResolvedPage, b: ResolvedPage) => number)
  readonly textFrom?: 'filename' | 'heading' | 'frontmatter'
  readonly textTransform?: (text: string, slug: string) => string
  readonly recursive?: boolean
  readonly indexFile?: string
  readonly exclude?: readonly string[]
  readonly collapsible?: boolean
  readonly frontmatter?: Frontmatter
}

export interface WorkspaceGroup {
  readonly name: string
  readonly description: string
  readonly icon: string
  readonly items: readonly WorkspaceItem[]
  readonly link?: string
}

// ── Entry ────────────────────────────────────────────────────

export interface Entry {
  readonly text: string
  readonly link?: UrlPath
  readonly from?: FilePath | GlobPattern
  readonly prefix?: UrlPath
  readonly content?: string | (() => string | Promise<string>)
  readonly items?: readonly Entry[]
  readonly collapsible?: boolean
  readonly exclude?: readonly GlobPattern[]
  readonly hidden?: boolean
  readonly frontmatter?: Frontmatter
  readonly textFrom?: 'filename' | 'heading' | 'frontmatter'
  readonly textTransform?: (text: string, slug: string) => string
  readonly sort?: 'alpha' | 'filename' | ((a: ResolvedPage, b: ResolvedPage) => number)
  readonly recursive?: boolean
  readonly indexFile?: string
  readonly icon?: string
  readonly card?: CardConfig
  readonly isolated?: boolean
}

// ── Resolved types ───────────────────────────────────────────

export interface ResolvedPage {
  readonly text: string
  readonly link: UrlPath
  readonly source?: FilePath
  readonly frontmatter: Frontmatter
}

export interface ResolvedSection {
  readonly text: string
  readonly link?: UrlPath
  readonly collapsible?: boolean
  readonly items: readonly (ResolvedPage | ResolvedSection)[]
}

// ── OpenAPI ──────────────────────────────────────────────────

export interface OpenAPIConfig {
  readonly spec: FilePath
  readonly prefix: UrlPath
  readonly title?: string
}

// ── Feature ──────────────────────────────────────────────────

export interface Feature {
  readonly text: string
  readonly description: string
  readonly link?: string
  readonly icon?: string
}

// ── Main config ──────────────────────────────────────────────

export interface ZpressConfig {
  readonly title?: string
  readonly description?: string
  readonly theme?: ThemeConfig
  readonly icon?: string
  readonly tagline?: string
  readonly apps?: readonly WorkspaceItem[]
  readonly packages?: readonly WorkspaceItem[]
  readonly workspaces?: readonly WorkspaceGroup[]
  readonly features?: readonly Feature[]
  readonly sections: readonly Entry[]
  readonly nav?: 'auto' | readonly NavItem[]
  readonly exclude?: readonly GlobPattern[]
  readonly openapi?: OpenAPIConfig
}

// ── Paths ────────────────────────────────────────────────────

export interface Paths {
  readonly repoRoot: string
  readonly outputRoot: string
  readonly contentDir: string
  readonly publicDir: string
  readonly distDir: string
  readonly cacheDir: string
}
