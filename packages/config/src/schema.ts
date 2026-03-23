/**
 * Zod schemas for zpress configuration validation.
 *
 * Note: Using 'zod/v3' import for compatibility with zod-to-json-schema@3.25.1
 * which requires Zod v3 schema objects even when Zod v4 is installed as peer dependency.
 * All schemas are redefined here using zod/v3 to avoid type incompatibilities.
 *
 * Recursive schemas (navItemSchema, entrySchema) are annotated with z.ZodType<T>
 * to enforce compile-time consistency between schemas and their TypeScript types.
 * If a schema field is renamed or changed without updating the type (or vice versa),
 * TypeScript will error here.
 *
 * Function fields use z.custom<T> with typed signatures to avoid z.function()'s
 * lossy (...args: unknown[]) => unknown inference, preserving exact call signatures.
 */

import { z } from 'zod/v3'

import type {
  CardConfig,
  Frontmatter,
  HomeConfig,
  IconId,
  NavItem,
  ResolvedPage,
  Section,
} from './types.ts'

// z.function() infers to (...args: unknown[]) => unknown, which loses
// parameter and return types. z.custom<T> preserves exact signatures
// while still validating typeof === 'function' at runtime.

const titleTransformSchema = z.custom<(text: string, slug: string) => string>(isFunction)
const sortFnSchema = z.custom<(a: ResolvedPage, b: ResolvedPage) => number>(isFunction)
const contentFnSchema = z.custom<() => string | Promise<string>>(isFunction)

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

const navItemSchema: z.ZodType<NavItem> = z.lazy(() =>
  z
    .object({
      title: z.string(),
      link: z.string().optional(),
      items: z.array(navItemSchema).optional(),
      activeMatch: z.string().optional(),
    })
    .strict()
)

const titleConfigSchema = z.union([
  z.string(),
  z
    .object({
      from: z.enum(['auto', 'filename', 'heading', 'frontmatter']),
      transform: titleTransformSchema.optional(),
    })
    .strict(),
])

const includeSchema = z.union([z.string(), z.array(z.string())])

const iconIdSchema: z.ZodType<IconId> = z
  .string()
  .refine((v) => v.includes(':')) as z.ZodType<IconId>

const iconConfigSchema = z.union([
  iconIdSchema,
  z.object({ id: iconIdSchema, color: z.string() }).strict(),
])

const cardConfigSchema = z
  .object({
    icon: iconConfigSchema.optional(),
    scope: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    badge: z.object({ src: z.string(), alt: z.string() }).strict().optional(),
  })
  .strict()

const entrySchema: z.ZodType<Section> = z.lazy(() =>
  z
    .object({
      title: titleConfigSchema,
      description: z.string().optional(),
      path: z.string().optional(),
      include: includeSchema.optional(),
      content: z.union([z.string(), contentFnSchema]).optional(),
      items: z.array(entrySchema).optional(),
      landing: z.boolean().optional(),
      collapsible: z.boolean().optional(),
      exclude: z.array(z.string()).optional(),
      hidden: z.boolean().optional(),
      frontmatter: frontmatterSchema.optional(),
      sort: z.union([z.enum(['default', 'alpha', 'filename']), sortFnSchema]).optional(),
      recursive: z.boolean().optional(),
      entryFile: z.string().optional(),
      icon: iconConfigSchema.optional(),
      card: cardConfigSchema.optional(),
      standalone: z.boolean().optional(),
    })
    .strict()
)

const openapiConfigSchema = z
  .object({
    spec: z.string(),
    path: z.string(),
    title: z.string().optional(),
    sidebarLayout: z.enum(['method-path', 'title']).optional(),
  })
  .strict()

