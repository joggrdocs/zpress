import type React from 'react'
import { match, P } from 'ts-pattern'

// ── Types ────────────────────────────────────────────────────

export interface SecurityBadgesProps {
  /**
   * Security requirement objects from the OpenAPI operation.
   */
  readonly securities: Record<string, unknown>
}

// ── Helpers ──────────────────────────────────────────────────

function LockIcon(): React.ReactElement {
  return (
    <svg
      className="zp-oas-security__lock"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ── Component ────────────────────────────────────────────────

/**
 * Renders badges for each security scheme required by an operation.
 *
 * Displays a lock icon alongside the scheme name.
 */
export function SecurityBadges({ securities }: SecurityBadgesProps): React.ReactElement {
  const keys = Object.keys(securities)

  const content = match(keys)
    .with(
      P.when((k): k is string[] => k.length > 0),
      (k) => (
        <div className="zp-oas-security">
          <div className="zp-oas-security__title">Authentication</div>
          <div className="zp-oas-security__list">
            {k.map((name) => (
              <span key={name} className="zp-oas-security__badge">
                <LockIcon />
                {name}
              </span>
            ))}
          </div>
        </div>
      )
    )
    .otherwise(() => <div />)

  return content
}
