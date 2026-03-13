import type { IconConfig } from './icon.ts'
import type { ThemeConfig } from './theme.ts'

/**
 * zpress — unified information architecture config.
 *
 * The IA tree IS the config. Each node defines what it is, where its
 * content comes from, and where it sits in the sidebar — all in one place.
 * Source `.md` files are never edited.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@zpress/core'
 *
 * export default defineConfig({
 *   title: 'My Docs',
 *   sections: [
 *     {
 *       title: 'Introduction',
 *       items: [
 *         { title: 'Architecture', link: '/architecture', from: 'docs/architecture.md' },
 *         { title: 'Structure', link: '/structure', from: 'docs/structure.md' },
 *       ],
 *     },
 *     {
 *       title: 'Guides',
 *       prefix: '/guides',
 *       from: 'docs/guides/*.md',
 *     },
 *     {
 *       title: 'API Reference',
 *       items: [
 *         { title: 'Overview', link: '/api/overview', content: '# API\n...' },
 *         { title: 'Routes', link: '/api/routes', from: 'apps/api/docs/routes.md' },
 *       ],
 *     },
 *   ],
 * })
 * ```
 */

// ── Result type ─────────────────────────────────────────────

/**
 * Result type for error handling without exceptions.
 *
 * Success: `[null, value]`
 * Failure: `[error, null]`
 *
 * @example
 * ```ts
 * const [error, value] = loadConfig(path)
 * if (error) return [error, null]
 * ```
 */
export type Result<T, E = Error> = readonly [E, null] | readonly [null, T]

/**
 * Glob pattern (e.g. `"docs/guides/*.md"`)
 */
type GlobPattern = string

/**
 * URL path (e.g. `"/guides/add-api-route"`)
 */
type UrlPath = string

/**
 * Relative file path from repo root (e.g. `"docs/guides/add-api-route.md"`)
 */
type FilePath = string

// ── Frontmatter ──────────────────────────────────────────────

/**
 * Rspress frontmatter fields injectable at build time.
 */
export interface Frontmatter {
  readonly title?: string
  readonly titleTemplate?: string | boolean
  readonly description?: string
  // oxlint-disable-next-line ban-types -- `string & {}` preserves literal autocompletion
  readonly layout?: 'doc' | 'page' | 'home' | (string & {})
  readonly sidebar?: boolean
  readonly aside?: boolean | 'left'
  readonly outline?: false | number | [number, number] | 'deep'
  readonly navbar?: boolean
  readonly editLink?: boolean
  readonly lastUpdated?: boolean
  readonly footer?: boolean
  readonly pageClass?: string
  readonly head?: readonly [string, Record<string, string>][]
  /**
   * Arbitrary extra fields merged into frontmatter.
   */
  readonly [key: string]: unknown
}

// ── Nav ──────────────────────────────────────────────────────

export interface NavItem {
  readonly title: string
  readonly link?: UrlPath
  readonly items?: readonly NavItem[]
  readonly activeMatch?: string
}

// ── Card — display metadata for parent landing pages ─────────

/**
 * Controls how an entry appears as a card on its parent section's
 * auto-generated landing page.
 *
 * When present, the landing page uses workspace-style cards
 * (icon + scope + name + description + tags + optional badge).
 *
 * @example
 * ```ts
 * card: {
 *   icon: 'devicon:hono',
 *   scope: 'apps/',
 *   description: 'Hono REST API with RPC-typed routes',
 *   tags: ['Hono', 'REST', 'Serverless'],
 *   badge: { src: '/logos/vercel.svg', alt: 'Vercel' },
 * }
 * ```
 */
export interface CardConfig {
  /**
   * Icon configuration — Iconify identifier string or `{ id, color }` object.
   */
  icon?: IconConfig
  /**
   * Scope label shown above the name (e.g. `"apps/"`).
   */
  scope?: string
  /**
   * Short description shown on the card. Overrides auto-extracted description.
   */
  description?: string
  /**
   * Technology tags shown at the bottom of the card.
   */
  tags?: string[]
  /**
   * Deploy badge image shown in the card header.
   */
  badge?: { src: string; alt: string }
}

// ── Workspace — apps and packages metadata ───────────────────

/**
 * A workspace item representing an app or package in the monorepo.
 *
 * Used as the single source of truth for workspace metadata — home page cards,
 * landing page cards, and introduction bullets all derive from these arrays.
 *
 * @example
 * ```ts
 * {
 *   title: 'API',
 *   icon: 'devicon:hono',
 *   description: 'Hono REST API serving all client applications with RPC-typed routes',
 *   tags: ['hono', 'react', 'vercel'],
 *   badge: { src: '/logos/vercel.svg', alt: 'Vercel' },
 *   path: '/apps/api',
 * }
 * ```
 */
