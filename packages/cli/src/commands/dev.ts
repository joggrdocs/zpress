import { screen } from '@kidd-cli/core/ui'
import { z } from 'zod'

import { DevScreen } from './dev-screen.tsx'

/**
 * Registers the `dev` CLI command to sync, watch, and start a live dev server.
 */
export const devCommand = screen({
  description: 'Run sync + watcher and start Rspress dev server',
  exit: 'manual',
  options: z.object({
    quiet: z.boolean().optional().default(false),
    clean: z.boolean().optional().default(false),
    port: z.number().optional(),
    theme: z.string().optional(),
    colorMode: z.string().optional(),
    vscode: z.boolean().optional().default(false),
  }),
  render: DevScreen,
})
