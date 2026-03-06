import fs from 'node:fs'
import path from 'node:path'

import { log } from '@clack/prompts'
import fg from 'fast-glob'
import { match, P } from 'ts-pattern'

import { hasGlobChars } from '../../glob.ts'
import type { Entry, Frontmatter } from '../../types.ts'
import { syncError, collectResults } from '../errors.ts'
import type { SyncError, SyncOutcome } from '../errors.ts'
import type { ResolvedEntry, SyncContext } from '../types.ts'
import { extractBaseDir, linkToOutputPath, sourceExt } from './path.ts'
import { resolveRecursiveGlob } from './recursive.ts'
import { sortEntries } from './sort.ts'
import { deriveText } from './text.ts'

/**
 * Walk the Entry tree and produce a ResolvedEntry tree.
 *
 * Resolves globs, derives text, merges frontmatter, deduplicates.
 * Returns a `SyncOutcome` tuple — the caller is responsible for
 * surfacing errors and exiting.
 *
 * @param entries - Config entry tree to resolve
 * @param ctx - Sync context (provides repo root, config, quiet flag)
 * @param inheritedFrontmatter - Frontmatter inherited from parent entries
 * @param depth - Current nesting depth (0 = top-level)
 * @returns Result tuple containing resolved entry tree or the first sync error
 */
export async function resolveEntries(
  entries: readonly Entry[],
  ctx: SyncContext,
  inheritedFrontmatter: Frontmatter = {},
  depth = 0
): Promise<readonly [SyncError, null] | readonly [null, ResolvedEntry[]]> {
  const results = await Promise.all(
    entries.map((entry) => resolveEntry(entry, ctx, inheritedFrontmatter, depth))
  )

  const result = collectResults(results)
  const [err] = result
  if (err) {
    return [err, null]
  }

  const [, collected] = result as readonly [null, readonly ResolvedEntry[]]
  return [null, [...collected]]
}

/**
 * Resolve a single entry node — dispatches to leaf, virtual, or section handler.
 */
function resolveEntry(
  entry: Entry,
  ctx: SyncContext,
  inheritedFrontmatter: Frontmatter,
  depth: number
): Promise<SyncOutcome<ResolvedEntry>> {
  const mergedFm = { ...inheritedFrontmatter, ...entry.frontmatter }

  // Leaf page from single file
  if (entry.from && !hasGlobChars(entry.from) && !entry.items) {
    return Promise.resolve(resolveFilePage(entry, ctx, mergedFm))
  }

  // Virtual page (inline/generated content)
  if (entry.content && entry.link) {
    return Promise.resolve(resolveVirtualPage(entry, mergedFm))
  }

  // Section — may have glob, explicit items, or both
  return resolveSection(entry, ctx, mergedFm, depth)
}

/**
 * Resolve a leaf page backed by a single source file.
 */
function resolveFilePage(
  entry: Entry,
  ctx: SyncContext,
  frontmatter: Frontmatter
): SyncOutcome<ResolvedEntry> {
  if (entry.from === null || entry.from === undefined) {
    return [syncError('missing_from', 'resolveFilePage called without entry.from'), null]
  }

  const sourcePath = path.resolve(ctx.repoRoot, entry.from)
  if (!fs.existsSync(sourcePath)) {
    return [syncError('file_not_found', `Source file not found: ${entry.from}`), null]
  }

  if (entry.link === null || entry.link === undefined) {
    return [
      syncError('missing_link', `resolveFilePage called without entry.link for: ${entry.from}`),
      null,
    ]
  }

  const ext = sourceExt(entry.from)

  return [
    null,
    {
      text: entry.text,
      link: entry.link,
      hidden: entry.hidden,
      card: entry.card,
      page: {
        source: sourcePath,
        outputPath: linkToOutputPath(entry.link, ext),
        frontmatter,
      },
    },
  ]
}

/**
 * Resolve a virtual page with inline or generated content.
 */
function resolveVirtualPage(entry: Entry, frontmatter: Frontmatter): SyncOutcome<ResolvedEntry> {
  if (entry.link === undefined || entry.link === null) {
    return [syncError('missing_link', 'resolveVirtualPage called without entry.link'), null]
  }

  return [
    null,
    {
      text: entry.text,
      link: entry.link,
      hidden: entry.hidden,
      card: entry.card,
      page: {
        content: entry.content,
        outputPath: linkToOutputPath(entry.link),
        frontmatter,
      },
    },
  ]
}

/**
 * Resolve a section entry — may include glob-discovered children,
 * explicit children, or both. Deduplicates and sorts the result.
 */
