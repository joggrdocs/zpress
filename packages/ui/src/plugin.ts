import path from 'node:path'

import type { RspressPlugin } from '@rspress/core'

/**
 * Rspress plugin that registers zpress theme components and styles.
 *
 * Global styles are loaded via the theme entry (theme/index.tsx)
 * CSS import — not through the plugin globalStyles property.
 * Custom UI components are registered here as globalUIComponents so
 * Rspress renders them on every page.
 */
export function zpressPlugin(): RspressPlugin {
  const componentsDir = path.resolve(import.meta.dirname, 'theme', 'components')

  return {
    name: 'zpress',
    globalUIComponents: [path.resolve(componentsDir, 'nav', 'branch-tag.tsx')],
  }
}
