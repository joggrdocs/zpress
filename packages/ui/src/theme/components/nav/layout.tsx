import { Layout as OriginalLayout } from '@rspress/core/theme-original'
import type React from 'react'
import { useEffect, useState } from 'react'

import { BranchTag } from './branch-tag'
import { ThemeSwitcher } from './theme-switcher'
import { VscodeTag } from './vscode-tag'

const VSCODE_OVERRIDES = `
/* Hide left sidebar and its placeholder */
html[data-zpress-env="vscode"] .rp-doc-layout__sidebar {
  display: none;
}
html[data-zpress-env="vscode"] .rp-doc-layout__sidebar-placeholder {
  display: none;
}

/* Hide right TOC and its placeholder */
html[data-zpress-env="vscode"] .rp-doc-layout__outline {
  display: none;
}
html[data-zpress-env="vscode"] .rp-doc-layout__outline-placeholder {
  display: none;
}

/* Center content at 1200px max */
html[data-zpress-env="vscode"] .rp-doc-layout__doc {
  max-width: 1200px;
  margin: 0 auto;
}

/* Hide nav items, social links, hamburger */
html[data-zpress-env="vscode"] .rp-nav-menu__item {
  display: none;
}
html[data-zpress-env="vscode"] .rp-social-links {
  display: none;
}
html[data-zpress-env="vscode"] .rp-nav-hamburger {
  display: none;
}

/* Hide mobile navigation elements */
html[data-zpress-env="vscode"] .rp-nav-screen {
  display: none;
}
html[data-zpress-env="vscode"] .rp-nav-screen-menu {
  display: none;
}
html[data-zpress-env="vscode"] .rp-local-nav {
  display: none;
}
html[data-zpress-env="vscode"] .rp-appearance {
  display: none;
}
html[data-zpress-env="vscode"] .rp-doc-layout__menu {
  display: none;
}
`

function useVscodeMode(): boolean {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search)
    const isVscode =
      params.get('env') === 'vscode' || globalThis.sessionStorage.getItem('zpress-env') === 'vscode'

    if (!isVscode) {
      return
    }

    globalThis.sessionStorage.setItem('zpress-env', 'vscode')
    setActive(true)
    document.documentElement.dataset.zpressEnv = 'vscode'

    const style = document.createElement('style')
    style.textContent = VSCODE_OVERRIDES
    document.head.append(style)
    return () => {
      style.remove()
      delete document.documentElement.dataset.zpressEnv
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
