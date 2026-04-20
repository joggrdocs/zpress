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
  WatcherStatus,
} from '../lib/dev-types.ts'
import { toError } from '../lib/error.ts'
import { startDevServer } from '../lib/rspress.ts'
import { createWatcher } from '../lib/watcher.ts'

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
 * Composes `useActivityLog` (log state) and `useServerLifecycle` (everything else)
 * into a single public API.
 *
 * @param props - Dev server configuration from CLI options
 * @returns Read-only state snapshot and action handles
 */
export function useDevServer(props: UseDevServerProps): UseDevServerResult {
  const { log, pushLog, clearLog } = useActivityLog()
  const lifecycle = useServerLifecycle(props, pushLog)

  return {
    state: {
      phase: lifecycle.phase,
      error: lifecycle.error,
      status: lifecycle.status,
      lastSync: lifecycle.lastSync,
      log,
      port: lifecycle.port,
    },
    actions: {
      resync: lifecycle.resync,
      clearLog,
      close: lifecycle.close,
    },
  }
}

// ---------------------------------------------------------------------------
// Private hooks
// ---------------------------------------------------------------------------

const MAX_LOG_ENTRIES = 50

/**
 * Manages the activity log — a bounded list of recent events.
 *
 * @private
 * @returns Log state, push function, and clear action
 */
function useActivityLog(): {
  readonly log: readonly LogEntry[]
  readonly pushLog: (entry: LogEntry) => void
  readonly clearLog: () => void
} {
  const [log, setLog] = useState<readonly LogEntry[]>([])

  const pushLog = useCallback((entry: LogEntry) => {
    setLog((prev) => [entry, ...prev].slice(0, MAX_LOG_ENTRIES))
  }, [])

  const clearLog = useCallback(() => {
    setLog([])
  }, [])

  return { log, pushLog, clearLog }
}

/**
 * Result from the server lifecycle hook.
 *
 * @private
 */
interface ServerLifecycleResult {
  readonly phase: DevPhase
  readonly error: string | null
  readonly status: WatcherStatus
  readonly lastSync: SyncResult | null
  readonly port: number
  readonly resync: () => void
  readonly close: () => Promise<void>
}

/**
 * Manages config loading, sync, dev server, and watcher lifecycle.
 *
 * All actions (resync, close) are stable functions that are safe to call
 * at any time — they are noops when the underlying resource isn't ready.
 *
 * @private
 * @param props - Dev server configuration from CLI options
 * @param pushLog - Callback to push entries into the activity log
 * @returns Lifecycle state and stable action handles
 */
function useServerLifecycle(
  props: UseDevServerProps,
  pushLog: (entry: LogEntry) => void
): ServerLifecycleResult {
  const [phase, setPhase] = useState<DevPhase>('loading')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<WatcherStatus>('idle')
  const [lastSync, setLastSync] = useState<SyncResult | null>(null)
  const [port, setPort] = useState(0)

  const watcherRef = useRef<WatcherHandle | null>(null)
  const serverCloseRef = useRef<(() => Promise<void>) | null>(null)
  const openapiCacheRef = useRef(new Map<string, unknown>())
  const cancelledRef = useRef(false)
  const lastFileRef = useRef<string | null>(null)

  const resync = useCallback(() => {
    if (watcherRef.current) {
      watcherRef.current.resync()
    }
  }, [])

  const close = useCallback(async () => {
    // oxlint-disable-next-line functional/immutable-data -- cancel in-flight init
    cancelledRef.current = true
    if (watcherRef.current) {
      watcherRef.current.close()
    }
    if (serverCloseRef.current) {
      try {
        await serverCloseRef.current()
      } catch {
        // Server may already be closed — ignore
      }
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
        guard(setError)(configErr.message)
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
          guard(setError)(`Sync failed: ${initialResult.error}`)
          guard(setPhase)('error')
          return
        }
        guard(setLastSync)(initialResult)
      } catch (error) {
        guard(setError)(`Initial sync failed: ${toError(error).message}`)
        guard(setPhase)('error')
        return
      }

      try {
        const {
          onConfigReload,
          port: resolvedPort,
          close: serverClose,
        } = await startDevServer({
          config,
          paths,
          port: props.port,
          theme: props.theme,
          colorMode: props.colorMode,
          vscode: props.vscode,
        })

        if (cancelledRef.current) {
          await serverClose()
          return
        }

        // oxlint-disable-next-line functional/immutable-data -- ref assignment for cleanup
        serverCloseRef.current = serverClose
        guard(setPort)(resolvedPort)

        const guardedPushLog = guard(pushLog)

        const callbacks: WatcherCallbacks = {
          onStatusChange: guard(setStatus),
          onError: guard(setError),
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
        guard(setError)(`Dev server failed: ${toError(error).message}`)
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
        // oxlint-disable-next-line no-empty-function -- best-effort cleanup; rejection is non-fatal
        serverCloseRef.current().catch(() => {})
      }
    }
  }, [])

  return { phase, error, status, lastSync, port, resync, close }
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
