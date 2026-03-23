import { log } from '@clack/prompts'

import type { NavItem, ZpressConfig } from '../../types.ts'
import { isEntrySlug } from '../resolve/path.ts'
import type { ResolvedEntry, RspressNavItem, SidebarItem } from '../types.ts'

/**
 * Convert resolved entry tree to Rspress sidebar config.
 *
 * Leaf pages are placed before sections (directories) at every level.
 *
 * @param entries - Resolved entry tree from the sync engine
 * @returns Rspress sidebar items
 */
export function generateSidebar(entries: readonly ResolvedEntry[]): SidebarItem[] {
  const visible = entries.filter((e) => !e.hidden)
  const pages = visible.filter((e) => !e.items || e.items.length === 0)
  const sections = visible.filter((e) => e.items && e.items.length > 0)

  return [...pages, ...sections].flatMap((entry) => {
    const item = buildSidebarEntry(entry)
    if (item === undefined) {
      return []
    }
    return [item]
  })
}

/**
 * Generate Rspress nav config from resolved tree.
 *
 * When `config.nav` is `"auto"` (or omitted), produces one nav item per
 * top-level section, linking to its first child page.
 *
 * @param config - zpress config (provides explicit nav or `"auto"`)
 * @param resolved - Resolved entry tree from the sync engine
 * @returns Rspress nav items array
 */
