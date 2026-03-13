import { match, P } from 'ts-pattern'

import { ICON_COLORS, resolveOptionalIcon } from '../../icon.ts'
import type { IconColor } from '../../icon.ts'
import type { Entry, WorkspaceItem } from '../../types.ts'
import { linkToOutputPath, sourceExt } from '../resolve/path.ts'
import type { ResolvedEntry } from '../types.ts'
import { buildWorkspaceCardJsx, generateLandingContent } from './landing.ts'

/**
 * Slug priority for overview files that should be promoted to section headers.
 */
const OVERVIEW_SLUGS: readonly string[] = ['overview', 'index', 'readme']

/**
 * Promote an overview/index/readme child to section header page.
 *
 * When a section entry has children and one matches an overview slug,
 * the child's content becomes the section's landing page and the child
 * is removed from `items`.
 *
 * @param entry - Resolved entry to check for overview children
 * @private
 */
function promoteOverviewChild(entry: ResolvedEntry): void {
  if (!entry.link || !entry.items || entry.items.length === 0 || entry.page) {
    return
  }

  const entryLink = entry.link
  const { items } = entry
  const promoted = OVERVIEW_SLUGS.map((slug) =>
    items.find((item) => {
      if (!item.link || !item.page) {
        return false
      }
      const lastSegment = item.link.split('/').at(-1)
      return lastSegment === slug
    })
  ).find((item) => item !== undefined)

  if (!promoted || !promoted.page) {
    return
  }

  const childPage = promoted.page
  const ext = resolveExt(childPage.source)

  entry.page = {
    source: childPage.source,
    content: childPage.content,
    outputPath: linkToOutputPath(entryLink, ext),
    frontmatter: childPage.frontmatter,
  }
  entry.items = items.filter((item) => item !== promoted)
}

/**
 * Walk the resolved tree and inject virtual landing pages
 * for any section that has a `link` and children but no page of its own.
 *
 * Landing pages with React components use `.mdx` extension;
 * simple text pages stay as `.md`.
 */
export function injectLandingPages(
  entries: readonly ResolvedEntry[],
  configEntries: readonly Entry[],
  workspaceItems: readonly WorkspaceItem[],
  colorIndex: { value: number } = { value: 0 }
): void {
  entries.reduce<void>((_, entry) => {
    promoteOverviewChild(entry)

    if (entry.link && !entry.page) {
      const configEntry = findConfigEntry(configEntries, entry.link)
      const description: string | undefined = resolveDescription(configEntry)

      const hasSelfLinkedChild = checkHasSelfLinkedChild(entry.items, entry.link)

      if (entry.items && entry.items.length > 0 && !hasSelfLinkedChild) {
        // Generate landing page from child entries (MDX — has React components)
        const color: IconColor = ICON_COLORS[colorIndex.value % ICON_COLORS.length]
        colorIndex.value += 1

        const children = entry.items
        entry.page = {
          content: () => generateLandingContent(entry.title, description, children, color),
          outputPath: linkToOutputPath(entry.link).replace(/\.md$/, '.mdx'),
          frontmatter: {},
        }
      } else if (!entry.items || entry.items.length === 0) {
        // Check for workspace items matching this section's link prefix
        const matching = workspaceItems.filter((item) => item.path.startsWith(`${entry.link}/`))

        if (matching.length > 0) {
          const segments = entry.link.split('/')
          const lastSegment = segments.findLast((seg) => seg.length > 0)
          const scope = `${lastSegment}/`
          entry.page = {
            content: () => generateWorkspaceLandingPage(entry.title, description, matching, scope),
            outputPath: linkToOutputPath(entry.link).replace(/\.md$/, '.mdx'),
            frontmatter: {},
          }
        }

        if (matching.length === 0) {
          const entryLink = entry.link
          const exact = workspaceItems.find((item) => item.path === entryLink)
          if (exact) {
            // Simple text page — no React components, stays as .md
            entry.page = {
              content: () => `# ${exact.title}\n\n${exact.description}\n`,
              outputPath: linkToOutputPath(entryLink),
              frontmatter: {},
            }
          }
        }
      }
    }

    if (entry.items) {
      injectLandingPages(
        entry.items as readonly ResolvedEntry[],
        configEntries,
        workspaceItems,
        colorIndex
      )
    }
  }, undefined as void)
}

/**
 * Generate a workspace-style landing page MDX from workspace items.
 *
 * @param heading - Page heading
 * @param description - Optional description below heading
 * @param items - Workspace items to render as cards
 * @param scopePrefix - Scope label for cards (e.g. 'apps/')
 * @returns MDX string with React component imports and JSX elements
 */
function generateWorkspaceLandingPage(
  heading: string,
  description: string | undefined,
  items: readonly WorkspaceItem[],
  scopePrefix: string
): string {
  const imports = "import { WorkspaceCard, WorkspaceGrid } from '@zpress/ui/theme'\n\n"

  const cards = items.map((item) => {
    const tags: readonly string[] | undefined = resolveTags(item.tags)
    const resolved = resolveOptionalIcon(item.icon)
    return buildWorkspaceCardJsx({
      link: item.path,
      title: item.title,
      icon: match(resolved)
        .with(P.nonNullable, (r) => r.id)
        // oxlint-disable-next-line unicorn/no-useless-undefined -- explicit undefined required for correct type narrowing
        .with(P.nullish, (): undefined => undefined)
        .exhaustive(),
      iconColor: match(resolved)
        .with(P.nonNullable, (r) => r.color)
        // oxlint-disable-next-line unicorn/no-useless-undefined -- explicit undefined required for correct type narrowing
        .with(P.nullish, (): undefined => undefined)
        .exhaustive(),
      scope: scopePrefix,
      description: item.description,
      tags,
      badge: item.badge,
    })
  })

  const descLine = match(description)
    .with(P.nonNullable, (d) => `\n${d}\n`)
    .otherwise(() => '')

  return `${imports}# ${heading}\n${descLine}\n<WorkspaceGrid>\n${cards.join('\n')}\n</WorkspaceGrid>\n`
}

/**
 * Look up the original config Entry by link for extracting metadata.
 *
 * @private
 */
function findConfigEntry(entries: readonly Entry[], link: string): Entry | undefined {
  const direct = entries.find((entry) => entry.link === link)
  if (direct) {
    return direct
  }
  const nested = entries
    .filter((entry) => entry.items !== null && entry.items !== undefined)
    .map((entry) => findConfigEntry(entry.items as readonly Entry[], link))
    .find((result) => result !== null && result !== undefined)
  return nested
}

// ── Private helpers ───────────────────────────────────────────

function resolveExt(source: string | undefined): string {
  if (source) {
    return sourceExt(source)
  }
  return '.md'
}

function resolveDescription(configEntry: Entry | undefined): string | undefined {
  if (
    configEntry !== null &&
    configEntry !== undefined &&
    configEntry.frontmatter !== null &&
    configEntry.frontmatter !== undefined
  ) {
    return configEntry.frontmatter.description as string | undefined
  }
  return undefined
}

function checkHasSelfLinkedChild(
  items: readonly ResolvedEntry[] | undefined,
  link: string | undefined
): boolean {
  if (items) {
    return items.some((child) => child.link === link)
  }
  return false
}

function resolveTags(tags: readonly string[] | undefined): readonly string[] | undefined {
  if (tags) {
    return [...tags]
  }
  return undefined
}
