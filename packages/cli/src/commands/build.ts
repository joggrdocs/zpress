import { command } from '@kidd-cli/core'
import { createPaths, loadConfig, sync } from '@zpress/core'
import { z } from 'zod'

import { buildSite } from '../lib/rspress.ts'
import { clean } from './clean.ts'

/**
 * Registers the `build` CLI command to sync content and produce a static site.
 */
export const buildCommand = command({
  description: 'Run sync and build the Rspress site',
  args: z.object({
    quiet: z.boolean().optional().default(false),
    clean: z.boolean().optional().default(false),
  }),
  handler: async (ctx) => {
    const { quiet } = ctx.args
    const paths = createPaths(process.cwd())
    ctx.logger.intro('zpress build')

    if (ctx.args.clean) {
      const removed = await clean(paths)
      if (removed.length > 0 && !quiet) {
        ctx.logger.info(`Cleaned: ${removed.join(', ')}`)
      }
    }

    const [configErr, config] = await loadConfig(paths.repoRoot)
    if (configErr) {
      ctx.logger.error(configErr.message)
      process.exit(1)
    }

    // Sync first
    await sync(config, { paths, quiet })

    // Build
    await buildSite({ config, paths })

    ctx.logger.outro('Done')
  },
})
