/**
 * Codemod manifest persistence — tracks which codemods have been applied.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import type { CodemodResult } from './errors.ts'
import { codemodError } from './errors.ts'
import type { AppliedCodemod, CodemodManifest } from './types.ts'

const MANIFEST_FILE = '.zpress/.generated/codemods.json'

/**
 * Load the codemod manifest from disk.
 *
 * @param repoRoot - Absolute path to the repository root
 * @returns Parsed manifest, or `null` if no manifest exists
 */
export async function loadCodemodManifest(
  repoRoot: string
): Promise<CodemodResult<CodemodManifest | null>> {
  const manifestPath = path.resolve(repoRoot, MANIFEST_FILE)
  try {
    const raw = await fs.readFile(manifestPath, 'utf8')
    const parsed = JSON.parse(raw) as CodemodManifest
    return [null, parsed]
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return [null, null]
    }
    return [
      codemodError('manifest_corrupted', `Failed to read codemod manifest: ${String(error)}`),
      null,
    ]
  }
}

/**
 * Save the codemod manifest to disk.
 *
 * @param repoRoot - Absolute path to the repository root
 * @param manifest - Manifest to persist
 * @returns Success or write error
 */
export async function saveCodemodManifest(
  repoRoot: string,
  manifest: CodemodManifest
): Promise<CodemodResult<void>> {
  const manifestPath = path.resolve(repoRoot, MANIFEST_FILE)
  try {
    await fs.mkdir(path.dirname(manifestPath), { recursive: true })
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
    return [null, undefined]
  } catch (error) {
    return [
      codemodError('write_failed', `Failed to write codemod manifest: ${String(error)}`),
      null,
    ]
  }
}

/**
 * Create an updated manifest with newly applied codemod IDs appended.
 *
 * @param params - Current manifest state and new entries
 * @param params.current - Existing manifest (or null for first run)
 * @param params.version - The target version being migrated to
 * @param params.appliedIds - IDs of codemods that were applied
 * @returns A new manifest with the applied entries added
 */
export function appendApplied(params: {
  readonly current: CodemodManifest | null
  readonly version: string
  readonly appliedIds: readonly string[]
}): CodemodManifest {
  const { current, version, appliedIds } = params
  const now = new Date().toISOString()
  const newEntries: readonly AppliedCodemod[] = appliedIds.map((id) => ({
    id,
    appliedAt: now,
  }))
  const previousApplied = extractPreviousApplied(current)
  return {
    version,
    applied: [...previousApplied, ...newEntries],
  }
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Extract the previously applied codemods from an existing manifest.
 *
 * @private
 * @param current - The existing manifest, or null
 * @returns Array of previously applied codemods
 */
function extractPreviousApplied(current: CodemodManifest | null): readonly AppliedCodemod[] {
  if (current) {
    return current.applied
  }
  return []
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
