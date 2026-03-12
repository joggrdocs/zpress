import * as vscode from 'vscode'

import { createCodeLensProvider } from './codelens'
import { createManifestReader } from './manifest'
import { createDevServer } from './server'
import { createStatusBarItem } from './status-bar'

export const activate = (context: vscode.ExtensionContext): void => {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
  if (!workspaceFolder) return

  const workspaceRoot = workspaceFolder.uri.fsPath
  const outputChannel = vscode.window.createOutputChannel('zpress')

  const statusBar = createStatusBarItem(
    (alignment, priority) => vscode.window.createStatusBarItem(alignment, priority),
  )

  const manifestReader = createManifestReader(
    workspaceRoot,
    (pattern) => vscode.workspace.createFileSystemWatcher(pattern),
    vscode.EventEmitter,
  )

  const server = createDevServer({
    workspaceRoot,
    statusBar,
    outputChannel,
    onReady: () => {
      manifestReader.reload()
    },
  })

  const updateTrackedContext = (editor: vscode.TextEditor | undefined): void => {
    if (!editor) {
      vscode.commands.executeCommand('setContext', 'zpress:isTrackedFile', false)
      return
    }
    const isTracked =
      editor.document.languageId === 'markdown' &&
      manifestReader.isTracked(editor.document.uri.fsPath)
    vscode.commands.executeCommand('setContext', 'zpress:isTrackedFile', isTracked)
  }

  const codeLensProvider = createCodeLensProvider({ manifestReader })

  context.subscriptions.push(
    outputChannel,
    statusBar,
    server,
    manifestReader,
    vscode.commands.registerCommand('zpress.start', () => {
      server.start()
    }),
    vscode.commands.registerCommand('zpress.stop', () => {
      server.stop()
    }),
    vscode.commands.registerCommand('zpress.toggle', () => {
      if (server.isRunning()) {
        server.stop()
      } else {
        server.start()
      }
    }),
    vscode.commands.registerCommand('zpress.openInBrowser', (url?: string) => {
      const targetUrl = url ?? (() => {
        const editor = vscode.window.activeTextEditor
        if (!editor) return undefined
        return manifestReader.getUrl(editor.document.uri.fsPath)
      })()

      if (!targetUrl) {
        vscode.window.showWarningMessage(
          'This file is not part of the zpress configuration.',
        )
        return
      }

      if (!server.isRunning()) {
        server.start()
        /*
         * The server.onReady callback triggers manifestReader.reload().
         * We open the browser after a short delay to let the server bind.
         * The onReady fires when we detect the port in stdout, so the
         * page should be available by then.
         */
        const disposable = manifestReader.onDidChange(() => {
          disposable.dispose()
          vscode.env.openExternal(vscode.Uri.parse(targetUrl))
        })
      } else {
        vscode.env.openExternal(vscode.Uri.parse(targetUrl))
      }
    }),
    vscode.languages.registerCodeLensProvider(
      { language: 'markdown', scheme: 'file' },
      codeLensProvider,
    ),
    vscode.window.onDidChangeActiveTextEditor(updateTrackedContext),
  )

  updateTrackedContext(vscode.window.activeTextEditor)
}

export const deactivate = (): void => {}
