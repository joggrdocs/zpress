/**
 * Codemod registry — collects all available codemods and filters by version range.
 */

import { gt, lte, valid } from 'semver'

import type { CodemodResult } from './errors.ts'
import { codemodError } from './errors.ts'
import type { Codemod, CodemodManifest } from './types.ts'

const codemods: readonly Codemod[] = []

/**
 * Return all registered codemods.
 *
 * @returns The full list of available codemods
 */
export function allCodemods(): readonly Codemod[] {
  return codemods
}

/**
 * Return codemods applicable for a version upgrade.
 *
 * Filters to codemods whose version is greater than `fromVersion`
 * and less than or equal to `toVersion`, excluding any already applied
 * per the manifest.
 *
 * @param params - Version range and manifest for filtering
 * @param params.fromVersion - The version being upgraded from
 * @param params.toVersion - The version being upgraded to
 * @param params.manifest - Previously applied codemods manifest (if any)
 * @returns Filtered list of applicable codemods, or an error if versions are invalid
 */
export function pendingCodemods(params: {
  readonly fromVersion: string
  readonly toVersion: string
  readonly manifest: CodemodManifest | null
}): CodemodResult<readonly Codemod[]> {
  const { fromVersion, toVersion, manifest } = params

  if (!valid(fromVersion)) {
    return [codemodError('invalid_version', `Invalid fromVersion: ${fromVersion}`), null]
  }

  if (!valid(toVersion)) {
    return [codemodError('invalid_version', `Invalid toVersion: ${toVersion}`), null]
  }

  const appliedIds = extractAppliedIds(manifest)

  const filtered = codemods.filter((codemod) => {
    if (appliedIds.has(codemod.id)) {
      return false
    }
    const codemodVersion = valid(codemod.version)
    if (!codemodVersion) {
      return false
    }
    return gt(codemodVersion, fromVersion) && lte(codemodVersion, toVersion)
  })

  return [null, filtered]
}

/**
 * Register a codemod into the global registry.
 *
 * Called at module initialization by each codemod definition.
 * This is an intentional side-effect at the module boundary.
 *
 * @param codemod - The codemod to register
 */
export function registerCodemod(codemod: Codemod): void {
  // Intentional mutation: registry population is a module-init side effect
  ;(codemods as Codemod[]).push(codemod)
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Extract the set of applied codemod IDs from a manifest.
 *
 * @private
 * @param manifest - The manifest to extract from, or null
 * @returns Set of applied codemod IDs
 */
function extractAppliedIds(manifest: CodemodManifest | null): Set<string> {
  if (manifest) {
    return new Set(manifest.applied.map((entry) => entry.id))
  }
  return new Set()
}
