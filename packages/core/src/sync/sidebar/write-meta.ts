/**
 * Write Rspress `_meta.json` and `_nav.json` files to the content directory.
 *
 * These files enable Rspress's native sidebar/nav auto-discovery with HMR
 * support, replacing the static `.generated/sidebar.json` approach.
 *
 * @see https://rspress.dev/guide/basic/auto-nav-sidebar
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import type { OpenAPISidebarEntry } from '../openapi.ts'
import type { ResolvedEntry, RspressNavItem, SidebarItem } from '../types.ts'
import type { MetaItem, MetaSectionHeaderItem } from './meta.ts'
import { buildMetaDirectories } from './meta.ts'

/**
 * Options for writing meta files.
 */
interface WriteMetaOptions {
  /**
   * Absolute path to the content output directory.
   */
  readonly contentDir: string
  /**
   * Resolved entry tree from the sync engine.
   */
  readonly entries: readonly ResolvedEntry[]
  /**
   * Generated nav items for `_nav.json`.
   */
  readonly nav: readonly RspressNavItem[]
  /**
   * OpenAPI sidebar entries to write as `_meta.json` in their prefix directories.
   */
  readonly openapiEntries: readonly OpenAPISidebarEntry[]
}

/**
 * Write `_meta.json` files for all section directories and `_nav.json` at root.
 *
 * Creates a `_meta.json` in each directory that has sidebar items, controlling
 * the ordering and labels. Also writes `_nav.json` at the content root for
 * Rspress navigation auto-discovery.
 *
 * OpenAPI directories receive flat `_meta.json` files with section-header
 * items for tag groups.
 *
 * @param options - Content directory, resolved entries, nav items, and OpenAPI entries
 * @returns Promise that resolves when all files are written
 */
export async function writeMetaFiles(options: WriteMetaOptions): Promise<void> {
  const { contentDir, entries, nav, openapiEntries } = options

  const sectionDirectories = buildMetaDirectories(entries)
  const openapiDirectories = openapiEntries.flatMap(buildOpenapiMetaDirectory)

  const allDirectories = [...sectionDirectories, ...openapiDirectories]

  await Promise.all([
    // Write _meta.json for each directory
    ...allDirectories.map(async (dir) => {
      const metaPath = path.resolve(contentDir, dir.dirPath, '_meta.json')
      await fs.mkdir(path.dirname(metaPath), { recursive: true })
      await fs.writeFile(metaPath, JSON.stringify(dir.items, null, 2), 'utf8')
    }),
    // Write _nav.json at content root
    fs.writeFile(path.resolve(contentDir, '_nav.json'), JSON.stringify(nav, null, 2), 'utf8'),
  ])
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Intermediate directory structure matching {@link import('./meta.ts').MetaDirectory}.
 *
 * @private
 */
interface MetaDirectory {
  readonly dirPath: string
  readonly items: readonly MetaItem[]
}

/**
 * Build a `_meta.json` directory entry for an OpenAPI sidebar.
 *
 * Flattens the nested tag-group sidebar structure into a flat list
 * using `section-header` items for tag labels and `file` items for operations.
 * The index page (overview) is listed first.
 *
 * @private
 * @param entry - OpenAPI sidebar entry with prefix and sidebar items
 * @returns MetaDirectory for the OpenAPI prefix directory
 */
function buildOpenapiMetaDirectory(entry: OpenAPISidebarEntry): readonly MetaDirectory[] {
  const dirPath = stripLeadingSlash(entry.prefix)
  if (dirPath === '') {
    return []
  }

  const items = flattenOpenapiSidebar(entry.sidebar, entry.prefix)

  return [{ dirPath, items }]
}

/**
 * Flatten a nested OpenAPI sidebar into ordered `_meta.json` items.
 *
 * The root sidebar item (e.g. "API Reference") is represented by the
 * index page. Each tag group becomes a `section-header` followed by
 * its operation file items.
 *
 * @private
 * @param sidebar - Nested sidebar items from OpenAPI sync
 * @param prefix - URL prefix for the OpenAPI section
 * @returns Flat array of meta items
 */
function flattenOpenapiSidebar(
  sidebar: readonly SidebarItem[],
  prefix: string
): readonly MetaItem[] {
  // The root sidebar typically has one item: { text: "API Reference", items: [tag groups] }
  // Extract the tag groups from the root item's children
  const tagGroups = sidebar.flatMap((root) => root.items ?? [])

  const indexItem: MetaItem = { type: 'file', name: 'index', label: 'Overview' }

  const tagItems = tagGroupsToMetaItems(tagGroups, prefix)

  return [indexItem, ...tagItems]
}

/**
 * Convert OpenAPI tag groups to flat meta items with section headers.
 *
 * Each tag group produces a section-header followed by file items
 * for each operation in that group.
 *
 * @private
 * @param groups - Tag group sidebar items
 * @param prefix - URL prefix for extracting file stems
 * @returns Flat array of meta items
 */
function tagGroupsToMetaItems(groups: readonly SidebarItem[], prefix: string): readonly MetaItem[] {
  return groups.reduce<MetaItem[]>((acc, group) => {
    const header: MetaSectionHeaderItem = { type: 'section-header', label: group.text }
    const operations: readonly MetaItem[] = (group.items ?? []).flatMap((op) => {
      const stem = extractStemFromLink(op.link, prefix)
      if (stem === null) {
        return []
      }
      return [{ type: 'file' as const, name: stem, label: op.text }]
    })
    // oxlint-disable-next-line unicorn/no-accumulating-spread -- small bounded arrays (tag count)
    return [...acc, header, ...operations]
  }, [])
}

/**
 * Extract a filename stem from a sidebar link, removing the prefix.
 *
 * @private
 * @param link - Sidebar link (e.g. "/api/list-users")
 * @param prefix - URL prefix to strip (e.g. "/api")
 * @returns Filename stem (e.g. "list-users") or null
 */
function extractStemFromLink(link: string | undefined, prefix: string): string | null {
  if (!link) {
    return null
  }
  const cleanPrefix = stripLeadingSlash(prefix)
  const cleanLink = stripLeadingSlash(link)
  if (cleanLink.startsWith(`${cleanPrefix}/`)) {
    return cleanLink.slice(cleanPrefix.length + 1)
  }
  return cleanLink.split('/').at(-1) ?? null
}

/**
 * Strip the leading slash from a path.
 *
 * @private
 * @param p - Path string
 * @returns Path without leading slash
 */
function stripLeadingSlash(p: string): string {
  if (p.startsWith('/')) {
    return p.slice(1)
  }
  return p
}
