import { HomeLayout as OriginalHomeLayout } from '@rspress/core/theme-original'
import type React from 'react'

import { HomeWorkspaces } from './workspaces'

// ── Types ────────────────────────────────────────────────────

interface HomeLayoutProps {
  readonly beforeHero?: React.ReactNode
  readonly afterHero?: React.ReactNode
  readonly beforeFeatures?: React.ReactNode
  readonly afterFeatures?: React.ReactNode
  readonly beforeHeroActions?: React.ReactNode
  readonly afterHeroActions?: React.ReactNode
}

// ── Component ────────────────────────────────────────────────

/**
 * Custom HomeLayout override for zpress.
 * Wraps the original Rspress HomeLayout and injects HomeWorkspaces
 * into the afterFeatures slot.
 */
export function HomeLayout(props: HomeLayoutProps): React.ReactElement {
  return (
    <OriginalHomeLayout
      {...props}
      afterFeatures={
        <>
          {props.afterFeatures}
          <HomeWorkspaces />
        </>
      }
    />
  )
}
