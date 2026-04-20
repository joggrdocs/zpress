import type { SyncResult } from '@zpress/core'
import { createPaths, loadConfig, sync } from '@zpress/core'
import { useCallback, useEffect, useRef, useState } from 'react'

import { clean } from '../commands/clean.ts'
import type {
  DevPhase,
  DevServerActions,
  DevServerState,
  LogEntry,
  WatcherCallbacks,
  WatcherHandle,
} from '../lib/dev-types.ts'
import { toError } from '../lib/error.ts'
import { startDevServer } from '../lib/rspress.ts'
import { createWatcher } from '../lib/watcher.ts'

const MAX_LOG_ENTRIES = 50

/**
 * Props accepted by the useDevServer hook.
 */
export interface UseDevServerProps {
  readonly quiet?: boolean
  readonly clean?: boolean
  readonly port?: number
  readonly theme?: string
  readonly colorMode?: string
  readonly vscode?: boolean
}

/**
 * Result returned by the useDevServer hook.
 */
export interface UseDevServerResult {
  readonly state: DevServerState
  readonly actions: DevServerActions
}

/**
 * Manages the full dev server lifecycle: config loading, content sync,
 * Rspress dev server, and file watcher.
 *
 * Encapsulates all mutable state (refs) and side effects (init, teardown)
 * so the consuming component can be a pure render function.
 *
 * @param props - Dev server configuration from CLI options
 * @returns Read-only state snapshot and action handles
 */
export function useDevServer(props: UseDevServerProps): UseDevServerResult {
  const [phase, setPhase] = useState<DevPhase>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [watcherStatus, setWatcherStatus] = useState<DevServerState['watcherStatus']>({
    _tag: 'idle',
  })
  const [lastSync, setLastSync] = useState<SyncResult | null>(null)
  const [log, setLog] = useState<readonly LogEntry[]>([])
  const [port, setPort] = useState(0)

  const watcherRef = useRef<WatcherHandle | null>(null)
  const serverCloseRef = useRef<(() => Promise<void>) | null>(null)
  const openapiCacheRef = useRef(new Map<string, unknown>())
  const cancelledRef = useRef(false)
  const lastFileRef = useRef<string | null>(null)

  const pushLog = useCallback((entry: LogEntry) => {
    setLog((prev) => [entry, ...prev].slice(0, MAX_LOG_ENTRIES))
  }, [])

  const clearLog = useCallback(() => {
    setLog([])
  }, [])

  const resync = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.resync()
    }
  }, [])

  const closeAll = useCallback(async () => {
    if (watcherRef.current) {
      watcherRef.current.close()
    }
    if (serverCloseRef.current) {
      await serverCloseRef.current()
    }
  }, [])

  useEffect(() => {
    /**
     * Wraps a state setter so it becomes a no-op after the effect cleanup runs.
     *
     * @private
     * @param setter - React state setter to guard
     * @returns Guarded setter that checks cancelledRef before calling
     */
    function guard<T>(setter: (value: T) => void): (value: T) => void {
      return (value: T) => {
        if (!cancelledRef.current) {
          setter(value)
        }
      }
    }

    async function init() {
      const paths = createPaths(process.cwd())

      if (props.clean) {
        await clean(paths)
      }

      const [configErr, config] = await loadConfig(paths.repoRoot)
      if (configErr) {
        guard(setErrorMessage)(configErr.message)
        guard(setPhase)('error')
        return
      }

      const openapiCache = openapiCacheRef.current

      try {
        const initialResult = await sync(config, {
          paths,
          quiet: props.quiet ?? true,
          openapiCache,
        })
        if (cancelledRef.current) {
          return
        }
        if (initialResult.error) {
          guard(setErrorMessage)(`Sync failed: ${initialResult.error}`)
          guard(setPhase)('error')
          return
        }
        guard(setLastSync)(initialResult)
      } catch (error) {
        guard(setErrorMessage)(`Initial sync failed: ${toError(error).message}`)
        guard(setPhase)('error')
        return
      }

      try {
        const {
          onConfigReload,
          port: resolvedPort,
          close,
        } = await startDevServer({
          config,
          paths,
          port: props.port,
          theme: props.theme,
          colorMode: props.colorMode,
          vscode: props.vscode,
        })

        if (cancelledRef.current) {
          await close()
          return
        }

        // oxlint-disable-next-line functional/immutable-data -- ref assignment for cleanup
        serverCloseRef.current = close
        guard(setPort)(resolvedPort)

        const guardedPushLog = guard(pushLog)

        const callbacks: WatcherCallbacks = {
          onStatusChange: guard(setWatcherStatus),
          onSyncComplete: (result) => {
            guard(setLastSync)(result)
            const file = lastFileRef.current
            if (file) {
              guardedPushLog({
                timestamp: formatTime(new Date()),
                action: 'synced',
                file,
                elapsed: result.elapsed,
              })
            }
          },
          onFileChange: (filename) => {
            // oxlint-disable-next-line functional/immutable-data -- ref tracking for log entries
            lastFileRef.current = filename
          },
          onConfigReloaded: () => {
            guardedPushLog({
              timestamp: formatTime(new Date()),
              action: 'restarted',
              file: 'zpress.config.ts',
              elapsed: 0,
            })
          },
        }

        const watcher = createWatcher({
          initialConfig: config,
          paths,
          callbacks,
          onConfigReload,
          openapiCache,
        })

        // oxlint-disable-next-line functional/immutable-data -- assigning ref for teardown
        watcherRef.current = watcher
        guard(setPhase)('ready')
      } catch (error) {
        guard(setErrorMessage)(`Dev server failed: ${toError(error).message}`)
        guard(setPhase)('error')
      }
    }

    init()

    return () => {
      // oxlint-disable-next-line functional/immutable-data -- ref mutation for unmount guard
      cancelledRef.current = true
      if (watcherRef.current) {
        watcherRef.current.close()
      }
      if (serverCloseRef.current) {
        serverCloseRef.current()
      }
    }
  }, [])

  return {
    state: { phase, error: errorMessage, watcherStatus, lastSync, log, port },
    actions: { resync, clearLog, close: closeAll },
  }
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Format a Date to HH:MM:SS string.
 *
 * @private
 * @param date - Date to format
 * @returns Time string in HH:MM:SS format
 */
function formatTime(date: Date): string {
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join(':')
}
