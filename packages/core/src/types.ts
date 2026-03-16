/**
 * Re-export all types from @zpress/config for backwards compatibility.
 *
 * This allows existing imports in the core package to continue working
 * while the canonical types are now defined in @zpress/config.
 */

export type {
  ZpressConfig,
  ThemeName,
  IconColor,
  IconId,
  IconConfig,
  ColorMode,
  ThemeColors,
  ThemeConfig,
  Frontmatter,
  NavItem,
  CardConfig,
  Section,
  Workspace,
  WorkspaceCategory,
  TitleConfig,
  Discovery,
  RecursiveDiscoveryConfig,
  FlatDiscoveryConfig,
  SeoConfig,
  HeroAction,
  SidebarConfig,
  SidebarLink,
  ResolvedPage,
  ResolvedSection,
  Feature,
  OpenAPIConfig,
  Result,
} from '@zpress/config'
