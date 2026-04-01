import {
  Alert,
  Box,
  Spacer,
  Spinner,
  StatusMessage,
  Text,
  useApp,
  useFullScreen,
  useHotkey,
  useInput,
} from '@kidd-cli/core/ui'
import type { SyncResult } from '@zpress/core'
import { createPaths, loadConfig, sync } from '@zpress/core'
import { useEffect, useRef, useState } from 'react'
import { match } from 'ts-pattern'

import type { WatcherCallbacks, WatcherHandle, WatcherStatus } from '../lib/dev-types.ts'
import { toError } from '../lib/error.ts'
import { openBrowser, startDevServer } from '../lib/rspress.ts'
import { createWatcher } from '../lib/watcher.ts'
import { clean } from './clean.ts'

const isTTY = Boolean(process.stdin.isTTY)

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
 * Renders a fullscreen status display with watcher state, sync results,
 * and hotkey bar. Falls back to plain text in non-TTY environments.
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
  const [lastFile, setLastFile] = useState<string | null>(null)
  const [port, setPort] = useState(0)

  const watcherRef = useRef<WatcherHandle | null>(null)
  const openapiCacheRef = useRef(new Map<string, unknown>())
  const cancelledRef = useRef(false)

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
        guard(setLastSync)(initialResult)
      } catch (error) {
        guard(setErrorMessage)(`Initial sync failed: ${toError(error).message}`)
        guard(setPhase)('error')
        return
      }

      try {
        const { onConfigReload, port: resolvedPort } = await startDevServer({
          config,
          paths,
          port: props.port,
          theme: props.theme,
          colorMode: props.colorMode,
          vscode: props.vscode,
        })

        if (cancelledRef.current) {
          return
        }

        guard(setPort)(resolvedPort)

        const callbacks: WatcherCallbacks = {
          onStatusChange: guard(setWatcherStatus),
          onSyncComplete: guard(setLastSync),
          onFileChange: guard(setLastFile),
          // No UI update needed — server restart via onConfigReload handles state refresh
          onConfigReloaded: () => {},
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
      process.stdout.write('\u001B[2J\u001B[H')
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
      if (phase !== 'ready') {
        return
      }

      if (input === 'q' || (key.ctrl && input === 'c')) {
        if (watcherRef.current) {
          watcherRef.current.close()
        }
        exit()
      }
    },
    { isActive: isTTY }
  )

  if (phase === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Alert variant="error" title="Dev Server Error" width={Math.min(columns, 80)}>
          {errorMessage}
        </Alert>
      </Box>
    )
  }

  if (phase === 'loading') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box flexDirection="column" gap={1}>
          <Text bold color="cyan">
            zpress dev
          </Text>
          <Spinner label="Starting dev server..." type="dots" />
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box>
        <Text bold color="cyan">
          zpress dev
        </Text>
        <Spacer />
        <Text dimColor>
          http://localhost:<Text color="cyan">{port}</Text>
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column" gap={0}>
        {/* Watcher status */}
        {match(watcherStatus)
          .with({ _tag: 'idle' }, () => (
            <StatusMessage variant="success">Watching for changes</StatusMessage>
          ))
          .with({ _tag: 'syncing' }, () => <Spinner label="Syncing..." type="dots" />)
          .with({ _tag: 'restarting' }, () => <Spinner label="Restarting server..." type="dots" />)
          .with({ _tag: 'error' }, (s) => (
            <StatusMessage variant="error">{s.message}</StatusMessage>
          ))
          .exhaustive()}

        {/* Last changed file */}
        {lastFile !== null && (
          <Box>
            <Text dimColor> changed </Text>
            <Text>{lastFile}</Text>
          </Box>
        )}

        {/* Sync stats */}
        {lastSync !== null && (
          <Box>
            <Text dimColor>
              {'  '}
              {lastSync.pagesWritten} written · {lastSync.pagesSkipped} skipped ·{' '}
              {lastSync.pagesRemoved} removed · {Math.round(lastSync.elapsed)}ms
            </Text>
          </Box>
        )}
      </Box>

      {/* Hotkey bar */}
      {isTTY && (
        <Box marginTop={1}>
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