export interface WorkspaceItem {
  /**
   * Display name (e.g. "API", "Console", "AI").
   */
  readonly title: string
  /**
   * Icon configuration — Iconify identifier string or `{ id, color }` object.
   * Falls back to a default app or package icon when omitted.
   */
  readonly icon?: IconConfig
  /**
   * Short description for cards and bullet lists.
   */
  readonly description: string
  /**
   * Technology tags — kebab-case keys resolved by the UI TechTag component.
   * Each tag maps to an Iconify icon and display label.
   */
  readonly tags?: readonly string[]
  /**
   * Deploy badge image for the card header.
   */
  readonly badge?: { readonly src: string; readonly alt: string }
  /**
   * Docs path prefix (e.g. "/apps/api"). Matches section entries and derives card links.
   * Also used as the URL prefix for glob-discovered children.
   */
  readonly path: string

  // ── Entry-like fields for hierarchical documentation ──────

  /**
   * Content source — file path or glob, **relative to the workspace item's
   * base path** (derived from `path`).
   *
   * - `path: "/apps/api"` + `from: "docs/*.md"` → resolves to `apps/api/docs/*.md`
   * - **No wildcards** → single file (e.g. `"docs/overview.md"`)
   * - **With wildcards** → auto-discover children (e.g. `"docs/*.md"`)
   *
   * @default "docs/*.md"
   */
  readonly from?: string
  /**
   * Explicit child entries for this workspace item.
   * Can be combined with `from` — explicit children override glob-discovered pages.
   */
  readonly items?: readonly Entry[]
  /**
   * Sort order for auto-discovered children.
   * - `"alpha"` — alphabetical by derived title (default)
   * - `"filename"` — alphabetical by filename
   * - Custom comparator function
   */
  readonly sort?: Entry['sort']
  /**
   * How to derive `title` for auto-discovered children.
   * - `"filename"` — kebab-to-title from filename (default)
   * - `"heading"` — first `# heading` in the file
   * - `"frontmatter"` — `title` field from YAML frontmatter, falls back to heading
   */
  readonly titleFrom?: Entry['titleFrom']
  /**
   * Transform function applied to auto-derived title (from `titleFrom`).
   */
  readonly titleTransform?: Entry['titleTransform']
  /**
   * Enable recursive directory-based nesting for glob patterns.
   * Requires `from` with a recursive glob (e.g. `"apps/api/docs/**\/*.md"`).
   * @default false
   */
  readonly recursive?: boolean
  /**
   * Filename (without extension) used as the section header page in each directory.
   * Only meaningful when `recursive` is true.
   * @default "overview"
   */
  readonly indexFile?: string
  /**
   * Exclude globs, scoped to this item's `from` glob.
   */
  readonly exclude?: readonly string[]
  /**
   * Make this item's section collapsible in the sidebar.
   */
  readonly collapsible?: boolean
  /**
   * Frontmatter injected at build time for all pages under this workspace item.
   */
  readonly frontmatter?: Frontmatter
}

/**
 * A named group of workspace items for custom workspace categories.
 *
 * Lets users define arbitrary groups beyond the built-in `apps` and `packages`
 * (e.g. "Services", "Tools", "Integrations") that receive the same
 * card/landing-page treatment.
 *
 * @example
 * ```ts
 * {
 *   name: 'Integrations',
 *   description: 'Third-party service connectors',
 *   icon: 'pixelarticons:integration',
 *   items: [
 *     { title: 'Stripe', description: 'Payment processing', path: '/integrations/stripe' },
 *   ],
 * }
 * ```
 */
export interface WorkspaceGroup {
  readonly name: string
  readonly description: string
  readonly icon: IconConfig
  readonly items: readonly WorkspaceItem[]
  /**
   * URL prefix override for the group's landing page.
   * Defaults to `/${slugify(name)}` when omitted.
   */
  readonly link?: string
}

// ── Entry — the single building block ────────────────────────

