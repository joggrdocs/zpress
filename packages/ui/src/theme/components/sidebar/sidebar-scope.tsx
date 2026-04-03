/**
 * Custom Sidebar component with multi-scope support.
 *
 * Rspress's `_meta.json` auto-discovery generates a single unified sidebar
 * keyed by `"/"`. This component filters the unified sidebar at runtime to
 * isolate standalone sections (e.g. Packages, Contributing) into their own
 * scope while merging the remaining sections into a shared scope.
 *
 * HMR works because `_meta.json` changes trigger Rspress's auto-discovery
 * re-run via `addDependency()` — the sidebar data updates reactively.
 */

import type { SidebarData } from '@rspress/core'
import { useActiveMatcher, usePage, useSidebar } from '@rspress/core/runtime'
import { SidebarList } from '@rspress/core/theme-original'
import type React from 'react'
import { useLayoutEffect, useMemo, useState } from 'react'

import { useZpress } from '../../hooks/use-zpress'

/**
 * Union element of `SidebarData` — sidebar items may be groups, leaf items,
 * dividers, or section headers.
 *
 * @private
 */
type SidebarDataItem = SidebarData[number]

/**
 * Scoped Sidebar that supports standalone section isolation.
 *
 * When the current path matches a standalone scope (e.g. `/packages`),
 * only that section's sidebar items are shown. For all other paths,
 * standalone sections are hidden and the remaining sections form a
 * unified sidebar.
 *
 * @returns React element rendering the filtered sidebar
 */
export function Sidebar(): React.ReactElement {
  const rawSidebarData = useSidebar()
  const activeMatcher = useActiveMatcher()
  const { page } = usePage()
  const { standaloneScopePaths } = useZpress()

  const pathname = page.pagePath
  const scopes = standaloneScopePaths ?? []

  const filteredData = useMemo(
    () => filterByScope(rawSidebarData, pathname, scopes),
    [rawSidebarData, pathname, scopes]
  )

  const [sidebarData, setSidebarData] = useState<SidebarData>(() =>
    initializeCollapsed(structuredClone(filteredData), activeMatcher)
  )

  useLayoutEffect(() => {
    setSidebarData(initializeCollapsed(filteredData, activeMatcher))
  }, [activeMatcher, filteredData])

  return <SidebarList sidebarData={sidebarData} setSidebarData={setSidebarData} />
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Filter sidebar items based on the current path and standalone scopes.
 *
 * @private
 * @param items - Full unified sidebar items
 * @param pathname - Current decoded pathname
 * @param scopes - Standalone scope paths
 * @returns Filtered sidebar items for the active scope
 */
function filterByScope(
  items: SidebarData,
  pathname: string,
  scopes: readonly string[]
): SidebarData {
  if (scopes.length === 0) {
    return [...items]
  }

  const standaloneMatch = scopes.find(
    (scope) => pathname === scope || pathname.startsWith(`${scope}/`)
  )

  const all = [...items]

  if (standaloneMatch) {
    return all.filter((item) => isItemInScope(item, standaloneMatch))
  }

  return all.filter((item) => !scopes.some((scope) => isItemInScope(item, scope)))
}

/**
 * Check whether a sidebar item belongs to a given scope path.
 *
 * Matches when the item's link equals the scope or starts with scope + "/".
 * Dividers and section headers (no link) are never matched.
 *
 * @private
 * @param item - Sidebar item to check
 * @param scope - Scope path (e.g. "/packages")
 * @returns True when the item belongs to the scope
 */
function isItemInScope(item: SidebarDataItem, scope: string): boolean {
  if (!Object.hasOwn(item, 'link')) {
    return false
  }
  const { link } = item as { readonly link?: string }
  if (!link) {
    return false
  }
  return link === scope || link.startsWith(`${scope}/`)
}

/**
 * Walk the sidebar tree and uncollapse groups that contain the active path.
 *
 * Mirrors Rspress's `createInitialSidebar` logic: groups whose descendants
 * match the active route get `collapsed = false` so the active page is
 * visible on initial render.
 *
 * @private
 * @param items - Sidebar items (will be mutated for collapsed state)
 * @param activeMatcher - Function that checks if a link matches the current route
 * @returns The same items array with collapsed state applied
 */
function initializeCollapsed(
  items: SidebarData,
  activeMatcher: (link: string) => boolean
): SidebarData {
  const cache = new WeakMap<SidebarDataItem, boolean>()
  const flat = items.filter(Boolean).flat()
  flat.reduce<null>((_, item) => {
    expandItem(item, activeMatcher, cache)
    return null
  }, null)
  return flat
}

/**
 * Check whether a sidebar item or any of its descendants match the active route.
 *
 * @private
 * @param item - Sidebar item to check
 * @param activeMatcher - Route matcher function
 * @param cache - Memoization cache for match results
 * @returns True when the item or a descendant matches
 */
function isItemActive(
  item: SidebarDataItem,
  activeMatcher: (link: string) => boolean,
  cache: WeakMap<SidebarDataItem, boolean>
): boolean {
  const cached = cache.get(item)
  if (cached !== undefined) {
    return cached
  }
  if (Object.hasOwn(item, 'link')) {
    const { link } = item as { readonly link?: string }
    if (link && activeMatcher(link)) {
      cache.set(item, true)
      return true
    }
  }
  if (Object.hasOwn(item, 'items')) {
    const { items } = item as { readonly items: readonly SidebarDataItem[] }
    const childMatch = items.some((child) => isItemActive(child, activeMatcher, cache))
    if (childMatch) {
      cache.set(item, true)
      return true
    }
  }
  cache.set(item, false)
  return false
}

/**
 * Recursively expand a sidebar item if it contains the active route.
 *
 * @private
 * @param item - Sidebar item to process
 * @param activeMatcher - Route matcher function
 * @param cache - Memoization cache for match results
 */
function expandItem(
  item: SidebarDataItem,
  activeMatcher: (link: string) => boolean,
  cache: WeakMap<SidebarDataItem, boolean>
): void {
  if (Object.hasOwn(item, 'items')) {
    const group = item as { readonly items: readonly SidebarDataItem[]; collapsed?: boolean }
    group.items.reduce<null>((_, child) => {
      expandItem(child, activeMatcher, cache)
      return null
    }, null)
    if (isItemActive(item, activeMatcher, cache)) {
      // oxlint-disable-next-line eslint/no-param-reassign -- intentional mutation matching Rspress's createInitialSidebar
      group.collapsed = false
    }
  }
}
