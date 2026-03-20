import fs from 'node:fs'
import path from 'node:path'

import {
  commands,
  env,
  EventEmitter,
  languages,
  Range,
  RelativePattern,
  ThemeColor,
  ThemeIcon,
  Uri,
  window,
  workspace,
} from 'vscode'
import type { ExtensionContext, TextEditor } from 'vscode'

import { createCodeLensProvider } from './code-lens'
import { createManifestReader } from './manifest'
import { createDevServer } from './server'
import { createSidebar } from './sidebar'
import { createStatusBarItem } from './status-bar'
import { createPreviewPanel } from './webview'

/**
 * TODO: Use @zpress/core config resolution instead of manual file checks.
 * This is a quick hack — should be replaced with proper config loading
 * from the zpress packages once the extension can depend on them.
 */
const CONFIG_FILES = [
  'zpress.config.ts',
  'zpress.config.mts',
  'zpress.config.js',
  'zpress.config.mjs',
  'zpress.config.json',
] as const

function isServerUrl(url: string, baseUrl: string): boolean {
  try {
    const target = new URL(url)
    const base = new URL(baseUrl)
    const basePath = base.pathname.replace(/\/$/, '')

    return (
      target.origin === base.origin &&
      (basePath === '' ||
        target.pathname === basePath ||
        target.pathname.startsWith(`${basePath}/`))
    )
  } catch {
    return false
  }
}

function isZpressProject(workspaceRoot: string): boolean {
  // oxlint-disable-next-line security/detect-non-literal-fs-filename
  return CONFIG_FILES.some((file) => fs.existsSync(path.join(workspaceRoot, file)))
}

/**
 * Activates the zpress VS Code extension when a zpress project is detected.
 */
