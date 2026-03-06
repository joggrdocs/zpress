import type React from 'react'

export interface SectionGridProps {
  readonly children: React.ReactNode
}

/**
 * Grid container for section cards on landing pages.
 */
export function SectionGrid({ children }: SectionGridProps): React.ReactElement {
  return <div className="section-grid">{children}</div>
}
