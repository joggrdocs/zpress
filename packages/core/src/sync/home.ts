import fs from 'node:fs/promises'
import path from 'node:path'

import matter from 'gray-matter'
import { match, P } from 'ts-pattern'

import { hasGlobChars } from '../glob.ts'
import { ICON_COLORS, resolveOptionalIcon } from '../icon.ts'
import type { IconColor } from '../icon.ts'
import type { Section, Feature, ZpressConfig, Workspace } from '../types.ts'

// ── Types ────────────────────────────────────────────────────

interface ResolvedFeature {
  readonly title: string
  readonly details: string
  readonly link: string | undefined
  readonly iconId: string | null
  readonly iconColor: IconColor
}

/**
 * Frontmatter-serializable feature shape for YAML output.
 */
interface FrontmatterFeature {
  readonly title: string
  readonly details: string
  readonly link?: string
  readonly icon?: string
  readonly iconColor: IconColor
}

/**
 * Serializable workspace card data for a single item.
 */
export interface HomeWorkspaceCardData {
  readonly title: string
  readonly href: string
  readonly icon: string | undefined
  readonly iconColor: string | undefined
  readonly scope: string | undefined
  readonly description: string | undefined
  readonly tags: readonly string[]
  readonly badge: { readonly src: string; readonly alt: string } | undefined
}

/**
 * A group of workspace cards (apps, packages, or custom).
 */
export interface HomeWorkspaceGroupData {
  readonly type: 'apps' | 'packages' | 'workspaces'
  readonly heading: string
  readonly description: string
  readonly cards: readonly HomeWorkspaceCardData[]
}

/**
 * All workspace groups for the home page.
 */
export type HomeWorkspaceData = readonly HomeWorkspaceGroupData[]

/**
 * Result of generating the default home page.
 * Contains the markdown content and workspace data.
 */
export interface HomePageResult {
  readonly content: string
  readonly workspaces: HomeWorkspaceData
}

// ── Default descriptions ─────────────────────────────────────

/**
 * Sensible fallback descriptions for common section names.
 * Used when no frontmatter description is available.
 */
const DEFAULT_SECTION_DESCRIPTIONS: Readonly<Record<string, string>> = {
  guides: 'Step-by-step walkthroughs covering setup, workflows, and common tasks.',
  guide: 'Step-by-step walkthroughs covering setup, workflows, and common tasks.',
  standards: 'Code style, naming conventions, and engineering best practices for the team.',
  standard: 'Code style, naming conventions, and engineering best practices for the team.',
  security: 'Authentication, authorization, secrets management, and vulnerability policies.',
  architecture: 'System design, service boundaries, data flow, and infrastructure decisions.',
  'getting started': 'Everything you need to set up your environment and start contributing.',
  introduction: 'Project overview, goals, and how the pieces fit together.',
  overview: 'High-level summary of the platform, key concepts, and navigation.',
  'api reference': 'Endpoint contracts, request/response schemas, and usage examples.',
  api: 'Endpoint contracts, request/response schemas, and usage examples.',
  testing: 'Test strategy, tooling, coverage targets, and how to run the suite.',
  deployment: 'Build pipelines, release process, and environment configuration.',
  contributing: 'How to propose changes, open PRs, and follow the development workflow.',
  troubleshooting: 'Common issues, error explanations, and debugging techniques.',
  configuration: 'Available settings, environment variables, and how to customize behavior.',
  reference: 'Detailed technical reference covering APIs, types, and configuration options.',
}

// ── Internal result types ────────────────────────────────────

interface WorkspaceDataResult {
  readonly data: HomeWorkspaceData
}

interface GroupDataResult {
  readonly group: HomeWorkspaceGroupData
}

// ── Public API ───────────────────────────────────────────────

/**
 * Generate a default Rspress home page from config metadata.
 *
 * Produces `pageType: home` frontmatter with hero derived from config
 * `title`/`description` and `features:` array from top-level sections.
 * Workspace data is serialized separately for `.generated/workspaces.json`.
 *
 * @param config - zpress config
 * @param repoRoot - Absolute path to repo root (for resolving source files)
 * @returns Home page content and workspace data
 */
