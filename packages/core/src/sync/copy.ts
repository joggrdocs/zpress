import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { log } from '@clack/prompts'
import matter from 'gray-matter'
import { match } from 'ts-pattern'

import type { Frontmatter } from '../types.ts'
import { rewriteImages } from './images.ts'
import { rewriteLinks } from './rewrite-links.ts'
import type { ManifestEntry, PageData, SyncContext } from './types.ts'

/**
 * Copy/generate a single page into `.content/`.
 *
 * Reads from `page.source` (file-backed) or evaluates `page.content`
 * (virtual), injects frontmatter, computes a content hash, and writes
 * the output file. Skips the write when the hash matches the previous manifest.
 *
 * @param page - Page data with source path or inline content
 * @param ctx - Sync context (provides output dir, repo root, previous manifest)
 * @returns Manifest entry with content hash for incremental tracking
 */
export async function copyPage(page: PageData, ctx: SyncContext): Promise<ManifestEntry> {
  const outPath = path.resolve(ctx.outDir, page.outputPath)
  await fs.mkdir(path.dirname(outPath), { recursive: true })

  const content: string = await (async () => {
    if (page.source) {
      const raw = await fs.readFile(page.source, 'utf8')
      const rewritten = rewriteSourceLinks(raw, page, ctx)
      const withImages = await rewriteSourceImages(rewritten, page, ctx)
      return injectFrontmatter(withImages, page.frontmatter)
    }
    if (page.content) {
      const body = match(typeof page.content)
        .with('function', async () => await (page.content as () => Promise<string>)())
        .otherwise(() => page.content as string)
      return injectFrontmatter(await body, page.frontmatter)
    }
    log.error(`[zpress] Page "${page.outputPath}" has neither source nor content`)
    return ''
  })()

  const contentHash = createHash('sha256').update(content).digest('hex')

  // Store source as repo-relative path (not machine-local absolute path)
  const relativeSource = (() => {
    if (page.source !== null && page.source !== undefined) {
      return path.relative(ctx.repoRoot, page.source)
    }
  })()

  // Incremental: skip write if content unchanged
  const prev = (() => {
    if (ctx.previousManifest !== null && ctx.previousManifest !== undefined) {
      return ctx.previousManifest.files[page.outputPath]
    }
  })()

  async function resolveSourceMtime(): Promise<number | undefined> {
    if (page.source !== null && page.source !== undefined) {
      const stat = await fs.stat(page.source)
      return stat.mtimeMs
    }
  }

  if (prev && prev.contentHash === contentHash) {
    return {
      source: relativeSource,
      sourceMtime: await resolveSourceMtime(),
      contentHash,
      outputPath: page.outputPath,
    }
  }

  await fs.writeFile(outPath, content, 'utf8')

  return {
    source: relativeSource,
    sourceMtime: await resolveSourceMtime(),
    contentHash,
    outputPath: page.outputPath,
  }
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Rewrite relative markdown links in source content when a source map is available.
 * No-op when the context has no source map (e.g. during resolve-only passes).
 *
 * @private
 * @param raw - Raw markdown content
 * @param page - Page data with source path information
 * @param ctx - Sync context with optional source map
 * @returns Content with rewritten links, or original content if no source map
 */
function rewriteSourceLinks(raw: string, page: PageData, ctx: SyncContext): string {
  if (ctx.sourceMap === null || ctx.sourceMap === undefined) {
    return raw
  }
  if (page.source === null || page.source === undefined) {
    return raw
  }
  const sourcePath = path.relative(ctx.repoRoot, page.source)
  return rewriteLinks({
    content: raw,
    sourcePath,
    outputPath: page.outputPath,
    sourceMap: ctx.sourceMap,
  })
}

/**
 * Rewrite relative image references in source content, copying image files
 * to the content public directory. No-op for virtual pages (no source file).
 *
 * @private
 * @param content - Markdown content (after link rewriting)
 * @param page - Page data with source path information
 * @param ctx - Sync context with repo root and output directory
 * @returns Content with rewritten image paths
 */
function rewriteSourceImages(
  content: string,
  page: PageData,
  ctx: SyncContext
): Promise<string> {
  if (page.source === null || page.source === undefined) {
    return Promise.resolve(content)
  }
  const sourcePath = path.relative(ctx.repoRoot, page.source)
  return rewriteImages({
    content,
    sourcePath,
    repoRoot: ctx.repoRoot,
    outDir: ctx.outDir,
  })
}

/**
 * Merge frontmatter into markdown.
 * Config-level frontmatter acts as defaults; source file frontmatter wins.
 *
 * @private
 * @param raw - Raw markdown content (may include existing frontmatter)
 * @param fm - Frontmatter key-value pairs to inject as defaults
 * @returns Markdown string with merged frontmatter
 */
function injectFrontmatter(raw: string, fm: Frontmatter): string {
  if (Object.keys(fm).length === 0) {
    return raw
  }

  const parsed = matter(raw)
  const merged = { ...fm, ...parsed.data }
  return matter.stringify(parsed.content, merged)
}
