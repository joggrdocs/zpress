import fs from 'node:fs'
import path from 'node:path'

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..', '..')

const DIRECTORY_NAMES = [
  'guides',
  'api',
  'tutorials',
  'concepts',
  'reference',
  'architecture',
  'integrations',
  'operations',
  'deployment',
  'security',
  'monitoring',
  'migrations',
  'workflows',
  'plugins',
  'internals',
  'examples',
  'recipes',
  'patterns',
  'troubleshooting',
  'contributing',
] as const

const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
]

/**
 * A generated fixture project with a cleanup function.
 */
export interface GeneratedFixture {
  readonly dir: string
  readonly fileCount: number
  readonly cleanup: () => void
}

/**
 * Options for generating a fixture project.
 */
export interface GenerateFixtureOptions {
  /** Number of top-level sections in the zpress config. */
  readonly sections: number
  /** Number of markdown files per directory. */
  readonly files: number
  /** Number of subdirectories per section (files are spread across these). */
  readonly directories: number
}

/**
 * Generate a fixture project with deterministic markdown files.
 *
 * Creates a temp directory inside the repo (so workspace deps resolve),
 * writes a zpress config and markdown files with lorem ipsum content.
 * Each section gets `directories` subdirectories, each containing `files` markdown files.
 * Total file count = sections * directories * files.
 *
 * @param options - Fixture generation options
 * @returns Object with dir path, file count, and cleanup function
 */
export function generateFixture(options: GenerateFixtureOptions): GeneratedFixture {
  const { sections, files, directories } = options
  const fixturesDir = path.join(REPO_ROOT, '.bench-fixtures')
  fs.mkdirSync(fixturesDir, { recursive: true })
  const dir = fs.mkdtempSync(path.join(fixturesDir, `bench-`))

  const sectionNames = Array.from(
    { length: sections },
    (_, i) => DIRECTORY_NAMES[i % DIRECTORY_NAMES.length],
  )

  // Deduplicate section names by appending index when needed
  const uniqueSectionNames = sectionNames.map((name, i) => {
    const firstIndex = sectionNames.indexOf(name)
    if (firstIndex === i) {
      return name
    }
    return `${name}-${i}`
  })

  // Write zpress.config.ts — each section uses recursive glob over its directory
  const sectionConfigs = uniqueSectionNames
    .map(
      (name) => `    {
      title: '${name.charAt(0).toUpperCase()}${name.slice(1)}',
      path: '/${name}',
      include: '${name}/**/*.md',
      recursive: true,
    }`,
    )
    .join(',\n')

  fs.writeFileSync(
    path.join(dir, 'zpress.config.ts'),
    `import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'Benchmark Fixture',
  sections: [
${sectionConfigs}
  ],
})
`,
    'utf8',
  )

  // Write package.json so workspace deps resolve
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'bench-fixture',
        private: true,
        type: 'module',
        dependencies: { '@zpress/kit': 'workspace:*' },
      },
      null,
      2,
    ),
    'utf8',
  )

  // Generate markdown files: sections × directories × files
  const dirNames = Array.from({ length: directories }, (_, i) => `group-${String(i + 1).padStart(2, '0')}`)

  let totalFiles = 0

  uniqueSectionNames.forEach((section, sectionIdx) => {
    dirNames.forEach((dirName, dirIdx) => {
      const targetDir = path.join(dir, section, dirName)
      fs.mkdirSync(targetDir, { recursive: true })

      Array.from({ length: files }, (_, fileIdx) => {
        const globalIdx = sectionIdx * directories * files + dirIdx * files + fileIdx
        const title = `${section} ${dirName} document ${fileIdx + 1}`
        const slug = `doc-${String(fileIdx + 1).padStart(3, '0')}`
        const para1 = LOREM_PARAGRAPHS[globalIdx % LOREM_PARAGRAPHS.length]
        const para2 = LOREM_PARAGRAPHS[(globalIdx + 1) % LOREM_PARAGRAPHS.length]
        const para3 = LOREM_PARAGRAPHS[(globalIdx + 2) % LOREM_PARAGRAPHS.length]

        const content = `---
title: "${title}"
description: "Documentation for ${section} ${dirName} topic ${fileIdx + 1}"
---

# ${title}

${para1}

## Overview

${para2}

## Details

${para3}

## Configuration

\`\`\`ts
const config = {
  name: '${slug}',
  enabled: true,
  timeout: ${(fileIdx + 1) * 1000},
}
\`\`\`
`
        fs.writeFileSync(path.join(targetDir, `${slug}.md`), content, 'utf8')
        totalFiles += 1
      })
    })
  })

  return {
    dir,
    fileCount: totalFiles,
    cleanup: () => fs.rmSync(dir, { recursive: true, force: true }),
  }
}
