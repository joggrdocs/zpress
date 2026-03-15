import type { ThemeConfig, ThemeName, ColorMode, ThemeColors, IconColor } from '@zpress/theme'

// Re-export theme types
export type { ThemeConfig, ThemeName, ColorMode, ThemeColors, IconColor } from '@zpress/theme'

// ── Icon types ───────────────────────────────────────────────

/**
 * Iconify icon identifier (e.g. `"devicon:hono"`, `"pixelarticons:device-mobile"`).
 * Find icons at https://icon-sets.iconify.design/
 */
export type IconId = string

/**
 * Unified icon configuration.
 *
 * Accepts either:
 * - **String**: Iconify identifier (e.g. `"devicon:hono"`, `"pixelarticons:device-mobile"`)
 *   - Color defaults to purple (first in rotation)
 *   - Find icons at https://icon-sets.iconify.design/
 * - **Object**: `{ id: IconId, color: IconColor }`
 *   - Explicit color from 8-color palette
 *
 * Auto-generated section cards rotate through these colors:
 * purple → blue → green → amber → cyan → red → pink → slate
 *
 * @example
 * ```ts
 * icon: 'devicon:react'  // Uses purple (default)
 * icon: { id: 'devicon:nextjs', color: 'blue' }  // Explicit blue
 * ```
 */
export type IconConfig = IconId | { readonly id: IconId; readonly color: IconColor }

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

// ── Base Entry — shared display metadata ────────────────────

/**
 * Base type for all config entries — shared display metadata.
 *
 * All types in the information architecture (Section, Workspace, WorkspaceCategory, Feature)
 * extend this base to inherit common display fields.
 */
export interface Entry {
  /**
   * Display title shown in UI (sidebar, nav, cards).
   * Can be a static string or a configuration for deriving from files.
   */
  readonly title: string | TitleConfig

  /**
   * Icon configuration — Iconify identifier string or `{ id, color }` object.
   *
   * Accepts either:
   * - **String**: Iconify identifier (e.g. `"devicon:hono"`, `"pixelarticons:device-mobile"`)
   *   - Color defaults to purple (first in rotation)
   *   - Find icons at https://icon-sets.iconify.design/
   * - **Object**: `{ id: IconId, color: IconColor }`
   *   - Explicit color from 8-color palette
   *
   * Auto-generated section cards rotate through these colors:
   * purple → blue → green → amber → cyan → red → pink → slate
   *
   * @example
   * ```ts
   * icon: 'devicon:react'  // Uses purple (default)
   * icon: { id: 'devicon:nextjs', color: 'blue' }  // Explicit blue
   * ```
   */
  readonly icon?: IconConfig

  /**
   * Short description for cards and summaries.
   */
  readonly description?: string
}

/**
 * Title configuration — static or derived from source files.
 *
 * **Static title**:
 * ```ts
 * title: "Getting Started"
 * ```
 *
 * **Derived title**:
 * ```ts
 * title: { from: 'auto', transform: (text, slug) => text.toUpperCase() }
 * ```
 */
export type TitleConfig =
  | string
  | {
      /**
       * Title derivation strategy for auto-discovered children.
       * - `"auto"` (default) — frontmatter > heading > filename fallback chain
       * - `"filename"` — kebab-to-title from filename only
       * - `"heading"` — first `# heading` in the file only
       * - `"frontmatter"` — `title` field from YAML frontmatter only
       */
      readonly from: 'auto' | 'filename' | 'heading' | 'frontmatter'
      /**
       * Transform function applied after derivation.
       * @param text - The derived title
       * @param slug - The filename slug (without extension)
       * @returns Transformed title for sidebar display
       */
      readonly transform?: (text: string, slug: string) => string
    }

// ── Discovery — content auto-discovery configuration ─────────

/**
 * Content discovery configuration for auto-generating pages from files.
 */
export interface DiscoveryConfig {
  /**
   * Content source — file path or glob pattern.
   * - **No wildcards** → single file (e.g. `"docs/overview.md"`)
   * - **With wildcards** → auto-discover children (e.g. `"docs/*.md"`)
   */
  readonly from?: string | GlobPattern

  /**
   * Title configuration for auto-discovered children.
   * @default { from: 'auto' }
   */
  readonly title?: TitleConfig

  /**
   * Sort order for auto-discovered children.
   * - `"alpha"` — alphabetical by derived title (default)
   * - `"filename"` — alphabetical by filename
   * - Custom comparator function
   */
  readonly sort?: 'alpha' | 'filename' | ((a: ResolvedPage, b: ResolvedPage) => number)

  /**
   * Exclude globs, scoped to this discovery's `from` glob.
   */
  readonly exclude?: readonly GlobPattern[]

  /**
   * Frontmatter injected at build time for all discovered pages.
   */
  readonly frontmatter?: Frontmatter
}

/**
 * Recursive directory-based discovery configuration.
 * Type-enforces that `indexFile` only exists when `recursive: true`.
 */
export interface RecursiveDiscoveryConfig extends DiscoveryConfig {
  readonly recursive: true
  /**
   * Filename (without extension) used as the section header page in each directory.
   * @default "overview"
   */
  readonly indexFile?: string
}

