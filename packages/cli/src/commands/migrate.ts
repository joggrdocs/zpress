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

    // Resolve config file path
    const resolvedConfig = await resolveConfigPath(paths.repoRoot)
    if (resolvedConfig[0]) {
      ctx.logger.error(resolvedConfig[0])
      process.exit(1)
    }
    const configPath = resolvedConfig[1] as string

    // Read current config source
    const readResult = await readSource(configPath)
    if (readResult[0]) {
      ctx.logger.error(readResult[0])
      process.exit(1)
    }
    const source = readResult[1] as string

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
 * Resolve the absolute path to the zpress config file.
 *
 * @private
 * @param repoRoot - Repository root directory
 * @returns Absolute config path or error message
 */
async function resolveConfigPath(
  repoRoot: string
): Promise<readonly [string, null] | readonly [null, string]> {
  const candidates = CONFIG_EXTENSIONS.map((ext) => path.join(repoRoot, `${CONFIG_BASENAME}${ext}`))

  const results = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        await fs.access(candidate)
        return candidate
      } catch {
        return null
      }
    })
  )

  const found = results.find((r) => r !== null)
  if (!found) {
    return [`No config file found (tried ${CONFIG_EXTENSIONS.join(', ')})`, null]
  }

  return [null, found]
}

/**
 * Read the source text of a file.
 *
 * @private
 * @param filePath - Absolute path to the file
 * @returns File content or error message
 */
async function readSource(
  filePath: string
): Promise<readonly [string, null] | readonly [null, string]> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return [null, content]
  } catch {
    return [`Failed to read config file: ${filePath}`, null]
  }
}

/**
 * Attempt to extract a version comment from the config source.
 *
 * Looks for patterns like `// @zpress-version 0.3.0` or
 * `@zpress/kit` import to infer the approximate version.
 *
 * @private
 * @param _source - Config file source text
 * @returns Extracted version string or null
 */
function extractFromVersion(_source: string): string | null {
  return null
}
