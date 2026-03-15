import type React from 'react'

// ── Types ────────────────────────────────────────────────────

export interface MethodBadgeProps {
  /**
   * HTTP method name (get, post, put, patch, delete, etc.).
   */
  readonly method: string
}

// ── Component ────────────────────────────────────────────────

/**
 * Colored badge for an HTTP method.
 *
 * Maps the method string to a BEM modifier class that applies
 * the corresponding `--zp-oas-*` color token.
 */
export function MethodBadge({ method }: MethodBadgeProps): React.ReactElement {
  const normalized = method.toLowerCase()
  return (
    <span className={`zp-oas-method-badge zp-oas-method-badge--${normalized}`}>{normalized}</span>
  )
}
