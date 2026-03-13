/**
 * Zod schemas for zpress configuration validation.
 */

import { themeConfigSchema } from '@zpress/theme'
import { z } from 'zod'

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
      .union([z.literal(false), z.number(), z.array(z.number()).min(2).max(2), z.literal('deep')])
      .optional(),
    navbar: z.boolean().optional(),
    editLink: z.boolean().optional(),
    lastUpdated: z.boolean().optional(),
    footer: z.boolean().optional(),
    pageClass: z.string().optional(),
    head: z
      .array(
        z
          .array(z.union([z.string(), z.record(z.string(), z.string())]))
          .min(2)
          .max(2)
      )
      .optional(),
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

// ── OpenAPI schema ───────────────────────────────────────────

const openapiConfigSchema = z
  .object({
    spec: z.string(),
    prefix: z.string(),
    title: z.string().optional(),
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
    sections: z.array(entrySchema).min(1, 'config.sections must have at least one entry'),
    nav: z.union([z.literal('auto'), z.array(navItemSchema)]).optional(),
    exclude: z.array(z.string()).optional(),
    openapi: openapiConfigSchema.optional(),
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
