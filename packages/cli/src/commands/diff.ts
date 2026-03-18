import { execFileSync } from 'node:child_process'
import path from 'node:path'

import { command } from '@kidd-cli/core'
import type { Section, ZpressConfig } from '@zpress/core'
import { createPaths, hasGlobChars, loadConfig } from '@zpress/core'
import { uniq } from 'es-toolkit'

/**
 * Registers the `diff` CLI command to show changed files in watched directories.
 */
export const diffCommand = command({
  description: 'Show changed files in configured source directories',
  handler: async (ctx) => {
    const paths = createPaths(process.cwd())
    ctx.logger.intro('zpress diff')

    const [configErr, config] = await loadConfig(paths.repoRoot)
    if (configErr) {
      ctx.logger.error(configErr.message)
      if (configErr.errors && configErr.errors.length > 0) {
        configErr.errors.map((err) => {
          const p = err.path.join('.')
          return ctx.logger.error(`  ${p}: ${err.message}`)
        })
      }
      process.exit(1)
    }

    const dirs = collectWatchDirs(config)

    if (dirs.length === 0) {
      ctx.logger.warn('No source directories found in config')
      ctx.logger.outro('Done')
      return
    }

    ctx.logger.step(`Watching: ${dirs.join(', ')}`)

    const changed = gitChangedFiles(paths.repoRoot, dirs)

    if (changed.length === 0) {
      ctx.logger.success('No changes detected')
      ctx.logger.outro('Done')
      return
    }

    ctx.logger.warn(`${changed.length} changed file(s):`)
    changed.map((file) => ctx.logger.info(`  ${file}`))
    ctx.logger.outro('Done')
  },
})

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Collect unique directory paths from all section `from` fields in the config.
 *
 * @private
 * @param config - Resolved zpress config
 * @returns Deduplicated array of directory paths to watch
 */
function collectWatchDirs(config: ZpressConfig): readonly string[] {
  const dirs = flattenFromPaths(config.sections)
  return uniq(dirs.map(toDirectory))
}

/**
 * Recursively extract all `from` values from a section tree.
 *
 * @private
 * @param sections - Section tree to traverse
 * @returns Flat array of all `from` path strings
 */
function flattenFromPaths(sections: readonly Section[]): readonly string[] {
  return sections.flatMap(flattenSection)
}

/**
 * Extract `from` paths from a single section, including nested items.
 *
 * @private
 * @param section - Section to extract from paths from
 * @returns Array of `from` path strings found in this section and its children
 */
function flattenSection(section: Section): readonly string[] {
  if (section.from && section.items) {
    return [section.from, ...flattenFromPaths(section.items)]
  }
  if (section.from) {
    return [section.from]
  }
  if (section.items) {
    return flattenFromPaths(section.items)
  }
  return []
}

/**
 * Extract the directory portion from a path that may contain glob characters.
 *
 * @private
 * @param from - A path or glob pattern (e.g. `docs/guides/*.md`)
 * @returns The directory portion (e.g. `docs/guides`)
 */
function toDirectory(from: string): string {
  if (hasGlobChars(from)) {
    const segments = from.split(path.sep)
    const dirSegments = segments.filter((s) => !hasGlobChars(s))
    return dirSegments.join(path.sep) || '.'
  }
  return from
}

/**
 * Run `git status --short` scoped to the given directories and return changed file paths.
 *
 * @private
 * @param repoRoot - Absolute path to the repo root
 * @param dirs - Directories to scope the git status to
 * @returns Array of changed file paths (repo-relative)
 */
function gitChangedFiles(repoRoot: string, dirs: readonly string[]): readonly string[] {
  const output = execSilent('git', ['status', '--short', '--', ...dirs], repoRoot)
  if (!output) {
    return []
  }
  return output
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.slice(3))
}

/**
 * Run a command silently with an explicit argument array, returning
 * trimmed stdout or `null` on failure.
 *
 * @private
 * @param file - Executable to run
 * @param args - Arguments to pass to the executable
 * @param cwd - Working directory for the command
 * @returns Trimmed stdout string or null on failure
 */
function execSilent(file: string, args: readonly string[], cwd: string): string | null {
  try {
    return execFileSync(file, [...args], { cwd, stdio: 'pipe', encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}
