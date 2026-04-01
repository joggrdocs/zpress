import { screen } from '@kidd-cli/core/ui'
import { StoriesScreen } from '@kidd-cli/core/stories'
import { z } from 'zod'

/**
 * Registers the `stories` CLI command to launch the interactive story viewer.
 *
 * Discovers `.stories.tsx` files in the CLI package, renders them in a
 * fullscreen TUI with live-reload, and supports `--out` for piping
 * rendered output to stdout.
 */
export const storiesCommand = screen({
  description: 'Launch the interactive component story viewer',
  exit: 'manual',
  fullscreen: true,
  options: z.object({
    include: z.string().optional(),
    out: z.string().optional(),
    check: z.boolean().optional().default(false),
  }),
  render: StoriesScreen,
})
