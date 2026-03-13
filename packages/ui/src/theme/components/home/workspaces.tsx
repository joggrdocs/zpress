import type React from 'react'
import { match, P } from 'ts-pattern'

import { useZpress } from '../../hooks/use-zpress'
import type { WorkspaceGroupData } from '../../hooks/use-zpress'
import { WorkspaceCard } from '../workspaces/card'
import { WorkspaceGrid } from '../workspaces/grid'

/**
 * Smart orchestrator that reads workspace data from themeConfig
 * and renders workspace groups with the correct card component per type.
 */
export function HomeWorkspaces(): React.ReactElement | null {
  const { workspaces } = useZpress()

  return match(workspaces)
    .with(
      P.when((w): w is readonly WorkspaceGroupData[] => Array.isArray(w) && w.length > 0),
      (groups) => (
        <div className="workspace-section">
          <hr className="home-card-divider" />
          {groups.map(renderGroup)}
        </div>
      )
    )
    .otherwise(() => null)
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Render a single workspace group.
 * @private
 */
function renderGroup(group: WorkspaceGroupData): React.ReactElement {
  return (
    <WorkspaceGrid key={group.heading} heading={group.heading} description={group.description}>
      {group.cards.map((card, i) => (
        <WorkspaceCard
          key={`${card.title}-${i}`}
          title={card.title}
          href={card.href}
          icon={card.icon}
          iconColor={card.iconColor}
          scope={card.scope}
          description={card.description}
          tags={card.tags}
          badge={card.badge}
        />
      ))}
    </WorkspaceGrid>
  )
}
