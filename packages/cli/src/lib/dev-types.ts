import type { SyncResult } from '@zpress/core'

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
