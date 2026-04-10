import type React from 'react'
import { match } from 'ts-pattern'

export type BadgeVariant =
  | 'new'
  | 'beta'
  | 'deprecated'
  | 'experimental'
  | 'stable'
  | 'info'
  | 'warning'

export interface BadgeProps {
  /**
   * Visual variant controlling color and semantics.
   * Defaults to 'info'.
   */
  readonly variant?: BadgeVariant
  /**
   * Badge label text.
   */
  readonly children: React.ReactNode
}

/**
 * Inline badge for marking features, API endpoints,
 * or documentation sections with status or category labels.
 *
 * @param props - Badge variant and label content
 * @returns React element with styled inline badge
 */
export function Badge({ variant = 'info', children }: BadgeProps): React.ReactElement {
  const className = match(variant)
    .with('new', () => 'zp-status-badge zp-status-badge--new')
    .with('beta', () => 'zp-status-badge zp-status-badge--beta')
    .with('deprecated', () => 'zp-status-badge zp-status-badge--deprecated')
    .with('experimental', () => 'zp-status-badge zp-status-badge--experimental')
    .with('stable', () => 'zp-status-badge zp-status-badge--stable')
    .with('info', () => 'zp-status-badge zp-status-badge--info')
    .with('warning', () => 'zp-status-badge zp-status-badge--warning')
    .exhaustive()

  return <span className={className}>{children}</span>
}
