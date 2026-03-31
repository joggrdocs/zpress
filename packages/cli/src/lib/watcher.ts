import { watch } from 'node:fs'
import path from 'node:path'

import type { Log } from '@kidd-cli/core'
import type { ZpressConfig, Paths } from '@zpress/core'
import { loadConfig, sync } from '@zpress/core'
import { debounce } from 'es-toolkit'

import { toError } from './error'

const CONFIG_EXTENSIONS = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json'] as const

const MARKDOWN_EXTENSIONS = ['.md', '.mdx'] as const

/**
 * Directories to ignore — any event whose path contains one of these
 * segments is silently dropped.
 */
const IGNORED_DIRS = new Set(['node_modules', '.git', '.zpress', 'bundle', 'dist', '.turbo'])

/**
 * Closeable handle returned by createWatcher.
 */
interface WatcherHandle {
  close(): void
}

/**
 * Create a file watcher that re-syncs documentation on changes.
 *
 * Uses Node.js native fs.watch with recursive:true which on macOS
 * creates a single FSEvents subscription — one file descriptor for
 * the entire tree. Filtering happens in the callback, not at the
 * OS level, so there are zero EMFILE concerns.
 *
 * @param params - Watcher configuration
 * @param params.initialConfig - Initial zpress config to use for syncing
 * @param params.paths - Resolved project paths
 * @param params.log - Logger instance for status output
 * @param params.onConfigReload - Optional async callback invoked after config reload and sync complete, receives new config
 * @returns Closeable watcher handle
 */
export function createWatcher(params: {
  readonly initialConfig: ZpressConfig
  readonly paths: Paths
  readonly log: Log
  readonly onConfigReload?: (newConfig: ZpressConfig) => Promise<void>
  readonly openapiCache?: Map<string, unknown>
}): WatcherHandle {
  const { initialConfig, paths, log, onConfigReload, openapiCache } = params
  const { repoRoot } = paths
  const configFileNames = new Set(CONFIG_EXTENSIONS.map((ext) => `zpress.config${ext}`))
  // oxlint-disable-next-line functional/no-let -- mutable config reloaded on file changes
  let config = initialConfig

  log.info(`Watching ${repoRoot}`)

  // oxlint-disable-next-line functional/no-let -- mutable sync state for debounced watcher
  let syncing = false
  // oxlint-disable-next-line functional/no-let -- tracks whether a pending resync needs config reload
  let pendingReloadConfig: boolean | null = null
  // oxlint-disable-next-line functional/no-let -- bounded retry counter to prevent unbounded recursive sync
  let consecutiveFailures = 0
  const MAX_CONSECUTIVE_FAILURES = 5

  async function triggerSync(reloadConfig: boolean) {
    if (syncing) {
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
          log.error(`Config reload failed: ${configErr.message}`)
          if (configErr.errors && configErr.errors.length > 0) {
            // oxlint-disable-next-line unicorn/no-array-for-each -- side-effect: logging each validation error
            configErr.errors.forEach((err) => {
              const pathStr = err.path.join('.')
              log.error(`  ${pathStr}: ${err.message}`)
            })
          }
          return
        }
        config = newConfig
        log.info('Config reloaded')
        didReloadConfig = true
        if (openapiCache) {
          openapiCache.clear()
        }
      }
      await sync(config, { paths, openapiCache })
      consecutiveFailures = 0
      if (didReloadConfig && onConfigReload) {
        await onConfigReload(config)
      }
    } catch (error) {
      consecutiveFailures += 1
      log.error(`Sync error: ${toError(error).message}`)
    } finally {
      syncing = false
      if (pendingReloadConfig !== null) {
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          log.error(
            `Sync failed ${consecutiveFailures} consecutive times, dropping pending resync. Will retry on next file change.`
          )
          pendingReloadConfig = null
          consecutiveFailures = 0
        } else {
          const shouldReload = pendingReloadConfig
          pendingReloadConfig = null
          // Intentionally not awaited — queues the next sync cycle without
          // blocking the finally block. Errors are caught by triggerSync's own try/catch.
          triggerSync(shouldReload)
        }
      }
    }
  }

  const debouncedSync = debounce(() => triggerSync(false), 150)
  const debouncedConfigSync = debounce(() => triggerSync(true), 150)

  function isConfigFile(filename: string, filePath: string): boolean {
    if (!configFileNames.has(filename)) {
      return false
    }
    // Only treat config files at the repo root as actual config changes,
    // not nested files (e.g. test fixtures) with the same basename.
    const dir = path.dirname(filePath)
    return dir === '.'
  }

  // Native recursive watcher — single FSEvents subscription on macOS,
  // single inotify recursive watch on Linux (Node 22+).
  // Note: fs.watch does NOT follow symlinks — symlinked doc directories
  // will not trigger change events (unlike the previous chokidar watcher).
  // _event ('rename' | 'change') is intentionally discarded — all changes
  // trigger the same debounced re-sync regardless of event type.
  const watcher = watch(repoRoot, { recursive: true }, (_event, filename) => {
    if (!filename) {
      return
    }

    if (isIgnored(filename)) {
      return
    }

    const basename = path.basename(filename)

    if (isConfigFile(basename, filename)) {
      log.info(`Config changed: ${basename}`)
      debouncedConfigSync()
      return
    }

    if (!isMarkdownFile(filename)) {
      return
    }

    log.step(`Changed: ${filename}`)
    debouncedSync()
  })

  return {
    close() {
      watcher.close()
    },
  }
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Check whether a file path has a markdown extension.
 *
 * @private
 * @param filePath - File path to check
 * @returns True if the path ends with a markdown extension
 */
function isMarkdownFile(filePath: string): boolean {
  return MARKDOWN_EXTENSIONS.some((ext) => filePath.endsWith(ext))
}

/**
 * Check whether any path segment is in the ignored directory set.
 *
 * @private
 * @param filePath - File path to check for ignored segments
 * @returns True if any segment matches an ignored directory name
 */
function isIgnored(filePath: string): boolean {
  return filePath.split(path.sep).some((segment) => IGNORED_DIRS.has(segment))
}