/**
 * Flat (non-recursive) discovery configuration.
 */
export interface FlatDiscoveryConfig extends DiscoveryConfig {
  readonly recursive?: false
}

/**
 * Unified discovery configuration with properly typed recursion dependency.
 */
export type Discovery = FlatDiscoveryConfig | RecursiveDiscoveryConfig

// ── SEO and Hero Configuration ───────────────────────────────

/**
 * SEO meta tag configuration.
 */
export interface SeoConfig {
  /**
   * Meta title (for `<title>` tag and og:title).
   * Falls back to site title or page title.
   */
  readonly title?: string

  /**
   * Meta description (for description and og:description).
   * Falls back to site description or auto-generated from content.
   */
  readonly description?: string

  /**
   * Open Graph image URL.
   * Falls back to `/og-image.png` (auto-generated from banner.svg).
   */
  readonly image?: string

  /**
   * OG site name. Defaults to site title.
   */
  readonly siteName?: string

  /**
   * OG locale (e.g. "en_US"). Defaults to "en_US".
   */
  readonly locale?: string

  /**
   * Twitter card type. Defaults to "summary_large_image".
   */
  readonly twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
}

/**
 * A single call-to-action button on the home page hero.
 */
export interface HeroAction {
  readonly theme: 'brand' | 'alt'
  readonly text: string
  readonly link: string
}

// ── Sidebar ─────────────────────────────────────────────────

/**
 * A persistent link rendered above or below the sidebar nav tree.
 */
export interface SidebarLink {
  readonly text: string
  readonly link: string
  readonly icon?: IconConfig
}

/**
 * Sidebar configuration.
 *
 * @example
 * ```ts
 * sidebar: {
 *   above: [
 *     { text: 'Home', link: '/', icon: 'pixelarticons:home' },
 *   ],
 *   below: [
 *     { text: 'GitHub', link: 'https://github.com/...', icon: 'pixelarticons:github' },
 *     { text: 'Discord', link: 'https://discord.gg/...', icon: 'pixelarticons:message' },
 *   ],
 * }
 * ```
 */
export interface SidebarConfig {
  /**
   * Links rendered above the nav tree.
   */
  readonly above?: readonly SidebarLink[]

  /**
   * Links rendered below the nav tree.
   */
  readonly below?: readonly SidebarLink[]
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
 * Workspace item representing an app or package in the monorepo.
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
 *   prefix: '/apps/api',
 *   discovery: {
 *     from: 'docs/*.md',
 *     title: { from: 'auto' },
 *   },
 * }
 * ```
 */
export interface Workspace extends Entry {
  /**
   * URL prefix for this workspace item's documentation (e.g. "/apps/api").
   */
  readonly prefix: string

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
   * Content discovery configuration for this workspace item's documentation.
   * The `from` field is **relative to the workspace base path** (derived from `prefix`).
   *
   * For example, `prefix: "/apps/api"` + `discovery.from: "docs/*.md"`
   * resolves to `apps/api/docs/*.md` (repo-root relative).
   *
   * @default { from: "docs/*.md", title: { from: 'auto' } }
   */
  readonly discovery?: Discovery

  /**
   * Explicit child sections. Can be combined with discovery — explicit children override glob-discovered pages.
   */
  readonly items?: readonly Section[]

  /**
   * Make this item's section collapsible in the sidebar.
   */
  readonly collapsible?: boolean
}

/**
 * Custom workspace category grouping apps/packages.
 *
 * Lets users define arbitrary groups beyond the built-in `apps` and `packages`
 * (e.g. "Services", "Tools", "Integrations") that receive the same
 * card/landing-page treatment.
 *
 * @example
 * ```ts
 * {
 *   title: 'Integrations',
 *   description: 'Third-party service connectors',
 *   icon: 'pixelarticons:integration',
 *   items: [
 *     { title: 'Stripe', description: 'Payment processing', prefix: '/integrations/stripe' },
 *   ],
 * }
 * ```
 */
export interface WorkspaceCategory extends Entry {
  /**
   * Workspace items in this category.
   */
  readonly items: readonly Workspace[]

  /**
   * URL prefix override for the category's landing page.
   * Defaults to `/${slugify(title)}` when omitted.
   */
  readonly link?: string
}

// ── Section — the single building block ──────────────────────

