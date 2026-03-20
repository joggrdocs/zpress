import { isNil, isString, isUndefined, kebabCase, omitBy } from 'es-toolkit'
import { match, P } from 'ts-pattern'

import { resolveOptionalIcon } from '../icon.ts'
import type { Section, ZpressConfig, Workspace } from '../types.ts'
import { buildWorkspaceCardJsx } from './sidebar/landing.ts'
import type { ResolvedEntry } from './types.ts'

/**
 * Enrich resolved entries with card metadata derived from workspace items.
 *
 * Walks the resolved entry tree and, for each entry whose link starts with
 * a `Workspace.path`, produces a new tree with `CardConfig` metadata
 * added — without mutating the original entries.
 *
 * @param entries - Resolved entry tree from `resolveEntries()`
 * @param config - zpress config containing `workspaces` categories
 * @returns New entry tree with card metadata enriched
 */
export function enrichWorkspaceCards(
  entries: readonly ResolvedEntry[],
  config: ZpressConfig
): ResolvedEntry[] {
  const workspaceGroupItems = (config.workspaces ?? []).flatMap((g) => g.items)
  if (workspaceGroupItems.length === 0) {
    return [...entries]
  }

  return enrichEntries(entries, workspaceGroupItems)
}

/**
 * Generate the home page markdown from workspace items.
 *
 * Produces Rspress frontmatter (hero, features) plus workspace grid blocks.
 * Tags render as SVG icons (when available) or text labels.
 *
 * @param workspaces - Workspace categories from config
 * @returns Full home page markdown string
 */
export function generateHomePage(workspaces: readonly Workspace[]): string {
  const frontmatter = [
    '---',
    'layout: home',
    'hero:',
    '  text: Documentation',
    '  tagline: "Internal platform documentation"',
    '  image:',
    '    src: /banner.svg',
    '    alt: zpress',
    '  actions:',
    '    - theme: brand',
    '      text: Get Started',
    '      link: /introduction',
    '    - theme: alt',
    '      text: Architecture',
    '      link: /architecture',
    'features:',
    '  - title: Guides',
    '    icon:',
    '      src: /icons/guides.svg',
    '      height: 48px',
    '      width: 48px',
    '    details: Step-by-step walkthroughs covering setup, workflows, and common tasks.',
    '    link: /guides/setup-local-env',
    '  - title: Standards',
    '    icon:',
    '      src: /icons/standards.svg',
    '      height: 48px',
    '      width: 48px',
    '    details: Code style, naming conventions, and engineering best practices for the team.',
    '    link: /standards/git-commits',
    '  - title: Security',
    '    icon:',
    '      src: /icons/security.svg',
    '      height: 48px',
    '      width: 48px',
    '    details: Authentication, authorization, secrets management, and vulnerability policies.',
    '    link: /security/http',
    '---',
  ].join('\n')

  const workspaceSection = buildWorkspaceSection(
    'Workspaces',
    'Apps and packages that make up the platform.',
    workspaces,
    ''
  )

  return [
    frontmatter,
    '',
    '<div class="zp-workspace-section">',
    '',
    workspaceSection,
    '',
    '</div>',
  ].join('\n')
}

/**
 * Generate the introduction page markdown from workspace items.
 *
 * Produces a "What's inside" section with dynamic bullet lists derived
 * from workspace items.
 *
 * @param workspaces - Workspace items from config
 * @returns Full introduction page markdown string
 */
export function generateIntroPage(workspaces: readonly Workspace[]): string {
  const itemsList = workspaces.map((a) => `${a.title} (${a.description})`).join(', ')

  return [
    '# Introduction',
    '',
    'Internal platform documentation.',
    '',
    'The codebase is a **pnpm workspace** managed by **Turborepo**, written in **TypeScript** with strict mode enabled.',
    '',
    "## What's inside",
    '',
    `- **Workspaces**: ${itemsList}`,
    '- **Tooling** — Internal developer tools including this documentation site',
  ].join('\n')
}

/**
 * Synthesize Section entries from workspace config (categories).
 *
 * Produces standalone parent sections with workspace item children,
 * ready to merge into `config.sections` before resolution.
 * Skips any category whose link already exists in `config.sections`.
 *
 * @param config - zpress config containing workspaces
 * @returns Section array of synthesized workspace sections
 */
