import fs from 'node:fs'
import path from 'node:path'

import { log } from '@clack/prompts'
import fg from 'fast-glob'
import { match, P } from 'ts-pattern'

import { hasGlobChars } from '../../glob.ts'
import type { Section, Frontmatter } from '../../types.ts'
import { syncError, collectResults } from '../errors.ts'
import type { SyncError, SyncOutcome } from '../errors.ts'
import type { ResolvedEntry, SyncContext } from '../types.ts'
import { extractBaseDir, linkToOutputPath, sourceExt } from './path.ts'
import { resolveRecursiveGlob } from './recursive.ts'
import { sortEntries } from './sort.ts'
import { deriveText, resolveSectionTitle } from './text.ts'

/**
 * Walk the Section tree and produce a ResolvedEntry tree.
 *
 * Resolves globs, derives text, merges frontmatter, deduplicates.
 * Returns a `SyncOutcome` tuple — the caller is responsible for
 * surfacing errors and exiting.
 *
 * @param sections - Config section tree to resolve
 * @param ctx - Sync context (provides repo root, config, quiet flag)
 * @param inheritedFrontmatter - Frontmatter inherited from parent sections
 * @param depth - Current nesting depth (0 = top-level)
 * @returns Result tuple containing resolved entry tree or the first sync error
 */
