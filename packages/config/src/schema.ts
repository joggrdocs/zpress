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
    outline: z.union([z.literal(false), z.number(), z.tuple([z.number(), z.number()]), z.literal('deep')]).optional(),
    navbar: z.boolean().optional(),
    editLink: z.boolean().optional(),
    lastUpdated: z.boolean().optional(),
    footer: z.boolean().optional(),
    pageClass: z.string().optional(),
    head: z.array(z.tuple([z.string(), z.record(z.string())])).optional(),
  })
  .passthrough() // Allow additional unknown fields

// ── Nav schema ───────────────────────────────────────────────

const navItemSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    text: z.string(),
    link: z.string().optional(),
    items: z.array(navItemSchema).optional(),
    activeMatch: z.string().optional(),
  }).strict()
)

// ── Card schema ──────────────────────────────────────────────

const cardConfigSchema = z.object({
  icon: z.string().optional(),
  iconColor: z.string().optional(),
  scope: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  badge: z.object({ src: z.string(), alt: z.string() }).strict().optional(),
}).strict()

// ── Entry schema ─────────────────────────────────────────────

const entrySchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    text: z.string(),
    link: z.string().optional(),
    from: z.string().optional(),
    prefix: z.string().optional(),
    content: z.union([z.string(), z.function()]).optional(),
    items: z.array(entrySchema).optional(),
    collapsible: z.boolean().optional(),
    exclude: z.array(z.string()).optional(),
    hidden: z.boolean().optional(),
    frontmatter: frontmatterSchema.optional(),
    textFrom: z.enum(['filename', 'heading', 'frontmatter']).optional(),
    textTransform: z.function().optional(),
    sort: z.union([z.enum(['alpha', 'filename']), z.function()]).optional(),
    recursive: z.boolean().optional(),
    indexFile: z.string().optional(),
    icon: z.string().optional(),
    card: cardConfigSchema.optional(),
    isolated: z.boolean().optional(),
  }).strict()
)

// ── Workspace schemas ────────────────────────────────────────

const workspaceItemSchema = z.object({
  text: z.string({ required_error: 'WorkspaceItem: "text" is required' }),
  icon: z.string().optional(),
  iconColor: z.string().optional(),
  description: z.string({ required_error: 'WorkspaceItem: "description" is required' }),
  tags: z.array(z.string()).optional(),
  badge: z.object({ src: z.string(), alt: z.string() }).strict().optional(),
  docsPrefix: z.string({ required_error: 'WorkspaceItem: "docsPrefix" is required' }),
  from: z.string().optional(),
  items: z.array(entrySchema).optional(),
  sort: z.union([z.enum(['alpha', 'filename']), z.function()]).optional(),
  textFrom: z.enum(['filename', 'heading', 'frontmatter']).optional(),
  textTransform: z.function().optional(),
  recursive: z.boolean().optional(),
  indexFile: z.string().optional(),
  exclude: z.array(z.string()).optional(),
  collapsible: z.boolean().optional(),
  frontmatter: frontmatterSchema.optional(),
}).strict()

const workspaceGroupSchema = z.object({
  name: z.string({ required_error: 'WorkspaceGroup: "name" is required' }),
  description: z.string({ required_error: 'WorkspaceGroup: "description" is required' }),
  icon: z.string({ required_error: 'WorkspaceGroup: "icon" is required' }),
  items: z.array(workspaceItemSchema).min(1, 'WorkspaceGroup: "items" must be a non-empty array'),
  link: z.string().optional(),
}).strict()

// ── Feature schema ───────────────────────────────────────────

const featureSchema = z.object({
  text: z.string({ required_error: 'Feature: "text" is required' }),
  description: z.string({ required_error: 'Feature: "description" is required' }),
  link: z.string().optional(),
  icon: z.string().optional(),
}).strict()

// ── OpenAPI schema ───────────────────────────────────────────

const openapiConfigSchema = z.object({
  spec: z.string(),
  prefix: z.string(),
  title: z.string().optional(),
}).strict()

// ── Main config schema ───────────────────────────────────────

export const zpressConfigSchema = z.object({
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
}).strict()

// ── Paths schema ─────────────────────────────────────────────

export const pathsSchema = z.object({
  repoRoot: z.string(),
  outputRoot: z.string(),
  contentDir: z.string(),
  publicDir: z.string(),
  distDir: z.string(),
  cacheDir: z.string(),
}).strict()
