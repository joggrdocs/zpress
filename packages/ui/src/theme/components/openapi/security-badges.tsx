import type React from 'react'
import { match, P } from 'ts-pattern'

// ── Types ────────────────────────────────────────────────────

export interface SecurityBadgesProps {
  /**
   * Security requirement objects from the OpenAPI operation.
   * Each entry is an alternative (OR); schemes within an entry are combined (AND).
   */
  readonly securities: readonly Record<string, unknown>[]
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

function formatSchemes(requirement: Record<string, unknown>): string {
  return Object.entries(requirement)
    .map(([name, scopes]) => {
      const scopeSuffix = match(scopes)
        .with(
          P.when((s): s is readonly string[] => Array.isArray(s) && s.length > 0),
          (s) => ` (${s.join(', ')})`
        )
        .otherwise(() => '')
      return `${name}${scopeSuffix}`
    })
    .join(' + ')
}

// ── Component ────────────────────────────────────────────────

/**
 * Renders badges for each security requirement of an operation.
 *
 * Each requirement is an alternative (OR). Schemes within a single
 * requirement are combined (AND). OAuth scopes are shown in parentheses.
 */
export function SecurityBadges({ securities }: SecurityBadgesProps): React.ReactElement | null {
  return match(securities)
    .with(
      P.when((s): s is readonly Record<string, unknown>[] => s.length > 0),
      (s) => (
        <div className="zp-oas-security">
          <div className="zp-oas-security__title">Authentication</div>
          <div className="zp-oas-security__list">
            {s.map((requirement, idx) => (
              <span key={String(idx)} className="zp-oas-security__badge">
                <LockIcon />
                {formatSchemes(requirement)}
              </span>
            ))}
          </div>
        </div>
      )
    )
    .otherwise(() => null)
}
