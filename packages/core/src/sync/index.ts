import fs from 'node:fs/promises'
import path from 'node:path'

import { log } from '@clack/prompts'
import { match, P } from 'ts-pattern'

import { generateAssets } from '../banner/index.ts'
import { GENERATED_MARKER } from '../banner/svg-shared.ts'
import type { AssetConfig } from '../banner/types.ts'
import type { Paths } from '../paths.ts'
import type { Entry, ZpressConfig } from '../types.ts'
import { copyPage } from './copy.ts'
import { generateDefaultHomePage } from './home.ts'
import { loadManifest, saveManifest, cleanStaleFiles } from './manifest.ts'
import { discoverPlanningPages } from './planning.ts'
import { resolveEntries } from './resolve/index.ts'
import { buildSourceMap } from './rewrite-links.ts'
import { generateNav } from './sidebar/index.ts'
import { injectLandingPages } from './sidebar/inject.ts'
import { buildMultiSidebar } from './sidebar/multi.ts'
import type { PageData, ResolvedEntry, SidebarItem, SyncContext } from './types.ts'
import { enrichWorkspaceCards, synthesizeWorkspaceSections } from './workspace.ts'

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

export async function sync(config: ZpressConfig, options: SyncOptions): Promise<SyncResult> {
  const start = performance.now()
  const quiet = resolveQuiet(options.quiet)

  const { repoRoot, contentDir: outDir } = options.paths

  await fs.mkdir(outDir, { recursive: true })
  await fs.mkdir(path.resolve(outDir, '.generated'), { recursive: true })

  // Seed .zpress/public/ with default assets from the package (skip files that already exist)
  await seedDefaultAssets(options.paths.publicDir)

  // Fallback: generate banner/logo if not already present in .zpress/public/
  // (Primary generation path is `zpress generate` or `zpress setup`)
  const assetConfig = buildAssetConfig(config)
  if (assetConfig) {
    await generateAssets({ config: assetConfig, publicDir: options.paths.publicDir })
  }

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
  const allSections: Entry[] = [...config.sections, ...workspaceSections]

  // 1. Resolve the entry tree
  const [resolveErr, rawResolved] = await resolveEntries(allSections, ctx)
  if (resolveErr) {
    log.error(`[zpress] ${resolveErr.message}`)
    return { pagesWritten: 0, pagesSkipped: 0, pagesRemoved: 0, elapsed: performance.now() - start }
  }

  // 1.25 Enrich entries with workspace card metadata from top-level apps/packages
  const resolved = enrichWorkspaceCards(rawResolved, config)

  // 1.5 Inject auto-generated landing pages for sections with link but no page
  const workspaceGroupItems = (config.workspaces ?? []).flatMap((g) => g.items)
  const workspaceItems = [
    ...(config.apps ?? []),
    ...(config.packages ?? []),
    ...workspaceGroupItems,
  ]
  injectLandingPages(resolved, allSections, workspaceItems)

  // 2. Collect all pages from the tree
  const sectionPages = collectPages(resolved)

  // 2.1 Auto-generate home page when no explicit index.md exists
  const hasExplicitHome = sectionPages.some((p) => p.outputPath === 'index.md')
  const homeResult = await match(hasExplicitHome)
    .with(true, () => Promise.resolve(null))
    .otherwise(() => generateDefaultHomePage(config, repoRoot))

  // 2.2 Write workspace data
  await match(homeResult)
    .with(P.nonNullable, async (result) => {
      await fs.writeFile(
        path.resolve(outDir, '.generated/workspaces.json'),
        JSON.stringify(result.workspaces, null, 2),
        'utf8'
      )
    })
    .otherwise(() => Promise.resolve())

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

  const openapiSidebar: SidebarItem[] = []

  // 3. Copy/generate all pages (sections + home + planning)
  const allPages = [...pages, ...planningPages]

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
  const icons = buildIconMap(allSections)
  const sortedSidebar = buildMultiSidebar(resolved, openapiSidebar, icons)
  const nav = generateNav(config, resolved, icons)

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
 */
async function writeZpressReadme(outputRoot: string): Promise<void> {
  const readmePath = path.resolve(outputRoot, 'README.md')
  const content = `# .zpress

This directory is managed by zpress. It contains the
materialized documentation site — synced content, build artifacts, and static assets.

| Directory   | Description                                    | Tracked |
| ----------- | ---------------------------------------------- | ------- |
| \`content/\`  | Synced markdown pages and generated config     | No      |
| \`public/\`   | Static assets (logos, icons, banners)           | Yes     |
| \`dist/\`     | Build output                                   | No      |
| \`cache/\`    | Build cache                                    | No      |

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
 * Seed .zpress/public/ with default assets from the core package's public/ directory.
 * Only copies files that don't already exist — user customizations are preserved.
 */
async function seedDefaultAssets(publicDir: string): Promise<void> {
  // Resolve from the bundled dist/ directory up to the package root's public/ dir
  const defaultsDir = path.resolve(import.meta.dirname, '..', 'public')
  const exists = await fs.stat(defaultsDir).catch(() => null)
  if (!exists) {
    return
  }

  await copySeeded(defaultsDir, publicDir)
}

/**
 * Recursively copy files from src to dest.
 *
 * Overwrites a destination file only when it was auto-generated
 * (first line matches the zpress-generated marker). User-customized
 * files (no marker) are never touched.
 */
async function copySeeded(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  await entries.reduce(async (prevPromise, entry) => {
    await prevPromise
    const srcPath = path.resolve(src, entry.name)
    const destPath = path.resolve(dest, entry.name)
    if (entry.isDirectory()) {
      await copySeeded(srcPath, destPath)
      return
    }
    const shouldCopy = await isReplaceable(destPath)
    if (shouldCopy) {
      await fs.copyFile(srcPath, destPath)
    }
  }, Promise.resolve())
}

/**
 * Check whether a destination file can be replaced by a seeded default.
 *
 * Returns `true` when:
 * - The file does not exist (first seed)
 * - The file exists and was auto-generated (has the zpress-generated marker)
 *
 * Returns `false` when:
 * - The file exists without the marker (user-customized)
 */
async function isReplaceable(filePath: string): Promise<boolean> {
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- path is constructed from trusted publicDir + directory entries
  const content = await fs.readFile(filePath, 'utf8').catch(() => null)
  if (content === null) {
    return true
  }
  const [firstLine] = content.split('\n')
  return firstLine === GENERATED_MARKER
}

/**
 * Recursively copy all files from src to dest, overwriting existing files.
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
 * Build a map of section text to Iconify identifier from entry icon fields.
 * Used by both the sidebar generator (icon rail) and the nav generator.
 *
 * @param sections - All sections (config + synthesized workspace sections)
 * @returns Map of section text to Iconify identifier string
 */
function buildIconMap(sections: readonly Entry[]): Map<string, string> {
  return new Map(
    sections.flatMap((section): [string, string][] => {
      if (section.icon) {
        return [[section.text, section.icon]]
      }
      return []
    })
  )
}

function resolveQuiet(quiet: boolean | undefined | null): boolean {
  if (quiet !== undefined && quiet !== null) {
    return quiet
  }
  return false
}

function concatPage(pages: readonly PageData[], page: PageData | undefined): PageData[] {
  if (page) {
    return [...pages, page]
  }
  return [...pages]
}

/**
 * Extract an `AssetConfig` from the zpress config.
 * Returns `null` when no title is set (falls back to default ZPRESS assets).
 */
function buildAssetConfig(config: ZpressConfig): AssetConfig | null {
  if (!config.title) {
    return null
  }
  return { title: config.title, tagline: config.tagline }
}
