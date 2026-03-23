import fs from 'node:fs/promises'
import path from 'node:path'

import { log } from '@clack/prompts'
import { match, P } from 'ts-pattern'

import { generateAssets } from '../banner/index.ts'
import type { AssetConfig } from '../banner/types.ts'
import type { Paths } from '../paths.ts'
import type { Section, ZpressConfig } from '../types.ts'
import { copyPage } from './copy.ts'
import { buildWorkspaceData, generateDefaultHomePage } from './home.ts'
import { loadManifest, saveManifest, cleanStaleFiles } from './manifest.ts'
import { syncAllOpenAPI } from './openapi.ts'
import { discoverPlanningPages } from './planning.ts'
import { resolveEntries } from './resolve/index.ts'
import { buildSourceMap } from './rewrite-links.ts'
import { generateNav } from './sidebar/index.ts'
import { injectLandingPages } from './sidebar/inject.ts'
import { buildMultiSidebar } from './sidebar/multi.ts'
import type { PageData, ResolvedEntry, SyncContext } from './types.ts'
import { collectAllWorkspaceItems } from './collect-workspaces.ts'
import { enrichWorkspaceCards, synthesizeWorkspaceSections } from './workspace.ts'

/**
 * Aggregate result from a completed sync pass.
 */
export interface SyncResult {
  readonly pagesWritten: number
  readonly pagesSkipped: number
  readonly pagesRemoved: number
  readonly elapsed: number
}

export interface SyncOptions {
  /**
   * Resolved project paths.
   */
  readonly paths: Paths
  /**
   * When true, suppress all log output during sync.
   */
  readonly quiet?: boolean
}

/**
 * Run a full documentation sync from config to the output directory.
 *
 * Resolves sections, copies pages, generates sidebar/nav, syncs OpenAPI specs,
 * and manages the incremental manifest for change tracking.
 *
 * @param config - Validated zpress config
 * @param options - Sync options including resolved paths and quiet flag
 * @returns Sync result with counts of pages written, skipped, and removed
 */
