/**
 * Animate "loading..." dots via JS — cross-browser safe.
 *
 * CSS `content` animation via @keyframes is not supported in
 * Firefox or Safari. Instead we cycle a data attribute and let
 * CSS read it via `attr(data-zp-loader-text)`.
 *
 * Stores the interval ID on window so ThemeProvider can clear it
 * when dismissing the loader.
 */
var _zl = ['loading', 'loading.', 'loading..', 'loading...']
var _zi = 0
document.documentElement.dataset.zpLoaderText = _zl[0]
window.__zpDotsInterval = setInterval(function () {
  _zi = (_zi + 1) % 4
  document.documentElement.dataset.zpLoaderText = _zl[_zi]
}, 300)