/**
 * A single node in the information architecture.
 *
 * What you provide determines what it is:
 *
 * **Page — explicit file**
 * ```ts
 * { title: 'Architecture', link: '/architecture', from: 'docs/architecture.md' }
 * ```
 *
 * **Page — inline/generated content**
 * ```ts
 * { title: 'Overview', link: '/api/overview', content: '# API Overview\n...' }
 * ```
 *
 * **Section — explicit children**
 * ```ts
 * { title: 'Guides', items: [ ... ] }
 * ```
 *
 * **Section — auto-discovered from glob**
 * ```ts
 * { title: 'Guides', prefix: '/guides', from: 'docs/guides/*.md' }
 * ```
 *
 * **Section — mix of explicit + auto-discovered**
 * ```ts
 * {
 *   title: 'Guides',
 *   prefix: '/guides',
 *   from: 'docs/guides/*.md',
 *   items: [
 *     { title: 'Getting Started', link: '/guides/start', from: 'docs/intro.md' },
 *   ],
 * }
 * ```
 */
export interface Entry {
  /**
   * Display title in sidebar and nav.
   */
  readonly title: string

  /**
   * Output URL path.
   * - Pages: exact URL (e.g. `"/guides/add-api-route"`)
   * - Sections: optional — makes the section header clickable
   */
  readonly link?: UrlPath

  /**
   * Content source — file path or glob, relative to repo root.
   *
   * - **No wildcards** → single file (e.g. `"docs/architecture.md"`)
   * - **With wildcards** → auto-discover children (e.g. `"docs/guides/*.md"`)
   */
  readonly from?: FilePath | GlobPattern

  /**
   * URL prefix for auto-discovered children.
   * Used with glob `from` — each discovered file gets `prefix + "/" + slug`.
   *
   * @example
   * `prefix: "/guides"` + file `add-api-route.md` → `/guides/add-api-route`
   */
  readonly prefix?: UrlPath

  /**
   * Inline markdown or async content generator.
   * For virtual pages that have no source `.md` file.
   * Mutually exclusive with `from`.
   */
  readonly content?: string | (() => string | Promise<string>)

  /**
   * Child entries — pages and/or sub-sections.
   */
  readonly items?: readonly Entry[]

  /**
   * Make this section collapsible in the sidebar.
   * Sections at depth > 1 are collapsible by default.
   * Set to `false` to keep a deep section always-open.
   */
  readonly collapsible?: boolean

  /**
   * Exclude globs, scoped to this entry's `from` glob.
   */
  readonly exclude?: readonly GlobPattern[]

  /**
   * Hide from sidebar. Page is still built and routable.
   * Useful for pages that should exist but not clutter navigation.
   */
  readonly hidden?: boolean

  /**
   * Frontmatter injected at build time.
   * - On a page: applied to that page.
   * - On a section: applied to all pages within.
   */
  readonly frontmatter?: Frontmatter

  /**
   * How to derive `title` for auto-discovered children.
   * - `"filename"` — kebab-to-title from filename (default)
   * - `"heading"` — first `# heading` in the file
   * - `"frontmatter"` — `title` field from YAML frontmatter, falls back to heading
   */
  readonly titleFrom?: 'filename' | 'heading' | 'frontmatter'

  /**
   * Transform function applied to auto-derived title (from `titleFrom`).
   * Called after title derivation for glob-discovered and recursive children.
   * Does NOT apply to entries with explicit `title` (those are already user-controlled).
   *
   * @param title - The derived title (from heading or filename)
   * @param slug - The filename slug (without extension)
   * @returns Transformed title for sidebar display
   */
  readonly titleTransform?: (title: string, slug: string) => string

  /**
   * Sort order for auto-discovered children.
   * - `"alpha"` — alphabetical by derived title (default)
   * - `"filename"` — alphabetical by filename
   * - Custom comparator function
   */
  readonly sort?: 'alpha' | 'filename' | ((a: ResolvedPage, b: ResolvedPage) => number)

  /**
   * Enable recursive directory-based nesting for glob patterns.
   * When true, directory structure under the glob base drives sidebar nesting:
   * - The `indexFile` (default `"overview"`) in a directory becomes the section header page
   * - Other `.md` files become children
   * - Sub-directories become nested collapsible sections
   *
   * Requires `from` with a recursive glob (e.g. `"docs/**\/*.md"`) and `prefix`.
   * @default false
   */
  readonly recursive?: boolean

  /**
   * Filename (without extension) used as the section header page in each directory.
   * Only meaningful when `recursive` is true.
   * @default "overview"
   */
  readonly indexFile?: string

  /**
   * Icon configuration — Iconify identifier string or `{ id, color }` object.
   * Used on home page feature cards when auto-generated from sections.
   */
  readonly icon?: IconConfig

  /**
   * Card display metadata for the parent section's auto-generated landing page.
   *
   * When present on child entries, the parent's landing page uses
   * workspace-style cards instead of the default simple cards.
   */
  readonly card?: CardConfig

