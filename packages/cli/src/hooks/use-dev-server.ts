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
 * All actions are stable functions — safe to call at any time, noops
 * when the underlying resource isn't ready yet.
 *
 * @param props - Dev server configuration from CLI options
 * @returns Read-only state snapshot and action handles
 */
export function useDevServer(props: UseDevServerProps): UseDevServerResult {
  const [phase, setPhase] = useState<DevPhase>('loading')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<WatcherStatus>('idle')
  const [lastSync, setLastSync] = useState<SyncResult | null>(null)
  const [port, setPort] = useState(0)

  const { log, pushLog, clearLog } = useActivityLog()

  const watcher = useRef<WatcherHandle | null>(null)
  const serverClose = useRef<(() => Promise<void>) | null>(null)
  const openapiCache = useRef(new Map<string, unknown>())
  const disposed = useRef(false)
  const pendingFile = useRef<string | null>(null)

  const resync = useCallback(() => {
    if (watcher.current) {
      watcher.current.resync()
    }
  }, [])

  const close = useCallback(async () => {
    // oxlint-disable-next-line functional/immutable-data -- mark disposed to cancel in-flight init
    disposed.current = true
    if (watcher.current) {
      watcher.current.close()
    }
    if (serverClose.current) {
      try {
        await serverClose.current()
      } catch {
        // Server may already be closed
      }
    }
  }, [])

  useEffect(() => {
    const set = createGuardedSetters(disposed, {
      phase: setPhase,
      error: setError,
      status: setStatus,
      lastSync: setLastSync,
      port: setPort,
      pushLog,
    })

    async function init() {
      const paths = createPaths(process.cwd())

      if (props.clean) {
        await clean(paths)
      }

      const [configErr, config] = await loadConfig(paths.repoRoot)
      if (configErr) {
        set.error(configErr.message)
        set.phase('error')
        return
      }

      const syncResult = await attemptSync(config, {
        paths,
        quiet: props.quiet ?? true,
        openapiCache: openapiCache.current,
      })

      if (disposed.current) {
        return
      }

      if (syncResult.error) {
        set.error(syncResult.error)
        set.phase('error')
        return
      }

      set.lastSync(syncResult)

      const server = await attemptStartServer(props, config, paths)

      if (disposed.current) {
        if (server.close) {
          await server.close()
        }
        return
      }

      if (server.error) {
        set.error(server.error)
        set.phase('error')
        return
      }

      // oxlint-disable-next-line functional/immutable-data -- ref assignment for cleanup
      serverClose.current = server.close
      set.port(server.port)

      const callbacks: WatcherCallbacks = {
        onStatusChange: set.status,
        onError: set.error,
        onSyncComplete: (result) => {
          set.lastSync(result)
          const file = pendingFile.current
          if (file) {
            set.pushLog({
              timestamp: formatTime(new Date()),
              action: 'synced',
              file,
              elapsed: result.elapsed,
            })
          }
        },
        onFileChange: (filename) => {
          // oxlint-disable-next-line functional/immutable-data -- tracks file for log attribution
          pendingFile.current = filename
        },
        onConfigReloaded: () => {
          set.pushLog({
            timestamp: formatTime(new Date()),
            action: 'restarted',
            file: 'zpress.config.ts',
            elapsed: 0,
          })
        },
      }

      // oxlint-disable-next-line functional/immutable-data -- ref assignment for teardown
      watcher.current = createWatcher({
        initialConfig: config,
        paths,
        callbacks,
        onConfigReload: server.onConfigReload,
        openapiCache: openapiCache.current,
      })

      set.phase('ready')
    }

    init()

    return () => {
      // oxlint-disable-next-line functional/immutable-data -- mark disposed on unmount
      disposed.current = true
      if (watcher.current) {
        watcher.current.close()
      }
      if (serverClose.current) {
        // oxlint-disable-next-line no-empty-function -- best-effort cleanup
        serverClose.current().catch(() => {})
      }
    }
  }, [])

  return {
    state: { phase, error, status, lastSync, log, port },
    actions: { resync, clearLog, close },
  }
}