export function synthesizeWorkspaceSections(config: ZpressConfig): Section[] {
  const existingLinks = collectAllLinks(config.sections)
  const categories = config.workspaces ?? []

  const categoryEntries = categories.map((category): Section | null => {
    const link = category.link ?? `/${slugify(String(category.title))}`
    if (existingLinks.has(link)) {
      return null
    }
    return {
      title: category.title,
      path: link,
      standalone: true,
      frontmatter: {
        description: category.description,
      },
      items: category.items
        .filter((item) => !existingLinks.has(item.path))
        .map((item) => workspaceToSection(item)),
    }
  })

  return categoryEntries.filter(
    (section): section is Section => section !== null
  )
}

/**
 * Convert display text to a URL-safe slug.
 * E.g. "Getting Started" → "getting-started", "updatePet" → "update-pet"
 *
 * @param text - Display text to slugify
 * @returns URL-safe lowercase slug
 */
export function slugify(text: string): string {
  return kebabCase(text)
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Recursively collect all links from a section tree.
 * Walks sections and their nested items to find every defined link.
 *
 * @private
 * @param sections - Section tree to walk
 * @returns Set of all link strings found in the tree
 */
function collectAllLinks(sections: readonly Section[]): Set<string> {
  return new Set(
    sections.flatMap((section): string[] => {
      const self = collectSelfLinks(section.path)
      const nested = collectNestedLinks(section.items)
      return [...self, ...nested]
    })
  )
}

/**
 * Recursively produce a new entry tree with card metadata from workspace items.
 *
 * @private
 * @param entries - Resolved entry tree to enrich
 * @param items - Workspace items containing card metadata
 * @returns New entry tree with card metadata added where matched
 */
function enrichEntries(
  entries: readonly ResolvedEntry[],
  items: readonly Workspace[]
): ResolvedEntry[] {
  return entries.map((entry) => {
    const enrichedItems = resolveEnrichedItems(entry.items, items)

    if (entry.link && !entry.card) {
      const entryLink = entry.link
      const matched = items.find((item) => entryLink === item.path)
      if (matched) {
        const scope = deriveScope(matched.path)
        const tags = resolveTags(matched.tags)
        const badge = resolveBadge(matched.badge)

        return {
          ...entry,
          items: enrichedItems,
          card: {
            icon: matched.icon,
            scope,
            description: matched.description,
            tags,
            badge,
          },
        }
      }
    }

    if (enrichedItems) {
      return { ...entry, items: enrichedItems }
    }
    return entry
  })
}

/**
 * Derive the scope label from a path.
 * E.g. "/apps/api" → "apps/", "/packages/database" → "packages/"
 *
 * @private
 * @param itemPath - Workspace item path
 * @returns Scope label string (first segment with trailing slash)
 */
function deriveScope(itemPath: string): string {
  const segments = itemPath.split('/').filter(Boolean)
  if (segments.length > 0) {
    return `${segments[0]}/`
  }
  return ''
}

/**
 * Build a workspace section (heading + description + card grid) for the home page.
 *
 * @private
 * @param heading - Section heading text
 * @param description - Section description text
 * @param items - Workspace items to render as cards
 * @param scopePrefix - Prefix for scoping items
 * @returns Markdown string with heading, description, and card grid
 */
function buildWorkspaceSection(
  heading: string,
  description: string,
  items: readonly Workspace[],
  scopePrefix: string
): string {
  const cards = items.map((item) => {
    const resolved = resolveOptionalIcon(item.icon)
    const titleStr = match(item.title)
      .with(P.string, (t) => t)
      .otherwise(String)
    return buildWorkspaceCardJsx({
      link: item.path,
      title: titleStr,
      icon: match(resolved)
        .with(
          P.nonNullable,
          (r): string | { readonly id: string; readonly color: string } =>
            match(r.color)
              .with('purple', () => r.id)
              .otherwise(() => ({ id: r.id, color: r.color }))
        )
        // oxlint-disable-next-line unicorn/no-useless-undefined -- explicit undefined required for correct type narrowing
        .with(P.nullish, (): undefined => undefined)
        .exhaustive(),
      scope: scopePrefix,
      description: item.description,
      tags: item.tags,
      badge: item.badge,
    })
  })

  return [
    `## ${heading}`,
    '',
    description,
    '',
    '<WorkspaceGrid>',
    cards.join('\n'),
    '</WorkspaceGrid>',
  ].join('\n')
}

/**
 * Convert a Workspace to a Section, extracting discovery fields and applying defaults.
 *
 * Uses `path` as both the section URL and URL prefix for glob-discovered children.
 * The `include` field is resolved relative to the workspace item's base path
 * (derived from `path`). Defaults to `"docs/*.md"` when omitted.
 *
 * For example, `path: "/apps/api"` + `include: "docs/*.md"` resolves to `"apps/api/docs/*.md"`.
 *
 * @private
 * @param item - Workspace item to convert
 * @returns Section config derived from the workspace item
 */
function workspaceToSection(item: Workspace): Section {
  const base: Section = {
    title: item.title,
    icon: item.icon,
    path: item.path,
  }

  return applyOptionalFields(base, item)
}

/**
 * Apply optional discovery fields to a base section from a workspace item.
 *
 * @private
 * @param base - Base section with title, icon, and path
 * @param item - Workspace item with optional discovery fields
 * @returns Complete section with all discovery fields resolved
 */
function applyOptionalFields(base: Section, item: Workspace): Section {
  const fromPattern = item.include ?? 'docs/*.md'
  const basePath = item.path.replace(/^\//, '')
  const resolvedInclude = normalizeAndResolveInclude(fromPattern, basePath)

  const sort = item.sort ?? null

  const recursive = item.recursive ?? null

  const entryFile = match(recursive)
    .with(true, () => item.entryFile)
    .otherwise(() => null)

  const exclude = match(item.exclude)
    .with(P.nonNullable, (ex) => [...ex])
    .otherwise(() => null)

  const frontmatter = item.frontmatter ?? null

  return omitBy(
    {
      ...base,
      include: resolvedInclude,
      items: item.items,
      sort,
      recursive,
      entryFile,
      exclude,
      frontmatter,
    },
    isUndefined
  ) as Section
}

/**
 * Return the link as a single-element array, or empty if undefined.
 *
 * @private
 * @param link - Optional link string
 * @returns Array with the link, or empty array
 */
function collectSelfLinks(link: string | undefined): string[] {
  if (!isNil(link)) {
    return [link]
  }
  return []
}

/**
 * Collect links from nested section items.
 *
 * @private
 * @param items - Optional array of child sections
 * @returns Array of link strings from nested items
 */
function collectNestedLinks(items: readonly Section[] | undefined): string[] {
  if (items) {
    return [...collectAllLinks(items)]
  }
  return []
}

/**
 * Recursively enrich child items with workspace card metadata.
 *
 * @private
 * @param items - Optional child entries to enrich
 * @param workspaceItems - Workspace items containing card metadata
 * @returns Enriched entries or undefined if no items
 */
function resolveEnrichedItems(
  items: readonly ResolvedEntry[] | undefined,
  workspaceItems: readonly Workspace[]
): ResolvedEntry[] | undefined {
  if (items) {
    return enrichEntries(items, workspaceItems)
  }
  return undefined
}

/**
 * Copy tags array, or return undefined if not present.
 *
 * @private
 * @param tags - Optional tags array
 * @returns Copied tags array or undefined
 */
function resolveTags(tags: readonly string[] | undefined): string[] | undefined {
  if (tags) {
    return [...tags]
  }
  return undefined
}

/**
 * Copy badge object, or return undefined if not present.
 *
 * @private
 * @param badge - Optional badge with src and alt
 * @returns Copied badge object or undefined
 */
function resolveBadge(
  badge: { readonly src: string; readonly alt: string } | undefined
): { readonly src: string; readonly alt: string } | undefined {
  if (badge) {
    return { src: badge.src, alt: badge.alt }
  }
  return undefined
}

/**
 * Normalize include (string | string[]) and resolve relative to base path.
 *
 * @private
 * @param include - Include pattern(s) from workspace
 * @param basePath - Base directory path to resolve relative to
 * @returns Resolved include pattern(s) as string or string[]
 */
function normalizeAndResolveInclude(
  include: string | readonly string[],
  basePath: string
): string | readonly string[] {
  if (isString(include)) {
    return `${basePath}/${include}`
  }
  return include.map((pattern) => `${basePath}/${pattern}`)
}
