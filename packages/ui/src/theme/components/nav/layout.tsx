import { Layout as OriginalLayout } from '@rspress/core/theme-original'
import type React from 'react'
import { useEffect, useState } from 'react'

import { BranchTag } from './branch-tag'
import { ThemeSwitcher } from './theme-switcher'
import { VscodeTag } from './vscode-tag'

const VSCODE_OVERRIDES = [
  /* Hide left sidebar and its placeholder */
  '.rp-doc-layout__sidebar { display: none !important; }',
  '.rp-doc-layout__sidebar-placeholder { display: none !important; }',
  /* Hide right TOC and its placeholder */
  '.rp-doc-layout__outline { display: none !important; }',
  '.rp-doc-layout__outline-placeholder { display: none !important; }',
  /* Center content at 1200px max */
  '.rp-doc-layout__doc { max-width: 1200px !important; margin: 0 auto !important; }',
  /* Hide nav items, social links, hamburger */
  '.rp-nav-menu__item { display: none !important; }',
  '.rp-social-links { display: none !important; }',
  '.rp-nav-hamburger { display: none !important; }',
].join('\n')

function useVscodeMode(): boolean {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search)
    if (params.get('env') !== 'vscode') {
      return
    }

    setActive(true)
    document.documentElement.dataset.zpressEnv = 'vscode'

    const style = document.createElement('style')
    style.textContent = VSCODE_OVERRIDES
    document.head.append(style)
    return () => {
      style.remove()
    }
  }, [])

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
