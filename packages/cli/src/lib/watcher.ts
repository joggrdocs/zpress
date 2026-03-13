import { existsSync } from 'node:fs'
import path from 'node:path'

import { cliLogger } from '@kidd-cli/core/logger'
import type { ZpressConfig, Entry, Paths } from '@zpress/core'
import { loadConfig, hasGlobChars, sync } from '@zpress/core'
import type { FSWatcher } from 'chokidar'
import { watch } from 'chokidar'
import { debounce } from 'es-toolkit'
import { match } from 'ts-pattern'

const CONFIG_EXTENSIONS = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json'] as const

const MARKDOWN_EXTENSIONS = ['.md', '.mdx'] as const

function isMarkdownFile(filePath: string): boolean {
  return MARKDOWN_EXTENSIONS.some((ext) => filePath.endsWith(ext))
}

/**
 * Find the nearest existing ancestor directory for a given path.
 * Chokidar cannot watch non-existent paths, but can detect when missing
 * subdirectories appear under a watched parent directory.
 *
 * @param targetPath - The path to normalize (may not exist)
 * @param fallbackRoot - Fallback root if no ancestors exist
 * @returns The nearest existing ancestor directory path
 */
function nearestExistingAncestor(targetPath: string, fallbackRoot: string): string {
  // oxlint-disable-next-line functional/no-let -- iterative ancestor search
  let current = targetPath
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: checking if path exists
  if (existsSync(current)) {
    return current
  }
  // Walk up parent directories until we find one that exists
  // oxlint-disable-next-line functional/no-loop-statements -- acceptable for iterative directory traversal
  while (current !== path.dirname(current)) {
    current = path.dirname(current)
    // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: checking if path exists
    if (existsSync(current)) {
      return current
    }
  }
  return fallbackRoot
}

/**
 * Create a file watcher that re-syncs documentation on changes.
 *
 * Watches markdown/mdx files and the zpress config file. Returns the
 * chokidar `FSWatcher` instance so the caller can close it on shutdown.
 * Returns `undefined` if there are no paths to watch.
 *
 * @param onConfigReload - Optional async callback invoked after config reload and sync complete, receives new config
 */
