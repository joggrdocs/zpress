import { isUndefined, omitBy } from 'es-toolkit'
import { match } from 'ts-pattern'

import type { Entry, ZpressConfig, WorkspaceItem } from '../types.ts'
import { buildWorkspaceCardJsx } from './sidebar/landing.ts'
import type { ResolvedEntry } from './types.ts'

// ── Types ────────────────────────────────────────────────────

interface WorkspaceArrays {
  readonly apps: readonly WorkspaceItem[]
  readonly packages: readonly WorkspaceItem[]
}

// ── Public API ───────────────────────────────────────────────

/**
 * Enrich resolved entries with card metadata derived from workspace items.
 *
 * Walks the resolved entry tree and, for each entry whose link starts with
 * a `WorkspaceItem.docsPrefix`, produces a new tree with `CardConfig` metadata
 * added — without mutating the original entries.
 *
 * @param entries - Resolved entry tree from `resolveEntries()`
 * @param config - zpress config containing `apps` and `packages` arrays
 * @returns New entry tree with card metadata enriched
 */
export function enrichWorkspaceCards(
  entries: readonly ResolvedEntry[],
  config: ZpressConfig
): ResolvedEntry[] {
  const workspaceGroupItems = (config.workspaces ?? []).flatMap((g) => g.items)
  const items = [...(config.apps ?? []), ...(config.packages ?? []), ...workspaceGroupItems]
  if (items.length === 0) {
    return [...entries]
  }

  return enrichEntries(entries, items)
}

/**
 * Generate the home page markdown from workspace items.
 *
 * Produces Rspress frontmatter (hero, features) plus workspace grid blocks
 * for apps and packages. Tags render as SVG icons (when available) or text labels.
 *
 * @param workspaces - Apps and packages arrays from config
 * @returns Full home page markdown string
 */
export function generateHomePage(workspaces: WorkspaceArrays): string {
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

  const appsSection = buildWorkspaceSection(
    'Apps',
    'Deployable applications that make up the platform — each runs as an independent service.',
    workspaces.apps,
    'apps/'
  )

  const packagesSection = buildWorkspaceSection(
    'Packages',
    'Shared libraries and utilities consumed across apps and services.',
    workspaces.packages,
    'packages/'
  )

  return [
    frontmatter,
    '',
    '<div class="workspace-section">',
    '',
    appsSection,
    '',
    packagesSection,
    '',
    '</div>',
  ].join('\n')
}

/**
 * Generate the introduction page markdown from workspace items.
 *
 * Produces a "What's inside" section with dynamic bullet lists derived
 * from the apps and packages arrays.
 *
 * @param workspaces - Apps and packages arrays from config
 * @returns Full introduction page markdown string
 */
export function generateIntroPage(workspaces: WorkspaceArrays): string {
  const appsList = workspaces.apps.map((a) => `${a.text} (${a.description})`).join(', ')
  const packagesList = workspaces.packages.map((p) => `${p.text} (${p.description})`).join(', ')

  return [
    '# Introduction',
    '',
    'Internal platform documentation.',
    '',
    'The codebase is a **pnpm workspace** managed by **Turborepo**, written in **TypeScript** with strict mode enabled.',
    '',
    "## What's inside",
    '',
    `- **Apps** — Deployable services: ${appsList}`,
    `- **Packages** — Shared libraries: ${packagesList}`,
    '- **Tooling** — Internal developer tools including this documentation site',
  ].join('\n')
}

/**
 * Synthesize Entry sections from workspace config (apps, packages, custom groups).
 *
 * Produces isolated parent sections with workspace item children,
 * ready to merge into `config.sections` before resolution.
 * Skips any category whose link already exists in `config.sections`.
 *
 * @param config - zpress config containing apps, packages, and workspaces
 * @returns Entry array of synthesized workspace sections
 */
export function synthesizeWorkspaceSections(config: ZpressConfig): Entry[] {
  const existingLinks = collectAllLinks(config.sections)

  const apps = config.apps ?? []
  const packages = config.packages ?? []
  const groups = config.workspaces ?? []

  const appsEntry = match(apps.length > 0 && !existingLinks.has('/apps'))
    .with(
      true,
      (): Entry => ({
        text: 'Apps',
        link: '/apps',
        isolated: true,
        frontmatter: {
          description: 'Deployable applications that make up the platform.',
        },
        items: apps
          .filter((item) => !existingLinks.has(item.docsPrefix))
          .map((item) => workspaceItemToEntry(item)),
      })
    )
    .otherwise(() => null)

  const packagesEntry = match(packages.length > 0 && !existingLinks.has('/packages'))
    .with(
      true,
      (): Entry => ({
        text: 'Packages',
        link: '/packages',
        isolated: true,
        frontmatter: {
          description: 'Shared libraries and utilities consumed across apps and services.',
        },
        items: packages
          .filter((item) => !existingLinks.has(item.docsPrefix))
          .map((item) => workspaceItemToEntry(item)),
      })
    )
    .otherwise(() => null)

  const groupEntries = groups.map((group): Entry | null => {
    const link = group.link ?? `/${slugify(group.name)}`
    if (existingLinks.has(link)) {
      return null
    }
    return {
      text: group.name,
      link,
      isolated: true,
      frontmatter: {
        description: group.description,
      },
      items: group.items
        .filter((item) => !existingLinks.has(item.docsPrefix))
        .map((item) => workspaceItemToEntry(item)),
    }
  })

  return [appsEntry, packagesEntry, ...groupEntries].filter(
    (entry): entry is Entry => entry !== null
  )
}

