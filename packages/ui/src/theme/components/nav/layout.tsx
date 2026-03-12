import { Layout as OriginalLayout } from '@rspress/core/theme-original'
import type React from 'react'

import { BranchTag } from './branch-tag'
import { ThemeSwitcher } from './theme-switcher'

/**
 * Custom Layout override for zpress.
 * Wraps the original Rspress Layout and injects BranchTag
 * into `beforeNavMenu` and ThemeSwitcher into `afterNavMenu`.
 */
export function Layout(): React.ReactElement {
  return <OriginalLayout beforeNavMenu={<BranchTag />} afterNavMenu={<ThemeSwitcher />} />
}
