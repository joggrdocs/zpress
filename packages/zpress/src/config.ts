/**
 * zpress/config — lightweight entrypoint for zpress.config.ts files.
 *
 * Only exports what's needed to define a config. This keeps the config file's
 * dependency footprint minimal — no sync engine, no path constants.
 *
 * @example
 * ```ts
 * // zpress.config.ts
 * import { defineConfig } from 'zpress/config'
 *
 * export default defineConfig({
 *   title: 'My Docs',
 *   sections: [ ... ],
 * })
 * ```
 */
export { defineConfig } from '@zpress/core'

export type {
  ZpressConfig,
  Entry,
  Feature,
  WorkspaceItem,
  WorkspaceGroup,
  Frontmatter,
  NavItem,
  CardConfig,
  IconConfig,
  IconColor,
  IconId,
  SidebarConfig,
  SidebarLink,
} from '@zpress/core'
