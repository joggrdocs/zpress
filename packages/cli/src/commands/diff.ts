import { spawnSync } from 'node:child_process'

import { command } from '@kidd-cli/core'
import { createPaths, hasGlobChars, loadConfig } from '@zpress/core'
import type { Section, Workspace, WorkspaceCategory, ZpressConfig } from '@zpress/core'
import { z } from 'zod'

/**
 * Extract the directory base from a glob pattern.
 * Returns everything up to (and including) the last `/` before the first glob character.
 */
function globBase(pattern: string): string {
  const indices = ['*', '?', '{', '['].map((char) => pattern.indexOf(char)).filter((i) => i !== -1)

  if (indices.length === 0) {
    return pattern
  }

  const firstGlob = Math.min(...indices)
  const base = pattern.slice(0, firstGlob)
  const lastSep = base.lastIndexOf('/')

  if (lastSep === -1) {
    return '.'
  }
  return base.slice(0, lastSep + 1)
}

/**
 * Normalize a source path: convert globs to their base directory, keep files as-is.
 */
function normalizePath(sourcePath: string): string {
  if (hasGlobChars(sourcePath)) {
    return globBase(sourcePath)
  }
  return sourcePath
}

/**
 * Extract `from` paths from a single section as an array.
 */
function sectionFromPaths(section: Section): readonly string[] {
  const { from } = section
  if (from) {
    return [from]
  }
  return []
}

/**
 * Extract child paths from a single section as an array.
 */
function sectionChildPaths(section: Section): readonly string[] {
  const { items } = section
  if (items) {
    return collectSectionPaths(items)
  }
  return []
}

/**
 * Recursively collect all `from` paths from a section tree.
 */
function collectSectionPaths(sections: readonly Section[]): readonly string[] {
  return sections.flatMap((section) => [
    ...sectionFromPaths(section),
    ...sectionChildPaths(section),
  ])
}

/**
 * Collect section paths from an optional section array.
 */
function collectOptionalSectionPaths(items: readonly Section[] | undefined): readonly string[] {
  if (items) {
    return collectSectionPaths(items)
  }
  return []
}

/**
 * Resolve the discovery `from` pattern for a workspace, falling back to the default.
 */
function resolveDiscoveryFrom(ws: Workspace): string {
  const { discovery } = ws
  if (discovery && discovery.from) {
    return discovery.from
  }
  return 'docs/*.md'
}

/**
 * Collect discovery paths from workspace items, resolving `from` relative to the workspace prefix.
 */
function collectWorkspacePaths(items: readonly Workspace[]): readonly string[] {
  return items.flatMap((ws) => {
    const { prefix, items: wsItems } = ws
    const base = prefix.replace(/^\//, '')
    const from = resolveDiscoveryFrom(ws)
    const itemPaths = collectOptionalSectionPaths(wsItems)
    return [`${base}/${from}`, ...itemPaths]
  })
}

/**
 * Collect all content source paths from a zpress config.
 */
function collectConfigPaths(config: ZpressConfig): readonly string[] {
  const { sections, apps, packages: pkgs, workspaces, openapi } = config

  const sectionPaths = collectSectionPaths(sections)

  const appPaths = collectOptionalWorkspacePaths(apps)
  const packagePaths = collectOptionalWorkspacePaths(pkgs)

  const workspacePaths = collectOptionalCategoryPaths(workspaces)
  const openapiPaths = collectOptionalOpenapiPaths(openapi)

  return [
    'zpress.config.ts',
    ...sectionPaths,
    ...appPaths,
    ...packagePaths,
    ...workspacePaths,
    ...openapiPaths,
  ]
}

/**
 * Collect workspace paths from an optional workspace array.
 */
function collectOptionalWorkspacePaths(items: readonly Workspace[] | undefined): readonly string[] {
  if (items) {
    return collectWorkspacePaths(items)
  }
  return []
}

/**
 * Collect workspace paths from an optional category array.
 */
function collectOptionalCategoryPaths(
  categories: readonly WorkspaceCategory[] | undefined
): readonly string[] {
  if (categories) {
    return categories.flatMap((cat: WorkspaceCategory) => collectWorkspacePaths(cat.items))
  }
  return []
}

/**
 * Collect the OpenAPI spec path if configured.
 */
function collectOptionalOpenapiPaths(openapi: ZpressConfig['openapi']): readonly string[] {
  if (openapi) {
    return [openapi.spec]
  }
  return []
}

/**
 * Check if a path is already covered by a directory in the list.
 */
function isCoveredByParent(targetPath: string, directories: readonly string[]): boolean {
  return directories.some((dir) => dir !== targetPath && targetPath.startsWith(dir))
}

/**
 * Deduplicate paths: normalize, remove duplicates, remove paths covered by parent directories.
 */
function deduplicatePaths(paths: readonly string[]): readonly string[] {
  const normalized = [...new Set(paths.map(normalizePath))].toSorted()
  const directories = normalized.filter((p) => p.endsWith('/'))
  return normalized.filter((p) => !isCoveredByParent(p, directories))
}

/**
 * Registers the `diff` CLI command to check if documentation sources changed between commits.
 */
export const diffCommand = command({
  description: 'Check if documentation sources changed between commits',
  args: z.object({
    paths: z.boolean().optional().default(false),
  }),
  handler: async (ctx) => {
    const zpressPaths = createPaths(process.cwd())
    const [configErr, config] = await loadConfig(zpressPaths.repoRoot)

    if (configErr) {
      ctx.logger.error(configErr.message)
      if (configErr.errors && configErr.errors.length > 0) {
        configErr.errors.map((err) => {
          const errPath = err.path.join('.')
          return ctx.logger.error(`  ${errPath}: ${err.message}`)
        })
      }
      process.exit(1)
    }

    const rawPaths = collectConfigPaths(config)
    const sourcePaths = deduplicatePaths(rawPaths)

    if (ctx.args.paths) {
      sourcePaths.map((p) => ctx.output.raw(`${p}\n`))
      return
    }

    const result = spawnSync('git', ['diff', 'HEAD^', 'HEAD', '--quiet', ...sourcePaths], {
      cwd: zpressPaths.repoRoot,
      stdio: 'inherit',
    })

    if (result.status === null) {
      process.exit(1)
    }

    process.exit(result.status)
  },
})
