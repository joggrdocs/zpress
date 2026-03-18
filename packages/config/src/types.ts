import type { ThemeConfig, ThemeName, ColorMode, ThemeColors, IconColor } from '@zpress/theme'

export type { ThemeConfig, ThemeName, ColorMode, ThemeColors, IconColor } from '@zpress/theme'

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
 * File-system path (absolute or relative).
 */
type FilePath = string

/**
 * URL path segment (e.g. `"/api"`, `"/guides/auth"`).
 */
type UrlPath = string

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
 * Rspress frontmatter fields injectable at build time.
 *
 * Schema: `frontmatterSchema` in schema.ts validates this shape.
 * The index signature allows arbitrary extra fields (schema uses `.passthrough()`).
 */
export interface Frontmatter {
  readonly title?: string
  readonly titleTemplate?: string | boolean
  readonly description?: string
  readonly layout?: string
  readonly sidebar?: boolean
  readonly aside?: boolean | 'left'
  readonly outline?: false | number | [number, number] | 'deep'
  readonly navbar?: boolean
  readonly editLink?: boolean
  readonly lastUpdated?: boolean
  readonly footer?: boolean
  readonly pageClass?: string
  readonly head?: readonly [string, Record<string, string>][]
  readonly [key: string]: unknown
}

/**
 * Navigation item for the top nav bar.
 *
 * Schema: `navItemSchema` in schema.ts validates this shape.
 * The schema uses `z.ZodType<NavItem>` to enforce consistency.
 */
export interface NavItem {
  readonly title: string
  readonly link?: string
  readonly items?: readonly NavItem[]
  readonly activeMatch?: string
}

/**
 * Title configuration — static or derived from source files.
 *
 * Schema: `titleConfigSchema` in schema.ts validates this shape.
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

/**
 * Controls how an entry appears as a card on its parent section's
 * auto-generated landing page.
 *
 * Schema: `cardConfigSchema` in schema.ts validates this shape.
 * A compile-time guard in schema.ts ensures these stay in sync.
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
  readonly icon?: IconConfig
  readonly scope?: string
  readonly description?: string
  readonly tags?: readonly string[]
  readonly badge?: { readonly src: string; readonly alt: string }
}

/**
 * Content discovery configuration for auto-generating pages from files.
 *
 * Schema: `discoverySchema` in schema.ts validates this shape.
 */
export interface DiscoveryConfig {
  readonly from?: string
  readonly title?: TitleConfig
  readonly sort?: 'default' | 'alpha' | 'filename' | ((a: ResolvedPage, b: ResolvedPage) => number)
  readonly exclude?: readonly string[]
  readonly frontmatter?: Frontmatter
  readonly recursive?: boolean
  readonly indexFile?: string
}

/**
 * Recursive directory-based discovery configuration.
 * Type-enforces that `indexFile` only exists when `recursive: true`.
 */
