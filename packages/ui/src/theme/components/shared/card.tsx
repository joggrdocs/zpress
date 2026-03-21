import { Link } from '@rspress/core/runtime'
import type React from 'react'
import { match, P } from 'ts-pattern'

export interface CardProps {
  readonly href?: string
  readonly className?: string
  readonly children: React.ReactNode
}

/**
 * Shared base card handling link-vs-div rendering.
 * Renders `<a>` with `zp-card--clickable` when `href` is provided,
 * plain `<div>` otherwise.
 *
 * @param props - Props with optional href, optional className, and children
 * @returns React element rendered as an anchor or div
 */
export function Card({ href, className, children }: CardProps): React.ReactElement {
  return match(href)
    .with(P.nonNullable, (h) => (
      <Link className={`zp-card zp-card--clickable ${className ?? ''}`} to={h}>
        {children}
      </Link>
    ))
    .otherwise(() => <div className={`zp-card ${className ?? ''}`}>{children}</div>)
}
