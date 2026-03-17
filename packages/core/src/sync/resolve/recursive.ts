import path from 'node:path'

import { log } from '@clack/prompts'
import fg from 'fast-glob'
import { match, P } from 'ts-pattern'

import type { Section, Frontmatter } from '../../types.ts'
import type { ResolvedEntry, SyncContext } from '../types.ts'
import { extractBaseDir, linkToOutputPath, sourceExt } from './path.ts'
import { sortEntries } from './sort.ts'
import { deriveText, kebabToTitle, resolveSectionTitle } from './text.ts'

/**
 * Resolve a recursive glob pattern into a nested section tree.
 *
 * Scans all files matching the glob, groups them by directory structure,
 * and produces a nested `ResolvedEntry` tree mirroring the filesystem.
 *
 * @param section - Config section with a recursive glob `from` pattern
 * @param ctx - Sync context (provides repo root, exclude patterns, quiet flag)
 * @param frontmatter - Merged frontmatter inherited from parent sections
 * @param depth - Current nesting depth for collapsible auto-detection
 * @returns Flat or nested resolved entries matching the glob
 */
export async function resolveRecursiveGlob(
  section: Section,
  ctx: SyncContext,
  frontmatter: Frontmatter,
  depth: number
): Promise<ResolvedEntry[]> {
  const ignore = [...(ctx.config.exclude ?? []), ...(section.exclude ?? [])]
  const indexFile = section.indexFile ?? 'overview'

  if (section.from === null || section.from === undefined) {
    log.error('[zpress] resolveRecursiveGlob called without section.from')
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

  const baseDir = extractBaseDir(section.from)
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

  const root = buildDirTree(files, baseDir)
  return buildEntryTree({
    node: root,
    prefix,
    titleFrom,
    titleTransform,
    sort: section.sort,
    collapsible: section.collapsible,
    indexFile,
    ctx,
    frontmatter,
    depth,
  })
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * A node in the directory tree built from glob results.
 *
 * @private
 */
interface DirNode {
  /**
   * Files directly in this directory (repo-relative paths).
   */
  readonly files: readonly string[]
  /**
   * Subdirectories keyed by directory name.
   */
  readonly subdirs: ReadonlyMap<string, DirNode>
}

/**
 * Group a flat file list into a directory tree.
 *
 * @private
 * @param files - Repo-relative file paths from the glob
 * @param baseDir - Static base directory prefix to strip
 * @returns Root directory node containing the full tree
 */
function buildDirTree(files: readonly string[], baseDir: string): DirNode {
  const basePrefixLen = match(baseDir.length > 0)
    .with(true, () => baseDir.length + 1)
    .otherwise(() => 0)

  // NOTE: Intentional mutation — tree-building via nested Map/Array insert; immutable rebuild would require deep-cloning nested Maps on every insert
  return files.reduce<{
    files: string[]
    subdirs: Map<string, { files: string[]; subdirs: Map<string, unknown> }>
  }>(
    (tree, file) => {
      const rel = file.slice(basePrefixLen)
      const segments = rel.split('/')
      const dirSegments = segments.slice(0, -1)

      const current = dirSegments.reduce(
        (
          acc: {
            files: string[]
            subdirs: Map<string, { files: string[]; subdirs: Map<string, unknown> }>
          },
          seg
        ) => {
          if (!acc.subdirs.has(seg)) {
            acc.subdirs.set(seg, { files: [], subdirs: new Map() })
          }
          return acc.subdirs.get(seg) as {
            files: string[]
            subdirs: Map<string, { files: string[]; subdirs: Map<string, unknown> }>
          }
        },
        tree
      )

      current.files.push(file)
      return tree
    },
    { files: [], subdirs: new Map() }
  ) as unknown as DirNode
}

/**
 * Parameters for `buildEntryTree` — grouped into an object to avoid positional ambiguity.
 *
 * @private
 */
interface BuildEntryTreeParams {
  readonly node: DirNode
  readonly prefix: string
  readonly titleFrom: 'auto' | 'filename' | 'heading' | 'frontmatter'
  readonly titleTransform: Section['titleTransform']
  readonly sort: Section['sort']
  readonly collapsible: boolean | undefined
  readonly indexFile: string
  readonly ctx: SyncContext
  readonly frontmatter: Frontmatter
  readonly depth: number
}

/**
 * Recursively convert a DirNode tree into ResolvedEntry[].
 *
 * The `indexFile` (default `"overview"`) in each directory becomes the section
 * header page and is excluded from the child list to avoid duplication.
 *
 * @private
 * @param params - Tree building parameters including node, prefix, and context
 * @returns Resolved entries for all files and subdirectories
 */
async function buildEntryTree(params: BuildEntryTreeParams): Promise<ResolvedEntry[]> {
  const {
    node,
    prefix,
    titleFrom,
    titleTransform,
    sort,
    collapsible,
    indexFile,
    ctx,
    frontmatter,
    depth,
  } = params

  // 1. Files at this level — exclude the index file (it becomes the section header)
  const nonIndexFiles = node.files.filter(
    (file) => path.basename(file, path.extname(file)) !== indexFile
  )

  const fileEntries = await Promise.all(
    nonIndexFiles.map(async (file) => {
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

  // 2. Subdirectories become nested sections
  const subdirEntries = await Promise.all(
    [...node.subdirs].map(async ([dirName, subNode]) => {
      const subPrefix = `${prefix}/${dirName}`

      // Check for index file in this subdirectory (.md or .mdx)
      const indexFilePath = subNode.files.find(
        (f) => path.basename(f, path.extname(f)) === indexFile
      )

      const { sectionTitle, sectionPage } = await resolveSubdirSection({
        indexFilePath,
        dirName,
        subPrefix,
        indexFile,
        titleFrom,
        titleTransform,
        ctx,
        frontmatter,
      })

      const children = await buildEntryTree({
        node: subNode,
        prefix: subPrefix,
        titleFrom,
        titleTransform,
        sort,
        collapsible,
        indexFile,
        ctx,
        frontmatter,
        depth: depth + 1,
      })

      const sorted = sortEntries(children, sort)

      // Explicit collapsible wins, otherwise auto-collapse below top level
      const autoEffectiveCollapsible = resolveAutoCollapsible(depth)
      const effectiveCollapsible = collapsible ?? autoEffectiveCollapsible

      const sectionLink = resolveSectionLink(indexFilePath, subPrefix, indexFile)

      return {
        title: sectionTitle,
        link: sectionLink,
        collapsible: effectiveCollapsible,
        items: sorted,
        page: sectionPage,
      } satisfies ResolvedEntry
    })
  )

  return sortEntries([...fileEntries, ...subdirEntries], sort)
}

/**
 * Parameters for `resolveSubdirSection`.
 *
 * @private
 */
interface ResolveSubdirSectionParams {
  readonly indexFilePath: string | undefined
  readonly dirName: string
  readonly subPrefix: string
  readonly indexFile: string
  readonly titleFrom: 'auto' | 'filename' | 'heading' | 'frontmatter'
  readonly titleTransform: Section['titleTransform']
  readonly ctx: SyncContext
  readonly frontmatter: Frontmatter
}

/**
 * Resolve the section title and optional page for a subdirectory entry.
 *
 * When an index file exists, derives the section heading from it and
 * creates a page entry. Otherwise falls back to kebab-to-title of the
 * directory name.
 *
 * @private
 * @param params - Subdirectory resolution parameters
 * @returns Object with section title and optional page data
 */
async function resolveSubdirSection(
  params: ResolveSubdirSectionParams
): Promise<{ sectionTitle: string; sectionPage: ResolvedEntry['page'] | undefined }> {
  const {
    indexFilePath,
    dirName,
    subPrefix,
    indexFile,
    titleFrom,
    titleTransform,
    ctx,
    frontmatter,
  } = params

  if (indexFilePath) {
    const ext = sourceExt(indexFilePath)
    const sourcePath = path.resolve(ctx.repoRoot, indexFilePath)
    const rawTitle = await deriveText(sourcePath, dirName, titleFrom)
    const sectionTitle = match(titleTransform)
      .with(P.nonNullable, (t) => t(rawTitle, dirName))
      .otherwise(() => rawTitle)
    const sectionPage: ResolvedEntry['page'] = {
      source: sourcePath,
      outputPath: linkToOutputPath(`${subPrefix}/${indexFile}`, ext),
      frontmatter,
    }
    return { sectionTitle, sectionPage }
  }
  const rawTitle = kebabToTitle(dirName)
  const sectionTitle = match(titleTransform)
    .with(P.nonNullable, (t) => t(rawTitle, dirName))
    .otherwise(() => rawTitle)
  return { sectionTitle, sectionPage: undefined }
}

/**
 * Determine whether a section should be auto-collapsed based on depth.
 *
 * @private
 * @param depth - Current nesting depth
 * @returns True for depths greater than 0, undefined otherwise
 */
function resolveAutoCollapsible(depth: number): true | undefined {
  if (depth > 0) {
    return true as const
  }
  return undefined
}

/**
 * Resolve the section link when an index file exists.
 *
 * @private
 * @param indexFilePath - Path to the index file, or undefined
 * @param subPrefix - URL prefix for the subdirectory
 * @param indexFile - Index file name (e.g. 'overview')
 * @returns Link to the index page, or undefined
 */
function resolveSectionLink(
  indexFilePath: string | undefined,
  subPrefix: string,
  indexFile: string
): string | undefined {
  if (indexFilePath !== null && indexFilePath !== undefined) {
    return `${subPrefix}/${indexFile}`
  }
  return undefined
}
