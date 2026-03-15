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
  // New base Entry type
  Entry,
  // Section (renamed from old Entry)
  Section,
  // New types from refactor
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
  // Backward compatibility
  WorkspaceItem,
  WorkspaceGroup,
  ResolvedPage,
  ResolvedSection,
  Feature,
  Result,
} from '@zpress/config'
