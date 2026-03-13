import fs from 'node:fs/promises'

import matter from 'gray-matter'
import { match, P } from 'ts-pattern'

import { resolveOptionalIcon } from '../../icon.ts'
import type { IconColor } from '../../icon.ts'
import type { ResolvedEntry } from '../types.ts'

// ── Shared card data ─────────────────────────────────────────

/**
 * Input data for building a workspace card JSX string.
 */
export interface WorkspaceCardData {
  /**
   * Card link target.
   */
  readonly link: string
  /**
   * Display name for the card.
   */
  readonly title: string
  /**
   * Iconify identifier for the card icon (e.g. 'devicon:hono').
   */
  readonly icon?: string
  /**
   * CSS class suffix for the icon color.
   */
  readonly iconColor?: string
  /**
   * Scope label shown above the name (e.g. 'apps/').
   */
  readonly scope?: string
  /**
   * Short description shown on the card.
   */
  readonly description?: string
  /**
   * Technology tags — kebab-case tag keys resolved by UI TechTag.
   */
  readonly tags?: readonly string[]
  /**
   * Deploy badge image.
   */
  readonly badge?: { readonly src: string; readonly alt: string }
  /**
   * Whether this entry has sub-items (used for default icon selection).
   */
  readonly hasChildren?: boolean
}

// ── Public API ───────────────────────────────────────────────

/**
 * Generate section landing page MDX from resolved children.
 *
 * Uses **workspace cards** when any child has `card` metadata
 * (richer cards with scope, tags, deploy badges — like the homepage).
 * Falls back to **section cards** (simple icon + title + description).
 *
 * @param sectionText - Section heading text
 * @param description - Optional section description
 * @param children - Resolved child entries
 * @param iconColor - Color theme for section card icons
 * @returns MDX string with React component imports and JSX elements
 */
export async function generateLandingContent(
  sectionText: string,
  description: string | undefined,
  children: readonly ResolvedEntry[],
  iconColor: IconColor
): Promise<string> {
  const visible = children.filter((c) => !c.hidden && c.link)
  const useWorkspace = visible.some((c) => c.card)

  const descLine = match(description)
    .with(P.nonNullable, (d) => `\n${d}\n`)
    .otherwise(() => '')

  const imports =
    'import { WorkspaceCard, WorkspaceGrid, SectionCard, SectionGrid } from ' +
    "'@zpress/ui/theme'\n\n"

  if (useWorkspace) {
    const cards = await Promise.all(visible.map((child) => buildWorkspaceCard(child)))
    const grid = cards.join('\n')
    return `${imports}# ${sectionText}\n${descLine}\n<WorkspaceGrid>\n${grid}\n</WorkspaceGrid>\n`
  }

  const cards = await Promise.all(visible.map((child) => buildSectionCard(child, iconColor)))
  const grid = cards.join('\n')
  return `${imports}# ${sectionText}\n${descLine}\n<SectionGrid>\n${grid}\n</SectionGrid>\n`
}

/**
 * Build a workspace card JSX string from structured data.
 *
 * Shared builder used by both the landing page generator (for resolved entries)
 * and the workspace module (for WorkspaceItem arrays).
 *
 * @param data - Card data with link, text, icon, tags, etc.
 * @returns JSX string for a single WorkspaceCard component
 */
export function buildWorkspaceCardJsx(data: WorkspaceCardData): string {
  const icon =
    data.icon ??
    match(data.hasChildren === true)
      .with(true, () => 'pixelarticons:folder')
      .otherwise(() => 'pixelarticons:file')
  const iconColor = data.iconColor ?? 'purple'

  const props: readonly string[] = [
    `title="${escapeJsxProp(data.title)}"`,
    `href="${data.link}"`,
    `icon="${icon}"`,
    `iconColor="${iconColor}"`,
    ...maybeScopeProp(data.scope),
    ...maybeDescriptionProp(data.description),
    ...maybeTagsProp(data.tags),
    ...maybeBadgeProp(data.badge),
  ]

  return `  <WorkspaceCard ${props.join(' ')} />`
}

// ── Workspace cards (rich — icon, scope, badges, tags) ───────

async function buildWorkspaceCard(entry: ResolvedEntry): Promise<string> {
  const card = entry.card ?? {}
  const description = card.description ?? (await resolveDescription(entry))
  const resolved = resolveOptionalIcon(card.icon)

  return buildWorkspaceCardJsx({
    link: entry.link ?? '',
    title: entry.title,
    icon: match(resolved)
      .with(P.nonNullable, (r) => r.id)
      .with(P.nullish, () => undefined)
      .exhaustive(),
    iconColor: match(resolved)
      .with(P.nonNullable, (r) => r.color)
      .with(P.nullish, () => undefined)
      .exhaustive(),
    scope: card.scope,
    description,
    tags: card.tags,
    badge: card.badge,
    hasChildren: entry.items !== null && entry.items !== undefined && entry.items.length > 0,
  })
}

