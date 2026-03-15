/**
 * OpenAPI sync engine — reads specs, resolves refs, and generates MDX pages + sidebar.
 *
 * Reads an OpenAPI spec file (JSON or YAML), resolves all `$ref`s via
 * `@apidevtools/swagger-parser`, extracts operations from paths, groups
 * by tag, and generates one `.mdx` per operation plus an index overview page.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import SwaggerParser from '@apidevtools/swagger-parser'
import { match, P } from 'ts-pattern'

import type { OpenAPIConfig, Workspace, ZpressConfig } from '../types.ts'
import type { PageData, SidebarItem, SyncContext } from './types.ts'

// ── Public types ─────────────────────────────────────────────

/**
 * A sidebar entry keyed by its prefix path.
 */
export interface OpenAPISidebarEntry {
  readonly prefix: string
  readonly sidebar: readonly SidebarItem[]
}

/**
 * Aggregate result from syncing all OpenAPI configs.
 */
export interface SyncOpenAPIResult {
  readonly sidebar: readonly OpenAPISidebarEntry[]
  readonly pages: readonly PageData[]
}

// ── Internal types ───────────────────────────────────────────

interface OperationInfo {
  readonly method: string
  readonly path: string
  readonly operationId: string
  readonly summary: string
  readonly tags: readonly string[]
}

interface TagGroup {
  readonly tag: string
  readonly operations: readonly OperationInfo[]
}

// ── Main entry point ─────────────────────────────────────────

/**
 * Sync all OpenAPI configs from both root config and workspace items.
 *
 * Collects configs from `config.openapi` and all workspace items' `.openapi`,
 * processes each spec, and returns aggregated sidebar entries and pages.
 *
 * @param ctx - Sync context with config and paths
 * @returns Aggregated sidebar entries and generated pages
 */
export async function syncAllOpenAPI(ctx: SyncContext): Promise<SyncOpenAPIResult> {
  const rootConfigs = collectRootConfigs(ctx.config)
  const workspaceConfigs = collectWorkspaceConfigs(ctx.config)
  const allConfigs = [...rootConfigs, ...workspaceConfigs]

  if (allConfigs.length === 0) {
    return { sidebar: [], pages: [] }
  }

  const results = await allConfigs.reduce<Promise<SyncOpenAPIResult>>(
    async (accPromise, entry) => {
      const acc = await accPromise
      const result = await syncOpenAPI(entry.config, ctx)
      return {
        sidebar: [...acc.sidebar, { prefix: entry.config.prefix, sidebar: result.sidebar }],
        pages: [...acc.pages, ...result.pages],
      }
    },
    Promise.resolve({ sidebar: [], pages: [] })
  )

  return results
}

// ── Per-spec sync ────────────────────────────────────────────

interface SingleSyncResult {
  readonly sidebar: readonly SidebarItem[]
  readonly pages: readonly PageData[]
}

/**
 * Sync a single OpenAPI spec — parse, extract operations, generate pages + sidebar.
 *
 * @param config - OpenAPI config with spec path and prefix
 * @param ctx - Sync context
 * @returns Sidebar items and generated page data
 */
async function syncOpenAPI(config: OpenAPIConfig, ctx: SyncContext): Promise<SingleSyncResult> {
  const specAbsPath = path.resolve(ctx.repoRoot, config.spec)
  const specExists = await fs.stat(specAbsPath).catch(() => null)

  if (specExists === null) {
    return { sidebar: [], pages: [] }
  }

  const api = await SwaggerParser.dereference(specAbsPath)
  const paths = (api as Record<string, unknown>).paths as
    | Record<string, Record<string, unknown>>
    | undefined

  if (paths === null || paths === undefined) {
    return { sidebar: [], pages: [] }
  }

  const operations = extractOperations(paths)
  const tagGroups = groupByTag(operations)
  const title = resolveTitle(config)
  const { prefix } = config

  // Write the fully dereferenced spec JSON into the content directory
  // so generated MDX pages can import it with a relative path.
  const specOutputPath = `${stripLeadingSlash(prefix)}/openapi.json`
  const specPage: PageData = {
    content: JSON.stringify(api, null, 2),
    outputPath: specOutputPath,
    frontmatter: {},
  }

  const operationPages = tagGroups.flatMap((group) =>
    group.operations.map((op) => buildOperationPage(op, prefix))
  )

  const indexPage = buildIndexPage(title, prefix)
  const pages = [specPage, indexPage, ...operationPages]

  const sidebarStyle = match(config.sidebarStyle)
    .with('title', () => 'title' as const)
    .otherwise(() => 'method-path' as const)
  const sidebarItems = buildSidebarItems(title, prefix, tagGroups, sidebarStyle)

  return { sidebar: sidebarItems, pages }
}

// ── Config collectors ────────────────────────────────────────

interface ConfigEntry {
  readonly config: OpenAPIConfig
}

/**
 * Collect root-level OpenAPI config (if present).
 */
function collectRootConfigs(config: ZpressConfig): readonly ConfigEntry[] {
  return match(config.openapi)
    .with(P.nonNullable, (o) => [{ config: o }])
    .otherwise(() => [])
}

/**
 * Collect workspace-level OpenAPI configs from apps, packages, and workspace categories.
 */
function collectWorkspaceConfigs(config: ZpressConfig): readonly ConfigEntry[] {
  const workspaceCategoryItems = (config.workspaces ?? []).flatMap((g) => g.items)
  const allWorkspaces: readonly Workspace[] = [
    ...(config.apps ?? []),
    ...(config.packages ?? []),
    ...workspaceCategoryItems,
  ]

  return allWorkspaces
    .filter(
      (ws): ws is Workspace & { readonly openapi: OpenAPIConfig } =>
        ws.openapi !== null && ws.openapi !== undefined
    )
    .map((ws) => ({ config: ws.openapi }))
}

