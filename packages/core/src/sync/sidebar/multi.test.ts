import { describe, it, expect } from 'vitest'

import type { ResolvedEntry } from '../types'
import { buildMultiSidebar } from './multi'

describe('buildMultiSidebar()', () => {
  it('should place non-standalone entries under the root "/" key', () => {
    const entries: ResolvedEntry[] = [
      {
        title: 'Guides',
        link: '/guides',
        items: [
          { title: 'Setup', link: '/guides/setup', page: { outputPath: 'guides/setup.md', frontmatter: {} } },
        ],
      },
    ]

    const result = buildMultiSidebar(entries, [])

    expect(result['/']).toBeDefined()
    expect(result['/'].length).toBeGreaterThan(0)
  })

  it('should create sidebar keys for standalone entries', () => {
    const entries: ResolvedEntry[] = [
      {
        title: 'Apps',
        link: '/apps',
        standalone: true,
        items: [
          { title: 'API', link: '/apps/api' },
          { title: 'Web', link: '/apps/web' },
        ],
      },
    ]

    const result = buildMultiSidebar(entries, [])

    expect(result['/apps']).toBeDefined()
    expect(result['/apps/']).toBeDefined()
  })

  it('should create orphaned child keys when children live outside parent prefix', () => {
    const entries: ResolvedEntry[] = [
      {
        title: 'Packages',
        link: '/packages',
        standalone: true,
        items: [
          { title: 'AI', link: '/libs/ai' },
          { title: 'Database', link: '/libs/database' },
        ],
      },
    ]

    const result = buildMultiSidebar(entries, [])

    // Parent keys still exist
    expect(result['/packages']).toBeDefined()
    expect(result['/packages/']).toBeDefined()

    // Orphaned child keys are created
    expect(result['/libs/ai']).toBeDefined()
    expect(result['/libs/ai/']).toBeDefined()
    expect(result['/libs/database']).toBeDefined()
    expect(result['/libs/database/']).toBeDefined()
  })

  it('should use the same sidebar content for orphaned keys as the parent', () => {
    const entries: ResolvedEntry[] = [
      {
        title: 'Packages',
        link: '/packages',
        standalone: true,
        items: [
          { title: 'AI', link: '/libs/ai' },
          { title: 'DB', link: '/libs/db' },
        ],
      },
    ]

    const result = buildMultiSidebar(entries, [])

    expect(result['/libs/ai/']).toEqual(result['/packages/'])
    expect(result['/libs/db/']).toEqual(result['/packages/'])
  })

  it('should not create orphaned keys for children that match the parent prefix', () => {
    const entries: ResolvedEntry[] = [
      {
        title: 'Apps',
        link: '/apps',
        standalone: true,
        items: [
          { title: 'API', link: '/apps/api' },
          { title: 'Web', link: '/apps/web' },
        ],
      },
    ]

    const result = buildMultiSidebar(entries, [])

    const keys = Object.keys(result)
    // Only root, /apps, and /apps/ — no extra orphaned keys
    expect(keys).not.toContain('/apps/api')
    expect(keys).not.toContain('/apps/api/')
    expect(keys).not.toContain('/apps/web')
    expect(keys).not.toContain('/apps/web/')
  })

  it('should handle mixed children where some match and some are orphaned', () => {
    const entries: ResolvedEntry[] = [
      {
        title: 'Packages',
        link: '/packages',
        standalone: true,
        items: [
          { title: 'Utils', link: '/packages/utils' },
          { title: 'AI', link: '/libs/ai' },
        ],
      },
    ]

    const result = buildMultiSidebar(entries, [])

    // Parent keys exist
    expect(result['/packages']).toBeDefined()
    expect(result['/packages/']).toBeDefined()

    // Only orphaned child gets extra keys
    expect(result['/libs/ai']).toBeDefined()
    expect(result['/libs/ai/']).toBeDefined()

    // Matched child does NOT get extra keys
    expect(Object.keys(result)).not.toContain('/packages/utils')
    expect(Object.keys(result)).not.toContain('/packages/utils/')
  })

  it('should handle standalone entry with no children', () => {
    const entries: ResolvedEntry[] = [
      {
        title: 'Packages',
        link: '/packages',
        standalone: true,
      },
    ]

    const result = buildMultiSidebar(entries, [])

    expect(result['/packages']).toBeDefined()
    expect(result['/packages/']).toBeDefined()
  })

  it('should sort sidebar keys by length descending', () => {
    const entries: ResolvedEntry[] = [
      { title: 'Guides', link: '/guides', items: [{ title: 'Setup', link: '/guides/setup' }] },
      {
        title: 'Packages',
        link: '/packages',
        standalone: true,
        items: [{ title: 'AI', link: '/libs/ai' }],
      },
    ]

    const result = buildMultiSidebar(entries, [])
    const keys = Object.keys(result)

    // Keys should be sorted by length descending
    const lengths = keys.map((k) => k.length)
    const sorted = lengths.toSorted((a, b) => b - a)
    expect(lengths).toEqual(sorted)
  })

  it('should include the parent landing link in orphaned sidebar content', () => {
    const entries: ResolvedEntry[] = [
      {
        title: 'Packages',
        link: '/packages',
        standalone: true,
        items: [
          { title: 'AI', link: '/libs/ai' },
        ],
      },
    ]

    const result = buildMultiSidebar(entries, [])
    const sidebar = result['/libs/ai/'] as { text: string; link: string }[]

    // First item should be the parent landing link
    expect(sidebar[0]).toMatchObject({ text: 'Packages', link: '/packages' })
  })
})
