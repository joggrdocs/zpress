import { Layout as OriginalLayout } from '@rspress/core/theme-original'
import type React from 'react'

import { BranchTag } from './branch-tag'

/**
 * Custom Layout override for zpress.
 * Wraps the original Rspress Layout and injects the BranchTag
 * into the `beforeNavMenu` slot so it renders before the search
 * bar in the navbar on all page types.
 */
export function Layout(): React.ReactElement {
  return <OriginalLayout beforeNavMenu={<BranchTag />} />
}
