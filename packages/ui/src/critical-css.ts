import type { BuiltInThemeName } from '@zpress/config'

/**
 * Critical CSS injected inline in <head> to prevent FOUC.
 *
 * Contains only the :root fallback variables needed for initial paint.
 * Full theme CSS loads asynchronously from external stylesheet.
 *
 * These values must match the :root blocks in theme CSS files but are
 * duplicated here for inline injection during SSG build.
 */

const BASE_CRITICAL_CSS = `:root{--zp-c-brand-1:#a78bfa;--zp-c-brand-2:#8b5cf6;--zp-c-brand-3:#7c3aed;--zp-c-brand-soft:rgba(167,139,250,0.14);--zp-c-bg:#ffffff;--zp-c-bg-alt:#f9f9f9;--zp-c-bg-elv:#f5f5f5;--zp-c-bg-soft:#f0f0f0;--zp-c-bg-icon:#cccccc;--zp-c-text-1:#1a1a1a;--zp-c-text-2:rgba(26,26,26,0.72);--zp-c-text-3:rgba(26,26,26,0.48);--zp-c-divider:#e2e2e2;--zp-c-border:#d0d0d0;--zp-c-gutter:#f5f5f5;--zp-code-block-bg:#f5f5f5;--zp-button-brand-bg:#7c3aed;--zp-button-brand-hover-bg:#8b5cf6;--zp-button-brand-active-bg:#6d28d9;--zp-button-brand-text:#ffffff;--rp-c-brand:#a78bfa;--rp-c-brand-light:#c4b5fd;--rp-c-brand-lighter:#ddd6fe;--rp-c-brand-dark:#8b5cf6;--rp-c-brand-darker:#7c3aed;--rp-c-brand-tint:rgba(167,139,250,0.14);--rp-home-background-bg:#fff;--rp-c-bg:#ffffff;--rp-c-bg-soft:#f0f0f0;--rp-c-text-1:#1a1a1a;--rp-c-text-2:rgba(26,26,26,0.72);--rp-c-text-3:rgba(26,26,26,0.48);--rp-c-divider:#e2e2e2}html,body{background-color:var(--zp-c-bg);color:var(--zp-c-text-1)}`

const MIDNIGHT_CRITICAL_CSS = `:root{--zp-c-brand-1:#60a5fa;--zp-c-brand-2:#3b82f6;--zp-c-brand-3:#2563eb;--zp-c-brand-soft:rgba(96,165,250,0.14);--zp-c-bg:#0a0e1a;--zp-c-bg-alt:#0d1120;--zp-c-bg-elv:#111523;--zp-c-bg-soft:#141829;--zp-c-bg-icon:#2d3548;--zp-c-text-1:#e8edf5;--zp-c-text-2:rgba(232,237,245,0.72);--zp-c-text-3:rgba(232,237,245,0.48);--zp-c-divider:#1a1f2e;--zp-c-border:#252a3a;--zp-c-gutter:#0d1120;--zp-code-block-bg:#0d1120;--zp-button-brand-bg:#2563eb;--zp-button-brand-hover-bg:#3b82f6;--zp-button-brand-active-bg:#1d4ed8;--zp-button-brand-text:#e8edf5;--rp-c-brand:#60a5fa;--rp-c-brand-light:#93c5fd;--rp-c-brand-lighter:#bfdbfe;--rp-c-brand-dark:#3b82f6;--rp-c-brand-darker:#2563eb;--rp-c-brand-tint:rgba(96,165,250,0.14);--rp-home-background-bg:#0a0e1a;--rp-c-bg:#0a0e1a;--rp-c-bg-soft:#141829;--rp-c-text-1:#e8edf5;--rp-c-text-2:rgba(232,237,245,0.72);--rp-c-text-3:rgba(232,237,245,0.48);--rp-c-divider:#1a1f2e}html,body{background-color:var(--zp-c-bg);color:var(--zp-c-text-1)}`

const ARCADE_CRITICAL_CSS = `:root{--zp-c-brand-1:#f472b6;--zp-c-brand-2:#ec4899;--zp-c-brand-3:#db2777;--zp-c-brand-soft:rgba(244,114,182,0.14);--zp-c-bg:#fef7fb;--zp-c-bg-alt:#fef3f9;--zp-c-bg-elv:#fdeef7;--zp-c-bg-soft:#fce9f4;--zp-c-bg-icon:#f9d5ea;--zp-c-text-1:#1a0a14;--zp-c-text-2:rgba(26,10,20,0.72);--zp-c-text-3:rgba(26,10,20,0.48);--zp-c-divider:#fce0f0;--zp-c-border:#fad0e8;--zp-c-gutter:#fef3f9;--zp-code-block-bg:#fef3f9;--zp-button-brand-bg:#db2777;--zp-button-brand-hover-bg:#ec4899;--zp-button-brand-active-bg:#be185d;--zp-button-brand-text:#fef7fb;--rp-c-brand:#f472b6;--rp-c-brand-light:#f9a8d4;--rp-c-brand-lighter:#fbcfe8;--rp-c-brand-dark:#ec4899;--rp-c-brand-darker:#db2777;--rp-c-brand-tint:rgba(244,114,182,0.14);--rp-home-background-bg:#fef7fb;--rp-c-bg:#fef7fb;--rp-c-bg-soft:#fce9f4;--rp-c-text-1:#1a0a14;--rp-c-text-2:rgba(26,10,20,0.72);--rp-c-text-3:rgba(26,10,20,0.48);--rp-c-divider:#fce0f0}html,body{background-color:var(--zp-c-bg);color:var(--zp-c-text-1)}`

const CRITICAL_CSS_MAP: Record<BuiltInThemeName, string> = {
  base: BASE_CRITICAL_CSS,
  midnight: MIDNIGHT_CRITICAL_CSS,
  arcade: ARCADE_CRITICAL_CSS,
  'arcade-fx': ARCADE_CRITICAL_CSS,
}

/**
 * Generate minified critical CSS for a given built-in theme.
 *
 * Returns an empty string for custom themes (non built-in) to avoid
 * injecting incorrect colors. Custom themes should provide their own
 * :root fallback in their external CSS.
 */
export function getCriticalCss(themeName: string): string {
  const theme = themeName as BuiltInThemeName
  const css = CRITICAL_CSS_MAP[theme]
  if (!css) {
    return ''
  }
  return css
}
