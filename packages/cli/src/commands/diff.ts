import { execFileSync } from 'node:child_process'
import path from 'node:path'

import { command } from '@kidd-cli/core'
import type { Section, ZpressConfig, Result } from '@zpress/core'
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
        // oxlint-disable-next-line unicorn/no-array-for-each -- side-effect: logging each validation error
        configErr.errors.forEach((err) => {
          const p = err.path.join('.')
          ctx.logger.error(`  ${p}: ${err.message}`)
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

    const [gitErr, changed] = gitChangedFiles({ repoRoot: paths.repoRoot, dirs })

    if (gitErr) {
      ctx.logger.error(`Git failed: ${gitErr.message}`)
      ctx.logger.outro('Done')
      process.exit(1)
    }

    if (changed.length === 0) {
      ctx.logger.success('No changes detected')
      ctx.logger.outro('Done')
      return
    }

    ctx.logger.warn(`${changed.length} changed file(s):`)
    // oxlint-disable-next-line unicorn/no-array-for-each -- side-effect: logging each changed file
    changed.forEach((file) => ctx.logger.info(`  ${file}`))
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
 * Separator used by `git status --short` for renamed/copied entries.
 *
 * @private
 */
const RENAME_SEPARATOR = ' -> '

/**
 * Run `git status --short` scoped to the given directories and return changed file paths.
 *
 * @private
 * @param params - Parameters for the git status query
 * @param params.repoRoot - Absolute path to the repo root
 * @param params.dirs - Directories to scope the git status to
 * @returns Result tuple with changed file paths (repo-relative) or an error
 */
function gitChangedFiles(params: {
  readonly repoRoot: string
  readonly dirs: readonly string[]
}): Result<readonly string[]> {
  const [err, output] = execSilent({
    file: 'git',
    args: ['status', '--short', '--', ...params.dirs],
    cwd: params.repoRoot,
  })
  if (err) {
    return [err, null]
  }
  if (!output) {
    return [null, []]
  }
  const files = output
    .split('\n')
    .filter((line) => line.length > 0)
    .map(parseStatusLine)
    .filter((p) => p.length > 0)
  return [null, files]
}

/**
 * Extract the file path from a single `git status --short` output line.
 *
 * Format: `XY <path>` or `XY <old> -> <new>` for renames/copies.
 * The status prefix is always 3 characters (2 status chars + 1 space).
 *
 * @private
 * @param line - A single line from git status --short output
 * @returns The extracted file path (new path for renames)
 */
function parseStatusLine(line: string): string {
  const filePart = line.slice(3)
  const renameIdx = filePart.indexOf(RENAME_SEPARATOR)
  if (renameIdx !== -1) {
    return filePart.slice(renameIdx + RENAME_SEPARATOR.length)
  }
  return filePart
}

/**
 * Run a command silently with an explicit argument array, returning a Result
 * tuple with trimmed stdout on success or an Error on failure.
 *
 * @private
 * @param params - Parameters for the command execution
 * @param params.file - Executable to run
 * @param params.args - Arguments to pass to the executable
 * @param params.cwd - Working directory for the command
 * @returns Result tuple with trimmed stdout or an error
 */
function execSilent(params: {
  readonly file: string
  readonly args: readonly string[]
  readonly cwd: string
}): Result<string> {
  try {
    const output = execFileSync(params.file, [...params.args], {
      cwd: params.cwd,
      stdio: 'pipe',
      encoding: 'utf8',
    }).trim()
    return [null, output]
  } catch (error) {
    if (error instanceof Error) {
      return [error, null]
    }
    return [new Error(String(error)), null]
  }
}
