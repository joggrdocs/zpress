import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..')

export const FIXTURES = {
  small: path.resolve(REPO_ROOT, 'examples/simple'),
  medium: path.resolve(REPO_ROOT, 'examples/kitchen-sink'),
} as const

const SECTIONS = ['guides', 'api', 'tutorials', 'concepts', 'reference'] as const
const FILES_PER_SECTION = 50

/**
 * Generate a large fixture project (~250 markdown files) in a temp directory.
 *
 * Files are deterministic (seeded by index) for reproducible benchmarks.
 *
 * @returns Object with `dir` path and `cleanup` function
 */
export function generateLargeFixture(): { readonly dir: string; readonly cleanup: () => void } {
  const fixturesDir = path.join(REPO_ROOT, '.bench-fixtures')
  fs.mkdirSync(fixturesDir, { recursive: true })
  const dir = fs.mkdtempSync(path.join(fixturesDir, 'large-'))

  // Write zpress.config.ts
  const sectionConfigs = SECTIONS.map(
    (name) => `    {
      title: '${name.charAt(0).toUpperCase()}${name.slice(1)}',
      path: '/${name}',
      include: '${name}/*.md',
      sort: 'alpha',
    }`
  ).join(',\n')

  fs.writeFileSync(
    path.join(dir, 'zpress.config.ts'),
    `import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'Large Benchmark Project',
  sections: [
${sectionConfigs}
  ],
})
`,
    'utf8'
  )

  // Write package.json so zpress can resolve
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'bench-large',
        private: true,
        type: 'module',
        dependencies: { '@zpress/kit': 'workspace:*' },
      },
      null,
      2
    ),
    'utf8'
  )

  // Generate markdown files
  SECTIONS.forEach((section) => {
    const sectionDir = path.join(dir, section)
    fs.mkdirSync(sectionDir, { recursive: true })

    Array.from({ length: FILES_PER_SECTION }, (_, i) => {
      const title = `${section} document ${i + 1}`
      const slug = `${section}-doc-${String(i + 1).padStart(3, '0')}`
      const content = `---
title: "${title}"
description: "Documentation for ${section} topic ${i + 1}"
---

# ${title}

This is a benchmark fixture document for the ${section} section.

## Overview

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
nostrud exercitation ullamco laboris.

## Details

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
culpa qui officia deserunt mollit anim id est laborum.

## Configuration

\`\`\`ts
const config = {
  name: '${slug}',
  enabled: true,
  timeout: ${(i + 1) * 1000},
}
\`\`\`
`
      fs.writeFileSync(path.join(sectionDir, `${slug}.md`), content, 'utf8')
    })
  })

  return {
    dir,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  }
}