// ---------------------------------------------------------------------------
// Private hooks
// ---------------------------------------------------------------------------

const MAX_LOG_ENTRIES = 50

/**
 * Manages a bounded activity log.
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

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Guarded setters keyed by name. Each setter is a no-op when
 * the disposed ref is true, preventing state updates after teardown.
 *
 * @private
 */
interface GuardedSetters {
  readonly phase: (value: DevPhase) => void
  readonly error: (value: string | null) => void
  readonly status: (value: WatcherStatus) => void
  readonly lastSync: (value: SyncResult) => void
  readonly port: (value: number) => void
  readonly pushLog: (entry: LogEntry) => void
}

/**
 * Wrap state setters so they become no-ops after disposal.
 *
 * @private
 * @param disposed - Ref that indicates the hook has been torn down
 * @param setters - Raw React state setters to guard
 * @returns Guarded setters safe to call from async callbacks
 */
function createGuardedSetters(
  disposed: React.RefObject<boolean>,
  setters: {
    readonly phase: (value: DevPhase) => void
    readonly error: (value: string | null) => void
    readonly status: (value: WatcherStatus) => void
    readonly lastSync: (value: SyncResult | null) => void
    readonly port: (value: number) => void
    readonly pushLog: (entry: LogEntry) => void
  }
): GuardedSetters {
  function guard<T>(setter: (value: T) => void): (value: T) => void {
    return (value: T) => {
      if (!disposed.current) {
        setter(value)
      }
    }
  }

  return {
    phase: guard(setters.phase),
    error: guard(setters.error),
    status: guard(setters.status),
    lastSync: guard(setters.lastSync),
    port: guard(setters.port),
    pushLog: guard(setters.pushLog),
  }
}

/**
 * Result from attempting an initial sync.
 *
 * @private
 */
interface SyncAttemptResult {
  readonly pagesWritten: number
  readonly pagesSkipped: number
  readonly pagesRemoved: number
  readonly elapsed: number
  readonly error?: string
}

/**
 * Run the initial content sync, catching unexpected rejections.
 *
 * @private
 * @param config - Validated zpress config
 * @param options - Sync options
 * @returns Sync result, with error field set on failure
 */
async function attemptSync(
  config: Parameters<typeof sync>[0],
  options: Parameters<typeof sync>[1]
): Promise<SyncAttemptResult> {
  try {
    return await sync(config, options)
  } catch (error) {
    return {
      pagesWritten: 0,
      pagesSkipped: 0,
      pagesRemoved: 0,
      elapsed: 0,
      error: `Initial sync failed: ${toError(error).message}`,
    }
  }
}

/**
 * Result from attempting to start the dev server.
 *
 * @private
 */
interface ServerAttemptResult {
  readonly port: number
  readonly close: () => Promise<void>
  readonly onConfigReload: (config: Parameters<typeof sync>[0]) => Promise<void>
  readonly error?: string
}

/**
 * Start the Rspress dev server, catching unexpected rejections.
 *
 * @private
 * @param props - Hook props for server configuration
 * @param config - Validated zpress config
 * @param paths - Resolved project paths
 * @returns Server handles, with error field set on failure
 */
async function attemptStartServer(
  props: UseDevServerProps,
  config: Parameters<typeof sync>[0],
  paths: ReturnType<typeof createPaths>
): Promise<ServerAttemptResult> {
  try {
    const result = await startDevServer({
      config,
      paths,
      port: props.port,
      theme: props.theme,
      colorMode: props.colorMode,
      vscode: props.vscode,
    })
    return {
      port: result.port,
      close: result.close,
      onConfigReload: result.onConfigReload,
    }
  } catch (error) {
    return {
      port: 0,
      // oxlint-disable-next-line no-empty-function -- noop close when server never started
      close: async () => {},
      // oxlint-disable-next-line no-empty-function -- noop reload when server never started
      onConfigReload: async () => {},
      error: `Dev server failed: ${toError(error).message}`,
    }
  }
}

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
