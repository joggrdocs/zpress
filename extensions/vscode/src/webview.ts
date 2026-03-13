import crypto from 'node:crypto'

import type { Disposable, Uri, WebviewPanel, WebviewPanelOptions, WebviewOptions } from 'vscode'

type ServerStatus = 'stopped' | 'starting' | 'running' | 'stopping'

interface PreviewPanel extends Disposable {
  readonly open: (url: string) => void
  readonly updateStatus: (status: ServerStatus) => void
}

interface PreviewPanelDeps {
  readonly createPanel: (
    viewType: string,
    title: string,
    showOptions: number,
    options: WebviewPanelOptions & WebviewOptions
  ) => WebviewPanel
  readonly asExternalUri: (uri: Uri) => Thenable<Uri>
  readonly parseUri: (value: string) => Uri
  readonly onError: (message: string) => void
}

function escapeHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function getStoppedHtml(cspSource: string): string {
  const nonce = crypto.randomBytes(16).toString('hex')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'nonce-${nonce}';"
  >
  <style nonce="${nonce}">
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: var(--vscode-editor-background); color: var(--vscode-foreground); font-family: var(--vscode-font-family); display: flex; align-items: center; justify-content: center; }
    .zp-message { text-align: center; max-width: 400px; }
    .zp-message h2 { font-size: 16px; font-weight: 600; margin: 0 0 8px 0; }
    .zp-message p { font-size: 13px; color: var(--vscode-descriptionForeground); margin: 0; }
  </style>
</head>
<body>
  <div class="zp-message">
    <h2>zpress dev server is not running</h2>
    <p>Click the start button in the sidebar to begin.</p>
  </div>
</body>
</html>`
}

function getStartingHtml(cspSource: string): string {
  const nonce = crypto.randomBytes(16).toString('hex')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'nonce-${nonce}';"
  >
  <style nonce="${nonce}">
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: var(--vscode-editor-background); color: var(--vscode-foreground); font-family: var(--vscode-font-family); display: flex; align-items: center; justify-content: center; }
    .zp-message { text-align: center; max-width: 400px; }
    .zp-message h2 { font-size: 16px; font-weight: 600; margin: 0 0 8px 0; }
    .zp-message p { font-size: 13px; color: var(--vscode-descriptionForeground); margin: 0; }
    .zp-spinner { margin: 0 auto 16px; width: 32px; height: 32px; border: 3px solid var(--vscode-progressBar-background); border-top-color: var(--vscode-button-background); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="zp-message">
    <div class="zp-spinner"></div>
    <h2>Starting dev server...</h2>
    <p>This may take a moment.</p>
  </div>
</body>
</html>`
}

function getRunningHtml(serverUri: string, cspSource: string): string {
  const nonce = crypto.randomBytes(16).toString('hex')

  const separator = (() => {
    if (serverUri.includes('?')) {
      return '&'
    }
    return '?'
  })()

  const fullUrl = `${serverUri}${separator}env=vscode`
  const safeUrl = escapeHtml(fullUrl)
  const safeOrigin = escapeHtml(new URL(serverUri).origin)
  const safeCspSource = escapeHtml(cspSource)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; frame-src ${safeOrigin} ${safeCspSource}; style-src 'nonce-${nonce}';"
  >
  <style nonce="${nonce}">
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    iframe { border: none; width: 100%; height: 100vh; display: block; }
  </style>
</head>
<body>
  <!--
    allow-same-origin is safe here: the VS Code webview and the iframe are
    cross-origin, so same-origin access between them is already blocked. The
    iframe needs its own origin for cookies, HMR WebSocket connections, and
    fetch requests to function correctly.
  -->
  <iframe sandbox="allow-scripts allow-same-origin" src="${safeUrl}"></iframe>
</body>
</html>`
}

/**
 * Creates a reusable webview panel that renders the zpress dev server in an iframe.
 */
function createPreviewPanel(deps: PreviewPanelDeps): PreviewPanel {
  /*
   * VS Code extension state: mutable panel reference is unavoidable
   * when reusing a single webview panel across multiple opens.
   */
  const state = {
    panel: null as WebviewPanel | null,
    currentUrl: null as string | null,
    currentStatus: 'stopped' as ServerStatus,
  }

  function updatePanel(): void {
    if (!state.panel) {
      return
    }

    const cspSource = state.panel.webview.cspSource

    if (state.currentStatus === 'stopped' || state.currentStatus === 'stopping') {
      state.panel.webview.html = getStoppedHtml(cspSource)
    } else if (state.currentStatus === 'starting') {
      state.panel.webview.html = getStartingHtml(cspSource)
    } else if (state.currentStatus === 'running' && state.currentUrl) {
      state.panel.webview.html = getRunningHtml(state.currentUrl, cspSource)
    }
  }

  function open(url: string): void {
    function showPanel(serverUri: Uri): void {
      const uriString = serverUri.toString()
      state.currentUrl = uriString

      if (state.panel) {
        state.panel.reveal()
        updatePanel()
        return
      }

      state.panel = deps.createPanel('zpressPreview', 'zpress Preview', 1 /* ViewColumn.One */, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [],
      })

      updatePanel()
      state.panel.onDidDispose(() => {
        state.panel = null
      })
    }

    const uri = deps.parseUri(url)
    const thenable = deps.asExternalUri(uri)
    // oxlint-disable-next-line prefer-catch, prefer-await-to-callbacks -- Thenable (not Promise) lacks .catch()
    thenable.then(showPanel, (error: unknown) => {
      const message = (() => {
        if (error instanceof Error) {
          return error.message
        }
        return String(error)
      })()
      deps.onError(`Failed to resolve external URI: ${message}`)
    })
  }

  function updateStatus(status: ServerStatus): void {
    state.currentStatus = status
    updatePanel()
  }

  return {
    open,
    updateStatus,
    dispose: (): void => {
      if (state.panel) {
        state.panel.dispose()
      }
    },
  }
}

export { createPreviewPanel }
export type { PreviewPanel, PreviewPanelDeps }
