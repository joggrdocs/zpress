import type { Disposable, StatusBarAlignment, StatusBarItem } from 'vscode'

type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping'

type StatusBarConfig = Readonly<Record<ServerStatus, { readonly text: string; readonly tooltip: string }>>

const STATUS_CONFIG: StatusBarConfig = {
  stopped: {
    text: '$(book) zpress',
    tooltip: 'zpress: Click to start dev server',
  },
  starting: {
    text: '$(sync~spin) zpress',
    tooltip: 'zpress: Starting dev server...',
  },
  running: {
    text: '$(check) zpress',
    tooltip: 'zpress: Dev server running — click to stop',
  },
  stopping: {
    text: '$(sync~spin) zpress',
    tooltip: 'zpress: Stopping dev server...',
  },
}

interface StatusBar extends Disposable {
  readonly update: (status: ServerStatus) => void
}

/**
 * Creates a status bar item that reflects the dev server lifecycle.
 */
function createStatusBarItem(
  createItem: (alignment: StatusBarAlignment, priority: number) => StatusBarItem
): StatusBar {
  const item = createItem(2 /* StatusBarAlignment.Right */, 100)
  item.command = 'zpress.toggle'
  item.text = STATUS_CONFIG.stopped.text
  item.tooltip = STATUS_CONFIG.stopped.tooltip
  item.show()

  return {
    update: (status: ServerStatus): void => {
      const config = STATUS_CONFIG[status]
      item.text = config.text
      item.tooltip = config.tooltip
    },
    dispose: (): void => {
      item.dispose()
    },
  }
}

export { createStatusBarItem }
export type { ServerStatus, StatusBar }