export async function resolveEntries(
  sections: readonly Section[],
  ctx: SyncContext,
  inheritedFrontmatter: Frontmatter = {},
  depth = 0
): Promise<readonly [SyncError, null] | readonly [null, ResolvedEntry[]]> {
  const results = await Promise.all(
    sections.map((section) => resolveSection(section, ctx, inheritedFrontmatter, depth))
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
 * Resolve a single section node — dispatches to leaf, virtual, or nested section handler.
 */
function resolveSection(
  section: Section,
  ctx: SyncContext,
  inheritedFrontmatter: Frontmatter,
  depth: number
): Promise<SyncOutcome<ResolvedEntry>> {
  const mergedFm = { ...inheritedFrontmatter, ...section.frontmatter }

  // Leaf page from single file
  if (section.from && !hasGlobChars(section.from) && !section.items) {
    return Promise.resolve(resolveFilePage(section, ctx, mergedFm))
  }

  // Virtual page (inline/generated content)
  if (section.content !== undefined && section.content !== null && section.link) {
    return Promise.resolve(resolveVirtualPage(section, mergedFm))
  }

  // Nested section — may have glob, explicit items, or both
  return resolveNestedSection(section, ctx, mergedFm, depth)
}

/**
 * Resolve a leaf page backed by a single source file.
 */
function resolveFilePage(
  section: Section,
  ctx: SyncContext,
  frontmatter: Frontmatter
): SyncOutcome<ResolvedEntry> {
  if (section.from === null || section.from === undefined) {
    return [syncError('missing_from', 'resolveFilePage called without section.from'), null]
  }

  const sourcePath = path.resolve(ctx.repoRoot, section.from)
  if (!fs.existsSync(sourcePath)) {
    return [syncError('file_not_found', `Source file not found: ${section.from}`), null]
  }

  if (section.link === null || section.link === undefined) {
    return [
      syncError('missing_link', `resolveFilePage called without section.link for: ${section.from}`),
      null,
    ]
  }

  const ext = sourceExt(section.from)

  return [
    null,
    {
      title: resolveSectionTitle(section),
      link: section.link,
      hidden: section.hidden,
      card: section.card,
      page: {
        source: sourcePath,
        outputPath: linkToOutputPath(section.link, ext),
        frontmatter,
      },
    },
  ]
}

/**
 * Resolve a virtual page with inline or generated content.
 */
function resolveVirtualPage(
  section: Section,
  frontmatter: Frontmatter
): SyncOutcome<ResolvedEntry> {
  if (section.link === undefined || section.link === null) {
    return [syncError('missing_link', 'resolveVirtualPage called without section.link'), null]
  }

  return [
    null,
    {
      title: resolveSectionTitle(section),
      link: section.link,
      hidden: section.hidden,
      card: section.card,
      page: {
        content: section.content,
        outputPath: linkToOutputPath(section.link),
        frontmatter,
      },
    },
  ]
}

/**
 * Resolve a nested section — may include glob-discovered children,
 * explicit children, or both. Deduplicates and sorts the result.
 */
async function resolveNestedSection(
  section: Section,
  ctx: SyncContext,
  mergedFm: Frontmatter,
  depth: number
): Promise<SyncOutcome<ResolvedEntry>> {
  // 1. Auto-discover from glob
  const globbed = await (() => {
    if (section.from && hasGlobChars(section.from)) {
      if (section.recursive) {
        return resolveRecursiveGlob(section, ctx, mergedFm, depth + 1)
      }
      return resolveGlob(section, ctx, mergedFm)
    }
    return Promise.resolve([] as ResolvedEntry[])
  })()

  // 2. Explicit children
  const explicitResult = await (() => {
    if (section.items) {
      return resolveEntries(section.items, ctx, mergedFm, depth + 1)
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
  const sorted = sortEntries(deduped, section.sort)

  // Section header can also be a page (has link + non-glob from)
  const sectionPage = resolveSectionPage(section, ctx, mergedFm)

  // Collapsible: explicit value wins, otherwise auto-collapse below top level
  const autoCollapsible = (() => {
    if (depth > 0) {
      return true as const
    }
  })()
  const collapsible = section.collapsible ?? autoCollapsible

  // Auto-derive link so the group is navigable and gets a landing page.
  // Priority: explicit link > prefix > common prefix of children's links
  const derivedLink = section.prefix ?? deriveCommonPrefix(sorted)
  const link = section.link ?? derivedLink
  const autoLink = !section.link && link !== undefined

  return [
    null,
    {
      title: resolveSectionTitle(section),
      link,
      collapsible,
      hidden: section.hidden,
      card: section.card,
      isolated: section.isolated,
      autoLink,
      items: sorted,
      page: sectionPage,
    },
  ]
}

/**
 * Resolve the section header page (if the section has a `link` and a non-glob `from`).
 */
function resolveSectionPage(
  section: Section,
  ctx: SyncContext,
  mergedFm: Frontmatter
): ResolvedEntry['page'] | undefined {
  if (section.link && section.from && !hasGlobChars(section.from)) {
    const sourcePath = path.resolve(ctx.repoRoot, section.from)
    if (fs.existsSync(sourcePath)) {
      const ext = sourceExt(section.from)
      return {
        source: sourcePath,
        outputPath: linkToOutputPath(section.link, ext),
        frontmatter: mergedFm,
      }
    }
  } else if (section.link && section.recursive && section.from) {
    // Recursive mode: find the root-level index file from the glob base (.md or .mdx)
    const baseDir = extractBaseDir(section.from)
    const indexFile = section.indexFile ?? 'overview'
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
        outputPath: linkToOutputPath(section.link, ext),
        frontmatter: mergedFm,
      }
    }
  }
}

/**
 * Resolve a non-recursive glob pattern into leaf page entries.
 */
async function resolveGlob(
  section: Section,
  ctx: SyncContext,
  frontmatter: Frontmatter
): Promise<ResolvedEntry[]> {
  const ignore = [...(ctx.config.exclude ?? []), ...(section.exclude ?? [])]

  if (section.from === null || section.from === undefined) {
    log.error('[zpress] resolveGlob called without section.from')
    return []
  }

  const files = await fg(section.from, {
    cwd: ctx.repoRoot,
    ignore,
    absolute: false,
    onlyFiles: true,
  })

  const titleStr = resolveSectionTitle(section)

  if (files.length === 0) {
    if (!ctx.quiet) {
      log.warn(`Glob "${section.from}" matched 0 files for "${titleStr}"`)
    }
    return []
  }

  const prefix = section.prefix ?? ''

  // Extract titleFrom and titleTransform, preferring new title object API over deprecated fields
  const titleConfig = match(section.title)
    .when(
      (
        t
      ): t is {
        from: 'auto' | 'filename' | 'heading' | 'frontmatter'
        transform?: (text: string, slug: string) => string
      } => typeof t === 'object' && t !== null && 'from' in t,
      (t) => t
    )
    .otherwise(() => null)
  const titleFrom = match(titleConfig)
    .with(P.nonNullable, (tc) => tc.from)
    .otherwise(() => section.titleFrom ?? ('auto' as const))
  const titleTransform = match(titleConfig)
    .with(P.nonNullable, (tc) => tc.transform)
    .otherwise(() => section.titleTransform)

  return Promise.all(
    files.map(async (file) => {
      const ext = sourceExt(file)
      const slug = path.basename(file, path.extname(file))
      const link = `${prefix}/${slug}`
      const sourcePath = path.resolve(ctx.repoRoot, file)
      const rawTitle = await deriveText(sourcePath, slug, titleFrom)
      const title = match(titleTransform)
        .with(P.nonNullable, (t) => t(rawTitle, slug))
        .otherwise(() => rawTitle)

      return {
        title,
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
 * Derive a common path prefix from children's links.
 *
 * Given children with links like `/a/b/c`, `/a/b/d`, `/a/b/e`,
 * returns `/a/b`. Returns `undefined` when no common prefix exists
 * or there are no children with links.
 */
function deriveCommonPrefix(children: readonly ResolvedEntry[]): string | undefined {
  const links = children.filter((c) => c.link).map((c) => c.link as string)
  if (links.length === 0) {
    return undefined
  }

  const segmentArrays = links.map((link) => link.split('/').filter(Boolean))
  const shortest = segmentArrays.reduce(
    (min, segs) => Math.min(min, segs.length),
    Number.POSITIVE_INFINITY
  )

  // Walk segments left-to-right, accumulating matches until divergence
  const common = segmentArrays[0].slice(0, shortest).reduce<readonly string[]>((acc, seg, i) => {
    if (acc.length !== i) {
      return acc
    }
    if (segmentArrays.every((segs) => segs[i] === seg)) {
      return [...acc, seg]
    }
    return acc
  }, [])

  if (common.length === 0) {
    return undefined
  }

  return `/${common.join('/')}`
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
