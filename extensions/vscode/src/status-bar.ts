import type * as vscode from 'vscode'

type ServerStatus = 'stopped' | 'starting' | 'running'

interface StatusBarConfig {
  readonly [K in ServerStatus]: {
    readonly text: string
    readonly tooltip: string
  }
}

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
}

interface StatusBar extends vscode.Disposable {
  readonly update: (status: ServerStatus) => void
}

const createStatusBarItem = (
  createItem: (alignment: vscode.StatusBarAlignment, priority: number) => vscode.StatusBarItem,
): StatusBar => {
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
