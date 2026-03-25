import { match, P } from 'ts-pattern'

import type { OpenAPISidebarEntry } from '../openapi.ts'
import type { ResolvedEntry, SidebarItem } from '../types.ts'
import { generateSidebar } from './index.ts'

/**
 * Build a multi-sidebar record from resolved entries.
 *
 * Root entries go under `"/"`, each standalone section gets its own namespace
 * keyed by `link`.
 * Keys are sorted by string length (descending) for Rspress matching precedence.
 *
 * @param resolved - Fully resolved entry tree
 * @param openapiEntries - OpenAPI sidebar entries keyed by prefix
 * @returns Sorted sidebar record ready for JSON serialization
 */
export function buildMultiSidebar(
  resolved: readonly ResolvedEntry[],
  openapiEntries: readonly OpenAPISidebarEntry[]
): Record<string, unknown[]> {
  const rootEntries = resolved.filter((e) => !e.standalone)
  const standaloneEntries = resolved.filter((e) => e.standalone && e.link)

  const docsSidebar = generateSidebar(rootEntries)

  // Pre-compute children per standalone entry for building grouped sidebars
  const childrenByLink = new Map<string, SidebarItem[]>(
    standaloneEntries.map((entry) => {
      const link = entry.link as string
      const items = resolveEntryItems(entry.items)
      return [link, generateSidebar(items)]
    })
  )

  const standaloneSidebar: Record<string, unknown[]> = Object.fromEntries(
    standaloneEntries.flatMap((entry) => {
      const entryLink = entry.link as string
      const children = resolveChildrenByLink(childrenByLink, entryLink)

      // Discover sibling standalone sections that are children of this entry's parent
      const parentLink = resolveParentLink(entryLink)
      const parentEntry = match(parentLink)
        .with(P.nonNullable, (pl) => standaloneEntries.find((e) => e.link === pl))
        .otherwise(() => {})

      const isChild = parentEntry !== null && parentEntry !== undefined && parentEntry !== entry

      const landing: SidebarItem = {
        text: entry.title,
        link: entryLink,
      }

      const sidebarItems = match(isChild)
        .with(true, () => {
          const pe = parentEntry as ResolvedEntry
          const peLink = pe.link as string
          const parentLanding: SidebarItem = {
            text: pe.title,
            link: peLink,
          }

          const siblings = standaloneEntries.filter((sib) => {
            const sibLink = sib.link as string
            return sib.link !== peLink && sibLink.startsWith(`${peLink}/`)
          })

          const siblingGroups: SidebarItem[] = siblings.map((sib): SidebarItem => {
            const sibLink = sib.link as string
            const sibChildren = resolveChildrenByLink(childrenByLink, sibLink)
            const isCurrent = sib.link === entry.link

            return buildSidebarGroup(sib.title, sibLink, sibChildren, !isCurrent)
          })

          return [parentLanding, ...siblingGroups]
        })
        .otherwise(() => {
          const childGroups: SidebarItem[] = match(children.length === 0)
            .with(true, () =>
              standaloneEntries
                .filter((child) => {
                  const childLink = child.link as string
                  return child.link !== entry.link && childLink.startsWith(`${entryLink}/`)
                })
                .map((child): SidebarItem => {
                  const childLink = child.link as string
                  const childItems = resolveChildrenByLink(childrenByLink, childLink)
                  return buildSidebarGroup(child.title, childLink, childItems, true)
                })
            )
            .otherwise(() => [])

          // Skip landing when a child already links to the same page
          const firstChildLink = resolveFirstChildLink(children)
          const items = match(firstChildLink === entryLink)
            .with(true, () => [...children, ...childGroups])
            .otherwise(() => [landing, ...children, ...childGroups])

          return items
        })

      const orphanedKeys = collectOrphanedChildLinks(entry.items, entryLink).flatMap(
        (childLink) =>
          [
            [`${childLink}/`, sidebarItems],
            [childLink, sidebarItems],
          ] as const
      )

      return [
        [`${entryLink}/`, sidebarItems],
        [entryLink, sidebarItems],
        ...orphanedKeys,
      ] as const
    })
  )

  // Partition OpenAPI entries: workspace-scoped go into parent standalone sidebar,
  // root-scoped get their own sidebar namespace
  const standaloneLinks = new Set(standaloneEntries.map((e) => e.link as string))
  const workspaceOpenapi = openapiEntries.filter((entry) =>
    [...standaloneLinks].some((link) => entry.prefix.startsWith(`${link}/`))
  )
  const rootOpenapi = openapiEntries.filter(
    (entry) => ![...standaloneLinks].some((link) => entry.prefix.startsWith(`${link}/`))
  )

  // Inject workspace-scoped OpenAPI sidebar items into matching standalone sidebars
  const mergedIsolatedSidebar = mergeOpenapiIntoStandalone(standaloneSidebar, workspaceOpenapi)

  const rootOpenapiSidebarRecord = buildOpenapiSidebarEntries(rootOpenapi)

  const sidebar: Record<string, unknown[]> = {
    '/': docsSidebar,
    ...mergedIsolatedSidebar,
    ...rootOpenapiSidebarRecord,
  }

  // Sort sidebar keys by string length (descending)
  const sortedKeys = Object.keys(sidebar).toSorted((a, b) => b.length - a.length)
  return Object.fromEntries(sortedKeys.map((key) => [key, sidebar[key]]))
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Collect child links that do not fall under the parent link prefix.
 *
 * When a standalone section at `/packages` has children at `/libs/ai`,
 * those children are "orphaned" — Rspress prefix matching on `/packages/`
 * will never reach them. Returns only the links that need extra sidebar keys.
 *
 * @private
 * @param items - Optional child entries of a standalone section
 * @param parentLink - The standalone parent's link
 * @returns Array of child links that are outside the parent prefix
 */
function collectOrphanedChildLinks(
  items: readonly ResolvedEntry[] | undefined,
  parentLink: string
): readonly string[] {
  if (!items) {
    return []
  }
  const prefix = `${parentLink}/`
  return items
    .filter((child) => child.link !== undefined && child.link !== null)
    .map((child) => child.link as string)
    .filter((childLink) => !childLink.startsWith(prefix))
}

/**
 * Unwrap optional entry items to a concrete array.
 *
 * @private
 * @param items - Optional resolved entry items
 * @returns Array of entries, or empty array if undefined
 */
function resolveEntryItems(items: readonly ResolvedEntry[] | undefined): readonly ResolvedEntry[] {
  if (items) {
    return [...items]
  }
  return []
}

/**
 * Look up sidebar children for a link, returning empty array if not found.
 *
 * @private
 * @param childrenByLink - Pre-computed map of link to sidebar items
 * @param link - Link key to look up
 * @returns Sidebar items for the link, or empty array
 */
function resolveChildrenByLink(
  childrenByLink: ReadonlyMap<string, SidebarItem[]>,
  link: string
): SidebarItem[] {
  const got = childrenByLink.get(link)
  if (got) {
    return got
  }
  return []
}

/**
 * Derive the parent link by removing the last path segment.
 *
 * @private
 * @param entryLink - Link path to derive parent from
 * @returns Parent link path, or null if at root
 */
function resolveParentLink(entryLink: string): string | null {
  const segments = entryLink.split('/').slice(0, -1).join('/')
  if (segments) {
    return segments
  }
  return null
}

/**
 * Extract the link from the first child sidebar item, if present.
 *
 * @private
 * @param children - Array of sidebar items
 * @returns First child's link, or undefined
 */
function resolveFirstChildLink(children: readonly SidebarItem[]): string | undefined {
  if (children.length > 0 && children[0].link) {
    return children[0].link
  }
  return undefined
}

/**
 * Build a sidebar group item with optional collapsed children.
 *
 * @private
 * @param text - Display text for the group
 * @param link - Link path for the group
 * @param children - Child sidebar items
 * @param collapsed - Whether the group starts collapsed
 * @returns Sidebar item with children if present, or leaf item
 */
function buildSidebarGroup(
  text: string,
  link: string,
  children: readonly SidebarItem[],
  collapsed: boolean
): SidebarItem {
  if (children.length > 0) {
    return { text, link, collapsed, items: children }
  }
  return { text, link }
}

/**
 * Merge workspace-scoped OpenAPI sidebar items into their parent standalone sidebars.
 *
 * For each OpenAPI entry whose prefix starts with an standalone sidebar key,
 * appends the OpenAPI sidebar items to that standalone sidebar. Both trailing-slash
 * and non-trailing-slash variants are updated.
 *
 * @private
 * @param standaloneSidebar - Existing standalone sidebar record
 * @param openapiEntries - Workspace-scoped OpenAPI entries to merge
 * @returns Updated sidebar record with OpenAPI items injected
 */
function mergeOpenapiIntoStandalone(
  standaloneSidebar: Record<string, unknown[]>,
  openapiEntries: readonly OpenAPISidebarEntry[]
): Record<string, unknown[]> {
  if (openapiEntries.length === 0) {
    return standaloneSidebar
  }

  // Build a list of OpenAPI → parent sidebar key pairings
  const trailingSlashKeys = Object.keys(standaloneSidebar).filter((key) => key.endsWith('/'))

  const pairings = openapiEntries.map((entry) => {
    // Find the longest (most specific) matching standalone sidebar key
    const candidates = trailingSlashKeys.filter((key) => entry.prefix.startsWith(key))
    const matchingKey = candidates.toSorted((a, b) => b.length - a.length)[0] ?? null
    return { entry, matchingKey }
  })

  // Fold pairings into a new sidebar record
  return pairings.reduce<Record<string, unknown[]>>(
    (acc, { entry, matchingKey }) => {
      if (matchingKey === null) {
        return acc
      }
      const baseKey = matchingKey.slice(0, -1)
      return Object.assign(acc, {
        [matchingKey]: [...(acc[matchingKey] ?? []), ...entry.sidebar],
        [baseKey]: [...(acc[baseKey] ?? []), ...entry.sidebar],
      })
    },
    { ...standaloneSidebar }
  )
}

/**
 * Build sidebar record entries from OpenAPI sidebar entries.
 * Each entry gets both a trailing-slash and non-trailing-slash key
 * for Rspress matching.
 *
 * @private
 * @param entries - OpenAPI sidebar entries with prefix and sidebar items
 * @returns Record of sidebar items keyed by prefix paths
 */
function buildOpenapiSidebarEntries(
  entries: readonly OpenAPISidebarEntry[]
): Record<string, readonly SidebarItem[]> {
  return Object.fromEntries(
    entries.flatMap(({ prefix, sidebar }) => [
      [`${prefix}/`, [...sidebar]],
      [prefix, [...sidebar]],
    ])
  )
}
