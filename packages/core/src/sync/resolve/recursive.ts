import path from 'node:path'

import { log } from '@clack/prompts'
import fg from 'fast-glob'
import { match, P } from 'ts-pattern'

import type { Entry, Frontmatter } from '../../types.ts'
import type { ResolvedEntry, SyncContext } from '../types.ts'
import { extractBaseDir, linkToOutputPath, sourceExt } from './path.ts'
import { sortEntries } from './sort.ts'
import { deriveText, kebabToTitle } from './text.ts'

// ── Recursive glob resolution ────────────────────────────────

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
 * Resolve a recursive glob pattern into a nested entry tree.
 *
 * Scans all files matching the glob, groups them by directory structure,
 * and produces a nested `ResolvedEntry` tree mirroring the filesystem.
 *
 * @param entry - Config entry with a recursive glob `from` pattern
 * @param ctx - Sync context (provides repo root, exclude patterns, quiet flag)
 * @param frontmatter - Merged frontmatter inherited from parent entries
 * @param depth - Current nesting depth for collapsible auto-detection
 * @returns Flat or nested resolved entries matching the glob
 */
export async function resolveRecursiveGlob(
  entry: Entry,
  ctx: SyncContext,
  frontmatter: Frontmatter,
  depth: number
): Promise<ResolvedEntry[]> {
  const ignore = [...(ctx.config.exclude ?? []), ...(entry.exclude ?? [])]
  const indexFile = entry.indexFile ?? 'overview'

  if (entry.from === null || entry.from === undefined) {
    log.error('[zpress] resolveRecursiveGlob called without entry.from')
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

  const baseDir = extractBaseDir(entry.from)
  const prefix = entry.prefix ?? ''
  const textFrom = entry.textFrom ?? 'filename'

  const root = buildDirTree(files, baseDir)
  return buildEntryTree({
    node: root,
    prefix,
    textFrom,
    textTransform: entry.textTransform,
    sort: entry.sort,
    collapsible: entry.collapsible,
    indexFile,
    ctx,
    frontmatter,
    depth,
  })
}

/**
 * Group a flat file list into a directory tree.
 *
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
 */
interface BuildEntryTreeParams {
  readonly node: DirNode
  readonly prefix: string
  readonly textFrom: 'filename' | 'heading' | 'frontmatter'
  readonly textTransform: Entry['textTransform']
  readonly sort: Entry['sort']
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
 */
async function buildEntryTree(params: BuildEntryTreeParams): Promise<ResolvedEntry[]> {
  const {
    node,
    prefix,
    textFrom,
    textTransform,
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

  // 2. Subdirectories become nested sections
  const subdirEntries = await Promise.all(
    [...node.subdirs].map(async ([dirName, subNode]) => {
      const subPrefix = `${prefix}/${dirName}`

      // Check for index file in this subdirectory (.md or .mdx)
      const indexFilePath = subNode.files.find(
        (f) => path.basename(f, path.extname(f)) === indexFile
      )

      const { sectionText, sectionPage } = await resolveSubdirSection({
        indexFilePath,
        dirName,
        subPrefix,
        indexFile,
        textFrom,
        textTransform,
        ctx,
        frontmatter,
      })

      const children = await buildEntryTree({
        node: subNode,
        prefix: subPrefix,
        textFrom,
        textTransform,
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
        text: sectionText,
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
 */
interface ResolveSubdirSectionParams {
  readonly indexFilePath: string | undefined
  readonly dirName: string
  readonly subPrefix: string
  readonly indexFile: string
  readonly textFrom: 'filename' | 'heading' | 'frontmatter'
  readonly textTransform: Entry['textTransform']
  readonly ctx: SyncContext
  readonly frontmatter: Frontmatter
}

/**
 * Resolve the section text and optional page for a subdirectory entry.
 *
 * When an index file exists, derives the section heading from it and
 * creates a page entry. Otherwise falls back to kebab-to-title of the
 * directory name.
 */
async function resolveSubdirSection(
  params: ResolveSubdirSectionParams
): Promise<{ sectionText: string; sectionPage: ResolvedEntry['page'] | undefined }> {
  const {
    indexFilePath,
    dirName,
    subPrefix,
    indexFile,
    textFrom,
    textTransform,
    ctx,
    frontmatter,
  } = params

  if (indexFilePath) {
    const ext = sourceExt(indexFilePath)
    const sourcePath = path.resolve(ctx.repoRoot, indexFilePath)
    const rawText = await deriveText(sourcePath, dirName, textFrom)
    const sectionText = match(textTransform)
      .with(P.nonNullable, (t) => t(rawText, dirName))
      .otherwise(() => rawText)
    const sectionPage: ResolvedEntry['page'] = {
      source: sourcePath,
      outputPath: linkToOutputPath(`${subPrefix}/${indexFile}`, ext),
      frontmatter,
    }
    return { sectionText, sectionPage }
  }
  const rawText = kebabToTitle(dirName)
  const sectionText = match(textTransform)
    .with(P.nonNullable, (t) => t(rawText, dirName))
    .otherwise(() => rawText)
  return { sectionText, sectionPage: undefined }
}

// ── Private helpers ───────────────────────────────────────────

function resolveAutoCollapsible(depth: number): true | undefined {
  if (depth > 0) {
    return true as const
  }
  return undefined
}

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