export async function generateDefaultHomePage(
  config: ZpressConfig,
  repoRoot: string
): Promise<HomePageResult> {
  const { tagline } = config
  const title = config.title ?? 'Documentation'
  const description = config.description ?? title
  const firstLink = findFirstLink(config.sections)
  const features = await match(config.features)
    .with(P.nonNullable, buildExplicitFeatures)
    .otherwise(() => buildFeatures(config.sections, repoRoot))
  const frontmatterFeatures = buildFrontmatterFeatures(features)
  const workspaceResult = buildWorkspaceData(config)

  const heroConfig: Record<string, unknown> = {
    name: title,
    text: description,
    ...match(tagline)
      .with(P.nonNullable, (t) => ({ tagline: t }))
      .otherwise(() => ({})),
    actions: match(config.actions)
      .with(P.nonNullable, (a) => a)
      .otherwise(() => [{ theme: 'brand', text: 'Get Started', link: firstLink }]),
    image: {
      src: '/banner.svg',
      alt: title,
    },
  }

  const frontmatterData: Record<string, unknown> = {
    pageType: 'home',
    hero: heroConfig,
    ...match(frontmatterFeatures.length > 0)
      .with(true, () => ({ features: frontmatterFeatures }))
      .otherwise(() => ({})),
  }

  const content = matter.stringify('', frontmatterData)

  return { content, workspaces: workspaceResult.data }
}

// ── Feature data ─────────────────────────────────────────────

/**
 * Convert resolved features into frontmatter-serializable objects.
 * Icon identifiers are stored as Iconify strings for YAML serialization.
 *
 * @private
 */
function buildFrontmatterFeatures(
  features: readonly ResolvedFeature[]
): readonly FrontmatterFeature[] {
  return features.map((f) => ({
    title: f.title,
    details: f.details,
    ...match(f.link)
      .with(P.nonNullable, (l) => ({ link: l }))
      .otherwise(() => ({})),
    ...match(f.iconId)
      .with(P.nonNullable, (id) => ({ icon: id }))
      .otherwise(() => ({})),
    iconColor: f.iconColor,
  }))
}

/**
 * Convert explicit user-defined features into resolved features.
 * Icon colors are cycled in the same way as auto-generated features.
 *
 * @private
 */
function buildExplicitFeatures(features: readonly Feature[]): Promise<readonly ResolvedFeature[]> {
  return Promise.resolve(
    features.map((f, index) => {
      const resolved = resolveOptionalIcon(f.icon)
      const titleStr = match(f.title)
        .with(P.string, (t) => t)
        .otherwise(String)
      const descStr = f.description ?? ''
      return {
        title: titleStr,
        details: descStr,
        link: f.link,
        iconId: match(resolved)
          .with(P.nonNullable, (r) => r.id)
          .otherwise(() => null),
        iconColor: match(resolved)
          .with(P.nonNullable, (r) => r.color)
          .otherwise(() => ICON_COLORS[index % ICON_COLORS.length]),
      }
    })
  )
}

// ── Workspace data ───────────────────────────────────────────

/**
 * Build serializable workspace data from config apps/packages/workspaces.
 * Returns typed group data for the home page.
 *
 * @private
 */
export function buildWorkspaceData(config: ZpressConfig): WorkspaceDataResult {
  const apps = config.apps ?? []
  const packages = config.packages ?? []
  const workspaceGroups = config.workspaces ?? []

  const hasWorkspaceItems = apps.length > 0 || packages.length > 0 || workspaceGroups.length > 0

  if (!hasWorkspaceItems) {
    return { data: [] }
  }

  const appsResult = match(apps.length > 0)
    .with(true, () =>
      buildGroupData(
        'apps',
        'Apps',
        'Deployable applications that make up the platform \u2014 each runs as an independent service.',
        apps,
        'apps/'
      )
    )
    .otherwise(() => null)

  const packagesResult = match(packages.length > 0)
    .with(true, () =>
      buildGroupData(
        'packages',
        'Packages',
        'Shared libraries and utilities consumed across apps and services.',
        packages,
        'packages/'
      )
    )
    .otherwise(() => null)

  const groupResults = workspaceGroups.map((g) => {
    const titleStr = match(g.title)
      .with(P.string, (t) => t)
      .otherwise(String)
    const descStr = g.description ?? ''
    return buildGroupData('workspaces', titleStr, descStr, g.items, '')
  })

  const allResults = [appsResult, packagesResult, ...groupResults].filter(
    (r): r is GroupDataResult => r !== null
  )

  return {
    data: allResults.map((r) => r.group),
  }
}

