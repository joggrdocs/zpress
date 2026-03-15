import { useEffect, useLayoutEffect } from 'react'
import type React from 'react'

declare const __ZPRESS_THEME_NAME__: string
declare const __ZPRESS_COLOR_MODE__: string
declare const __ZPRESS_THEME_COLORS__: string
declare const __ZPRESS_THEME_DARK_COLORS__: string

const COLOR_VAR_MAP: Record<string, readonly string[]> = {
  brand: ['--zp-c-brand-1', '--rp-c-brand'],
  brandLight: ['--rp-c-brand-light'],
  brandDark: ['--zp-c-brand-2', '--rp-c-brand-dark'],
  brandSoft: ['--zp-c-brand-soft', '--rp-c-brand-tint'],
  bg: ['--zp-c-bg', '--rp-c-bg'],
  bgAlt: ['--zp-c-bg-alt'],
  bgElv: ['--zp-c-bg-elv'],
  bgSoft: ['--zp-c-bg-soft', '--rp-c-bg-soft'],
  text1: ['--zp-c-text-1', '--rp-c-text-1'],
  text2: ['--zp-c-text-2', '--rp-c-text-2'],
  text3: ['--zp-c-text-3', '--rp-c-text-3'],
  divider: ['--zp-c-divider', '--rp-c-divider'],
  border: ['--zp-c-border'],
  homeBg: ['--rp-home-background-bg'],
}

/**
 * Build a flat list of [cssVar, value] pairs from a color overrides object.
 */
function resolveColorPairs(colors: Record<string, string>): readonly (readonly [string, string])[] {
  return Object.entries(colors).flatMap(([key, value]) => {
    const vars = COLOR_VAR_MAP[key]
    if (!vars) {
      return []
    }
    return vars.map((cssVar) => [cssVar, value] as const)
  })
}

/**
 * Apply a ThemeColors object as inline CSS custom properties on <html>.
 */
function applyColorOverrides(html: HTMLElement, colors: Record<string, string>): void {
  const pairs = resolveColorPairs(colors)
  // oxlint-disable-next-line unicorn/no-array-for-each -- DOM side effect; for-loops also banned
  pairs.forEach(([cssVar, value]) => {
    html.style.setProperty(cssVar, value)
  })
}

/**
 * Collect all CSS variable names from the color map.
 */
const ALL_CSS_VARS: readonly string[] = Object.values(COLOR_VAR_MAP).flat()

/**
 * Remove all color overrides previously set as inline styles.
 */
function clearColorOverrides(html: HTMLElement): void {
  // oxlint-disable-next-line unicorn/no-array-for-each -- DOM side effect; for-loops also banned
  ALL_CSS_VARS.forEach((cssVar) => {
    html.style.removeProperty(cssVar)
  })
}

/**
 * Safe localStorage read — returns null if storage is unavailable.
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/**
 * Parse a JSON build-time define, returning an empty object on failure.
 */
function parseColors(raw: string): Record<string, string> {
  if (!raw || raw === '""' || raw === 'undefined') {
    return {}
  }
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}

/**
 * useLayoutEffect on the client, useEffect on the server (avoids SSR warning).
 * Ensures DOM mutations happen synchronously before browser paint.
 */
function getIsomorphicEffect(): typeof useLayoutEffect {
  if (globalThis.window !== undefined) {
    return useLayoutEffect
  }
  return useEffect
}

const useIsomorphicLayoutEffect = getIsomorphicEffect()

/**
 * ThemeProvider — global UI component that configures the active theme.
 *
 * Sets `data-zp-theme` attribute, forces color mode, and applies
 * inline CSS custom property overrides from build-time defines.
 * Sets `data-zp-ready` on <html> to dismiss the loading overlay
 * injected by critical CSS.
 */
/**
 * Minimum time (ms) the loading overlay stays visible before fading out.
 */
const LOADER_MIN_DISPLAY_MS = 600

/**
 * Duration (ms) of the CSS fade-out transition. Must match the
 * `transition: opacity` value in loader-backdrop.css / loader-dots.css.
 */
const LOADER_FADE_MS = 400

/**
 * Dismiss the loading overlay with a two-phase approach:
 *   1. Add `zp-loader-fade` class → CSS transitions opacity to 0
 *   2. After transition completes → set `data-zp-ready` attribute → CSS hard removes (display: none)
 *
 * Returns a cleanup function that cancels pending timers.
 */
function dismissLoader(html: HTMLElement): () => void {
  const fadeTimer = setTimeout(() => {
    html.classList.add('zp-loader-fade')
  }, LOADER_MIN_DISPLAY_MS)

  const removeTimer = setTimeout(() => {
    html.dataset.zpReady = 'true'
    html.classList.remove('zp-loader-fade')
  }, LOADER_MIN_DISPLAY_MS + LOADER_FADE_MS)

  return () => {
    clearTimeout(fadeTimer)
    clearTimeout(removeTimer)
  }
}

export function ThemeProvider(): React.ReactElement | null {
  useIsomorphicLayoutEffect(() => {
    const html = document.documentElement
    const themeName = safeGetItem('zpress-theme') || __ZPRESS_THEME_NAME__
    const colorMode = __ZPRESS_COLOR_MODE__
    const colors = parseColors(__ZPRESS_THEME_COLORS__)
    const darkColors = parseColors(__ZPRESS_THEME_DARK_COLORS__)
    const hasColors = Object.keys(colors).length > 0
    const hasDarkColors = Object.keys(darkColors).length > 0

    // 1. Set theme attribute
    html.dataset.zpTheme = themeName

    // 2. Force color mode if not toggle
    if (colorMode === 'dark') {
      html.classList.add('rp-dark')
      html.dataset.dark = 'true'
      try {
        localStorage.setItem('rspress-theme-appearance', 'dark')
      } catch {
        // storage unavailable
      }
    } else if (colorMode === 'light') {
      html.classList.remove('rp-dark')
      html.dataset.dark = 'false'
      try {
        localStorage.setItem('rspress-theme-appearance', 'light')
      } catch {
        // storage unavailable
      }
    }

    // 3. Apply base color overrides
    if (hasColors) {
      applyColorOverrides(html, colors)
    }

    // 4. Observe dark mode changes for dark-specific overrides
    if (hasDarkColors) {
      const isDark = html.classList.contains('rp-dark')
      if (isDark) {
        applyColorOverrides(html, darkColors)
      }

      const observer = new MutationObserver((mutations) => {
        const classChanged = mutations.some((m) => m.attributeName === 'class')
        if (classChanged) {
          const nowDark = html.classList.contains('rp-dark')
          clearColorOverrides(html)
          if (hasColors) {
            applyColorOverrides(html, colors)
          }
          if (nowDark && hasDarkColors) {
            applyColorOverrides(html, darkColors)
          }
        }
      })

      observer.observe(html, { attributes: true, attributeFilter: ['class'] })

      // 5. Dismiss loading overlay
      const cancelLoader = dismissLoader(html)

      return () => {
        observer.disconnect()
        cancelLoader()
      }
    }

    // 5. Dismiss loading overlay
    const cancelLoader = dismissLoader(html)

    return () => {
      cancelLoader()
    }
  }, [])

  return null
}

export { ThemeProvider as default }
