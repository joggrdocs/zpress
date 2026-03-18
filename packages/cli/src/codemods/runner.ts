/**
 * Codemod runner — executes pending codemods against a config source file.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import { toError } from '../lib/error.ts'
import type { CodemodResult } from './errors.ts'
import { codemodError } from './errors.ts'
import { appendApplied, loadCodemodManifest, saveCodemodManifest } from './manifest.ts'
import { pendingCodemods } from './registry.ts'
import type { Codemod, CodemodRunSummary, MigrateOptions, MigrateResult } from './types.ts'

/**
 * Run all pending codemods for a version upgrade.
 *
 * Loads the manifest, filters applicable codemods, applies transforms
 * sequentially (each feeds its output to the next), and persists the
 * updated manifest unless `dryRun` is set.
 *
 * @param options - Migration options including version range and config path
 * @returns Migration result with applied/skipped summaries and final source
 */
export async function migrate(options: MigrateOptions): Promise<CodemodResult<MigrateResult>> {
  const { configPath, source, fromVersion, toVersion, dryRun } = options
  const repoRoot = path.dirname(configPath)

  const [manifestErr, manifest] = await loadCodemodManifest(repoRoot)
  if (manifestErr) {
    return [manifestErr, null]
  }

  const [pendingErr, pending] = pendingCodemods({ fromVersion, toVersion, manifest })
  if (pendingErr) {
    return [pendingErr, null]
  }

  const filtered = filterByIds(pending, options.ids)

  if (filtered.length === 0) {
    return [null, { applied: [], skipped: [], source }]
  }

  const [applyErr, result] = applyCodemods({
    codemods: filtered,
    configPath,
    source,
  })
  if (applyErr) {
    return [applyErr, null]
  }

  if (!dryRun) {
    const [writeErr] = await writeTransformedSource(configPath, result.source)
    if (writeErr) {
      return [writeErr, null]
    }

    const updatedManifest = appendApplied({
      current: manifest,
      version: toVersion,
      appliedIds: result.applied.map((summary) => summary.id),
    })
    const [saveErr] = await saveCodemodManifest(repoRoot, updatedManifest)
    if (saveErr) {
      return [saveErr, null]
    }
  }

  return [null, result]
}

/**
 * List all pending codemods for a version upgrade without applying them.
 *
 * @param params - Version range and repo root for manifest lookup
 * @param params.repoRoot - Absolute path to the repository root
 * @param params.fromVersion - The version being upgraded from
 * @param params.toVersion - The version being upgraded to
 * @returns List of pending codemods
 */
export async function listPending(params: {
  readonly repoRoot: string
  readonly fromVersion: string
  readonly toVersion: string
}): Promise<CodemodResult<readonly Codemod[]>> {
  const { repoRoot, fromVersion, toVersion } = params

  const [manifestErr, manifest] = await loadCodemodManifest(repoRoot)
  if (manifestErr) {
    return [manifestErr, null]
  }

  return pendingCodemods({ fromVersion, toVersion, manifest })
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Filter codemods by explicit ID list, or return all if no IDs specified.
 *
 * @private
 * @param codemods - Full list of pending codemods
 * @param ids - Optional explicit list of IDs to include
 * @returns Filtered codemods
 */
function filterByIds(
  codemods: readonly Codemod[],
  ids: readonly string[] | undefined
): readonly Codemod[] {
  if (!ids) {
    return codemods
  }
  return codemods.filter((codemod) => ids.includes(codemod.id))
}

/**
 * Apply a list of codemods sequentially, threading the source through each transform.
 *
 * @private
 * @param params - Codemods to apply with config context
 * @returns Accumulated migration result or transform error
 */
function applyCodemods(params: {
  readonly codemods: readonly Codemod[]
  readonly configPath: string
  readonly source: string
}): CodemodResult<MigrateResult> {
  const { codemods, configPath } = params

  const initial: MigrateResult = {
    applied: [],
    skipped: [],
    source: params.source,
  }

  // Sequential reduce: each codemod transforms the output of the previous
  return codemods.reduce<CodemodResult<MigrateResult>>(
    (acc, codemod) => {
      const [accErr, current] = acc
      if (accErr) {
        return [accErr, null]
      }

      try {
        const output = codemod.transform({ configPath, source: current.source })

        if (output.changes.length === 0) {
          return [
            null,
            {
              ...current,
              skipped: [...current.skipped, codemod.id],
            },
          ]
        }

        const summary: CodemodRunSummary = {
          id: codemod.id,
          description: codemod.description,
          breaking: codemod.breaking,
          changes: output.changes,
          changelog: codemod.changelog,
        }

        return [
          null,
          {
            applied: [...current.applied, summary],
            skipped: current.skipped,
            source: output.source,
          },
        ]
      } catch (error) {
        return [
          codemodError(
            'transform_failed',
            `Codemod "${codemod.id}" failed: ${toError(error).message}`
          ),
          null,
        ]
      }
    },
    [null, initial]
  )
}

/**
 * Write the transformed source back to the config file.
 *
 * @private
 * @param configPath - Absolute path to the config file
 * @param source - Transformed source text to write
 * @returns Success or write error
 */
async function writeTransformedSource(
  configPath: string,
  source: string
): Promise<CodemodResult<void>> {
  try {
    await fs.writeFile(configPath, source, 'utf8')
    return [null, undefined]
  } catch (error) {
    return [codemodError('write_failed', `Failed to write config: ${String(error)}`), null]
  }
}
