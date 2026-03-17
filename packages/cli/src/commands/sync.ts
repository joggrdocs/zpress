import { command } from '@kidd-cli/core'
import { createPaths, loadConfig, sync } from '@zpress/core'
import { z } from 'zod'

/**
 * Registers the `sync` CLI command to resolve and copy documentation sources.
 */
export const syncCommand = command({
  description: 'Sync documentation sources into .zpress/',
  options: z.object({
    quiet: z.boolean().optional().default(false),
  }),
  handler: async (ctx) => {
    const { quiet } = ctx.args
    const paths = createPaths(process.cwd())
    if (!quiet) {
      ctx.logger.intro('zpress sync')
    }
    const [configErr, config] = await loadConfig(paths.repoRoot)
    if (configErr) {
      ctx.logger.error(configErr.message)
      if (configErr.errors && configErr.errors.length > 0) {
        configErr.errors.map((err) => {
          const path = err.path.join('.')
          return ctx.logger.error(`  ${path}: ${err.message}`)
        })
      }
      process.exit(1)
    }
    await sync(config, { paths, quiet })
    if (!quiet) {
      ctx.logger.outro('Done')
    }
  },
})