export interface RecursiveDiscoveryConfig extends DiscoveryConfig {
  readonly recursive: true
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

/**
 * A single call-to-action button on the home page hero.
 *
 * Schema: `heroActionSchema` in schema.ts validates this shape.
 */
export interface HeroAction {
  readonly theme: 'brand' | 'alt'
  readonly text: string
  readonly link: string
}

/**
 * A persistent link rendered above or below the sidebar nav tree.
 *
 * Schema: `sidebarLinkSchema` in schema.ts validates this shape.
 */
export interface SidebarLink {
  readonly text: string
  readonly link: string
  readonly icon?: string | { readonly id: string; readonly color: string }
}

/**
 * Sidebar configuration.
 *
 * Schema: `sidebarConfigSchema` in schema.ts validates this shape.
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
  readonly above?: readonly SidebarLink[]
  readonly below?: readonly SidebarLink[]
}

/**
 * SEO meta tag configuration.
 * No schema — this is a type-only definition used for future extension.
 */
export interface SeoConfig {
  readonly title?: string
  readonly description?: string
  readonly image?: string
  readonly siteName?: string
  readonly locale?: string
  readonly twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
}

/**
 * A single node in the information architecture (sidebar/nav tree).
 *
 * Schema: `entrySchema` in schema.ts validates this shape.
 * The schema uses `z.ZodType<Section>` to enforce consistency.
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
 */
export interface Section {
  readonly title: TitleConfig
  readonly link?: string
  readonly from?: string
  readonly prefix?: string
  readonly content?: string | (() => string | Promise<string>)
  readonly items?: readonly Section[]
  readonly landing?: 'auto' | 'cards' | 'overview' | false
  readonly collapsible?: boolean
  readonly exclude?: readonly string[]
  readonly hidden?: boolean
  readonly frontmatter?: Frontmatter
  readonly sort?: 'default' | 'alpha' | 'filename' | ((a: ResolvedPage, b: ResolvedPage) => number)
  readonly recursive?: boolean
  readonly indexFile?: string
  readonly icon?: IconConfig
  readonly card?: CardConfig
  readonly isolated?: boolean
  /**
   * @deprecated Use `title: { from: 'auto' }` instead
   */
  readonly titleFrom?: 'filename' | 'heading' | 'frontmatter' | 'auto'
  /**
   * @deprecated Use `title: { from: 'auto', transform: ... }` instead
   */
  readonly titleTransform?: (title: string, slug: string) => string
}

/**
 * Workspace item representing an app or package in the monorepo.
 *
 * Schema: `workspaceItemSchema` in schema.ts validates this shape.
 *
 * @example
 * ```ts
 * {
 *   title: 'API',
 *   icon: 'devicon:hono',
 *   description: 'Hono REST API serving all client applications',
 *   tags: ['hono', 'react', 'vercel'],
 *   prefix: '/apps/api',
 *   discovery: { from: 'docs/*.md', title: { from: 'auto' } },
 * }
 * ```
 */
export interface Workspace {
  readonly title: TitleConfig
  readonly icon?: IconConfig
  readonly description: string
  readonly tags?: readonly string[]
  readonly badge?: { readonly src: string; readonly alt: string }
  readonly prefix: string
  readonly discovery?: Discovery
  readonly items?: readonly Section[]
  readonly openapi?: OpenAPIConfig
}

/**
 * Custom workspace category grouping apps/packages.
 *
 * Schema: `workspaceGroupSchema` in schema.ts validates this shape.
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
export interface WorkspaceCategory {
  readonly title: TitleConfig
  readonly description: string
  readonly icon: string
  readonly items: readonly Workspace[]
  readonly link?: string
}

/**
 * A fully resolved page after the sync engine processes the config.
 */
export interface ResolvedPage {
  readonly title: string
  readonly link: string
  readonly source?: string
  readonly frontmatter: Frontmatter
}

/**
 * A fully resolved section.
 */
export interface ResolvedSection {
  readonly title: string
  readonly link?: string
  readonly collapsible?: boolean
  readonly items: readonly (ResolvedPage | ResolvedSection)[]
}

/**
 * Configuration for OpenAPI spec integration.
 */
export interface OpenAPIConfig {
  /**
   * Path to openapi.json relative to repo root.
   */
  readonly spec: FilePath
  /**
   * URL prefix for API operation pages (e.g., '/api').
   */
  readonly prefix: UrlPath
  /**
   * Sidebar group title.
   * @default 'API Reference'
   */
  readonly title?: string
  /**
   * How operations appear in the sidebar.
   *
   * - `'method-path'` — shows `GET /users` with method badge and path in code font
   * - `'title'` — shows the operation summary (e.g., "List Users")
   *
   * @default 'method-path'
   */
  readonly sidebarLayout?: 'method-path' | 'title'
}

/**
 * Explicit feature card for the home page.
 *
 * Schema: `featureSchema` in schema.ts validates this shape.
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
  readonly title: TitleConfig
  readonly description: string
  readonly link?: string
  readonly icon?: string
}

/**
 * zpress configuration.
 *
 * Schema: `zpressConfigSchema` in schema.ts validates this shape.
 * The information architecture tree IS the config — each node defines
 * what it is, where its content comes from, and where it sits in the sidebar.
 */
export interface ZpressConfig {
  readonly title?: string
  readonly description?: string
  readonly theme?: ThemeConfig
  readonly icon?: string
  readonly tagline?: string
  readonly actions?: readonly HeroAction[]
  readonly seo?: SeoConfig
  readonly apps?: readonly Workspace[]
  readonly packages?: readonly Workspace[]
  readonly workspaces?: readonly WorkspaceCategory[]
  readonly features?: readonly Feature[]
  readonly sidebar?: SidebarConfig
  readonly sections: readonly Section[]
  readonly nav?: 'auto' | readonly NavItem[]
  readonly exclude?: readonly string[]
  readonly openapi?: OpenAPIConfig
}
