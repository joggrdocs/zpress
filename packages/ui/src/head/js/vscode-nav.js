/**
 * Notify parent window (VS Code webview) on SPA navigation.
 *
 * Patches pushState/replaceState and listens for popstate to detect
 * route changes. Observes <title> mutations so the VS Code tab title
 * updates after React renders the new page title.
 */
;(function () {
  var originalPush = history.pushState
  var originalReplace = history.replaceState
  var lastPath = ''

  function send(path, title) {
    if (path === lastPath && !title) return
    lastPath = path
    window.parent.postMessage(
      { type: 'zpress:navigate', path: path, title: title || document.title },
      '*'
    )
  }

  function notify() {
    send(location.pathname, '')
  }

  history.pushState = function () {
    originalPush.apply(this, arguments)
    notify()
  }

  history.replaceState = function () {
    originalReplace.apply(this, arguments)
    notify()
  }

  window.addEventListener('popstate', notify)

  /* Watch <title> changes so the tab title updates after React renders */
  new MutationObserver(function () {
    send(location.pathname, document.title)
  }).observe(document.querySelector('title'), { childList: true })

  notify()
})()
