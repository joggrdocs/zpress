import type { RspressPlugin } from '@rspress/core'

/**
 * Rspress plugin that registers zpress theme components and styles.
 *
 * Global styles are loaded via the theme entry (theme/index.tsx)
 * CSS import — not through the plugin globalStyles property.
 * Nav-level components (e.g. BranchTag) are injected via layout
 * slot props in the custom Layout component, not globalUIComponents.
 */
export function zpressPlugin(): RspressPlugin {
  return {
    name: 'zpress',
  }
}
