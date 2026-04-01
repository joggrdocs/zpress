import { stories, withFullScreen, withLayout } from '@kidd-cli/core/stories'
import { Alert, Box, Spacer, Spinner, StatusMessage, Text } from '@kidd-cli/core/ui'
import { z } from 'zod'

/**
 * Props for the story-only DevScreenPreview component.
 * Mirrors the visual states of the real DevScreen without side effects.
 */
type DevScreenPreviewProps = Record<string, unknown> & {
  readonly phase: 'loading' | 'ready' | 'error'
  readonly errorMessage: string
  readonly watcherTag: 'idle' | 'syncing' | 'restarting' | 'error'
  readonly watcherError: string
  readonly lastFile: string
  readonly pagesWritten: number
  readonly pagesSkipped: number
  readonly pagesRemoved: number
  readonly elapsed: number
  readonly port: number
}

/**
 * Pure visual preview of the DevScreen for the story viewer.
 *
 * @param props - DevScreen visual state props
 * @returns React element rendering the dev screen preview
 */
function DevScreenPreview(props: DevScreenPreviewProps): React.ReactElement {
  if (props.phase === 'error') {
    return (
      <Box flexDirection="column" padding={1}>
        <Alert variant="error" title="Dev Server Error" width={72}>
          {props.errorMessage}
        </Alert>
      </Box>
    )
  }

  if (props.phase === 'loading') {
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
          http://localhost:<Text color="cyan">{props.port}</Text>
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column" gap={0}>
        {/* Watcher status */}
        {props.watcherTag === 'idle' && (
          <StatusMessage variant="success">Watching for changes</StatusMessage>
        )}
        {props.watcherTag === 'syncing' && <Spinner label="Syncing..." type="dots" />}
        {props.watcherTag === 'restarting' && <Spinner label="Restarting server..." type="dots" />}
        {props.watcherTag === 'error' && (
          <StatusMessage variant="error">{props.watcherError}</StatusMessage>
        )}

        {/* Last changed file */}
        {props.lastFile.length > 0 && (
          <Box>
            <Text dimColor> changed </Text>
            <Text>{props.lastFile}</Text>
          </Box>
        )}

        {/* Sync stats */}
        <Box>
          <Text dimColor>
            {'  '}
            {props.pagesWritten} written · {props.pagesSkipped} skipped · {props.pagesRemoved}{' '}
            removed · {Math.round(props.elapsed)}ms
          </Text>
        </Box>
      </Box>

      {/* Hotkey bar */}
      <Box marginTop={1}>
        <HotkeyHint label="r" description="resync" />
        <Text dimColor> · </Text>
        <HotkeyHint label="o" description="open" />
        <Text dimColor> · </Text>
        <HotkeyHint label="c" description="clear" />
        <Text dimColor> · </Text>
        <HotkeyHint label="q" description="quit" />
      </Box>
    </Box>
  )
}

/**
 * @private
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

const schema = z.object({
  phase: z.enum(['loading', 'ready', 'error']).default('ready'),
  errorMessage: z.string().default('Config file not found'),
  watcherTag: z.enum(['idle', 'syncing', 'restarting', 'error']).default('idle'),
  watcherError: z.string().default('ENOSPC: System limit for file watchers reached'),
  lastFile: z.string().default('docs/getting-started/introduction.md'),
  pagesWritten: z.number().default(3),
  pagesSkipped: z.number().default(42),
  pagesRemoved: z.number().default(0),
  elapsed: z.number().default(187),
  port: z.number().default(3000),
})

/**
 * Stories for the DevScreen TUI component.
 */
export default stories<DevScreenPreviewProps>({
  title: 'DevScreen',
  component: DevScreenPreview,
  schema,
  defaults: {
    port: 3000,
    pagesWritten: 3,
    pagesSkipped: 42,
    pagesRemoved: 0,
    elapsed: 187,
    errorMessage: 'Config file not found',
    watcherError: 'ENOSPC: System limit for file watchers reached',
  },
  decorators: [withLayout({ width: 80, padding: 0 })],
  stories: {
    Loading: {
      props: { phase: 'loading' },
      description: 'Initial loading state while config loads and first sync runs',
    },
    Idle: {
      props: {
        phase: 'ready',
        watcherTag: 'idle',
        lastFile: 'docs/getting-started/introduction.md',
      },
      description: 'Watching for changes with last sync stats visible',
    },
    Syncing: {
      props: {
        phase: 'ready',
        watcherTag: 'syncing',
        lastFile: 'docs/concepts/content.md',
      },
      description: 'File change detected, sync in progress',
    },
    Restarting: {
      props: {
        phase: 'ready',
        watcherTag: 'restarting',
        lastFile: 'zpress.config.ts',
      },
      description: 'Config change detected, dev server restarting',
    },
    'Watcher Error': {
      props: {
        phase: 'ready',
        watcherTag: 'error',
        lastFile: '',
      },
      description: 'Watcher encountered an error (e.g. ENOSPC)',
    },
    'Fatal Error': {
      props: { phase: 'error' },
      description: 'Fatal startup error — config missing or invalid',
    },
    Fullscreen: {
      props: {
        phase: 'ready',
        watcherTag: 'idle',
        lastFile: 'docs/guides/deploying-to-vercel.md',
        pagesWritten: 12,
        pagesSkipped: 35,
        elapsed: 342,
      },
      decorators: [withFullScreen()],
      description: 'Fullscreen mode as rendered in the real dev command',
    },
  },
})
