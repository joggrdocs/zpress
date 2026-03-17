import { command } from '@kidd-cli/core'
import { createPaths, loadConfig } from '@zpress/core'
import { z } from 'zod'

import { DEFAULT_PORT, openBrowser, serveSite } from '../lib/rspress.ts'

/**
 * Registers the `serve` CLI command to preview a previously built site.
 */
export const serveCommand = command({
  description: 'Preview the built Rspress site',
  options: z.object({
    open: z.boolean().optional().default(true),
  }),
  handler: async (ctx) => {
    ctx.logger.intro('zpress serve')
    const paths = createPaths(process.cwd())
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

    if (ctx.args.open) {
      setTimeout(() => openBrowser(`http://localhost:${DEFAULT_PORT}`), 2000)
    }

    await serveSite({ config, paths })
  },
})
