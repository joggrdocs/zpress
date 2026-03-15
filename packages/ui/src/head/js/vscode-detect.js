/**
 * Detect VS Code preview mode synchronously before first paint.
 *
 * Checks sessionStorage and URL params for env=vscode. If found,
 * sets data-zpress-env="vscode" on <html> so the static vscode.css
 * rules apply immediately (no flash of sidebar/nav).
 */
try {
  var s = sessionStorage.getItem('zpress-env')
  var p = new URLSearchParams(location.search).get('env')
  if (s === 'vscode' || p === 'vscode') {
    document.documentElement.dataset.zpressEnv = 'vscode'
    if (p === 'vscode') {
      sessionStorage.setItem('zpress-env', 'vscode')
    }
  }
} catch (_) {}
