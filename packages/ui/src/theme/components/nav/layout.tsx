import { Layout as OriginalLayout } from '@rspress/core/theme-original'
import type React from 'react'
import { useEffect, useState } from 'react'
import { match } from 'ts-pattern'

import { useZpress } from '../../hooks/use-zpress'
import { SiteFooter } from '../footer/site-footer'
import { SidebarLinks } from '../sidebar/sidebar-links'
import { BranchTag } from './branch-tag'
import { ThemeSwitcher } from './theme-switcher'
import { VscodeTag } from './vscode-tag'

/**
 * Custom Layout override for zpress.
 * Wraps the original Rspress Layout and injects BranchTag
 * into `beforeNavMenu` and ThemeSwitcher into `afterNavMenu`.
 * Sidebar above/below links are injected via `beforeSidebar`/`afterSidebar`.
 *
 * @returns React element with the custom layout
 */
export function Layout(): React.ReactElement {
  const vscode = useVscodeMode()
  const { sidebarAbove, sidebarBelow } = useZpress()
  const navSlot = match(vscode)
    .with(true, () => (
      <>
        <BranchTag />
        <VscodeTag />
      </>
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

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Detect vscode mode synchronously from sessionStorage and URL params.
 * Returns false during SSR — client initializes correctly via lazy useState.
 *
 * @private
 * @returns True if running in VS Code preview mode
 */
function readVscodeMode(): boolean {
  if (globalThis.window === undefined) {
    return false
  }
  try {
    const params = new URLSearchParams(globalThis.location.search)
    return (
      params.get('env') === 'vscode' || globalThis.sessionStorage.getItem('zpress-env') === 'vscode'
    )
  } catch {
    return false
  }
}

/**
 * Returns true when the page is loaded in VS Code preview mode.
 *
 * Initializes synchronously from sessionStorage/URL so the VscodeTag
 * renders in the same paint as the rest of the nav. The data-zpress-env
 * attribute and static vscode.css are applied by the inline head script
 * before React mounts, so no dynamic style injection is needed here.
 *
 * @private
 * @returns True if running in VS Code preview mode
 */
function useVscodeMode(): boolean {
  const [active] = useState<boolean>(readVscodeMode)

  // Persist vscode mode across SPA route changes — the inline head script
  // sets sessionStorage on first load via URL param, but client-side
  // navigation may lose the param. This ensures the flag survives.
  useEffect(() => {
    if (!active) {
      return
    }
    try {
      sessionStorage.setItem('zpress-env', 'vscode')
    } catch {
      // sessionStorage may be blocked in some environments
    }
  }, [active])

  return active
}
