import { Layout as OriginalLayout } from '@rspress/core/theme-original'
import type React from 'react'
import { useEffect, useState } from 'react'

import { BranchTag } from './branch-tag'
import { ThemeSwitcher } from './theme-switcher'
import { VscodeTag } from './vscode-tag'

/**
 * Detect vscode mode synchronously from sessionStorage and URL params.
 * Returns false during SSR — client initializes correctly via lazy useState.
 */
function readVscodeMode(): boolean {
  if (globalThis.window === undefined) {
    return false
  }
  const params = new URLSearchParams(globalThis.location.search)
  return (
    params.get('env') === 'vscode' || globalThis.sessionStorage.getItem('zpress-env') === 'vscode'
  )
}

/**
 * Returns true when the page is loaded in VS Code preview mode.
 *
 * Initializes synchronously from sessionStorage/URL so the VscodeTag
 * renders in the same paint as the rest of the nav. The data-zpress-env
 * attribute and static vscode.css are applied by the inline head script
 * before React mounts, so no dynamic style injection is needed here.
 */
function useVscodeMode(): boolean {
  const [active] = useState<boolean>(readVscodeMode)

  useEffect(() => {
    if (!active) {
      return
    }
    sessionStorage.setItem('zpress-env', 'vscode')
  }, [active])

  return active
}

/**
 * Custom Layout override for zpress.
 * Wraps the original Rspress Layout and injects BranchTag
 * into `beforeNavMenu` and ThemeSwitcher into `afterNavMenu`.
 */
export function Layout(): React.ReactElement {
  const vscode = useVscodeMode()
  const navSlot = (() => {
    if (vscode) {
      return (
        <>
          <BranchTag />
          <VscodeTag />
        </>
      )
    }
    return <BranchTag />
  })()
  return <OriginalLayout beforeNavMenu={navSlot} afterNavMenu={<ThemeSwitcher />} />
}
