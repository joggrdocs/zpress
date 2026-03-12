import type React from 'react'

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
 * Git branch tag — pill-shaped badge rendered via the `beforeNavMenu`
 * layout slot. Hidden when on `main` (production).
 * Uses the pixelarticons:git-branch icon.
 */
export function BranchTag(): React.ReactElement | null {
  const branch = resolveBranch()

  if (!branch || branch === 'main') {
    return null
  }

  return (
    <a
      className="branch-tag"
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