/**
 * A single node in the information architecture (sidebar/nav tree).
 *
 * Goes in `config.sections` array. Can be a page, section, or both.
 *
 * **Page — explicit file**:
 * ```ts
 * { title: 'Architecture', link: '/architecture', from: 'docs/architecture.md' }
 * ```
 *
 * **Page — inline/generated content**:
 * ```ts
 * { title: 'Overview', link: '/api/overview', content: '# API Overview\n...' }
 * ```
 *
 * **Section — explicit children**:
 * ```ts
 * { title: 'Guides', items: [ ... ] }
 * ```
 *
 * **Section — auto-discovered from glob**:
 * ```ts
 * { title: 'Guides', prefix: '/guides', from: 'docs/guides/*.md' }
 * ```
 *
 * **Section — mix of explicit + auto-discovered**:
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
export interface Section extends Entry {
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
  readonly items?: readonly Section[]

  /**
   * Landing page generation strategy for sections with children.
   *
   * - `"auto"` (default) — generate cards from children, or promote overview/index if found
   * - `"cards"` — always generate cards, never promote overview files
   * - `"overview"` — only use overview file if found, no auto-generation
   * - `false` — disable landing page (section header not clickable unless explicit `from`)
   *
   * Only applies to sections with `items`.
   * Requires `link` to be set.
   */
  readonly landing?: 'auto' | 'cards' | 'overview' | false

  /**
   * Make this section collapsible in the sidebar.
   *
   * - `true` — always collapsible
   * - `false` — never collapsible (keeps deep sections always-open)
   * - `undefined` (default) — auto-collapsible when depth > 1
   */
  readonly collapsible?: boolean

  /**
   * Exclude globs, scoped to this section's `from` glob.
   */
  readonly exclude?: readonly GlobPattern[]

  /**
   * Hide from sidebar. Page is still built and routable.
   * Useful for pages that should exist but not clutter navigation.
   */
  readonly hidden?: boolean

  /**
   * Isolate this section into its own Rspress sidebar namespace.
   *
   * When `true`, the section's children appear under a dedicated sidebar
   * keyed by `link` (e.g. `"/apps/"`) instead of the root `"/"` sidebar.
   * This mirrors how the OpenAPI reference already works.
   *
   * Note: Isolated sections are excluded from `nav: "auto"` generation.
   *
   * Requires `link` to be set.
   * @default false
   */
  readonly isolated?: boolean

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
   * - `"auto"` — frontmatter > heading > filename fallback chain
   *
   * @deprecated Use `title: { from: 'auto' }` instead
   */
  readonly titleFrom?: 'filename' | 'heading' | 'frontmatter' | 'auto'

  /**
   * Transform function applied to auto-derived title (from `titleFrom`).
   * Called after title derivation for glob-discovered and recursive children.
   * Does NOT apply to sections with explicit `title` string (those are already user-controlled).
   *
   * @param title - The derived title (from heading or filename)
   * @param slug - The filename slug (without extension)
   * @returns Transformed title for sidebar display
   *
   * @deprecated Use `title: { from: 'auto', transform: ... }` instead
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
   * Card display metadata for the parent section's auto-generated landing page.
   *
   * When present on child sections, the parent's landing page uses
   * workspace-style cards instead of the default simple cards.
   */
  readonly card?: CardConfig

  /**
   * SEO meta tag overrides for this page.
   * Merges with site-level SEO config.
   */
  readonly seo?: SeoConfig
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
export interface Feature extends Entry {
  /**
   * Link target when the card is clicked.
   */
  readonly link: string
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
   * Call-to-action buttons on the home page hero.
   * When omitted, a single "Get Started" button linking to the first section is generated.
   */
  readonly actions?: readonly HeroAction[]

  /**
   * SEO meta tag configuration for the entire site.
   * Individual sections can override with their own seo config.
   */
  readonly seo?: SeoConfig

  /**
   * Workspace apps — deployable services that make up the platform.
   * Single source of truth for app metadata used on the home page,
   * landing pages, and introduction page.
   */
  readonly apps?: readonly Workspace[]

  /**
   * Workspace packages — shared libraries consumed by apps.
   * Single source of truth for package metadata used on the home page,
   * landing pages, and introduction page.
   */
  readonly packages?: readonly Workspace[]

  /**
   * Custom workspace groups — arbitrary named groups of workspace items.
   * Each group receives the same card/landing-page treatment as apps and packages.
   * Rendered after apps and packages, in array order.
   */
  readonly workspaces?: readonly WorkspaceCategory[]

  /**
   * Explicit feature cards for the home page.
   *
   * When provided, these replace the auto-generated feature cards
   * that are normally derived from top-level sections.
   * When omitted, features are auto-generated from sections with icons.
   */
  readonly features?: readonly Feature[]

  /**
   * Sidebar configuration.
   * Add persistent links above or below the navigation tree.
   */
  readonly sidebar?: SidebarConfig

  /**
   * The information architecture.
   * Defines content sources, sidebar structure, and routing in a single tree.
   */
  readonly sections: readonly Section[]

  /**
   * Top navigation bar.
   * - `"auto"` (default) — one nav item per top-level non-isolated section
   * - Array — explicit nav items
   *
   * Note: Sections with `isolated: true` are excluded from auto nav generation.
   * @default "auto"
   */
  readonly nav?: 'auto' | readonly NavItem[]

  /**
   * Globs to exclude globally across all sources.
   */
  readonly exclude?: readonly GlobPattern[]

}

// ── Backward compatibility aliases ───────────────────────────

/**
 * @deprecated Use `Workspace` instead
 */
export type WorkspaceItem = Workspace

/**
 * @deprecated Use `WorkspaceCategory` instead
 */
export type WorkspaceGroup = WorkspaceCategory