  /**
   * Isolate this section into its own Rspress sidebar namespace.
   *
   * When `true`, the section's children appear under a dedicated sidebar
   * keyed by `link` (e.g. `"/apps/"`) instead of the root `"/"` sidebar.
   * This mirrors how the OpenAPI reference already works.
   *
   * Requires `link` to be set.
   * @default false
   */
  readonly isolated?: boolean
}

// ── Resolved types (output of the sync engine) ──────────────

/**
 * A fully resolved page after the sync engine processes the config.
 */
export interface ResolvedPage {
  /**
   * Display title.
   */
  readonly title: string
  /**
   * Output URL path.
   */
  readonly link: UrlPath
  /**
   * Source file path (undefined for virtual pages).
   */
  readonly source?: FilePath
  /**
   * Merged frontmatter.
   */
  readonly frontmatter: Frontmatter
}

/**
 * A fully resolved section.
 */
export interface ResolvedSection {
  readonly title: string
  readonly link?: UrlPath
  readonly collapsible?: boolean
  readonly items: readonly (ResolvedPage | ResolvedSection)[]
}

// ── OpenAPI ──────────────────────────────────────────────────

/**
 * Configuration for OpenAPI spec integration.
 */
export interface OpenAPIConfig {
  /**
   * Path to openapi.json relative to repo root.
   */
  spec: FilePath
  /**
   * URL prefix for API operation pages (e.g., '/api').
   */
  prefix: UrlPath
  /**
   * Sidebar group title.
   * @default 'API Reference'
   */
  title?: string
}

// ── Feature — home page feature card ─────────────────────────

/**
 * Explicit feature card for the home page.
 *
 * When `features` is provided on the config, these replace the
 * auto-generated feature cards that are normally derived from
 * top-level sections.
 *
 * @example
 * ```ts
 * {
 *   title: 'Getting Started',
 *   description: 'Everything you need to set up and start building.',
 *   link: '/getting-started',
 *   icon: 'pixelarticons:speed-fast',
 * }
 * ```
 */
export interface Feature {
  /**
   * Display title for the feature card.
   */
  readonly title: string
  /**
   * Short description shown below the title.
   */
  readonly description: string
  /**
   * Link target when the card is clicked.
   */
  readonly link?: string
  /**
   * Icon configuration — Iconify identifier string or `{ id, color }` object.
   */
  readonly icon?: IconConfig
}

// ── Top-level config ─────────────────────────────────────────

export interface ZpressConfig {
  /**
   * Site title.
   */
  readonly title?: string

  /**
   * Site meta description. Used as the hero headline on the home page.
   */
  readonly description?: string

  /**
   * Theme configuration.
   * Controls the visual theme, color mode, and optional color overrides.
   */
  readonly theme?: ThemeConfig

  /**
   * Path to a custom favicon file served from `.zpress/public/`.
   * When omitted, defaults to the auto-generated `/icon.svg`.
   */
  readonly icon?: string

  /**
   * Hero tagline displayed below the headline on the home page.
   * When omitted, the tagline is not rendered.
   */
  readonly tagline?: string

  /**
   * Workspace apps — deployable services that make up the platform.
   * Single source of truth for app metadata used on the home page,
   * landing pages, and introduction page.
   */
  readonly apps?: readonly WorkspaceItem[]

  /**
   * Workspace packages — shared libraries consumed by apps.
   * Single source of truth for package metadata used on the home page,
   * landing pages, and introduction page.
   */
  readonly packages?: readonly WorkspaceItem[]

  /**
   * Custom workspace groups — arbitrary named groups of workspace items.
   * Each group receives the same card/landing-page treatment as apps and packages.
   * Rendered after apps and packages, in array order.
   */
  readonly workspaces?: readonly WorkspaceGroup[]

  /**
   * Explicit feature cards for the home page.
   *
   * When provided, these replace the auto-generated feature cards
   * that are normally derived from top-level sections.
   * When omitted, features are auto-generated from sections with icons.
   */
  readonly features?: readonly Feature[]

  /**
   * The information architecture.
   * Defines content sources, sidebar structure, and routing in a single tree.
   */
  readonly sections: readonly Entry[]

  /**
   * Top navigation bar.
   * - `"auto"` — one nav item per top-level section
   * - Array — explicit nav items
   * @default "auto"
   */
  readonly nav?: 'auto' | readonly NavItem[]

  /**
   * Globs to exclude globally across all sources.
   */
  readonly exclude?: readonly GlobPattern[]

  /**
   * OpenAPI spec integration for interactive API docs.
   */
  readonly openapi?: OpenAPIConfig
}
