import React, { useCallback, useEffect, useRef, useState } from 'react'

import { Icon } from '../shared/icon.tsx'

import './theme-switcher.css'

declare const __ZPRESS_THEME_SWITCHER__: boolean

interface ThemeOption {
  readonly name: string
  readonly label: string
  readonly swatch: string
  readonly defaultColorMode: 'dark' | 'light' | 'toggle'
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { name: 'base', label: 'Base', swatch: '#a78bfa', defaultColorMode: 'toggle' },
  { name: 'midnight', label: 'Midnight', swatch: '#60a5fa', defaultColorMode: 'dark' },
  { name: 'arcade', label: 'Arcade', swatch: '#00ff88', defaultColorMode: 'dark' },
]

/**
 * Build the className string for a theme option button.
 */
function optionClassName(isActive: boolean): string {
  if (isActive) {
    return 'theme-switcher-option theme-switcher-option--active'
  }
  return 'theme-switcher-option'
}

/**
 * Apply a theme by updating the DOM and persisting to localStorage.
 */
function applyTheme(theme: ThemeOption): void {
  const html = document.documentElement
  html.dataset.zpTheme = theme.name
  localStorage.setItem('zpress-theme', theme.name)

  if (theme.defaultColorMode === 'dark') {
    html.classList.add('rp-dark')
    html.dataset.dark = 'true'
    localStorage.setItem('rspress-theme-appearance', 'dark')
  } else if (theme.defaultColorMode === 'light') {
    html.classList.remove('rp-dark')
    html.dataset.dark = 'false'
    localStorage.setItem('rspress-theme-appearance', 'light')
  }
}

/**
 * ThemeSwitcher — dropdown button for switching between built-in themes.
 * Only renders when `__ZPRESS_THEME_SWITCHER__` build-time define is true.
 */
export function ThemeSwitcher(): React.ReactElement | null {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTheme, setActiveTheme] = useState(() => {
    if (globalThis.window === undefined) {
      return 'base'
    }
    try {
      return globalThis.localStorage.getItem('zpress-theme') || 'base'
    } catch {
      return 'base'
    }
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const handleSelect = useCallback((theme: ThemeOption) => {
    setActiveTheme(theme.name)
    applyTheme(theme)
    setIsOpen(false)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  if (!__ZPRESS_THEME_SWITCHER__) {
    return null
  }

  return (
    <div className="theme-switcher" ref={containerRef}>
      <button
        className="theme-switcher-btn"
        onClick={handleToggle}
        aria-label="Switch theme"
        type="button"
      >
        <Icon icon="pixelarticons:paint-bucket" width={16} height={16} />
      </button>
      {isOpen && (
        <div className="theme-switcher-dropdown">
          {THEME_OPTIONS.map((theme) => (
            <button
              key={theme.name}
              className={optionClassName(activeTheme === theme.name)}
              onClick={() => handleSelect(theme)}
              type="button"
            >
              <span className="theme-switcher-swatch" style={{ backgroundColor: theme.swatch }} />
              <span className="theme-switcher-name">{theme.label}</span>
              {activeTheme === theme.name && (
                <span className="theme-switcher-check">{'\u2713'}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