export function activate(context: ExtensionContext): void {
  const folders = workspace.workspaceFolders
  if (!folders) {
    return
  }
  const workspaceFolder = folders.find((folder) => isZpressProject(folder.uri.fsPath))
  if (!workspaceFolder) {
    return
  }

  const workspaceRoot = workspaceFolder.uri.fsPath

  commands.executeCommand('setContext', 'zpress:isProject', true)
  const outputChannel = window.createOutputChannel('zpress')

  const statusBar = createStatusBarItem((alignment, priority) =>
    window.createStatusBarItem(alignment, priority)
  )

  const manifestReader = createManifestReader({
    workspaceRoot,
    createWatcher: (pattern) => workspace.createFileSystemWatcher(pattern),
    EventEmitter,
    RelativePattern,
  })

  const previewPanel = createPreviewPanel({
    createPanel: (viewType, title, showOptions, options) =>
      window.createWebviewPanel(viewType, title, showOptions, options),
    asExternalUri: (uri) => env.asExternalUri(uri),
    parseUri: (value) => Uri.parse(value),
    iconPath: Uri.joinPath(context.extensionUri, 'resources', 'icon.svg'),
    onError: (message) => {
      outputChannel.appendLine(`[zpress] ${message}`)
    },
    onStart: () => {
      commands.executeCommand('zpress.start')
    },
  })

  const sidebar = createSidebar({
    workspaceRoot,
    createWatcher: (pattern) => workspace.createFileSystemWatcher(pattern),
    EventEmitter,
    ThemeIcon,
    ThemeColor,
    RelativePattern,
  })

  /* Empty tree view shown while the dev server is starting */
  const loadingView = window.createTreeView('zpress.loading', {
    treeDataProvider: { getTreeItem: () => ({ label: '' }), getChildren: () => [] },
  })

  const sectionTreeViews = sidebar.sections.map((section) =>
    window.createTreeView(section.viewId, {
      treeDataProvider: section.treeDataProvider,
      showCollapseAll: true,
    })
  )

  function refreshSectionViews(): void {
    const activeCount = sidebar.activeSectionCount()
    // oxlint-disable-next-line no-unused-expressions -- .map() used for side-effect (setting context on each section)
    sidebar.sections.map((section, i) => {
      commands.executeCommand('setContext', `zpress:section.${String(i)}`, i < activeCount)
      const treeView = sectionTreeViews[i]
      if (treeView && i < activeCount) {
        treeView.title = section.title
      }
      return null
    })
  }

  function setServerStatus(status: 'stopped' | 'starting' | 'running' | 'stopping'): void {
    commands.executeCommand('setContext', 'zpress:serverReady', status === 'running')
    commands.executeCommand(
      'setContext',
      'zpress:serverStarting',
      status === 'starting' || status === 'stopping'
    )
    commands.executeCommand('setContext', 'zpress:serverStopped', status === 'stopped')
  }

  const server = createDevServer({
    workspaceRoot,
    statusBar,
    outputChannel,
    showErrorMessage: (message) => {
      window.showErrorMessage(message)
    },
    onStatusChange: (status) => {
      setServerStatus(status)
      previewPanel.updateStatus(status)
    },
    onReady: (baseUrl) => {
      manifestReader.reload(baseUrl)
      sidebar.setBaseUrl(baseUrl)
      refreshSectionViews()
      const autoOpen = workspace.getConfiguration('zpress.server').get<boolean>('autoOpen', true)
      if (autoOpen) {
        previewPanel.open(baseUrl)
      }
    },
    onStopped: () => {
      manifestReader.reload(null)
      sidebar.setBaseUrl('')
    },
  })

  /* Update section visibility whenever sidebar.json changes */
  sidebar.onDidReload(refreshSectionViews)

  /* Set initial section visibility from any existing sidebar.json */
  refreshSectionViews()

  /* Set initial server status to stopped */
  setServerStatus('stopped')
  previewPanel.updateStatus('stopped')

  function updateTrackedContext(editor: TextEditor | undefined): void {
    if (!editor) {
      commands.executeCommand('setContext', 'zpress:isTrackedFile', false)
      return
    }
    const isTracked =
      editor.document.languageId === 'markdown' &&
      manifestReader.isTracked(editor.document.uri.fsPath)
    commands.executeCommand('setContext', 'zpress:isTrackedFile', isTracked)
  }

  /* Re-evaluate tracked context whenever the manifest updates */
  manifestReader.onDidChange(() => {
    updateTrackedContext(window.activeTextEditor)
  })

  const codeLensProvider = createCodeLensProvider({
    manifestReader,
    EventEmitter,
    Range,
  })

  function resolveTargetUrl(arg?: string | Uri): string | undefined {
    if (typeof arg === 'string') {
      return arg
    }
    if (arg instanceof Uri) {
      return manifestReader.getUrl(arg.fsPath)
    }
    const activeEditor = window.activeTextEditor
    if (!activeEditor) {
      return undefined
    }
    return manifestReader.getUrl(activeEditor.document.uri.fsPath)
  }

  context.subscriptions.push(
    outputChannel,
    statusBar,
    server,
    manifestReader,
    previewPanel,
    sidebar,
    codeLensProvider,
    loadingView,
    loadingView.onDidChangeVisibility((e) => {
      const autoStart = workspace.getConfiguration('zpress.server').get<boolean>('autoStart', true)
      if (e.visible && autoStart && !server.isRunning()) {
        server.start()
      }
    }),
    ...sectionTreeViews,
    commands.registerCommand('zpress.start', () => {
      server.start()
    }),
    commands.registerCommand('zpress.stop', () => {
      server.stop()
    }),
    commands.registerCommand('zpress.toggle', () => {
      if (server.isRunning()) {
        server.stop()
      } else {
        server.start()
      }
    }),
    commands.registerCommand('zpress.restart', () => {
      server.restart()
    }),
    commands.registerCommand('zpress.openInBrowser', () => {
      const baseUrl = server.getBaseUrl()
      if (!baseUrl) {
        window.showWarningMessage('Dev server is not running.')
        return
      }
      env.openExternal(Uri.parse(baseUrl))
    }),
    commands.registerCommand('zpress.openPage', (url: string) => {
      const baseUrl = server.getBaseUrl()
      if (!baseUrl || !isServerUrl(url, baseUrl)) {
        return
      }
      previewPanel.open(url)
    }),
    commands.registerCommand('zpress.preview', (arg?: string | Uri) => {
      /*
       * When invoked from CodeLens, arg is a string URL.
       * When invoked from editor/title menu, VS Code passes the resource Uri.
       * When invoked from the command palette, arg is undefined.
       */
      const targetUrl = resolveTargetUrl(arg)

      const baseUrl = server.getBaseUrl()
      if (!targetUrl || !baseUrl || !isServerUrl(targetUrl, baseUrl)) {
        window.showWarningMessage('This file is not part of the zpress configuration.')
        return
      }

      previewPanel.open(targetUrl)
    }),
    languages.registerCodeLensProvider({ language: 'markdown', scheme: 'file' }, codeLensProvider),
    window.onDidChangeActiveTextEditor(updateTrackedContext),
    workspace.onDidChangeConfiguration((e) => {
      const affected =
        e.affectsConfiguration('zpress.theme') ||
        e.affectsConfiguration('zpress.theme.mode') ||
        e.affectsConfiguration('zpress.server.port')
      if (affected && server.isRunning()) {
        server.restart()
      }
    })
  )

  updateTrackedContext(window.activeTextEditor)
}

/**
 * Deactivates the zpress VS Code extension.
 */
export function deactivate(): void {}
