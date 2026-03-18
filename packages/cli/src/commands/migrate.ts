import fs from 'node:fs/promises'
import path from 'node:path'

import { command } from '@kidd-cli/core'
import { createPaths } from '@zpress/core'
import { z } from 'zod'

import { allCodemods, listPending, migrate } from '../codemods/index.ts'

declare const ZPRESS_VERSION: string

const CONFIG_EXTENSIONS = ['.ts', '.js', '.mjs'] as const
const CONFIG_BASENAME = 'zpress.config'

/**
 * Registers the `migrate` CLI command to run codemods when upgrading zpress.
 *
 * Lists pending codemods for the version upgrade, prompts the user to
 * apply them, and writes the transformed config back to disk.
 */
export const migrateCommand = command({
  description: 'Run codemods to migrate your config to the current version',
  options: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    'dry-run': z.boolean().optional().default(false),
    list: z.boolean().optional().default(false),
  }),
  handler: async (ctx) => {
    const paths = createPaths(process.cwd())
    const toVersion = ctx.args.to ?? ZPRESS_VERSION
    const dryRun = ctx.args['dry-run']

    ctx.logger.intro('zpress migrate')

    if (ctx.args.list) {
      listAllCodemods(ctx.logger)
      ctx.logger.outro('Done')
      return
    }

    // Resolve and read config file in one pass
    const configResult = await loadConfigSource(paths.repoRoot)
    if (configResult[0]) {
      ctx.logger.error(configResult[0])
      process.exit(1)
    }
    const { configPath, source } = configResult[1] as NonNullable<(typeof configResult)[1]>

    // Determine from-version
    const fromVersion = ctx.args.from ?? extractFromVersion(source) ?? '0.0.0'

    // List pending codemods
    const pendingResult = await listPending({
      repoRoot: paths.repoRoot,
      fromVersion,
      toVersion,
    })
    if (pendingResult[0]) {
      ctx.logger.error(pendingResult[0].message)
      process.exit(1)
    }
    const pending = pendingResult[1] as Awaited<ReturnType<typeof listPending>>[1]

    if (!pending || pending.length === 0) {
      ctx.logger.info('No pending codemods for this version range')
      ctx.logger.outro('Done')
      return
    }

    ctx.logger.info(`Found ${pending.length} pending codemod(s)`)
    pending.map((codemod) => {
      const label = formatLabel(codemod.breaking)
      ctx.logger.info(`  ${label} ${codemod.id} — ${codemod.description}`)
      if (codemod.changelog) {
        ctx.logger.info(`    changelog: ${codemod.changelog}`)
      }
      return codemod
    })

    if (dryRun) {
      ctx.logger.step('Dry run — no changes will be written')
    }

    // Run migration
    const migrateResult = await migrate({
      configPath,
      source,
      fromVersion,
      toVersion,
      dryRun,
    })
    if (migrateResult[0]) {
      ctx.logger.error(migrateResult[0].message)
      process.exit(1)
    }
    const result = migrateResult[1] as NonNullable<(typeof migrateResult)[1]>

    if (result.applied.length > 0) {
      ctx.logger.success(`Applied ${result.applied.length} codemod(s):`)
      result.applied.map((summary) => {
        ctx.logger.info(`  ${summary.id}`)
        summary.changes.map((change) => ctx.logger.info(`    - ${change.description}`))
        return summary
      })
    }

    if (result.skipped.length > 0) {
      ctx.logger.info(`Skipped ${result.skipped.length} codemod(s) (no matching patterns):`)
      result.skipped.map((id) => ctx.logger.info(`  ${id}`))
    }

    if (dryRun) {
      ctx.logger.outro('Dry run complete')
    } else {
      ctx.logger.outro('Done')
    }
  },
})

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Format a label for a codemod based on whether it is breaking.
 *
 * @private
 * @param breaking - Whether the codemod addresses a breaking change
 * @returns Formatted label string
 */
function formatLabel(breaking: boolean): string {
  if (breaking) {
    return '[BREAKING]'
  }
  return '[migration]'
}

/**
 * Log all registered codemods grouped by version.
 *
 * @private
 * @param logger - CLI logger instance
 */
function listAllCodemods(logger: { readonly info: (msg: string) => void }): void {
  const codemods = allCodemods()
  if (codemods.length === 0) {
    logger.info('No codemods registered')
    return
  }

  logger.info(`${codemods.length} registered codemod(s):`)
  codemods.map((codemod) => {
    const label = formatLabel(codemod.breaking)
    logger.info(`  ${label} ${codemod.id} (v${codemod.version})`)
    logger.info(`    ${codemod.description}`)
    if (codemod.changelog) {
      logger.info(`    changelog: ${codemod.changelog}`)
    }
    return codemod
  })
}

/**
 * Resolve and read the zpress config file in a single pass.
 *
 * Attempts to read each candidate file directly, avoiding a separate
 * existence check (TOCTOU). Returns the first successfully read file.
 *
 * @private
 * @param repoRoot - Repository root directory
 * @returns Config path and source text, or error message
 */
async function loadConfigSource(
  repoRoot: string
): Promise<readonly [string, null] | readonly [null, { readonly configPath: string; readonly source: string }]> {
  const candidates = CONFIG_EXTENSIONS.map((ext) => path.join(repoRoot, `${CONFIG_BASENAME}${ext}`))

  // Sequential short-circuit: stop on first successful read, surface non-ENOENT errors immediately
  const result = await candidates.reduce<
    Promise<readonly [string, null] | readonly [null, { readonly configPath: string; readonly source: string }] | null>
  >(async (accPromise, candidate) => {
    const acc = await accPromise
    // Already found a result or hit an error — skip remaining candidates
    if (acc !== null) {
      return acc
    }
    try {
      const content = await fs.readFile(candidate, 'utf8')
      return [null, { configPath: candidate, source: content }]
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return null
      }
      return [`Failed to read ${candidate}: ${String(error)}`, null]
    }
  }, Promise.resolve(null))

  if (result) {
    return result
  }

  return [`No config file found (tried ${CONFIG_EXTENSIONS.join(', ')})`, null]
}

/**
 * Attempt to extract a version comment from the config source.
 *
 * Looks for patterns like `// @zpress-version 0.3.0` or
 * `@zpress/kit` import to infer the approximate version.
 *
 * TODO: Implement version extraction — currently returns null,
 * causing the caller to fall back to '0.0.0' (re-evaluates all codemods).
 *
 * @private
 * @param _source - Config file source text
 * @returns Extracted version string or null
 */
function extractFromVersion(_source: string): string | null {
  return null
}

/**
 * Type guard for Node.js system errors with a `code` property.
 *
 * @private
 * @param error - The unknown error value
 * @returns Whether the error has a string `code` property
 */
function isNodeError(error: unknown): error is { readonly code: string } {
  return typeof error === 'object' && error !== null && 'code' in error
}
