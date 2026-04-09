import { describe, expect, it } from 'vitest'

import type { ResolvedEntry } from '../types'

import { buildMetaDirectories, buildRootMeta } from './meta'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Simulates the packages section from zpress.config.ts where each package
 * section has a landing page leaf that shares the same path as the parent.
 *
 * ```
 * packages/
 *   cli.md          ← leaf "Overview" at /packages/cli
 *   cli/
 *     changelog.md  ← leaf "Changelog" at /packages/cli/changelog
 * ```
 */
function makePackageSection(name: string, label: string): ResolvedEntry {
  return {
    title: label,
    link: `/packages/${name}`,
    items: [
      {
        title: 'Overview',
        link: `/packages/${name}`,
        page: { outputPath: `packages/${name}.md`, frontmatter: {} },
      },
      {
        title: 'Changelog',
        link: `/packages/${name}/changelog`,
        page: { outputPath: `packages/${name}/changelog.md`, frontmatter: {} },
      },
    ],
  }
}

const packagesRoot: ResolvedEntry = {
  title: 'Packages',
  link: '/packages',
  items: [
    makePackageSection('zpress', '@zpress/kit'),
    makePackageSection('cli', '@zpress/cli'),
    makePackageSection('config', '@zpress/config'),
    makePackageSection('core', '@zpress/core'),
    makePackageSection('ui', '@zpress/ui'),
    makePackageSection('theme', '@zpress/theme'),
    makePackageSection('templates', '@zpress/templates'),
  ],
}

// ---------------------------------------------------------------------------
// buildRootMeta
// ---------------------------------------------------------------------------

describe('buildRootMeta', () => {
  it('should include visible top-level sections', () => {
    const entries: readonly ResolvedEntry[] = [
      { title: 'Getting Started', link: '/getting-started', items: [{ title: 'Intro', link: '/getting-started/intro' }] },
      { title: 'Packages', link: '/packages', items: [] },
    ]

    const result = buildRootMeta(entries)

    expect(result).toEqual([
      { type: 'dir', name: 'getting-started', label: 'Getting Started' },
      { type: 'dir', name: 'packages', label: 'Packages' },
    ])
  })

  it('should exclude hidden sections', () => {
    const entries: readonly ResolvedEntry[] = [
      { title: 'Visible', link: '/visible', items: [] },
      { title: 'Hidden', link: '/hidden', hidden: true, items: [] },
    ]

    const result = buildRootMeta(entries)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ name: 'visible' })
  })
})

// ---------------------------------------------------------------------------
// buildMetaDirectories
// ---------------------------------------------------------------------------

describe('buildMetaDirectories', () => {
  it('should use the section title when a leaf and section share the same name', () => {
    const directories = buildMetaDirectories([packagesRoot])
    const packagesDir = directories.find((d) => d.dirPath === 'packages')

    expect(packagesDir).toBeDefined()
    if (packagesDir) {
      const cliItem = packagesDir.items.find(
        (item) => typeof item === 'object' && 'name' in item && item.name === 'cli'
      )

      expect(cliItem).toMatchObject({ type: 'dir', name: 'cli', label: '@zpress/cli' })
    }
  })

  it('should not produce duplicate entries for same-name leaf and section', () => {
    const directories = buildMetaDirectories([packagesRoot])
    const packagesDir = directories.find((d) => d.dirPath === 'packages')

    expect(packagesDir).toBeDefined()
    if (packagesDir) {
      const cliItems = packagesDir.items.filter(
        (item) => typeof item === 'object' && 'name' in item && item.name === 'cli'
      )

      expect(cliItems).toHaveLength(1)
    }
  })

  it('should place child leaves in the correct subdirectory', () => {
    const directories = buildMetaDirectories([packagesRoot])
    const cliDir = directories.find((d) => d.dirPath === 'packages/cli')

    expect(cliDir).toBeDefined()
    if (cliDir) {
      expect(cliDir.items).toContainEqual({ type: 'file', name: 'changelog', label: 'Changelog' })
    }
  })

  it('should preserve config order for sections in the same directory', () => {
    const directories = buildMetaDirectories([packagesRoot])
    const packagesDir = directories.find((d) => d.dirPath === 'packages')

    expect(packagesDir).toBeDefined()
    if (packagesDir) {
      const names = packagesDir.items
        .filter((item): item is { readonly type: string; readonly name: string; readonly label: string } =>
          typeof item === 'object' && 'name' in item
        )
        .map((item) => item.name)

      expect(names).toEqual(['zpress', 'cli', 'config', 'core', 'ui', 'theme', 'templates'])
    }
  })

  it('should preserve all package sections in the packages directory', () => {
    const directories = buildMetaDirectories([packagesRoot])
    const packagesDir = directories.find((d) => d.dirPath === 'packages')

    expect(packagesDir).toBeDefined()
    if (packagesDir) {
      const names = packagesDir.items
        .filter((item): item is { readonly type: string; readonly name: string; readonly label: string } =>
          typeof item === 'object' && 'name' in item
        )
        .map((item) => item.name)

      expect(names).toContain('cli')
      expect(names).toContain('core')
      expect(names).toContain('ui')
    }
  })
})
