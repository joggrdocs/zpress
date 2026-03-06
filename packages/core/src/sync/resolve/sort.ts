import { match, P } from 'ts-pattern'

import type { ResolvedPage } from '../../types.ts'
import type { ResolvedEntry } from '../types.ts'

/**
 * Sections (entries with items) sort before leaf pages.
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
 * Sort resolved entries using the specified strategy.
 *
 * Sections (entries with children) always sort before leaf pages.
 * When no sort strategy is provided, entries are returned in discovery order.
 *
 * @param entries - Entries to sort
 * @param sort - Sort strategy: `"alpha"` by text, `"filename"` by output path, or custom comparator
 * @returns Sorted copy of the entries array
 */
export function sortEntries(
  entries: readonly ResolvedEntry[],
  sort?: 'alpha' | 'filename' | ((a: ResolvedPage, b: ResolvedPage) => number)
): ResolvedEntry[] {
  if (!sort) {
    return [...entries]
  }

  return match(sort)
    .with('alpha', () =>
      [...entries].toSorted((a, b) => sectionFirst(a, b) || a.text.localeCompare(b.text))
    )
    .with('filename', () =>
      [...entries].toSorted((a, b) => {
        const rank = sectionFirst(a, b)
        if (rank !== 0) {
          return rank
        }
        const aKey = match(a.page)
          .with(P.nonNullable, (p) => p.outputPath)
          .otherwise(() => a.text)
        const bKey = match(b.page)
          .with(P.nonNullable, (p) => p.outputPath)
          .otherwise(() => b.text)
        return aKey.localeCompare(bKey)
      })
    )
    .otherwise((comparator) =>
      [...entries].toSorted((a, b) => comparator(toResolvedPage(a), toResolvedPage(b)))
    )
}

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
    text: entry.text,
    link: match(entry.link)
      .with(P.nonNullable, (l) => l)
      .otherwise(() => ''),
    source,
    frontmatter,
  }
}