// ── Operation extraction ─────────────────────────────────────

const HTTP_METHODS: readonly string[] = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
  'trace',
]

/**
 * Extract all operations from OpenAPI paths object.
 */
function extractOperations(
  paths: Record<string, Record<string, unknown>>
): readonly OperationInfo[] {
  return Object.entries(paths).flatMap(([pathStr, methods]) =>
    HTTP_METHODS.filter((method) => methods[method] !== null && methods[method] !== undefined).map(
      (method) => {
        const op = methods[method] as Record<string, unknown>
        const summary = match(op.summary)
          .with(P.string, (s) => s)
          .otherwise(() => `${method.toUpperCase()} ${pathStr}`)
        const operationId = match(op.operationId)
          .with(P.string, (id) => id)
          .otherwise(() => `${method}-${slugify(pathStr)}`)
        const tags = match(op.tags)
          .with(P.array(P.string), (t) => t)
          .otherwise(() => ['default'])
        return { method, path: pathStr, operationId, summary, tags }
      }
    )
  )
}

// ── Tag grouping ─────────────────────────────────────────────

/**
 * Group operations by their first tag.
 */
function groupByTag(operations: readonly OperationInfo[]): readonly TagGroup[] {
  const grouped = Map.groupBy(operations, (op) =>
    match(op.tags[0])
      .with(P.string, (t) => t)
      .otherwise(() => 'default')
  )

  return [...grouped.entries()].map(([tag, ops]) => ({ tag, operations: ops }))
}

// ── Page generation ──────────────────────────────────────────

/**
 * Build an MDX page for a single OpenAPI operation.
 */
function buildOperationPage(op: OperationInfo, prefix: string): PageData {
  const slug = slugify(op.operationId)
  const outputPath = `${stripLeadingSlash(prefix)}/${slug}.mdx`
  const title = op.summary

  const content = [
    '---',
    `title: ${title}`,
    '---',
    '',
    "import spec from './openapi.json'",
    "import { OpenAPIOperation } from '@zpress/ui/theme'",
    '',
    '<OpenAPIOperation',
    '  spec={spec}',
    `  method="${op.method}"`,
    `  path="${op.path}"`,
    `  operationId="${op.operationId}"`,
    '/>',
    '',
  ].join('\n')

  return {
    content,
    outputPath,
    frontmatter: { title },
  }
}

/**
 * Build an index/overview MDX page for the OpenAPI spec.
 */
function buildIndexPage(title: string, prefix: string): PageData {
  const outputPath = `${stripLeadingSlash(prefix)}/index.mdx`

  const content = [
    '---',
    `title: ${title}`,
    '---',
    '',
    "import spec from './openapi.json'",
    "import { OpenAPIOverview } from '@zpress/ui/theme'",
    '',
    '<OpenAPIOverview spec={spec} />',
    '',
  ].join('\n')

  return {
    content,
    outputPath,
    frontmatter: { title },
  }
}

// ── Sidebar generation ───────────────────────────────────────

/**
 * Build sidebar items grouped by tag.
 */
function buildSidebarItems(
  title: string,
  prefix: string,
  tagGroups: readonly TagGroup[],
  sidebarStyle: 'method-path' | 'title'
): readonly SidebarItem[] {
  const tagItems: readonly SidebarItem[] = tagGroups.map((group) => ({
    text: capitalize(group.tag),
    collapsed: false,
    items: group.operations.map((op) => ({
      text: formatSidebarText(op, sidebarStyle),
      link: `${prefix}/${slugify(op.operationId)}`,
    })),
  }))

  return [
    {
      text: title,
      link: prefix,
      items: tagItems,
    },
  ]
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Format sidebar text for an operation based on the configured style.
 *
 * - `'method-path'` renders an HTML string with a colored method badge
 *   (`.zp-oas-sidebar-badge--{method}`) and the API path in monospace
 *   (`.zp-oas-sidebar-path`). Rspress renders this via `dangerouslySetInnerHTML`.
 * - `'title'` renders the operation summary as plain text (e.g., "List Users")
 */
function formatSidebarText(op: OperationInfo, style: 'method-path' | 'title'): string {
  return match(style)
    .with('title', () => op.summary)
    .with('method-path', () => {
      const method = op.method.toUpperCase()
      const badge = `<span class="zp-oas-sidebar-badge zp-oas-sidebar-badge--${op.method}">${method}</span>`
      const pathHtml = `<code class="zp-oas-sidebar-path">${op.path}</code>`
      return `${badge}${pathHtml}`
    })
    .exhaustive()
}

/**
 * Resolve the sidebar title from config, defaulting to 'API Reference'.
 */
function resolveTitle(config: OpenAPIConfig): string {
  return match(config.title)
    .with(P.string, (t) => t)
    .otherwise(() => 'API Reference')
}

/**
 * Convert a string to a URL-safe slug.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
}

/**
 * Capitalize the first character of a string.
 */
function capitalize(text: string): string {
  if (text.length === 0) {
    return text
  }
  return `${text[0].toUpperCase()}${text.slice(1)}`
}

/**
 * Strip the leading slash from a path for use as an output path.
 */
function stripLeadingSlash(p: string): string {
  if (p.startsWith('/')) {
    return p.slice(1)
  }
  return p
}
