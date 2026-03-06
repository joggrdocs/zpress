import { useFrontmatter } from '@rspress/core/runtime'
import type React from 'react'
import { match, P } from 'ts-pattern'

import { Icon } from '../shared/icon'
import { FeatureCard, FeatureGrid } from './feature-card'
import type { FeatureItem } from './feature-card'

// ── Helpers ──────────────────────────────────────────────────

/**
 * Render a single feature as a FeatureCard element.
 * Accepts the array index from `.map()` to guarantee unique keys.
 */
function renderFeature(feature: FeatureItem, index: number): React.ReactElement {
  const iconEl = match(feature.icon)
    .with(P.nonNullable, (iconId) => <Icon icon={iconId} />)
    .otherwise(() => null)

  return (
    <FeatureCard
      key={`${feature.title}-${index}`}
      title={feature.title}
      description={feature.details}
      href={feature.link}
      icon={iconEl}
      iconColor={feature.iconColor}
    />
  )
}

// ── Component ────────────────────────────────────────────────

/**
 * Custom HomeFeature override for zpress.
 * Uses useFrontmatter() hook to read features and renders with FeatureCard/FeatureGrid styling.
 */
export function HomeFeature(): React.ReactElement | null {
  const { frontmatter } = useFrontmatter()
  // Rspress types frontmatter as its own FrontMatterMeta shape which does not
  // include zpress-specific `features`. The double cast is necessary because
  // no shared Zod schema exists for frontmatter validation at runtime.
  const features = (frontmatter as Record<string, unknown>).features as
    | readonly FeatureItem[]
    | undefined

  return match(features)
    .with(
      P.when((f): f is readonly FeatureItem[] => Array.isArray(f) && f.length > 0),
      (items) => <FeatureGrid>{items.map(renderFeature)}</FeatureGrid>
    )
    .otherwise(() => null)
}