/**
 * Build a single workspace group with card data.
 *
 * @private
 */
function buildGroupData(
  type: 'apps' | 'packages' | 'workspaces',
  heading: string,
  description: string,
  items: readonly Workspace[],
  scopePrefix: string
): GroupDataResult {
  const cards: readonly HomeWorkspaceCardData[] = items.map((item) => {
    const resolved = resolveOptionalIcon(item.icon)
    const titleStr = match(item.title)
      .with(P.string, (t) => t)
      .otherwise(String)
    return {
      title: titleStr,
      href: item.prefix,
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
      scope: resolveScope(scopePrefix),
      description: item.description,
      tags: resolveTagLabels(item.tags),
      badge: item.badge,
    }
  })

  return {
    group: { type, heading, description, cards },
  }
}

// ── Internal helpers ─────────────────────────────────────────

/**
 * Find the first navigable link from the sections array.
 *
 * @private
 */
function findFirstLink(sections: readonly Section[]): string {
  const [first] = sections
  if (!first) {
    return '/'
  }
  return first.link ?? first.prefix ?? '/'
}

/**
 * Build resolved feature data from the first 3 config sections
 * with Iconify identifiers and cycled icon colors.
 *
 * @private
 */
function buildFeatures(
  sections: readonly Section[],
  repoRoot: string
): Promise<readonly ResolvedFeature[]> {
  return Promise.all(
    sections.slice(0, 3).map(async (section, index) => {
      const link = section.link ?? findFirstChildLink(section)
      const details = await extractSectionDescription(section, repoRoot)
      const resolved = resolveOptionalIcon(section.icon)
      const iconId = match(resolved)
        .with(P.nonNullable, (r) => r.id)
        .otherwise(() => null)
      const iconColor: IconColor = match(resolved)
        .with(P.nonNullable, (r) => r.color)
        .otherwise(() => ICON_COLORS[index % ICON_COLORS.length])
      const titleStr = match(section.title)
        .with(P.string, (t) => t)
        .otherwise(() => 'Section')
      return { title: titleStr, details, link, iconId, iconColor }
    })
  )
}

/**
 * Recursively find the first child link in a section's items.
 *
 * @private
 */
function findFirstChildLink(section: Section): string | undefined {
  if (!section.items) {
    return undefined
  }
  const first = section.items.find((item) => item.link)
  if (first) {
    return first.link
  }
  const nested = section.items.find((item) => findFirstChildLink(item))
  if (nested) {
    return findFirstChildLink(nested)
  }
  return undefined
}

/**
 * Extract a description for a config section.
 *
 * Priority: source file frontmatter -> config frontmatter -> section title.
 *
 * @private
 */
async function extractSectionDescription(section: Section, repoRoot: string): Promise<string> {
  // Single-file source — read frontmatter description
  if (section.from && !hasGlobChars(section.from)) {
    const description = await readFrontmatterDescription(path.resolve(repoRoot, section.from))
    if (description) {
      return description
    }
  }

  // Config-level frontmatter description
  if (
    section.frontmatter !== null &&
    section.frontmatter !== undefined &&
    section.frontmatter.description
  ) {
    return String(section.frontmatter.description)
  }

  // Well-known section name → curated default
  const titleStr = match(section.title)
    .with(P.string, (t) => t)
    .otherwise(() => 'Section')
  const knownDesc = DEFAULT_SECTION_DESCRIPTIONS[titleStr.toLowerCase()]
  if (knownDesc) {
    return knownDesc
  }

  return titleStr
}

/**
 * Read the `description` field from a markdown file's frontmatter.
 *
 * @private
 */
async function readFrontmatterDescription(filePath: string): Promise<string | undefined> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const { data } = matter(raw)
    return (
      match(data.description)
        .with(P.nonNullable, String)
        // oxlint-disable-next-line unicorn/no-useless-undefined -- explicit return for Result-style consistency
        .otherwise(() => undefined)
    )
  } catch {
    return undefined
  }
}

/**
 * Pass through raw tag strings. UI layer handles label resolution via TechTag.
 *
 * @private
 */
function resolveTagLabels(tags: readonly string[] | undefined): readonly string[] {
  if (!tags) {
    return []
  }
  return [...tags]
}

function resolveScope(scopePrefix: string): string | undefined {
  if (scopePrefix.length > 0) {
    return scopePrefix
  }
  return undefined
}