export function generateNav(
  config: ZpressConfig,
  resolved: readonly ResolvedEntry[]
): RspressNavItem[] {
  if (config.nav !== 'auto' && config.nav !== undefined) {
    return config.nav.map(mapNavItem)
  }

  // Auto: first 3 non-standalone sections (matching home page features),
  // plus all standalone sections (workspace dropdowns).
  const visible = resolved.filter((e) => !e.hidden)
  const nonStandalone = visible.filter((e) => !e.standalone).slice(0, 3)
  const standalone = visible.filter((e) => e.standalone)

  return [...nonStandalone, ...standalone]
    .map(buildNavEntry)
    .filter((item) => item.link !== undefined)
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Build a SidebarItem from a resolved entry.
 *
 * @private
 * @param entry - Resolved entry to convert
 * @returns Sidebar item for Rspress config
 */
function buildSidebarEntry(entry: ResolvedEntry): SidebarItem | undefined {
  if (entry.items && entry.items.length > 0) {
    const dedupedItems = filterDuplicateChildLink(entry.items, entry.link)
    return {
      text: entry.title,
      items: generateSidebar(dedupedItems),
      ...maybeCollapsed(entry.collapsible),
      ...maybeLink(entry.link),
    }
  }

  if (!entry.link || entry.link.trim().length === 0) {
    log.error(`[zpress] Leaf entry "${entry.title}" has no link — skipping`)
    return undefined
  }

  return {
    text: entry.title,
    link: entry.link,
  }
}

/**
 * Build a NavItem from a resolved entry.
 *
 * @private
 * @param entry - Resolved entry to convert
 * @returns Rspress nav item with text, link, and optional children
 */
function buildNavEntry(entry: ResolvedEntry): RspressNavItem {
  const link = resolveLink(entry)
  const children = resolveChildren(entry)

  return {
    text: entry.title,
    link,
    ...maybeChildren(children),
  }
}

/**
 * Recursively find the first link in an entry tree.
 *
 * @private
 * @param entry - Entry to search for a link
 * @returns First link found, or undefined
 */
function findFirstLink(entry: ResolvedEntry): string | undefined {
  if (entry.link) {
    return entry.link
  }
  if (entry.items) {
    const mapped = entry.items.map(findFirstLink)
    return mapped.find(Boolean)
  }
  return undefined
}

/**
 * Return a collapsed property object if collapsible is true.
 *
 * @private
 * @param collapsible - Whether the sidebar group is collapsible
 * @returns Object with collapsed property, or empty object
 */
function maybeCollapsed(collapsible: boolean | undefined): { collapsed?: true } {
  if (collapsible) {
    return { collapsed: true as const }
  }
  return {}
}

/**
 * Return a link property object if link is defined.
 *
 * @private
 * @param link - Optional link string
 * @returns Object with link property, or empty object
 */
function maybeLink(link: string | undefined): { link?: string } {
  if (link) {
    return { link }
  }
  return {}
}

/**
 * Find a child entry whose link ends with a known entry-page slug.
 *
 * Checks children (one level) for links matching entry slugs (overview,
 * introduction, intro, index, readme). Returns the first match found,
 * preferring earlier slugs in priority order.
 *
 * @private
 * @param items - Direct children of a section
 * @returns Link of the first matching entry page, or undefined
 */
function findEntryPageLink(items: readonly ResolvedEntry[]): string | undefined {
  const entryChildren = items
    .filter((c) => c.link)
    .filter((c) => isEntrySlug(c.link as string))
  if (entryChildren.length === 0) {
    return undefined
  }
  return entryChildren[0].link
}

/**
 * Resolve the link for a nav entry.
 *
 * For sections with children, prefers a child whose slug matches a known
 * entry-page name (overview, introduction, index, readme) so the nav
 * points to an actual content page rather than a generated landing page.
 * Falls back to the section's own link, then the first child link.
 *
 * @private
 * @param entry - Resolved entry to extract link from
 * @returns Link string or undefined
 */
function resolveLink(entry: ResolvedEntry): string | undefined {
  if (entry.items && entry.items.length > 0) {
    const entryPage = findEntryPageLink(entry.items)
    if (entryPage) {
      return entryPage
    }
  }
  if (entry.link) {
    return entry.link
  }
  return findFirstLink(entry)
}

/**
 * Resolve children for standalone nav dropdowns (one level deep).
 * Only standalone sections produce dropdown children — nested sub-items
 * within those children are intentionally flattened to { text, link }.
 *
 * @private
 * @param entry - Resolved entry to check for standalone children
 * @returns Array of nav items for dropdown, or undefined
 */
function resolveChildren(entry: ResolvedEntry): readonly RspressNavItem[] | undefined {
  if (entry.standalone && entry.items && entry.items.length > 0) {
    return entry.items
      .filter((child) => !child.hidden)
      .map(
        (child): RspressNavItem => ({
          text: child.title,
          link: resolveChildLink(child),
        })
      )
      .filter((child) => child.link !== undefined)
  }
  return undefined
}

/**
 * Resolve the link for a child nav entry, falling back to first nested link.
 *
 * @private
 * @param child - Child resolved entry
 * @returns Link string or undefined
 */
function resolveChildLink(child: ResolvedEntry): string | undefined {
  if (child.link) {
    return child.link
  }
  return findFirstLink(child)
}

/**
 * Return an items property object if children are present.
 *
 * @private
 * @param children - Optional array of nav items
 * @returns Object with items property, or empty object
 */
function maybeChildren(children: readonly RspressNavItem[] | undefined): {
  items?: readonly RspressNavItem[]
} {
  if (children && children.length > 0) {
    return { items: children }
  }
  return {}
}

/**
 * Return an activeMatch property object if defined on the nav item.
 *
 * @private
 * @param item - Nav item config from user
 * @returns Object with activeMatch property, or empty object
 */
function maybeActiveMatch(item: NavItem): Pick<RspressNavItem, 'activeMatch'> {
  if (item.activeMatch) {
    return { activeMatch: item.activeMatch }
  }
  return {}
}

/**
 * Return an items property object if the nav item has children.
 *
 * @private
 * @param item - Nav item config from user
 * @returns Object with recursively mapped items, or empty object
 */
function maybeItems(item: NavItem): Pick<RspressNavItem, 'items'> {
  if (item.items) {
    return { items: item.items.map(mapNavItem) }
  }
  return {}
}

/**
 * Map a user-facing NavItem (title) to an Rspress NavItem (text).
 *
 * @private
 * @param item - User-facing nav item config
 * @returns Rspress-compatible nav item
 */
function mapNavItem(item: NavItem): RspressNavItem {
  return {
    text: item.title,
    link: item.link,
    ...maybeActiveMatch(item),
    ...maybeItems(item),
  }
}

/**
 * Remove any direct child whose link duplicates the parent section link.
 *
 * When a child (e.g. "Overview") has the same link as its parent group,
 * it is redundant in the sidebar — the group header already navigates there.
 * Keeping both causes double-highlighting of the active state.
 *
 * @private
 * @param items - Direct child entries
 * @param parentLink - Parent section link to check against
 * @returns Filtered child entries with duplicates removed
 */
function filterDuplicateChildLink(
  items: readonly ResolvedEntry[],
  parentLink: string | undefined
): readonly ResolvedEntry[] {
  if (!parentLink) {
    return items
  }
  return items.filter((item) => item.link !== parentLink)
}
