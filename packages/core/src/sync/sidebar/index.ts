import { log } from '@clack/prompts'

import type { NavItem, ZpressConfig } from '../../types.ts'
import type { ResolvedEntry, RspressNavItem, SidebarItem } from '../types.ts'

/**
 * Build a SidebarItem from a resolved entry.
 */
function buildSidebarEntry(entry: ResolvedEntry): SidebarItem {
  if (entry.items && entry.items.length > 0) {
    return {
      text: entry.title,
      items: generateSidebar(entry.items),
      ...maybeCollapsed(entry.collapsible),
      ...maybeLink(entry.link),
    }
  }

  if (entry.link === null || entry.link === undefined) {
    log.error(`[zpress] Leaf entry "${entry.title}" has no link — skipping`)
    return { text: entry.title }
  }

  return {
    text: entry.title,
    link: entry.link,
  }
}

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

  return [...pages, ...sections].map(buildSidebarEntry)
}

/**
 * Build a NavItem from a resolved entry.
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

  // Auto: first 3 non-isolated sections (matching home page features),
  // plus all isolated sections (workspace dropdowns).
  const visible = resolved.filter((e) => !e.hidden)
  const nonIsolated = visible.filter((e) => !e.isolated).slice(0, 3)
  const isolated = visible.filter((e) => e.isolated)

  return [...nonIsolated, ...isolated].map(buildNavEntry).filter((item) => item.link !== undefined)
}

/**
 * Recursively find the first link in an entry tree.
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

// ── Private helpers ───────────────────────────────────────────

function maybeCollapsed(collapsible: boolean | undefined): { collapsed?: true } {
  if (collapsible) {
    return { collapsed: true as const }
  }
  return {}
}

function maybeLink(link: string | undefined): { link?: string } {
  if (link) {
    return { link }
  }
  return {}
}

function resolveLink(entry: ResolvedEntry): string | undefined {
  if (entry.link) {
    return entry.link
  }
  return findFirstLink(entry)
}

/**
 * Resolve children for isolated nav dropdowns (one level deep).
 * Only isolated sections produce dropdown children — nested sub-items
 * within those children are intentionally flattened to { text, link }.
 */
function resolveChildren(entry: ResolvedEntry): readonly RspressNavItem[] | undefined {
  if (entry.isolated && entry.items && entry.items.length > 0) {
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

function resolveChildLink(child: ResolvedEntry): string | undefined {
  if (child.link) {
    return child.link
  }
  return findFirstLink(child)
}

function maybeChildren(
  children: readonly RspressNavItem[] | undefined,
): { items?: readonly RspressNavItem[] } {
  if (children && children.length > 0) {
    return { items: children }
  }
  return {}
}

/**
 * Map a user-facing NavItem (title) to an Rspress NavItem (text).
 */
function maybeActiveMatch(item: NavItem): Pick<RspressNavItem, 'activeMatch'> {
  if (item.activeMatch) {
    return { activeMatch: item.activeMatch }
  }
  return {}
}

function maybeItems(item: NavItem): Pick<RspressNavItem, 'items'> {
  if (item.items) {
    return { items: item.items.map(mapNavItem) }
  }
  return {}
}

function mapNavItem(item: NavItem): RspressNavItem {
  return {
    text: item.title,
    link: item.link,
    ...maybeActiveMatch(item),
    ...maybeItems(item),
  }
}
