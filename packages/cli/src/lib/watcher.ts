import { watch } from 'node:fs'
import path from 'node:path'

import { cliLogger } from '@kidd-cli/core/logger'
import type { ZpressConfig, Paths } from '@zpress/core'
import { loadConfig, sync } from '@zpress/core'
import { debounce } from 'es-toolkit'

const CONFIG_EXTENSIONS = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json'] as const

const MARKDOWN_EXTENSIONS = ['.md', '.mdx'] as const

/**
 * Directories to ignore — any event whose path contains one of these
 * segments is silently dropped.
 */
const IGNORED_DIRS = new Set(['node_modules', '.git', '.zpress', 'bundle', 'dist', '.turbo'])

function isMarkdownFile(filePath: string): boolean {
  return MARKDOWN_EXTENSIONS.some((ext) => filePath.endsWith(ext))
}

/**
 * Check whether any path segment is in the ignored set.
 */
function isIgnored(filePath: string): boolean {
  return filePath.split(path.sep).some((segment) => IGNORED_DIRS.has(segment))
}

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
 * @param onConfigReload - Optional async callback invoked after config reload and sync complete, receives new config
 */
export function createWatcher(
  initialConfig: ZpressConfig,
  paths: Paths,
  onConfigReload?: (newConfig: ZpressConfig) => Promise<void>
): WatcherHandle {
  const { repoRoot } = paths
  const configFileNames = new Set(CONFIG_EXTENSIONS.map((ext) => `zpress.config${ext}`))
  // oxlint-disable-next-line functional/no-let -- mutable config reloaded on file changes
  let config = initialConfig

  cliLogger.info(`Watching ${repoRoot}`)

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
          cliLogger.error(`Config reload failed: ${configErr.message}`)
          if (configErr.errors && configErr.errors.length > 0) {
            configErr.errors.map((err) => {
              const pathStr = err.path.join('.')
              return cliLogger.error(`  ${pathStr}: ${err.message}`)
            })
          }
          return
        }
        config = newConfig
        cliLogger.info('Config reloaded')
        didReloadConfig = true
      }
      await sync(config, { paths })
      consecutiveFailures = 0
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

  function isConfigFile(filename: string): boolean {
    return configFileNames.has(filename)
  }

  // Native recursive watcher — single FSEvents subscription on macOS,
  // single inotify recursive watch on Linux (Node 24+).
  const watcher = watch(repoRoot, { recursive: true }, (_event, filename) => {
    if (!filename) {
      return
    }

    if (isIgnored(filename)) {
      return
    }

    const basename = path.basename(filename)

    if (isConfigFile(basename)) {
      cliLogger.info(`Config changed: ${basename}`)
      debouncedConfigSync()
      return
    }

    if (!isMarkdownFile(filename)) {
      return
    }

    cliLogger.step(`Changed: ${filename}`)
    debouncedSync()
  })

  return {
    close() {
      watcher.close()
    },
  }
}
