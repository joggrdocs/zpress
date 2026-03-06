import { log } from '@clack/prompts'

import type { ZpressConfig, NavItem } from '../../types.ts'
import type { ResolvedEntry, SidebarItem } from '../types.ts'

/**
 * Build a SidebarItem from a resolved entry with optional icon.
 */
function buildSidebarEntry(entry: ResolvedEntry, icon: string | undefined): SidebarItem {
  if (entry.items && entry.items.length > 0) {
    return {
      text: entry.text,
      items: generateSidebar(entry.items),
      ...maybeCollapsed(entry.collapsible),
      ...maybeLink(entry.link),
      ...maybeIcon(icon),
    }
  }

  if (entry.link === null || entry.link === undefined) {
    log.error(`[zpress] Leaf entry "${entry.text}" has no link — skipping`)
    return { text: entry.text }
  }

  return {
    text: entry.text,
    link: entry.link,
    ...maybeIcon(icon),
  }
}

/**
 * Convert resolved entry tree to Rspress sidebar config.
 *
 * Leaf pages are placed before sections (directories) at every level.
 *
 * @param entries - Resolved entry tree from the sync engine
 * @param icons - Optional map of section text to Iconify identifier (applied to top-level items only)
 * @returns Rspress sidebar items with optional icon identifier attached
 */
export function generateSidebar(
  entries: readonly ResolvedEntry[],
  icons?: Map<string, string>
): SidebarItem[] {
  const visible = entries.filter((e) => !e.hidden)
  const pages = visible.filter((e) => !e.items || e.items.length === 0)
  const sections = visible.filter((e) => e.items && e.items.length > 0)

  return [...pages, ...sections].map((entry) => {
    const icon = resolveIcon(icons, entry.text)
    return buildSidebarEntry(entry, icon)
  })
}

/**
 * Build a NavItem from a resolved entry with optional icon.
 */
function buildNavEntry(entry: ResolvedEntry, icon: string | undefined): NavItem {
  const link = resolveLink(entry)
  const children = resolveChildren(entry)

  return {
    text: entry.text,
    link,
    ...maybeIcon(icon),
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
 * @param icons - Map of section text to raw Iconify icon identifiers
 * @returns Rspress nav items array
 */
export function generateNav(
  config: ZpressConfig,
  resolved: readonly ResolvedEntry[],
  icons: Map<string, string>
): NavItem[] {
  if (config.nav !== 'auto' && config.nav !== undefined) {
    return [...config.nav]
  }

  // Auto: first 3 non-isolated sections (matching home page features),
  // plus all isolated sections (workspace dropdowns).
  const visible = resolved.filter((e) => !e.hidden)
  const nonIsolated = visible.filter((e) => !e.isolated).slice(0, 3)
  const isolated = visible.filter((e) => e.isolated)

  return [...nonIsolated, ...isolated]
    .map((entry) => buildNavEntry(entry, icons.get(entry.text)))
    .filter((item) => item.link !== undefined)
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

function maybeIcon(icon: string | undefined): { icon?: string } {
  if (icon) {
    return { icon }
  }
  return {}
}

function resolveIcon(icons: Map<string, string> | undefined, text: string): string | undefined {
  if (icons) {
    return icons.get(text)
  }
  return undefined
}

function resolveLink(entry: ResolvedEntry): string | undefined {
  if (entry.link) {
    return entry.link
  }
  return findFirstLink(entry)
}

function resolveChildren(entry: ResolvedEntry): NavItem[] | undefined {
  if (entry.isolated && entry.items && entry.items.length > 0) {
    return entry.items
      .filter((child) => !child.hidden)
      .map(
        (child): NavItem => ({
          text: child.text,
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

function maybeChildren(children: NavItem[] | undefined): { items?: NavItem[] } {
  if (children && children.length > 0) {
    return { items: children }
  }
  return {}
}
