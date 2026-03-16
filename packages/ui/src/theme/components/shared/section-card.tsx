import type React from 'react'
import { match, P } from 'ts-pattern'

import type { IconColor } from '../home/feature-card'
import { Card } from './card'
import { Icon } from './icon'

export interface SectionCardProps {
  readonly href: string
  readonly title: string
  readonly description?: string
  readonly icon?: string
  readonly iconColor?: IconColor
}

/**
 * Section card — simple icon + title + description link card
 * used on auto-generated section landing pages.
 */
export function SectionCard({
  href,
  title,
  description,
  icon = 'pixelarticons:file',
  iconColor = 'purple',
}: SectionCardProps): React.ReactElement {
  const descEl = match(description)
    .with(P.nonNullable, (d) => <span className="section-desc">{d}</span>)
    .otherwise(() => null)

  return (
    <Card href={href} className="section-card">
      <div className="section-header">
        <span className={`section-icon section-icon--${iconColor}`}>
          <Icon icon={icon} />
        </span>
        <span className="section-title">{title}</span>
      </div>
      {descEl}
    </Card>
  )
}
