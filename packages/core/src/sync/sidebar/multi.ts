import { match, P } from 'ts-pattern'

import type { ResolvedEntry, SidebarItem } from '../types.ts'
import { generateSidebar } from './index.ts'

/**
 * Build a multi-sidebar record from resolved entries.
 *
 * Root entries go under `"/"`, each isolated section gets its own namespace
 * keyed by `link`, and OpenAPI sidebars (if any) each get their own prefix key.
 * Keys are sorted by string length (descending) for Rspress matching precedence.
 *
 * @param resolved - Fully resolved entry tree
 * @param openapiSidebar - Flat sidebar items from OpenAPI sync (currently unused)
 * @returns Sorted sidebar record ready for JSON serialization
 */
export function buildMultiSidebar(
  resolved: readonly ResolvedEntry[],
  openapiSidebar: readonly SidebarItem[]
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
        text: entry.text,
        link: entryLink,
      }

      const sidebarItems = match(isChild)
        .with(true, () => {
          const pe = parentEntry as ResolvedEntry
          const peLink = pe.link as string
          const parentLanding: SidebarItem = {
            text: pe.text,
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

            return buildSidebarGroup(sib.text, sibLink, sibChildren, !isCurrent)
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
                  return buildSidebarGroup(child.text, childLink, childItems, true)
                })
            )
            .otherwise(() => [])

          return [landing, ...children, ...childGroups]
        })

      return [
        [`${entryLink}/`, sidebarItems],
        [entryLink, sidebarItems],
      ] as const
    })
  )

  const openapiEntries = buildOpenapiSidebarEntries(openapiSidebar)

  const sidebar: Record<string, unknown[]> = {
    '/': docsSidebar,
    ...isolatedSidebar,
    ...openapiEntries,
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

function buildOpenapiSidebarEntries(
  _openapiSidebar: readonly SidebarItem[]
): Record<string, readonly SidebarItem[]> {
  return {}
}
