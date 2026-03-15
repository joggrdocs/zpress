/**
 * Force light color mode synchronously before first paint.
 * Sets localStorage so Rspress's own inline script agrees,
 * then removes the dark class and sets color-scheme immediately.
 */
try {
  localStorage.setItem('rspress-theme-appearance', 'light')
} catch (_) {}
document.documentElement.classList.remove('rp-dark', 'dark')
document.documentElement.style.colorScheme = 'light'
