import { Spinner } from '@inkjs/ui'
import { Box, Newline, Spacer, Text, useApp, useInput } from '@kidd-cli/core/ui'
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
 * Renders a live status display with watcher state, sync results,
 * and hotkey bar. Falls back to plain text in non-TTY environments.
 *
 * @param props - Parsed CLI options
 * @returns React element tree for the dev TUI
 */
export function DevScreen(props: DevScreenProps): React.ReactElement {
  const { exit } = useApp()

  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [watcherStatus, setWatcherStatus] = useState<WatcherStatus>({ _tag: 'idle' })
  const [lastSync, setLastSync] = useState<SyncResult | null>(null)
  const [lastFile, setLastFile] = useState<string | null>(null)
  const [port, setPort] = useState(0)

  const watcherRef = useRef<WatcherHandle | null>(null)
  const openapiCacheRef = useRef(new Map<string, unknown>())

  useEffect(() => {
    // oxlint-disable-next-line functional/no-let -- mutable flag to prevent state updates after cleanup
    let cancelled = false

    /**
     * @private
     * Wraps a state setter so it becomes a no-op after the effect cleanup runs.
     */
    const guard = <T,>(setter: (value: T) => void) => (value: T) => {
      if (!cancelled) {
        setter(value)
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
        const initialResult = await sync(config, { paths, quiet: true, openapiCache })
        if (cancelled) {
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

        if (cancelled) {
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
      cancelled = true
      if (watcherRef.current) {
        watcherRef.current.close()
      }
    }
  }, [])

  useInput(
    (input, key) => {
      if (phase !== 'ready') {
        return
      }

      if (input === 'r') {
        if (watcherRef.current) {
          watcherRef.current.resync()
        }
        return
      }

      if (input === 'c') {
        process.stdout.write('\u001B[2J\u001B[H')
        return
      }

      if (input === 'o') {
        openBrowser(`http://localhost:${port}`)
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
      <Box flexDirection="column">
        <Text bold color="red">
          zpress dev failed
        </Text>
        <Text color="red">{errorMessage}</Text>
      </Box>
    )
  }

  if (phase === 'loading') {
    return (
      <Box>
        <Spinner label="Starting zpress dev..." />
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold> zpress dev</Text>
        <Spacer />
        <Text dimColor>:{port}</Text>
      </Box>

      <Box>
        {match(watcherStatus)
          .with({ _tag: 'idle' }, () => <Text dimColor>Watching</Text>)
          .with({ _tag: 'syncing' }, () => <Spinner label="Syncing..." />)
          .with({ _tag: 'restarting' }, () => <Spinner label="Restarting..." />)
          .with({ _tag: 'error' }, (s) => <Text color="red">{s.message}</Text>)
          .exhaustive()}
      </Box>

      {lastFile !== null && (
        <Box>
          <Text dimColor>{lastFile}</Text>
        </Box>
      )}

      {lastSync !== null && (
        <Box>
          <Text>
            {lastSync.pagesWritten} written · {lastSync.pagesSkipped} skipped ·{' '}
            {lastSync.pagesRemoved} removed · {Math.round(lastSync.elapsed)}ms
          </Text>
        </Box>
      )}

      {isTTY && (
        <>
          <Newline />
          <Box>
            <Text dimColor>r resync · c clear · o open · q quit</Text>
          </Box>
        </>
      )}
    </Box>
  )
}
