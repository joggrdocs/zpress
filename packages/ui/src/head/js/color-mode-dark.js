/**
 * Force dark color mode synchronously before first paint.
 * Sets localStorage so Rspress's own inline script agrees,
 * then applies the dark class and color-scheme immediately.
 */
try {
  localStorage.setItem('rspress-theme-appearance', 'dark')
} catch (_) {}
document.documentElement.classList.add('rp-dark', 'dark')
document.documentElement.style.colorScheme = 'dark'