export async function sync(config: ZpressConfig, options: SyncOptions): Promise<SyncResult> {
  const start = performance.now()
  const quiet = resolveQuiet(options.quiet)

  const { repoRoot, contentDir: outDir } = options.paths

  await fs.mkdir(outDir, { recursive: true })
  await fs.mkdir(path.resolve(outDir, '.generated'), { recursive: true })

  // Generate banner/logo/icon SVGs (skips user-customized files automatically)
  const assetConfig = buildAssetConfig(config)
  await generateAssets({ config: assetConfig, publicDir: options.paths.publicDir })

  // Copy public assets into content/public/ so Rspress can resolve them
  // (Rspress looks for public/ inside the root directory, which is .zpress/content/)
  await copyAll(options.paths.publicDir, path.resolve(outDir, 'public'))

  const previousManifest = await loadManifest(outDir)

  const ctx: SyncContext = {
    repoRoot,
    outDir,
    config,
    previousManifest,
    manifest: { files: {}, timestamp: Date.now() },
    quiet,
  }

  // 0. Synthesize workspace sections from apps/packages/workspaces config
  const workspaceSections = synthesizeWorkspaceSections(config)
  const allSections: Section[] = [...config.sections, ...workspaceSections]

  // 1. Resolve the section tree
  const [resolveErr, rawResolved] = await resolveEntries(allSections, ctx)
  if (resolveErr) {
    log.error(`[zpress] ${resolveErr.message}`)
    return { pagesWritten: 0, pagesSkipped: 0, pagesRemoved: 0, elapsed: performance.now() - start }
  }

  // 1.25 Enrich sections with workspace card metadata from workspaces config
  const resolved = enrichWorkspaceCards(rawResolved, config)

  // 1.5 Inject auto-generated landing pages for sections with path but no page
  const workspaces = collectAllWorkspaceItems(config)
  injectLandingPages(resolved, allSections, workspaces)

  // 2. Collect all pages from the tree
  const sectionPages = collectPages(resolved)

  // 2.1 Write workspace data (always — independent of home page strategy)
  const workspaceResult = buildWorkspaceData(config)
  await fs.writeFile(
    path.resolve(outDir, '.generated/workspaces.json'),
    JSON.stringify(workspaceResult.data, null, 2),
    'utf8'
  )

  // 2.2 Auto-generate home page when no explicit index.md exists
  const hasExplicitHome = sectionPages.some((p) => p.outputPath === 'index.md')
  const homeResult = await match(hasExplicitHome)
    .with(true, () => Promise.resolve(null))
    .otherwise(() => generateDefaultHomePage(config, repoRoot))

  const pages: PageData[] = match(homeResult)
    .with(P.nonNullable, (result) => [
      ...sectionPages,
      {
        content: result.content,
        outputPath: 'index.md',
        frontmatter: {},
      } satisfies PageData,
    ])
    .otherwise(() => sectionPages)

  // 2.5 Discover planning pages (hidden — not in sidebar/nav)
  const planningPages = await discoverPlanningPages(ctx)

  // 2.6 Sync OpenAPI specs
  const openapiResult = await syncAllOpenAPI(ctx)

  // 3. Copy/generate all pages (sections + home + planning + openapi)
  const allPages = [...pages, ...planningPages, ...openapiResult.pages]

  // Build source-to-output map for link rewriting
  const sourceMap = buildSourceMap({ pages: allPages, repoRoot })
  const copyCtx = { ...ctx, sourceMap }

  const { written, skipped } = await allPages.reduce(
    async (accPromise, page) => {
      const counts = await accPromise
      const entry = await copyPage(page, copyCtx)
      const prevFile = match(previousManifest)
        .with(P.nonNullable, (m) => m.files[entry.outputPath])
        .otherwise(() => {})
      const isNew =
        entry.contentHash !==
        match(prevFile)
          .with(P.nonNullable, (p) => p.contentHash)
          .otherwise(() => {})
      // oxlint-disable-next-line eslint/no-unused-expressions -- side-effect boundary: manifest is intentionally mutable context accumulated during sync
      ctx.manifest.files[entry.outputPath] = entry
      if (isNew) {
        return { written: counts.written + 1, skipped: counts.skipped }
      }
      return { written: counts.written, skipped: counts.skipped + 1 }
    },
    Promise.resolve({ written: 0, skipped: 0 })
  )

  // 5. Clean stale files
  const removed = await match(previousManifest)
    .with(P.nonNullable, async (m) => await cleanStaleFiles(outDir, m, ctx.manifest))
    .otherwise(() => Promise.resolve(0))

  // 6. Generate sidebar + nav
  const sortedSidebar = buildMultiSidebar(resolved, openapiResult.sidebar)
  const nav = generateNav(config, resolved)

  await fs.writeFile(
    path.resolve(outDir, '.generated/sidebar.json'),
    JSON.stringify(sortedSidebar, null, 2),
    'utf8'
  )
  await fs.writeFile(
    path.resolve(outDir, '.generated/nav.json'),
    JSON.stringify(nav, null, 2),
    'utf8'
  )

  // 7. Save manifest
  await saveManifest(outDir, ctx.manifest)

  // 8. Write bare-bones README in .zpress/ root
  await writeZpressReadme(options.paths.outputRoot)

  const elapsed = performance.now() - start
  if (!quiet) {
    log.success(
      `Sync complete: ${written} written, ${skipped} unchanged, ${removed} removed (${elapsed.toFixed(0)}ms)`
    )
  }

  return { pagesWritten: written, pagesSkipped: skipped, pagesRemoved: removed, elapsed }
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Recursively collect all page data from a resolved entry tree.
 *
 * @private
 * @param entries - Resolved entry tree nodes
 * @returns Flat array of page data from all entries and their children
 */
function collectPages(entries: readonly ResolvedEntry[]): PageData[] {
  return entries.reduce<PageData[]>((pages, entry) => {
    const withPage = concatPage(pages, entry.page)
    if (entry.items) {
      return [...withPage, ...collectPages(entry.items)]
    }
    return withPage
  }, [])
}

/**
 * Write a bare-bones README.md in the .zpress/ root explaining the directory.
 *
 * @private
 * @param outputRoot - Absolute path to the .zpress/ directory
 * @returns Promise that resolves when the file is written
 */
async function writeZpressReadme(outputRoot: string): Promise<void> {
  const readmePath = path.resolve(outputRoot, 'README.md')
  const content = `# .zpress

This directory is managed by zpress. It contains the
materialized documentation site — synced content, build artifacts, and static assets.

| Directory   | Description                                    |
| ----------- | ---------------------------------------------- |
| \`content/\`  | Synced markdown pages and generated config     |
| \`public/\`   | Static assets (logos, icons, banners)           |
| \`dist/\`     | Build output                                   |
| \`cache/\`    | Build cache                                    |

## Commands

\`\`\`bash
zpress sync    # Sync docs into content/
zpress dev     # Start dev server
zpress build   # Build static site
\`\`\`

> **Do not edit files in \`content/\`** — they are regenerated on every sync.
> Edit the source markdown in your workspace packages instead.
`
  await fs.writeFile(readmePath, content, 'utf8')
}

/**
 * Recursively copy all files from src to dest, overwriting existing files.
 *
 * @private
 * @param src - Source directory path
 * @param dest - Destination directory path
 * @returns Promise that resolves when all files are copied
 */
async function copyAll(src: string, dest: string): Promise<void> {
  const exists = await fs.stat(src).catch(() => null)
  if (!exists) {
    return
  }
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  await entries.reduce(async (prevPromise, entry) => {
    await prevPromise
    const srcPath = path.resolve(src, entry.name)
    const destPath = path.resolve(dest, entry.name)
    if (entry.isDirectory()) {
      await copyAll(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }, Promise.resolve())
}

/**
 * Resolve the quiet flag to a boolean, defaulting to false.
 *
 * @private
 * @param quiet - Optional quiet flag from sync options
 * @returns Resolved boolean value
 */
function resolveQuiet(quiet: boolean | undefined | null): boolean {
  if (quiet !== undefined && quiet !== null) {
    return quiet
  }
  return false
}

/**
 * Append a page to the pages array if it exists.
 *
 * @private
 * @param pages - Existing pages array
 * @param page - Optional page to append
 * @returns New array with the page appended (if present)
 */
function concatPage(pages: readonly PageData[], page: PageData | undefined): PageData[] {
  if (page) {
    return [...pages, page]
  }
  return [...pages]
}

/**
 * Extract an `AssetConfig` from the zpress config.
 * Falls back to 'Documentation' when no title is set.
 *
 * @private
 * @param config - Zpress config object
 * @returns Asset config with title and optional tagline
 */
function buildAssetConfig(config: ZpressConfig): AssetConfig {
  return { title: config.title ?? 'Documentation', tagline: config.tagline }
}
