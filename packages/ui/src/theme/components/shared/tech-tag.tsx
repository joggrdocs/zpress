import type React from 'react'
import { match, P } from 'ts-pattern'

import { TECH_ICONS } from '../../icons/index.ts'
import { Icon } from './icon'

export interface TechTagProps {
  readonly name: string
}

/**
 * Technology tag — resolves a tech name to icon + label using the tech map.
 * Falls back to raw name string if not in map.
 */
export function TechTag({ name }: TechTagProps): React.ReactElement {
  const entry = (TECH_ICONS as Record<string, { readonly icon: string; readonly label: string }>)[
    name
  ]

  return match(entry)
    .with(P.nonNullable, (e) => (
      <span className="workspace-tag">
        <Icon icon={e.icon} />
        {` ${e.label}`}
      </span>
    ))
    .otherwise(() => <span className="workspace-tag">{name}</span>)
}