// ── Section cards (simple — icon + title + description) ──────

/**
 * Build a section card JSX string from a resolved entry.
 *
 * @param entry - Resolved entry to render as a card
 * @param iconColor - Color theme for the icon
 * @returns JSX string for a single SectionCard component
 */
async function buildSectionCard(entry: ResolvedEntry, iconColor: IconColor): Promise<string> {
  const hasChildren = entry.items && entry.items.length > 0
  const icon = match(hasChildren)
    .with(true, () => 'pixelarticons:folder')
    .otherwise(() => 'pixelarticons:file')
  const description = await resolveDescription(entry)

  const props = [
    `href="${entry.link}"`,
    `title="${escapeJsxProp(entry.title)}"`,
    `icon="${icon}"`,
    `iconColor="${iconColor}"`,
  ]
  if (description) {
    props.push(`description="${escapeJsxProp(description)}"`)
  }

  return `  <SectionCard ${props.join(' ')} />`
}

// ── Shared helpers ───────────────────────────────────────────

/**
 * Resolve a description for a card.
 * Priority: card.description > source file frontmatter > first paragraph > page frontmatter.
 */
async function resolveDescription(entry: ResolvedEntry): Promise<string | undefined> {
  // Explicit card description wins
  if (entry.card !== null && entry.card !== undefined && entry.card.description) {
    return entry.card.description
  }

  // Try to extract from source file
  if (entry.page !== null && entry.page !== undefined && entry.page.source) {
    try {
      const desc = await extractDescription(entry.page.source)
      if (desc) {
        return desc
      }
    } catch {
      // ignore
    }
  }

  // Fallback to page frontmatter
  if (
    entry.page !== null &&
    entry.page !== undefined &&
    entry.page.frontmatter !== null &&
    entry.page.frontmatter !== undefined &&
    entry.page.frontmatter.description
  ) {
    return String(entry.page.frontmatter.description)
  }

  return undefined
}

/**
 * Extract a short description from a markdown file.
 * Checks frontmatter `description` first, then first paragraph after heading.
 */
async function extractDescription(sourcePath: string): Promise<string | undefined> {
  const raw = await fs.readFile(sourcePath, 'utf8')
  const { data, content } = matter(raw)

  if (data.description) {
    return String(data.description)
  }

  // First non-empty paragraph after the first heading
  const lines = content.split('\n')
  const headingIdx = lines.findIndex((l) => l.startsWith('#'))
  const para: readonly string[] = resolveParagraph(lines, headingIdx)

  if (para.length > 0) {
    return para.join(' ')
  }
}

/**
 * Escape special characters in JSX prop values.
 *
 * @param str - Raw string to escape for use in JSX attribute values
 * @returns Escaped string safe for JSX prop interpolation
 */
function escapeJsxProp(str: string): string {
  return str.replaceAll('"', '&quot;').replaceAll('{', '&#123;').replaceAll('}', '&#125;')
}

// ── Private helpers ───────────────────────────────────────────

function resolveParagraph(lines: readonly string[], headingIdx: number): readonly string[] {
  if (headingIdx === -1) {
    return []
  }

  return lines
    .slice(headingIdx + 1)
    .reduce<{ readonly done: boolean; readonly result: readonly string[] }>(
      (acc, line) => {
        if (acc.done) {
          return acc
        }
        if (line.startsWith('#')) {
          return { done: true, result: acc.result }
        }

        const trimmed = line.trim()
        if (trimmed === '' && acc.result.length > 0) {
          return { done: true, result: acc.result }
        }
        if (trimmed === '') {
          return acc
        }
        // Skip raw HTML / dividers
        if (trimmed.startsWith('<') || trimmed.startsWith('---')) {
          return acc
        }

        return { done: false, result: [...acc.result, trimmed] }
      },
      { done: false, result: [] }
    ).result
}

function maybeScopeProp(scope: string | undefined): readonly string[] {
  if (scope) {
    return [`scope="${escapeJsxProp(scope)}"`]
  }
  return []
}

function maybeDescriptionProp(description: string | undefined): readonly string[] {
  if (description) {
    return [`description="${escapeJsxProp(description)}"`]
  }
  return []
}

function maybeTagsProp(tags: readonly string[] | undefined): readonly string[] {
  if (tags && tags.length > 0) {
    return [`tags={${JSON.stringify(tags)}}`]
  }
  return []
}

function maybeBadgeProp(
  badge: { readonly src: string; readonly alt: string } | undefined
): readonly string[] {
  if (badge) {
    return [`badge={${JSON.stringify(badge)}}`]
  }
  return []
}
