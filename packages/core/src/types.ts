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
  ColorMode,
  ThemeColors,
  ThemeConfig,
  Frontmatter,
  NavItem,
  CardConfig,
  WorkspaceItem,
  WorkspaceGroup,
  Entry,
  ResolvedPage,
  ResolvedSection,
  OpenAPIConfig,
  Feature,
  Paths,
  Result,
} from '@zpress/config'
