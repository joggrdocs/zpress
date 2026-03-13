import type { Disposable, Uri, WebviewPanel, WebviewPanelOptions, WebviewOptions } from 'vscode'

interface PreviewPanel extends Disposable {
  readonly open: (url: string) => void
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
}

function escapeHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function getHtml(serverUri: string, cspSource: string): string {
  const nonce = Array.from({ length: 32 }, () =>
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
      Math.floor(Math.random() * 62)
    )
  ).join('')

  const separator = (() => {
    if (serverUri.includes('?')) {
      return '&'
    }
    return '?'
  })()

  const fullUrl = `${serverUri}${separator}env=vscode`
  const safeUrl = escapeHtml(fullUrl)
  const safeCsp = escapeHtml(serverUri)
  const safeCspSource = escapeHtml(cspSource)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; frame-src ${safeCsp} ${safeCspSource}; style-src 'nonce-${nonce}';"
  >
  <style nonce="${nonce}">
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
    .zp-address-bar { display: flex; align-items: center; gap: 6px; font: 12px/1 monospace; padding: 4px 8px; background: #1e1e1e; color: #999; border-bottom: 1px solid #333; }
    .zp-address-bar span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; background: #2a2a2a; padding: 3px 8px; border-radius: 4px; color: #ccc; }
    iframe { border: none; width: 100%; height: calc(100vh - 28px); display: block; }
  </style>
</head>
<body>
  <div class="zp-address-bar">&#9679; <span>${safeUrl}</span></div>
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
  const state = { panel: null as WebviewPanel | null }

  function open(url: string): void {
    function showPanel(serverUri: Uri): void {
      const uriString = serverUri.toString()

      if (state.panel) {
        state.panel.reveal()
        state.panel.webview.html = getHtml(uriString, state.panel.webview.cspSource)
        return
      }

      state.panel = deps.createPanel('zpressPreview', 'zpress Preview', 1 /* ViewColumn.One */, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [],
      })

      state.panel.webview.html = getHtml(uriString, state.panel.webview.cspSource)
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
      console.error('[zpress] Failed to resolve external URI:', message)
    })
  }

  return {
    open,
    dispose: (): void => {
      if (state.panel) {
        state.panel.dispose()
      }
    },
  }
}

export { createPreviewPanel }
export type { PreviewPanel, PreviewPanelDeps }
