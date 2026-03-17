import type React from 'react'

import './card.css'

export interface WorkspaceGridProps {
  /**
   * Section heading (e.g. "Apps", "Packages").
   */
  readonly heading: string
  /**
   * Brief description rendered below the heading.
   */
  readonly description: string
  /**
   * WorkspaceCard elements.
   */
  readonly children: React.ReactNode
}

/**
 * Grid container for workspace cards — renders a heading, description,
 * and a CSS grid wrapping its children.
 *
 * @param props - Props with heading, description, and children workspace cards
 * @returns React element with heading, description, and grid layout
 */
export function WorkspaceGrid({
  heading,
  description,
  children,
}: WorkspaceGridProps): React.ReactElement {
  return (
    <>
      <h2>{heading}</h2>
      <p className="workspace-group-desc">{description}</p>
      <div className="workspace-grid">{children}</div>
    </>
  )
}
