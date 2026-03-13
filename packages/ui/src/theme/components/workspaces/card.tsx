import type { IconColor } from '@zpress/core'
import type React from 'react'
import { match, P } from 'ts-pattern'

import { Card } from '../shared/card'
import { Icon } from '../shared/icon'
import { TechTag } from '../shared/tech-tag'

// ── Types ────────────────────────────────────────────────────

export interface WorkspaceCardProps {
  /**
   * Display name for the card header.
   */
  readonly title: string
  /**
   * Link target (e.g. "/apps/api").
   */
  readonly href: string
  /**
   * Iconify identifier (e.g. "simple-icons:typescript").
   */
  readonly icon?: string
  /**
   * CSS class suffix for icon background color.
   */
  readonly iconColor?: IconColor
  /**
   * Scope prefix shown above the name (e.g. "apps/").
   */
  readonly scope?: string
  /**
   * Short description rendered below the header.
   */
  readonly description?: string
  /**
   * Technology tag names resolved via the tech map.
   */
  readonly tags?: readonly string[]
  /**
   * Deploy badge image for the card header.
   */
  readonly badge?: { readonly src: string; readonly alt: string }
}

// ── Component ────────────────────────────────────────────────

/**
 * Workspace card — renders a clickable link card with icon, name,
 * description, tech tags, and optional deploy badge.
 */
export function WorkspaceCard({
  title,
  href,
  icon,
  iconColor = 'purple',
  scope,
  description,
  tags,
  badge,
}: WorkspaceCardProps): React.ReactElement {
  const name = title.toLowerCase()

  const iconEl = match(icon)
    .with(P.nonNullable, (id) => <Icon icon={id} />)
    .otherwise(() => null)

  const scopeEl = match(scope)
    .with(
      P.when((s): s is string => s !== undefined && s.length > 0),
      (s) => <span className="workspace-scope">{s}</span>
    )
    .otherwise(() => null)

  const badgeEl = match(badge)
    .with(P.nonNullable, (b) => (
      <span className="deploy-badge" title={`Deployed on ${b.alt}`}>
        <img src={b.src} alt={b.alt} className="deploy-logo" />
      </span>
    ))
    .otherwise(() => null)

  const descEl = match(description)
    .with(P.nonNullable, (d) => <span className="workspace-desc">{d}</span>)
    .otherwise(() => null)

  const tagsEl = match(tags)
    .with(
      P.when((t): t is readonly string[] => t !== undefined && t.length > 0),
      (t) => (
        <div className="workspace-tags">
          {t.map((tag) => (
            <TechTag key={tag} name={tag} />
          ))}
        </div>
      )
    )
    .otherwise(() => null)

  return (
    <Card href={href} className="workspace-card">
      <div className="workspace-header">
        <div className="workspace-identity">
          <span className={`home-card-icon home-card-icon--${iconColor}`}>{iconEl}</span>
          <div className="workspace-title">
            {scopeEl}
            <span className="workspace-name">{name}</span>
          </div>
        </div>
        {badgeEl}
      </div>
      {descEl}
      {tagsEl}
    </Card>
  )
}
