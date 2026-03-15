/**
 * zpress Rspress theme entry.
 *
 * Re-exports the default Rspress theme and extends it with
 * zpress-specific components (branch tag, feature cards).
 *
 * Global styles are imported here so Rspress includes them
 * in the site bundle when this theme entry is loaded.
 */

// Global override styles — imported for side-effects
import './styles/overrides/fonts.css'
import './styles/overrides/tokens.css'
import './styles/overrides/rspress.css'
// Theme color palettes — scoped via [data-zp-theme] selectors
import './styles/themes/base.css'
import './styles/themes/midnight.css'
import './styles/themes/arcade.css'
// arcade-fx.css is intentionally separate from arcade.css:
// arcade.css = color palette tokens, arcade-fx.css = visual effects
// (border trace, neon pulse, CRT scanlines, etc.) scoped to [data-zp-theme='arcade']
import './styles/themes/arcade-fx.css'
import './styles/overrides/details.css'
import './styles/overrides/scrollbar.css'
import './styles/overrides/sidebar.css'
import './styles/overrides/home.css'
import './styles/overrides/home-card.css'
import './styles/overrides/section-card.css'
import './styles/overrides/vscode.css'

// Re-export everything from the original Rspress theme
// (theme-original avoids circular resolution when used inside a themeDir)
export * from '@rspress/core/theme-original'

// Layout override — inject zpress nav components via layout slots
export { Layout } from './components/nav/layout'

// zpress components
export { FeatureCard, FeatureGrid } from './components/home/feature-card'
export type { FeatureCardProps, FeatureItem, IconColor } from './components/home/feature-card'
export { WorkspaceCard } from './components/workspaces/card'
export type { WorkspaceCardProps } from './components/workspaces/card'
export { WorkspaceGrid } from './components/workspaces/grid'
export type { WorkspaceGridProps } from './components/workspaces/grid'

export { SectionCard } from './components/shared/section-card'
export type { SectionCardProps } from './components/shared/section-card'
export { SectionGrid } from './components/shared/section-grid'
export type { SectionGridProps } from './components/shared/section-grid'
export { TechTag } from './components/shared/tech-tag'
export type { TechTagProps } from './components/shared/tech-tag'
export { TechIconTable } from './components/shared/tech-icon-table'
export type { TechIconEntry, TechIconTableProps } from './components/shared/tech-icon-table'
export { Icon } from './components/shared/icon'
export { BrowserWindow } from './components/shared/browser-window'
export type { BrowserWindowProps } from './components/shared/browser-window'

// Home page overrides — shadow the wildcard re-exports from theme-original
export { HomeFeature } from './components/home/feature'
export { HomeLayout } from './components/home/layout'
