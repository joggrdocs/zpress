import fs from 'node:fs/promises'
import path from 'node:path'

import { attemptAsync } from 'es-toolkit'

import type { Manifest } from './types.ts'

const MANIFEST_FILE = '.generated/manifest.json'

/**
 * Load the previous sync manifest from disk.
 *
 * @param outDir - Absolute path to the output directory
 * @returns Parsed manifest, or `null` if no manifest exists
 */
export async function loadManifest(outDir: string): Promise<Manifest | null> {
  const p = path.resolve(outDir, MANIFEST_FILE)
  // I/O boundary: both fs.readFile and JSON.parse can throw —
  // missing file (first sync) or corrupted manifest are expected cases.
  try {
    const raw = await fs.readFile(p, 'utf8')
    return JSON.parse(raw) as Manifest
  } catch {
    return null
  }
}

/**
 * Write the current sync manifest to disk.
 *
 * @param outDir - Absolute path to the output directory
 * @param manifest - Manifest to persist
 */
export async function saveManifest(outDir: string, manifest: Manifest): Promise<void> {
  const p = path.resolve(outDir, MANIFEST_FILE)
  await fs.mkdir(path.dirname(p), { recursive: true })
  await fs.writeFile(p, JSON.stringify(manifest, null, 2), 'utf8')
}

/**
 * Delete output files that exist in the old manifest but not the new one.
 * Prunes empty parent directories after removing stale files.
 *
 * @param outDir - Absolute path to the output directory
 * @param oldManifest - Manifest from the previous sync
 * @param newManifest - Manifest from the current sync
 * @returns Number of stale files removed
 */
export async function cleanStaleFiles(
  outDir: string,
  oldManifest: Manifest,
  newManifest: Manifest
): Promise<number> {
  const oldPaths = new Set(Object.keys(oldManifest.files))
  const newPaths = new Set(Object.keys(newManifest.files))
  const stalePaths = [...oldPaths].filter((p) => !newPaths.has(p))

  await Promise.all(
    stalePaths.map((oldPath) =>
      attemptAsync(async () => {
        const abs = path.resolve(outDir, oldPath)
        await fs.rm(abs, { force: true })
        await pruneEmptyDirs(path.dirname(abs), outDir)
      })
    )
  )

  return stalePaths.length
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Recursively remove empty parent directories up to the stop boundary.
 *
 * @private
 * @param dir - Absolute path to the directory to check and possibly remove
 * @param stopAt - Absolute path to the boundary directory (never removed)
 * @returns Promise that resolves when pruning is complete
 */
async function pruneEmptyDirs(dir: string, stopAt: string): Promise<void> {
  if (dir === stopAt || !dir.startsWith(stopAt)) {
    return
  }
  try {
    const entries = await fs.readdir(dir)
    if (entries.length === 0) {
      await fs.rmdir(dir)
      await pruneEmptyDirs(path.dirname(dir), stopAt)
    }
  } catch {
    // directory may have been removed already
  }
}
