import {
  Alert,
  Box,
  Spacer,
  Spinner,
  Text,
  useApp,
  useFullScreen,
  useHotkey,
  useInput,
} from '@kidd-cli/core/ui'
import type { SyncResult } from '@zpress/core'
import { createPaths, loadConfig, sync } from '@zpress/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { match } from 'ts-pattern'

import { clean } from '../commands/clean.ts'
import { Banner } from '../components/banner.tsx'
import type { WatcherCallbacks, WatcherHandle, WatcherStatus } from '../lib/dev-types.ts'
import { toError } from '../lib/error.ts'
import { openBrowser, startDevServer } from '../lib/rspress.ts'
import { createWatcher } from '../lib/watcher.ts'

const isTTY = Boolean(process.stdin.isTTY)

const MAX_LOG_ENTRIES = 50

/**
 * A single entry in the activity log.
 */
export interface LogEntry {
  readonly timestamp: string
  readonly action: 'synced' | 'removed' | 'restarted' | 'error'
  readonly file: string
  readonly elapsed: number
}

/**
 * Props passed to the DevScreen component by the screen() runtime.
 * These correspond to the parsed CLI options.
 */
interface DevScreenProps {
  readonly quiet?: boolean
  readonly clean?: boolean
  readonly port?: number
  readonly theme?: string
  readonly colorMode?: string
  readonly vscode?: boolean
}

/**
 * React/Ink TUI for the `zpress dev` command.
 *
 * Renders a fullscreen status display with styled banner, activity log,
 * sync stats, and hotkey bar.
 *
 * @param props - Parsed CLI options
 * @returns React element tree for the dev TUI
 */
export function DevScreen(props: DevScreenProps): React.ReactElement {
  const { exit } = useApp()
  const { columns } = useFullScreen()

  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [watcherStatus, setWatcherStatus] = useState<WatcherStatus>({ _tag: 'idle' })
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

  useEffect(() => {
    /**
     * @private
     * Wraps a state setter so it becomes a no-op after the effect cleanup runs.
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
        const { onConfigReload, port: resolvedPort, close } = await startDevServer({
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

  useHotkey({
    keys: ['r'],
    action: () => {
      if (watcherRef.current) {
        watcherRef.current.resync()
      }
    },
    active: phase === 'ready' && isTTY,
  })

  useHotkey({
    keys: ['c'],
    action: () => {
      setLog([])
    },
    active: phase === 'ready' && isTTY,
  })

  useHotkey({
    keys: ['o'],
    action: () => {
      openBrowser(`http://localhost:${port}`)
    },
    active: phase === 'ready' && isTTY,
  })

  useInput(
    (input, key) => {
      if (input === 'q' || (key.ctrl && input === 'c')) {
        if (watcherRef.current) {
          watcherRef.current.close()
        }
        const closeServer = serverCloseRef.current
        if (closeServer) {
          closeServer().finally(() => {
            exit()
            process.exit(0)
          })
        } else {
          exit()
          process.exit(0)
        }
      }
    },
    { isActive: isTTY }
  )

  const width = Math.max(Math.min(columns, 80), 2)
  const separatorWidth = Math.max(width - 2, 0)

  if (phase === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Banner />
        <Box marginTop={1}>
          <Alert variant="error" title="Dev Server Error" width={width}>
            {errorMessage}
          </Alert>
        </Box>
      </Box>
    )
  }

  if (phase === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Banner />
        <Box marginTop={1}>
          <Spinner label="Starting dev server..." type="dots" />
        </Box>
      </Box>
    )
  }

  const watcherTag = watcherStatus._tag

  return (
    <Box flexDirection="column" padding={1}>
      {/* Banner + URL */}
      <Banner />
      <Box marginTop={1}>
        <Text dimColor>
          http://localhost:<Text color="cyan">{port}</Text>
        </Text>
        <Spacer />
        {match(watcherTag)
          .with('idle', () => <Text color="green">● Ready</Text>)
          .with('syncing', () => <Spinner label="Syncing" type="dots" />)
          .with('restarting', () => <Spinner label="Restarting" type="dots" />)
          .with('error', () => {
            if (watcherStatus._tag === 'error') {
              return <Text color="red">● Error: {watcherStatus.message}</Text>
            }
            return <Text color="red">● Error</Text>
          })
          .exhaustive()}
      </Box>

      {/* Separator */}
      <Box marginTop={1}>
        <Text dimColor>{'─'.repeat(separatorWidth)}</Text>
      </Box>

      {/* Activity log */}
      <Box flexDirection="column" marginTop={0}>
        {log.length === 0 && (
          <Box paddingLeft={1}>
            <Text dimColor>Waiting for changes...</Text>
          </Box>
        )}
        {log.slice(0, 12).map((entry, i) => (
          <LogLine key={`${entry.timestamp}-${entry.file}-${i}`} entry={entry} first={i === 0} />
        ))}
      </Box>

      {/* Separator */}
      <Box marginTop={1}>
        <Text dimColor>{'─'.repeat(separatorWidth)}</Text>
      </Box>

      {/* Stats bar */}
      {lastSync !== null && (
        <Box paddingLeft={1}>
          <Text dimColor>
            <Text color="green">{lastSync.pagesWritten}</Text> written
            {' · '}
            <Text color="yellow">{lastSync.pagesSkipped}</Text> skipped
            {' · '}
            <Text color="red">{lastSync.pagesRemoved}</Text> removed
            {' · '}
            {Math.round(lastSync.elapsed)}ms
          </Text>
        </Box>
      )}

      {/* Hotkey bar */}
      {isTTY && (
        <Box marginTop={1} paddingLeft={1}>
          <HotkeyHint label="r" description="resync" />
          <Text dimColor> · </Text>
          <HotkeyHint label="o" description="open" />
          <Text dimColor> · </Text>
          <HotkeyHint label="c" description="clear" />
          <Text dimColor> · </Text>
          <HotkeyHint label="q" description="quit" />
        </Box>
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Render a single line in the activity log.
 *
 * @private
 * @param props - Log entry data and whether this is the most recent entry
 * @returns React element for one log line
 */
function LogLine(props: { readonly entry: LogEntry; readonly first: boolean }): React.ReactElement {
  const { entry, first } = props
  const actionColor = match(entry.action)
    .with('synced', () => 'green' as const)
    .with('removed', () => 'red' as const)
    .with('restarted', () => 'yellow' as const)
    .with('error', () => 'red' as const)
    .exhaustive()
  const resolvedColor = match(first)
    .with(true, () => actionColor)
    // oxlint-disable-next-line unicorn/no-useless-undefined -- match requires explicit return
    .otherwise(() => undefined)

  return (
    <Box paddingLeft={1}>
      <Text dimColor={!first}>{entry.timestamp}</Text>
      <Text> </Text>
      <Text color={resolvedColor} dimColor={!first}>
        {entry.action.padEnd(10)}
      </Text>
      <Text dimColor={!first}>{entry.file}</Text>
      {entry.elapsed > 0 && <Text dimColor> {Math.round(entry.elapsed)}ms</Text>}
    </Box>
  )
}

/**
 * Render a single hotkey hint (e.g. "r resync").
 *
 * @private
 * @param props - Label and description for the hotkey
 * @returns React element with styled hotkey hint
 */
function HotkeyHint(props: {
  readonly label: string
  readonly description: string
}): React.ReactElement {
  return (
    <Text>
      <Text bold color="cyan">
        {props.label}
      </Text>
      <Text dimColor> {props.description}</Text>
    </Text>
  )
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
