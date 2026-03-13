import type React from 'react'

import './vscode-tag.css'
import { Icon } from '../shared/icon.tsx'

/**
 * VS Code mode indicator — pill-shaped badge rendered next to the
 * BranchTag when the page is loaded inside the VS Code webview
 * (detected via `?env=vscode` query parameter).
 */
export function VscodeTag(): React.ReactElement {
  return (
    <span className="vscode-tag" title="VS Code preview mode" aria-label="VS Code preview mode">
      <Icon icon="vscode-icons:file-type-vscode" width={14} height={14} />
      <span className="vscode-tag-text">vscode</span>
    </span>
  )
}
