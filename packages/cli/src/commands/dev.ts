import { command } from '@kidd-cli/core'
import { createPaths, loadConfig, sync } from '@zpress/core'
import { z } from 'zod'

import { startDevServer } from '../lib/rspress.ts'
import { clean } from './clean.ts'

/**
 * Registers the `dev` CLI command to sync, watch, and start a live dev server.
 */
export const devCommand = command({
  description: 'Run sync + watcher and start Rspress dev server',
  args: z.object({
    quiet: z.boolean().optional().default(false),
    clean: z.boolean().optional().default(false),
  }),
  handler: async (ctx) => {
    const { quiet } = ctx.args
    const paths = createPaths(process.cwd())
    ctx.logger.intro('zpress dev')

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

    // Initial sync
    await sync(config, { paths, quiet })

    // Start Rspress dev server and get config reload callback
    const onConfigReload = startDevServer({ config, paths })

    // Start watcher with config reload callback
    const { createWatcher } = await import('../lib/watcher.ts')
    const watcher = createWatcher(config, paths, onConfigReload)

    function cleanup(): void {
      if (watcher) {
        watcher.close()
      }
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
  },
})