export function createWatcher(
  initialConfig: ZpressConfig,
  paths: Paths,
  onConfigReload?: (newConfig: ZpressConfig) => Promise<void>
): FSWatcher | undefined {
  const { repoRoot } = paths
  const configFiles = CONFIG_EXTENSIONS.map((ext) => path.resolve(repoRoot, `zpress.config${ext}`))
  // oxlint-disable-next-line functional/no-let -- mutable config reloaded on file changes
  let config = initialConfig
  const planningDir = path.resolve(repoRoot, '.planning')
  // Normalize content paths to nearest existing ancestors (Chokidar limitation with non-existent paths)
  const contentPaths = extractWatchPaths(config.sections, repoRoot).map((p) =>
    nearestExistingAncestor(p, repoRoot)
  )
  const initialWatchPaths = [
    ...contentPaths,
    nearestExistingAncestor(planningDir, repoRoot),
    ...configFiles,
  ]
  // Deduplicate initial paths
  const uniqueInitialPaths = [...new Set(initialWatchPaths)]

  if (uniqueInitialPaths.length === 0) {
    cliLogger.warn('No source paths to watch')
    return
  }

  cliLogger.info(
    `Watching ${uniqueInitialPaths.length} paths: ${uniqueInitialPaths.map((p) => path.relative(repoRoot, p)).join(', ')}`
  )

  // oxlint-disable-next-line functional/no-let -- mutable sync state for debounced watcher
  let syncing = false
  // oxlint-disable-next-line functional/no-let -- tracks whether a pending resync needs config reload
  let pendingReloadConfig: boolean | null = null
  // oxlint-disable-next-line functional/no-let -- bounded retry counter to prevent unbounded recursive sync
  let consecutiveFailures = 0
  const MAX_CONSECUTIVE_FAILURES = 5
  // oxlint-disable-next-line functional/no-let -- tracks currently watched paths for dynamic updates
  let currentWatchPaths = new Set(uniqueInitialPaths)

  const watcher = watch(uniqueInitialPaths, {
    ignoreInitial: true,
    ignored: ['**/node_modules/**', '**/.git/**', '**/.zpress/**', '**/bundle/**'],
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  })

  function updateWatchPaths(newConfig: ZpressConfig): void {
    const newContentPaths = extractWatchPaths(newConfig.sections, repoRoot)
    // Normalize each content path to its nearest existing ancestor
    // (Chokidar cannot watch non-existent paths, but can detect subdirs when they appear)
    const normalizedContentPaths = newContentPaths.map((p) => nearestExistingAncestor(p, repoRoot))
    const newWatchPaths = [
      ...normalizedContentPaths,
      // Normalize planning dir to nearest existing ancestor
      nearestExistingAncestor(planningDir, repoRoot),
      ...configFiles,
    ]
    // Deduplicate normalized paths
    const newSet = new Set(newWatchPaths)

    // Add new paths
    const toAdd = [...newSet].filter((p) => !currentWatchPaths.has(p))
    if (toAdd.length > 0) {
      watcher.add(toAdd)
      cliLogger.info(`Added ${toAdd.length} watch paths: ${toAdd.map((p) => path.relative(repoRoot, p)).join(', ')}`)
    }

    // Remove old paths (excluding config files which should always be watched)
    const configFileSet = new Set(configFiles)
    const toRemove = [...currentWatchPaths].filter((p) => !newSet.has(p) && !configFileSet.has(p))
    if (toRemove.length > 0) {
      watcher.unwatch(toRemove)
      cliLogger.info(
        `Removed ${toRemove.length} watch paths: ${toRemove.map((p) => path.relative(repoRoot, p)).join(', ')}`
      )
    }

    currentWatchPaths = newSet
  }

  async function triggerSync(reloadConfig: boolean) {
    if (syncing) {
      // Preserve the most demanding pending value: if any pending call wants
      // a config reload, keep it as true even if a later call passes false.
      pendingReloadConfig = pendingReloadConfig === true || reloadConfig
      return
    }
    syncing = true
    // oxlint-disable-next-line functional/no-let -- tracks whether this sync included a config reload
    let didReloadConfig = false
    try {
      if (reloadConfig) {
        const [configErr, newConfig] = await loadConfig(paths.repoRoot)
        if (configErr) {
          cliLogger.error(`Config reload failed: ${configErr.message}`)
          return
        }
        config = newConfig
        cliLogger.info('Config reloaded')
        updateWatchPaths(newConfig)
        didReloadConfig = true
      }
      await sync(config, { paths })
      consecutiveFailures = 0
      // Notify caller that config was reloaded and sync completed successfully
      if (didReloadConfig && onConfigReload) {
        await onConfigReload(config)
      }
    } catch (error) {
      consecutiveFailures += 1
      const errorMessage = (() => {
        if (error instanceof Error) {
          return error.message
        }
        return String(error)
      })()
      cliLogger.error(`Sync error: ${errorMessage}`)
    } finally {
      syncing = false
      if (pendingReloadConfig !== null) {
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          cliLogger.error(
            `Sync failed ${consecutiveFailures} consecutive times, dropping pending resync. Will retry on next file change.`
          )
          pendingReloadConfig = null
          consecutiveFailures = 0
        } else {
          const shouldReload = pendingReloadConfig
          pendingReloadConfig = null
          triggerSync(shouldReload)
        }
      }
    }
  }

  const debouncedSync = debounce(() => triggerSync(false), 150)
  const debouncedConfigSync = debounce(() => triggerSync(true), 150)

  const configFileSet = new Set(configFiles)

  function isConfigFile(filePath: string): boolean {
    return configFileSet.has(path.resolve(filePath))
  }

  watcher.on('change', (filePath) => {
    if (isConfigFile(filePath)) {
      cliLogger.info(`Config changed: ${path.basename(filePath)}`)
      debouncedConfigSync()
      return
    }
    if (!isMarkdownFile(filePath)) {
      return
    }
    cliLogger.step(`Changed: ${path.relative(repoRoot, filePath)}`)
    debouncedSync()
  })

  watcher.on('add', (filePath) => {
    if (!isMarkdownFile(filePath)) {
      return
    }
    cliLogger.step(`Added: ${path.relative(repoRoot, filePath)}`)
    debouncedSync()
  })

  watcher.on('unlink', (filePath) => {
    if (!isMarkdownFile(filePath)) {
      return
    }
    cliLogger.step(`Removed: ${path.relative(repoRoot, filePath)}`)
    debouncedSync()
  })

  return watcher
}

/**
 * Extract watch paths from the config tree.
 * - Glob entries → watch the parent directory (chokidar recurses)
 * - Single-file entries → watch just the file (avoids watching huge parent dirs)
 * Deduplicates: files inside an already-watched directory are dropped.
 */
function extractWatchPaths(entries: readonly Entry[], repoRoot: string): string[] {
  const dirs = new Set<string>()
  const files = new Set<string>()

  function walk(items: readonly Entry[]) {
    // oxlint-disable-next-line no-unused-expressions -- walk is a private recursive helper inside extractWatchPaths; using .map for traversal with controlled mutation of the enclosing dirs/files sets is acceptable here
    items.map((entry) => {
      if (entry.from) {
        if (hasGlobChars(entry.from)) {
          // Glob: watch the directory containing the glob
          const [beforeGlob] = entry.from.split('*')
          const dir = match(beforeGlob.endsWith('/'))
            .with(true, () => beforeGlob.slice(0, -1))
            .otherwise(() => path.dirname(beforeGlob))
          dirs.add(path.resolve(repoRoot, dir))
        } else {
          // Single file: watch just the file to avoid watching its entire parent tree
          files.add(path.resolve(repoRoot, entry.from))
        }
      }
      if (entry.items) {
        walk(entry.items)
      }
      return null
    })
  }

  walk(entries)

  // Deduplicate directories: remove children of already-watched parents
  const sortedDirs = [...dirs].toSorted()
  const dedupedDirs = sortedDirs.filter((dir, index) => {
    const previousDirs = sortedDirs.slice(0, index)
    return !previousDirs.some((parent) => dir.startsWith(`${parent}${path.sep}`))
  })

  // Drop individual files that are already inside a watched directory
  const extraFiles = [...files].filter(
    (file) => !dedupedDirs.some((dir) => file.startsWith(dir + path.sep))
  )

  return [...dedupedDirs, ...extraFiles]
}
