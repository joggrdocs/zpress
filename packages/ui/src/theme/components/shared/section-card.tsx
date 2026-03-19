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
 *
 * @param props - Props with href, title, optional description, icon, and iconColor
 * @returns React element with a linked section card
 */
export function SectionCard({
  href,
  title,
  description,
  icon = 'pixelarticons:file',
  iconColor = 'purple',
}: SectionCardProps): React.ReactElement {
  const descEl = match(description)
    .with(P.nonNullable, (d) => <span className="zp-section-card__desc">{d}</span>)
    .otherwise(() => null)

  return (
    <Card href={href} className="zp-section-card">
      <div className="zp-section-card__header">
        <span className={`zp-section-card__icon zp-section-card__icon--${iconColor}`}>
          <Icon icon={icon} />
        </span>
        <span className="zp-section-card__title">{title}</span>
      </div>
      {descEl}
    </Card>
  )
}
