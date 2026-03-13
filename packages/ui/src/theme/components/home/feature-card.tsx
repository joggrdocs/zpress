import type { IconColor } from '@zpress/core'
import type React from 'react'
import { match, P } from 'ts-pattern'

import './feature-card.css'
import { Card } from '../shared/card'

export type { IconColor } from '@zpress/core'

export interface FeatureCardProps {
  readonly title: string
  readonly description: string
  readonly href?: string
  readonly icon?: React.ReactNode
  readonly iconColor?: IconColor
  readonly span?: 2 | 3 | 4 | 6
}

/**
 * Frontmatter-shaped data for consumers to map from.
 */
export interface FeatureItem {
  readonly title: string
  readonly details: string
  readonly link?: string
  readonly icon?: string
  readonly iconColor?: IconColor
  readonly span?: 2 | 3 | 4 | 6
}

/**
 * Feature card for landing pages — matches the workspace/section card design.
 * Renders as `<a>` when `href` is provided, `<div>` otherwise.
 */
export function FeatureCard({
  title,
  description,
  href,
  icon,
  iconColor = 'purple',
  span = 4,
}: FeatureCardProps): React.ReactElement {
  const iconEl = match(icon)
    .with(P.nonNullable, (ic) => (
      <span className={`home-card-icon home-card-icon--${iconColor}`}>{ic}</span>
    ))
    .otherwise(() => null)

  return (
    <div className={`feature-card__item feature-card__item--span-${span}`}>
      <div className="feature-card__item-wrapper">
        <Card href={href} className="feature-card">
          <div className="feature-header">
            {iconEl}
            <span className="feature-title">{title}</span>
          </div>
          <span className="feature-desc">{description}</span>
        </Card>
      </div>
    </div>
  )
}

interface FeatureGridProps {
  readonly children: React.ReactNode
}

/**
 * Flex-wrap layout container for feature cards.
 */
export function FeatureGrid({ children }: FeatureGridProps): React.ReactElement {
  return <div className="feature-grid">{children}</div>
}
