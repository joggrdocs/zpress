import type { SyncResult } from '@zpress/core'

/**
 * A single entry in the dev server activity log.
 */
export interface LogEntry {
  readonly timestamp: string
  readonly action: 'synced' | 'removed' | 'restarted' | 'error'
  readonly file: string
  readonly elapsed: number
}

/**
 * Lifecycle phase of the dev server.
 */
export type DevPhase = 'loading' | 'ready' | 'error'

/**
 * Read-only state snapshot exposed by the useDevServer hook.
 */
export interface DevServerState {
  readonly phase: DevPhase
  readonly error: string | null
  readonly watcherStatus: WatcherStatus
  readonly lastSync: SyncResult | null
  readonly log: readonly LogEntry[]
  readonly port: number
}

/**
 * Actions exposed by the useDevServer hook for external control.
 */
export interface DevServerActions {
  readonly resync: () => void
  readonly clearLog: () => void
  readonly close: () => Promise<void>
}

/**
 * Discriminated union representing the current state of the file watcher.
 */
export type WatcherStatus =
  | { readonly _tag: 'idle' }
  | { readonly _tag: 'syncing'; readonly isConfigReload: boolean }
  | { readonly _tag: 'restarting' }
  | { readonly _tag: 'error'; readonly message: string }

/**
 * Callback interface used by the watcher to communicate state changes
 * to the TUI layer without coupling to a specific logging implementation.
 */
export interface WatcherCallbacks {
  readonly onStatusChange: (status: WatcherStatus) => void
  readonly onSyncComplete: (result: SyncResult) => void
  readonly onFileChange: (filename: string) => void
  readonly onConfigReloaded: () => void
}

/**
 * Closeable + resyncable handle returned by createWatcher.
 */
export interface WatcherHandle {
  readonly close: () => void
  readonly resync: () => void
}