// ── Internal helpers ─────────────────────────────────────────

/**
 * Recursively collect all links from a section tree.
 * Walks entries and their nested items to find every defined link.
 *
 * @private
 */
function collectAllLinks(sections: readonly Entry[]): Set<string> {
  return new Set(
    sections.flatMap((entry): string[] => {
      const self = collectSelfLinks(entry.link)
      const nested = collectNestedLinks(entry.items)
      return [...self, ...nested]
    })
  )
}

/**
 * Convert display text to a URL-safe slug.
 * E.g. "Getting Started" → "getting-started"
 *
 * @private
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
}

/**
 * Recursively produce a new entry tree with card metadata from workspace items.
 *
 * @private
 */
function enrichEntries(
  entries: readonly ResolvedEntry[],
  items: readonly WorkspaceItem[]
): ResolvedEntry[] {
  return entries.map((entry) => {
    const enrichedItems = resolveEnrichedItems(entry.items, items)

    if (entry.link && !entry.card) {
      const entryLink = entry.link
      const matched = items.find((item) => entryLink === item.docsPrefix)
      if (matched) {
        const scope = deriveScope(matched.docsPrefix)
        const tags = resolveTags(matched.tags)
        const badge = resolveBadge(matched.badge)

        return {
          ...entry,
          items: enrichedItems,
          card: {
            icon: matched.icon,
            iconColor: matched.iconColor,
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
 * Derive the scope label from a docsPrefix.
 * E.g. "/apps/api" → "apps/", "/packages/database" → "packages/"
 *
 * @private
 */
function deriveScope(docsPrefix: string): string {
  const segments = docsPrefix.split('/').filter(Boolean)
  if (segments.length > 0) {
    return `${segments[0]}/`
  }
  return ''
}

/**
 * Build a workspace section (heading + description + card grid) for the home page.
 *
 * @private
 */
function buildWorkspaceSection(
  heading: string,
  description: string,
  items: readonly WorkspaceItem[],
  scopePrefix: string
): string {
  const cards = items.map((item) =>
    buildWorkspaceCardJsx({
      link: item.docsPrefix,
      text: item.text,
      icon: item.icon,
      iconColor: item.iconColor,
      scope: scopePrefix,
      description: item.description,
      tags: item.tags,
      badge: item.badge,
    })
  )

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
 * Convert a WorkspaceItem to an Entry, passing through all Entry-like fields.
 *
 * Uses `docsPrefix` as both `link` (clickable section header) and `prefix`
 * (URL prefix for glob-discovered children).
 *
 * The `from` field is resolved relative to the workspace item's base path
 * (derived from `docsPrefix`). Defaults to `"docs/*.md"` when omitted.
 *
 * For example, `docsPrefix: "/apps/api"` resolves to `"apps/api/docs/*.md"`.
 *
 * @private
 */
function workspaceItemToEntry(item: WorkspaceItem): Entry {
  const base: Entry = {
    text: item.text,
    link: item.docsPrefix,
  }

  return applyOptionalFields(base, item)
}

function applyOptionalFields(base: Entry, item: WorkspaceItem): Entry {
  const fromPattern = item.from ?? 'docs/*.md'
  const basePath = item.docsPrefix.replace(/^\//, '')
  const resolvedFrom = `${basePath}/${fromPattern}`

  return omitBy(
    {
      ...base,
      from: resolvedFrom,
      prefix: item.docsPrefix,
      items: item.items,
      sort: item.sort,
      textFrom: item.textFrom,
      textTransform: item.textTransform,
      recursive: item.recursive,
      indexFile: resolveIndexFile(item.recursive, item.indexFile),
      exclude: resolveExclude(item.exclude),
      collapsible: item.collapsible,
      frontmatter: item.frontmatter,
    },
    isUndefined
  ) as Entry
}

function collectSelfLinks(link: string | undefined): string[] {
  if (link !== null && link !== undefined) {
    return [link]
  }
  return []
}

function collectNestedLinks(items: readonly Entry[] | undefined): string[] {
  if (items) {
    return [...collectAllLinks(items)]
  }
  return []
}

function resolveEnrichedItems(
  items: readonly ResolvedEntry[] | undefined,
  workspaceItems: readonly WorkspaceItem[]
): ResolvedEntry[] | undefined {
  if (items) {
    return enrichEntries(items, workspaceItems)
  }
  return undefined
}

function resolveTags(tags: readonly string[] | undefined): string[] | undefined {
  if (tags) {
    return [...tags]
  }
  return undefined
}

function resolveBadge(
  badge: { readonly src: string; readonly alt: string } | undefined
): { readonly src: string; readonly alt: string } | undefined {
  if (badge) {
    return { src: badge.src, alt: badge.alt }
  }
  return undefined
}

function resolveIndexFile(
  recursive: boolean | undefined,
  indexFile: string | undefined
): string | undefined {
  if (recursive) {
    return indexFile
  }
  return undefined
}

function resolveExclude(exclude: readonly string[] | undefined): string[] | undefined {
  if (exclude) {
    return [...exclude]
  }
  return undefined
}
