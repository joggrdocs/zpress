import fs from 'node:fs'
import path from 'node:path'

import {
  commands,
  env,
  EventEmitter,
  languages,
  Range,
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
const CONFIG_FILES = ['zpress.config.ts', 'zpress.config.js', 'zpress.config.json']

function isZpressProject(workspaceRoot: string): boolean {
  // oxlint-disable-next-line security/detect-non-literal-fs-filename
  return CONFIG_FILES.some((file) => fs.existsSync(path.join(workspaceRoot, file)))
}

/**
 * Activates the zpress VS Code extension when a zpress project is detected.
 */
export function activate(context: ExtensionContext): void {
  const folders = workspace.workspaceFolders
  if (!folders || !folders[0]) {
    return
  }
  const [workspaceFolder] = folders

  const workspaceRoot = workspaceFolder.uri.fsPath

  if (!isZpressProject(workspaceRoot)) {
    return
  }

  commands.executeCommand('setContext', 'zpress:isProject', true)
  const outputChannel = window.createOutputChannel('zpress')

  const statusBar = createStatusBarItem((alignment, priority) =>
    window.createStatusBarItem(alignment, priority)
  )

  const manifestReader = createManifestReader({
    workspaceRoot,
    createWatcher: (pattern) => workspace.createFileSystemWatcher(pattern),
    EventEmitter,
  })

  const previewPanel = createPreviewPanel({
    createPanel: (viewType, title, showOptions, options) =>
      window.createWebviewPanel(viewType, title, showOptions, options),
    asExternalUri: (uri) => env.asExternalUri(uri),
    parseUri: (value) => Uri.parse(value),
  })

  const sidebar = createSidebar({
    workspaceRoot,
    createWatcher: (pattern) => workspace.createFileSystemWatcher(pattern),
    EventEmitter,
    ThemeIcon,
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
    sidebar.sections.map((section, i) => {
      commands.executeCommand('setContext', `zpress:section.${String(i)}`, i < activeCount)
      const treeView = sectionTreeViews[i]
      if (treeView && i < activeCount) {
        treeView.title = section.title
      }
      return null
    })
  }

  function setServerReady(ready: boolean): void {
    commands.executeCommand('setContext', 'zpress:serverReady', ready)
  }

  const server = createDevServer({
    workspaceRoot,
    statusBar,
    outputChannel,
    onReady: (baseUrl) => {
      manifestReader.reload(baseUrl)
      sidebar.setBaseUrl(baseUrl)
      refreshSectionViews()
      setServerReady(true)
    },
    onStopped: () => {
      setServerReady(false)
    },
  })

  /* Update section visibility whenever sidebar.json changes */
  sidebar.onDidReload(refreshSectionViews)

  /* Set initial section visibility from any existing sidebar.json */
  refreshSectionViews()

  /* Start the dev server immediately on activation */
  server.start()

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
    ...sectionTreeViews,
    commands.registerCommand('zpress.start', () => {
      server.start()
    }),
    commands.registerCommand('zpress.stop', () => {
      server.stop()
      setServerReady(false)
    }),
    commands.registerCommand('zpress.toggle', () => {
      if (server.isRunning()) {
        server.stop()
        setServerReady(false)
      } else {
        server.start()
      }
    }),
    commands.registerCommand('zpress.openPage', (url: string) => {
      previewPanel.open(url)
    }),
    commands.registerCommand('zpress.openInBrowser', (arg?: string | Uri) => {
      /*
       * When invoked from CodeLens, arg is a string URL.
       * When invoked from editor/title menu, VS Code passes the resource Uri.
       * When invoked from the command palette, arg is undefined.
       */
      const targetUrl = resolveTargetUrl(arg)

      if (!targetUrl) {
        window.showWarningMessage('This file is not part of the zpress configuration.')
        return
      }

      previewPanel.open(targetUrl)
    }),
    languages.registerCodeLensProvider(
      { language: 'markdown', scheme: 'file' },
      codeLensProvider
    ),
    window.onDidChangeActiveTextEditor(updateTrackedContext)
  )

  updateTrackedContext(window.activeTextEditor)
}

/**
 * Deactivates the zpress VS Code extension.
 */
export function deactivate(): void {}
