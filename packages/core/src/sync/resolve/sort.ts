import { basename, extname } from 'node:path'

import { match, P } from 'ts-pattern'

import type { ResolvedPage } from '../../types.ts'
import type { ResolvedEntry } from '../types.ts'

const PINNED_STEMS = ['introduction', 'intro', 'overview', 'readme'] as const

/**
 * Sort resolved entries using the specified strategy.
 *
 * Sections (entries with children) always sort before leaf pages.
 * When no sort strategy is provided, entries are sorted with pinned intro-style
 * files first (introduction, intro, overview, readme), then alpha by title.
 *
 * @param entries - Entries to sort
 * @param sort - Sort strategy: `"default"` (pinned + alpha), `"alpha"` by text, `"filename"` by output path, or custom comparator
 * @returns Sorted copy of the entries array
 */
export function sortEntries(
  entries: readonly ResolvedEntry[],
  sort?: 'default' | 'alpha' | 'filename' | ((a: ResolvedPage, b: ResolvedPage) => number)
): ResolvedEntry[] {
  if (!sort) {
    return [...entries].toSorted(
      (a, b) => sectionFirst(a, b) || pinnedFirst(a, b) || a.title.localeCompare(b.title)
    )
  }

  return match(sort)
    .with('default', () =>
      [...entries].toSorted(
        (a, b) => sectionFirst(a, b) || pinnedFirst(a, b) || a.title.localeCompare(b.title)
      )
    )
    .with('alpha', () =>
      [...entries].toSorted((a, b) => sectionFirst(a, b) || a.title.localeCompare(b.title))
    )
    .with('filename', () =>
      [...entries].toSorted((a, b) => {
        const rank = sectionFirst(a, b)
        if (rank !== 0) {
          return rank
        }
        const aKey = match(a.page)
          .with(P.nonNullable, (p) => p.outputPath)
          .otherwise(() => a.title)
        const bKey = match(b.page)
          .with(P.nonNullable, (p) => p.outputPath)
          .otherwise(() => b.title)
        return aKey.localeCompare(bKey)
      })
    )
    .otherwise((comparator) =>
      [...entries].toSorted((a, b) => comparator(toResolvedPage(a), toResolvedPage(b)))
    )
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Sections (entries with items) sort before leaf pages.
 *
 * @private
 * @param a - First entry to compare
 * @param b - Second entry to compare
 * @returns Negative if a is a section, positive if b is, zero if equal
 */
function sectionFirst(a: ResolvedEntry, b: ResolvedEntry): number {
  const aIsSection = (() => {
    if (a.items !== null && a.items !== undefined && a.items.length > 0) {
      return 0
    }
    return 1
  })()
  const bIsSection = (() => {
    if (b.items !== null && b.items !== undefined && b.items.length > 0) {
      return 0
    }
    return 1
  })()
  return aIsSection - bIsSection
}

/**
 * Rank an entry by its pinned stem position, returning -1 if not pinned.
 *
 * @private
 * @param entry - Entry to rank
 * @returns Index in PINNED_STEMS, or -1 if not a pinned file
 */
function pinnedRank(entry: ResolvedEntry): number {
  if (!entry.page) {
    return -1
  }
  const source = entry.page.source
  if (!source) {
    return -1
  }
  const stem = basename(source, extname(source)).toLowerCase()
  return (PINNED_STEMS as readonly string[]).indexOf(stem)
}

/**
 * Sort pinned intro-style files before all others, preserving their relative order.
 *
 * @private
 * @param a - First entry to compare
 * @param b - Second entry to compare
 * @returns Negative if a is pinned first, positive if b is, zero if equal priority
 */
function pinnedFirst(a: ResolvedEntry, b: ResolvedEntry): number {
  const aRank = pinnedRank(a)
  const bRank = pinnedRank(b)
  if (aRank !== -1 && bRank !== -1) {
    return aRank - bRank
  }
  if (aRank !== -1) {
    return -1
  }
  if (bRank !== -1) {
    return 1
  }
  return 0
}

/**
 * Convert a ResolvedEntry to a ResolvedPage for custom sort comparators.
 *
 * @private
 * @param entry - Resolved entry to convert
 * @returns Resolved page shape with title, link, source, and frontmatter
 */
function toResolvedPage(entry: ResolvedEntry): ResolvedPage {
  const source = (() => {
    if (entry.page) {
      return entry.page.source
    }
  })()
  const frontmatter = (() => {
    if (entry.page) {
      return entry.page.frontmatter
    }
    return {}
  })()
  return {
    title: entry.title,
    link: match(entry.link)
      .with(P.nonNullable, (l) => l)
      .otherwise(() => ''),
    source,
    frontmatter,
  }
}
