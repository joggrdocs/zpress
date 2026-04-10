/**
 * zpress Rspress theme entry.
 *
 * Re-exports the default Rspress theme and extends it with
 * zpress-specific components.
 *
 * Global styles are imported here so Rspress includes them
 * in the site bundle when this theme entry is loaded.
 */

// ── Global styles (side-effect imports) ──────────────────────────────
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
import './styles/overrides/badge.css'
// Component styles
import './components/openapi/openapi.css'
import './components/shared/accordion.css'
import './components/shared/columns.css'
import './components/shared/status-badge.css'
import './components/shared/frame.css'
import './components/shared/tooltip.css'
import './components/shared/prompt.css'
import './components/shared/color.css'

// ── Rspress theme re-export ──────────────────────────────────────────
// (theme-original avoids circular resolution when used inside a themeDir)
export * from '@rspress/core/theme-original'

// ── Layout overrides (@internal — required by Rspress theme resolution) ──

/** @internal Rspress layout override — injects zpress nav components via layout slots */
export { Layout } from './components/nav/layout'
/** @internal Home page feature block override */
export { HomeFeature } from './components/home/feature'
/** @internal Home page layout override */
export { HomeLayout } from './components/home/layout'
/** @internal Sidebar override — multi-scope filtering for standalone sections */
export { Sidebar } from './components/sidebar/sidebar-scope'

// ── Cards & Grids ────────────────────────────────────────────────────

export { FeatureCard, FeatureGrid } from './components/home/feature-card'
export type { FeatureCardProps, FeatureItem } from './components/home/feature-card'
export { WorkspaceCard } from './components/workspaces/card'
export type { WorkspaceCardProps } from './components/workspaces/card'
export { WorkspaceGrid } from './components/workspaces/grid'
export type { WorkspaceGridProps } from './components/workspaces/grid'
export { SectionCard } from './components/shared/section-card'
export type { SectionCardProps } from './components/shared/section-card'
export { SectionGrid } from './components/shared/section-grid'
export type { SectionGridProps } from './components/shared/section-grid'

// ── Window Chrome ────────────────────────────────────────────────────

export { DesktopWindow } from './components/shared/desktop-window'
export type { DesktopWindowProps, WindowTab } from './components/shared/desktop-window'
export { BrowserWindow } from './components/shared/desktop-window'
export type { BrowserWindowProps, BrowserTab } from './components/shared/desktop-window'
export { IDEWindow } from './components/shared/desktop-window'
export type { IDEWindowProps, IDEFileTab } from './components/shared/desktop-window'
export { TerminalWindow, Command, Output, Line } from './components/shared/desktop-window'
export type {
  TerminalWindowProps,
  TerminalColor,
  TerminalLineConfig,
  CommandProps,
  OutputProps,
  LineProps,
} from './components/shared/desktop-window'

// ── Content Components ───────────────────────────────────────────────

export { Accordion, AccordionGroup } from './components/shared/accordion'
export type { AccordionProps, AccordionGroupProps } from './components/shared/accordion'
export { Columns, Column } from './components/shared/columns'
export type { ColumnsProps, ColumnProps } from './components/shared/columns'
export { Badge } from './components/shared/status-badge'
export type { BadgeProps, BadgeVariant } from './components/shared/status-badge'
export { Frame } from './components/shared/frame'
export type { FrameProps } from './components/shared/frame'
export { Tooltip } from './components/shared/tooltip'
export type { TooltipProps } from './components/shared/tooltip'
export { Prompt } from './components/shared/prompt'
export type { PromptProps } from './components/shared/prompt'
export { Color } from './components/shared/color'
export type { ColorProps } from './components/shared/color'

// ── OpenAPI (framework-generated — advanced use only) ────────────────

export { CopyMarkdownButton } from './components/openapi'
export type { CopyMarkdownButtonProps } from './components/openapi'
export { OpenAPIOperation } from './components/openapi'
export type { OpenAPIOperationProps } from './components/openapi'
export { OpenAPIOverview } from './components/openapi'
export type { OpenAPIOverviewProps } from './components/openapi'

// ── Utilities ────────────────────────────────────────────────────────

export { Icon } from './components/shared/icon'
export { TechTag } from './components/shared/tech-tag'
export type { TechTagProps } from './components/shared/tech-tag'
export { TechIconTable } from './components/shared/tech-icon-table'
export type { TechIconEntry, TechIconTableProps } from './components/shared/tech-icon-table'
