import React, { useEffect, useRef } from 'react'

import './branch-tag.css'
import { Icon } from '../shared/icon.tsx'

declare const __ZPRESS_GIT_BRANCH__: string | undefined

/**
 * Resolves the current git branch name from the build-time global,
 * returning an empty string when undefined.
 */
function resolveBranch(): string {
  if (__ZPRESS_GIT_BRANCH__ !== undefined) {
    return __ZPRESS_GIT_BRANCH__
  }
  return ''
}

/**
 * Git branch tag — pill-shaped badge positioned in the nav bar.
 * Hidden when on `main` (production). Uses the pixelarticons:git-branch icon.
 */
export function BranchTag(): React.ReactElement | null {
  const branch = resolveBranch()
  const rootRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!branch || branch === 'main' || !rootRef.current) {
      return
    }

    const node = rootRef.current

    // Relocate into the search container so it sits beside the search button.
    // No Rspress API exists for injecting into the nav bar, so direct DOM
    // manipulation is the only option for this placement.
    const searchContainer = document.querySelector('.rspress-nav-search')
    if (searchContainer) {
      searchContainer.append(node)
    }

    return () => {
      node.remove()
    }
  }, [branch])

  if (!branch || branch === 'main') {
    return null
  }

  return (
    <a
      className="branch-tag"
      ref={rootRef}
      href={`https://github.com/joggrdocs/zpress/tree/${branch}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`Branch: ${branch}`}
    >
      <Icon icon="pixelarticons:git-branch" width={14} height={14} />
      <span className="branch-tag-text">{branch}</span>
    </a>
  )
}

export { BranchTag as default }