const workspaceItemSchema = z
  .object({
    title: titleConfigSchema,
    icon: iconConfigSchema.optional(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    badge: z.object({ src: z.string(), alt: z.string() }).strict().optional(),
    path: z.string(),
    include: includeSchema.optional(),
    items: z.array(entrySchema).optional(),
    sort: z.union([z.enum(['default', 'alpha', 'filename']), sortFnSchema]).optional(),
    exclude: z.array(z.string()).optional(),
    recursive: z.boolean().optional(),
    entryFile: z.string().optional(),
    frontmatter: frontmatterSchema.optional(),
    openapi: openapiConfigSchema.optional(),
  })
  .strict()

const workspaceGroupSchema = z
  .object({
    title: titleConfigSchema,
    description: z.string().optional(),
    icon: iconIdSchema,
    items: z.array(workspaceItemSchema).min(1),
    link: z.string().optional(),
  })
  .strict()

const featureSchema = z
  .object({
    title: titleConfigSchema,
    description: z.string(),
    link: z.string().optional(),
    icon: iconConfigSchema.optional(),
  })
  .strict()

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

const sidebarLinkSchema = z
  .object({
    text: z.string(),
    link: z.string(),
    icon: iconConfigSchema.optional(),
    style: z.enum(['brand', 'alt', 'ghost']).optional(),
    shape: z.enum(['square', 'rounded', 'circle']).optional(),
  })
  .strict()

const sidebarConfigSchema = z
  .object({
    above: z.array(sidebarLinkSchema).optional(),
    below: z.array(sidebarLinkSchema).optional(),
  })
  .strict()

const truncateConfigSchema = z
  .object({
    title: z.number().int().min(1).optional(),
    description: z.number().int().min(1).optional(),
  })
  .strict()

const homeGridConfigSchema = z
  .object({
    columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
    truncate: truncateConfigSchema.optional(),
  })
  .strict()

const homeConfigSchema = z
  .object({
    features: homeGridConfigSchema.optional(),
    workspaces: homeGridConfigSchema.optional(),
  })
  .strict()

const heroActionSchema = z
  .object({
    theme: z.enum(['brand', 'alt']),
    text: z.string(),
    link: z.string(),
  })
  .strict()

const socialLinkSchema = z
  .object({
    icon: z.union([
      z.enum([
        'lark',
        'discord',
        'facebook',
        'github',
        'instagram',
        'linkedin',
        'slack',
        'x',
        'youtube',
        'wechat',
        'qq',
        'juejin',
        'zhihu',
        'bilibili',
        'weibo',
        'gitlab',
        'X',
        'bluesky',
        'npm',
      ]),
      z.object({ svg: z.string() }).strict(),
    ]),
    mode: z.enum(['link', 'text', 'img', 'dom']),
    content: z.string(),
  })
  .strict()

const footerConfigSchema = z
  .object({
    message: z.string().optional(),
    copyright: z.string().optional(),
    socials: z.boolean().optional(),
  })
  .strict()

export const zpressConfigSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    theme: themeConfigSchema.optional(),
    icon: iconIdSchema.optional(),
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
    home: homeConfigSchema.optional(),
    socialLinks: z.array(socialLinkSchema).optional(),
    footer: footerConfigSchema.optional(),
    openapi: openapiConfigSchema.optional(),
  })
  .strict()

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

// These compile-time assertions ensure non-recursive schemas stay
// in sync with their TypeScript types. If a schema field is added,
// removed, or renamed without updating the type, TypeScript errors.
// Recursive schemas (navItemSchema, entrySchema) are already guarded
// via their z.ZodType<T> annotations above.

// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardFrontmatter: z.ZodType<Frontmatter> = frontmatterSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardCardConfig: z.ZodType<CardConfig> = cardConfigSchema
// oxlint-disable-next-line no-unused-vars -- compile-time type guard
const _guardHomeConfig: z.ZodType<HomeConfig> = homeConfigSchema

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Runtime check for function values. Used by z.custom<T> to validate
 * function-typed config fields while preserving their exact TypeScript signature.
 *
 * @private
 * @param val - Value to check
 * @returns True if the value is a function
 */
function isFunction(val: unknown): boolean {
  return typeof val === 'function'
}
