import { Layout as OriginalLayout } from '@rspress/core/theme-original'
import type React from 'react'
import { match } from 'ts-pattern'

import { useZpress } from '../../hooks/use-zpress'
import { SiteFooter } from '../footer/site-footer'
import { SidebarLinks } from '../sidebar/sidebar-links'
import { BranchTag } from './branch-tag'
import { ThemeSwitcher } from './theme-switcher'
import { VscodeTag } from './vscode-tag'

declare const __ZPRESS_VSCODE__: boolean

/**
 * Custom Layout override for zpress.
 * Wraps the original Rspress Layout and injects BranchTag
 * into `beforeNavMenu` and ThemeSwitcher into `afterNavMenu`.
 * Sidebar above/below links are injected via `beforeSidebar`/`afterSidebar`.
 *
 * @returns React element with the custom layout
 */
export function Layout(): React.ReactElement {
  const { sidebarAbove, sidebarBelow } = useZpress()
  const navSlot = match(__ZPRESS_VSCODE__)
    .with(true, () => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BranchTag />
        <VscodeTag />
      </div>
    ))
    .otherwise(() => <BranchTag />)

  const aboveItems = sidebarAbove ?? []
  const belowItems = sidebarBelow ?? []

  const beforeSidebar = match(aboveItems.length > 0)
    .with(true, () => <SidebarLinks items={aboveItems} position="above" />)
    .otherwise(() => null)
  const afterSidebar = match(belowItems.length > 0)
    .with(true, () => <SidebarLinks items={belowItems} position="below" />)
    .otherwise(() => null)

  return (
    <OriginalLayout
      beforeNavMenu={navSlot}
      afterNavMenu={<ThemeSwitcher />}
      beforeSidebar={beforeSidebar}
      afterSidebar={afterSidebar}
      bottom={<SiteFooter />}
    />
  )
}
