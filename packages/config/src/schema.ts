/**
 * Zod schemas for zpress configuration validation.
 *
 * Note: Using 'zod/v3' import for compatibility with zod-to-json-schema@3.25.1
 * which requires Zod v3 schema objects even when Zod v4 is installed as peer dependency.
 * All schemas are redefined here using zod/v3 to avoid type incompatibilities.
 */

import { z } from 'zod/v3'

// ── Frontmatter schema ───────────────────────────────────────

const frontmatterSchema = z
  .object({
    title: z.string().optional(),
    titleTemplate: z.union([z.string(), z.boolean()]).optional(),
    description: z.string().optional(),
    layout: z.string().optional(),
    sidebar: z.boolean().optional(),
    aside: z.union([z.boolean(), z.literal('left')]).optional(),
    outline: z
      .union([z.literal(false), z.number(), z.tuple([z.number(), z.number()]), z.literal('deep')])
      .optional(),
    navbar: z.boolean().optional(),
    editLink: z.boolean().optional(),
    lastUpdated: z.boolean().optional(),
    footer: z.boolean().optional(),
    pageClass: z.string().optional(),
    head: z.array(z.tuple([z.string(), z.record(z.string(), z.string())])).optional(),
  })
  .passthrough() // Allow additional unknown fields

// ── Nav schema ───────────────────────────────────────────────

const navItemSchema: z.ZodType<unknown> = z.lazy(() =>
  z
    .object({
      text: z.string(),
      link: z.string().optional(),
      items: z.array(navItemSchema).optional(),
      activeMatch: z.string().optional(),
    })
    .strict()
)

// ── Title schema ─────────────────────────────────────────────

const titleConfigSchema = z.union([
  z.string(),
  z
    .object({
      from: z.enum(['auto', 'filename', 'heading', 'frontmatter']),
      transform: z.function().optional(),
    })
    .strict(),
])

// ── Discovery schema ─────────────────────────────────────────

const discoverySchema = z
  .object({
    from: z.string().optional(),
    title: titleConfigSchema.optional(),
    sort: z.union([z.enum(['alpha', 'filename']), z.function()]).optional(),
    exclude: z.array(z.string()).optional(),
    frontmatter: frontmatterSchema.optional(),
    recursive: z.boolean().optional(),
    indexFile: z.string().optional(),
  })
  .strict()

// ── Card schema ──────────────────────────────────────────────

const cardConfigSchema = z
  .object({
    icon: z.string().optional(),
    iconColor: z.string().optional(),
    scope: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    badge: z.object({ src: z.string(), alt: z.string() }).strict().optional(),
  })
  .strict()

// ── Entry schema ─────────────────────────────────────────────

const entrySchema: z.ZodType<unknown> = z.lazy(() =>
  z
    .object({
      title: titleConfigSchema,
      link: z.string().optional(),
      from: z.string().optional(),
      prefix: z.string().optional(),
      content: z.union([z.string(), z.function()]).optional(),
      items: z.array(entrySchema).optional(),
      landing: z.union([z.enum(['auto', 'cards', 'overview']), z.literal(false)]).optional(),
      collapsible: z.boolean().optional(),
      exclude: z.array(z.string()).optional(),
      hidden: z.boolean().optional(),
      frontmatter: frontmatterSchema.optional(),
      sort: z.union([z.enum(['alpha', 'filename']), z.function()]).optional(),
      recursive: z.boolean().optional(),
      indexFile: z.string().optional(),
      icon: z.string().optional(),
      iconColor: z.string().optional(),
      card: cardConfigSchema.optional(),
      isolated: z.boolean().optional(),
      // Deprecated fields for backward compatibility
      titleFrom: z.enum(['filename', 'heading', 'frontmatter', 'auto']).optional(),
      titleTransform: z.function().optional(),
    })
    .strict()
)

// ── Workspace schemas ────────────────────────────────────────

const workspaceItemSchema = z
  .object({
    title: titleConfigSchema,
    icon: z.string().optional(),
    iconColor: z.string().optional(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    badge: z.object({ src: z.string(), alt: z.string() }).strict().optional(),
    prefix: z.string(),
    discovery: discoverySchema.optional(),
    items: z.array(entrySchema).optional(),
  })
  .strict()

const workspaceGroupSchema = z
  .object({
    title: titleConfigSchema,
    description: z.string(),
    icon: z.string(),
    items: z.array(workspaceItemSchema).min(1),
    link: z.string().optional(),
  })
  .strict()

// ── Feature schema ───────────────────────────────────────────

const featureSchema = z
  .object({
    title: titleConfigSchema,
    description: z.string(),
    link: z.string().optional(),
    icon: z.string().optional(),
  })
  .strict()

// ── Theme schema ─────────────────────────────────────────────

const themeColorsSchema = z
  .object({
    brand: z.string().optional(),
    brandLight: z.string().optional(),
    brandDark: z.string().optional(),
    brandSoft: z.string().optional(),
    bg: z.string().optional(),
    bgAlt: z.string().optional(),
    bgElv: z.string().optional(),
    bgSoft: z.string().optional(),
    text1: z.string().optional(),
    text2: z.string().optional(),
    text3: z.string().optional(),
    divider: z.string().optional(),
    border: z.string().optional(),
    homeBg: z.string().optional(),
  })
  .strict()

const themeConfigSchema = z
  .object({
    name: z.string().default('base'),
    colorMode: z.enum(['dark', 'light', 'toggle']).optional(),
    switcher: z.boolean().optional(),
    colors: themeColorsSchema.optional(),
    darkColors: themeColorsSchema.optional(),
  })
  .strict()

// ── Sidebar schema ──────────────────────────────────────────

const sidebarLinkSchema = z
  .object({
    text: z.string(),
    link: z.string(),
    icon: z.union([z.string(), z.object({ id: z.string(), color: z.string() }).strict()]).optional(),
  })
  .strict()

const sidebarConfigSchema = z
  .object({
    above: z.array(sidebarLinkSchema).optional(),
    below: z.array(sidebarLinkSchema).optional(),
  })
  .strict()

// ── Hero action schema ──────────────────────────────────────

const heroActionSchema = z
  .object({
    theme: z.enum(['brand', 'alt']),
    text: z.string(),
    link: z.string(),
  })
  .strict()

// ── Main config schema ───────────────────────────────────────

export const zpressConfigSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    theme: themeConfigSchema.optional(),
    icon: z.string().optional(),
    tagline: z.string().optional(),
    apps: z.array(workspaceItemSchema).optional(),
    packages: z.array(workspaceItemSchema).optional(),
    workspaces: z.array(workspaceGroupSchema).optional(),
    features: z.array(featureSchema).optional(),
    actions: z.array(heroActionSchema).optional(),
    sidebar: sidebarConfigSchema.optional(),
    sections: z.array(entrySchema).min(1, 'config.sections must have at least one entry'),
    nav: z.union([z.literal('auto'), z.array(navItemSchema)]).optional(),
    exclude: z.array(z.string()).optional(),
  })
  .strict()

// ── Paths schema ─────────────────────────────────────────────

export const pathsSchema = z
  .object({
    repoRoot: z.string(),
    outputRoot: z.string(),
    contentDir: z.string(),
    publicDir: z.string(),
    distDir: z.string(),
    cacheDir: z.string(),
  })
  .strict()