async function resolveSection(
  entry: Entry,
  ctx: SyncContext,
  mergedFm: Frontmatter,
  depth: number
): Promise<SyncOutcome<ResolvedEntry>> {
  // 1. Auto-discover from glob
  const globbed = await (() => {
    if (entry.from && hasGlobChars(entry.from)) {
      if (entry.recursive) {
        return resolveRecursiveGlob(entry, ctx, mergedFm, depth + 1)
      }
      return resolveGlob(entry, ctx, mergedFm)
    }
    return Promise.resolve([] as ResolvedEntry[])
  })()

  // 2. Explicit children
  const explicitResult = await (() => {
    if (entry.items) {
      return resolveEntries(entry.items, ctx, mergedFm, depth + 1)
    }
    return Promise.resolve([null, [] as ResolvedEntry[]] as const)
  })()

  const [explicitErr, explicit] = explicitResult
  if (explicitErr) {
    return [explicitErr, null]
  }

  // 3. Merge, deduplicate (explicit wins over glob), sort
  const children = [...globbed, ...explicit]
  const deduped = deduplicateByLink(children)
  const sorted = sortEntries(deduped, entry.sort)

  // Section header can also be a page (has link + non-glob from)
  const sectionPage = resolveSectionPage(entry, ctx, mergedFm)

  // Collapsible: explicit value wins, otherwise auto-collapse below top level
  const autoCollapsible = (() => {
    if (depth > 0) {
      return true as const
    }
  })()
  const collapsible = entry.collapsible ?? autoCollapsible

  return [
    null,
    {
      text: entry.text,
      link: entry.link,
      collapsible,
      hidden: entry.hidden,
      card: entry.card,
      isolated: entry.isolated,
      items: sorted,
      page: sectionPage,
    },
  ]
}

/**
 * Resolve the section header page (if the section has a `link` and a non-glob `from`).
 */
function resolveSectionPage(
  entry: Entry,
  ctx: SyncContext,
  mergedFm: Frontmatter
): ResolvedEntry['page'] | undefined {
  if (entry.link && entry.from && !hasGlobChars(entry.from)) {
    const sourcePath = path.resolve(ctx.repoRoot, entry.from)
    if (fs.existsSync(sourcePath)) {
      const ext = sourceExt(entry.from)
      return {
        source: sourcePath,
        outputPath: linkToOutputPath(entry.link, ext),
        frontmatter: mergedFm,
      }
    }
  } else if (entry.link && entry.recursive && entry.from) {
    // Recursive mode: find the root-level index file from the glob base (.md or .mdx)
    const baseDir = extractBaseDir(entry.from)
    const indexFile = entry.indexFile ?? 'overview'
    const mdPath = path.join(baseDir, `${indexFile}.md`)
    const mdxPath = path.join(baseDir, `${indexFile}.mdx`)
    const mdxExists = fs.existsSync(path.resolve(ctx.repoRoot, mdxPath))
    const indexPath = match(mdxExists)
      .with(true, () => mdxPath)
      .otherwise(() => mdPath)
    const sourcePath = path.resolve(ctx.repoRoot, indexPath)
    if (fs.existsSync(sourcePath)) {
      const ext = sourceExt(indexPath)
      return {
        source: sourcePath,
        outputPath: linkToOutputPath(entry.link, ext),
        frontmatter: mergedFm,
      }
    }
  }
}

/**
 * Resolve a non-recursive glob pattern into leaf page entries.
 */
async function resolveGlob(
  entry: Entry,
  ctx: SyncContext,
  frontmatter: Frontmatter
): Promise<ResolvedEntry[]> {
  const ignore = [...(ctx.config.exclude ?? []), ...(entry.exclude ?? [])]

  if (entry.from === null || entry.from === undefined) {
    log.error('[zpress] resolveGlob called without entry.from')
    return []
  }

  const files = await fg(entry.from, {
    cwd: ctx.repoRoot,
    ignore,
    absolute: false,
    onlyFiles: true,
  })

  if (files.length === 0) {
    if (!ctx.quiet) {
      log.warn(`Glob "${entry.from}" matched 0 files for "${entry.text}"`)
    }
    return []
  }

  const prefix = entry.prefix ?? ''
  const textFrom = entry.textFrom ?? 'filename'
  const { textTransform } = entry

  return Promise.all(
    files.map(async (file) => {
      const ext = sourceExt(file)
      const slug = path.basename(file, path.extname(file))
      const link = `${prefix}/${slug}`
      const sourcePath = path.resolve(ctx.repoRoot, file)
      const rawText = await deriveText(sourcePath, slug, textFrom)
      const text = match(textTransform)
        .with(P.nonNullable, (t) => t(rawText, slug))
        .otherwise(() => rawText)

      return {
        text,
        link,
        page: {
          source: sourcePath,
          outputPath: linkToOutputPath(link, ext),
          frontmatter,
        },
      } satisfies ResolvedEntry
    })
  )
}

/**
 * Deduplicate entries by `link`. Later entries (explicit) override earlier (glob).
 *
 * Uses `link` as the dedup key when present. Entries without a link are never
 * considered duplicates — they always pass through (sections with only `text`).
 */
function deduplicateByLink(entries: readonly ResolvedEntry[]): ResolvedEntry[] {
  const { result } = entries.reduce<{ seen: Map<string, number>; result: ResolvedEntry[] }>(
    (acc, entry) => {
      // Only dedup by link — entries without links are always unique
      if (entry.link === null || entry.link === undefined) {
        return {
          seen: acc.seen,
          result: [...acc.result, entry],
        }
      }
      const existing = acc.seen.get(entry.link)
      if (existing === undefined) {
        acc.seen.set(entry.link, acc.result.length)
        return {
          seen: acc.seen,
          result: [...acc.result, entry],
        }
      }
      // Later entry wins (explicit items come after glob)
      return {
        seen: acc.seen,
        result: acc.result.map((item, i) => {
          if (i === existing) {
            return entry
          }
          return item
        }),
      }
    },
    { seen: new Map<string, number>(), result: [] }
  )

  return result
}
