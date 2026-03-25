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
  HeroAction,
  SidebarConfig,
  SidebarLink,
  ResolvedPage,
  ResolvedSection,
  Feature,
  OpenAPIConfig,
  Result,
} from '@zpress/config'

/**
 * Convert an unknown caught value to an `Error` instance.
 *
 * @param error - The unknown value from a catch clause
 * @returns An `Error` instance
 */
// TODO: replace with shared toError util (https://github.com/joggrdocs/zpress/issues/73)
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }
  return new Error(String(error))
}
