import { match, P } from 'ts-pattern'

import type { OpenAPISidebarEntry } from '../openapi.ts'
import type { ResolvedEntry, SidebarItem } from '../types.ts'
import { generateSidebar } from './index.ts'

/**
 * Build a multi-sidebar record from resolved entries.
 *
 * Root entries go under `"/"`, each isolated section gets its own namespace
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
  const rootEntries = resolved.filter((e) => !e.isolated)
  const isolatedEntries = resolved.filter((e) => e.isolated && e.link)

  const docsSidebar = generateSidebar(rootEntries)

  // Pre-compute children per isolated entry for building grouped sidebars
  const childrenByLink = new Map<string, SidebarItem[]>(
    isolatedEntries.map((entry) => {
      const link = entry.link as string
      const items = resolveEntryItems(entry.items)
      return [link, generateSidebar(items)]
    })
  )

  const isolatedSidebar: Record<string, unknown[]> = Object.fromEntries(
    isolatedEntries.flatMap((entry) => {
      const entryLink = entry.link as string
      const children = resolveChildrenByLink(childrenByLink, entryLink)

      // Discover sibling isolated sections that are children of this entry's parent
      const parentLink = resolveParentLink(entryLink)
      const parentEntry = match(parentLink)
        .with(P.nonNullable, (pl) => isolatedEntries.find((e) => e.link === pl))
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

          const siblings = isolatedEntries.filter((sib) => {
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
              isolatedEntries
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

      return [
        [`${entryLink}/`, sidebarItems],
        [entryLink, sidebarItems],
      ] as const
    })
  )

  // Partition OpenAPI entries: workspace-scoped go into parent isolated sidebar,
  // root-scoped get their own sidebar namespace
  const isolatedLinks = new Set(isolatedEntries.map((e) => e.link as string))
  const workspaceOpenapi = openapiEntries.filter((entry) =>
    [...isolatedLinks].some((link) => entry.prefix.startsWith(`${link}/`))
  )
  const rootOpenapi = openapiEntries.filter(
    (entry) => ![...isolatedLinks].some((link) => entry.prefix.startsWith(`${link}/`))
  )

  // Inject workspace-scoped OpenAPI sidebar items into matching isolated sidebars
  const mergedIsolatedSidebar = mergeOpenapiIntoIsolated(isolatedSidebar, workspaceOpenapi)

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

// ── Private helpers ───────────────────────────────────────────

function resolveEntryItems(items: readonly ResolvedEntry[] | undefined): readonly ResolvedEntry[] {
  if (items) {
    return [...items]
  }
  return []
}

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

function resolveParentLink(entryLink: string): string | null {
  const segments = entryLink.split('/').slice(0, -1).join('/')
  if (segments) {
    return segments
  }
  return null
}

function resolveFirstChildLink(children: readonly SidebarItem[]): string | undefined {
  if (children.length > 0 && children[0].link) {
    return children[0].link
  }
  return undefined
}

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
 * Merge workspace-scoped OpenAPI sidebar items into their parent isolated sidebars.
 *
 * For each OpenAPI entry whose prefix starts with an isolated sidebar key,
 * appends the OpenAPI sidebar items to that isolated sidebar. Both trailing-slash
 * and non-trailing-slash variants are updated.
 *
 * @param isolatedSidebar - Existing isolated sidebar record
 * @param openapiEntries - Workspace-scoped OpenAPI entries to merge
 * @returns Updated sidebar record with OpenAPI items injected
 */
function mergeOpenapiIntoIsolated(
  isolatedSidebar: Record<string, unknown[]>,
  openapiEntries: readonly OpenAPISidebarEntry[]
): Record<string, unknown[]> {
  if (openapiEntries.length === 0) {
    return isolatedSidebar
  }

  // Build a list of OpenAPI → parent sidebar key pairings
  const trailingSlashKeys = Object.keys(isolatedSidebar).filter((key) => key.endsWith('/'))

  const pairings = openapiEntries.map((entry) => {
    // Find the longest (most specific) matching isolated sidebar key
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
    { ...isolatedSidebar }
  )
}

/**
 * Build sidebar record entries from OpenAPI sidebar entries.
 * Each entry gets both a trailing-slash and non-trailing-slash key
 * for Rspress matching.
 *
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
