import { command } from '@kidd-cli/core'
import { createPaths, loadConfig, sync } from '@zpress/core'
import { z } from 'zod'

import { presentResults, runBuildCheck, runConfigCheck } from '../lib/check.ts'
import { buildSite } from '../lib/rspress.ts'
import { clean } from './clean.ts'

/**
 * Registers the `build` CLI command to sync content and produce a static site.
 *
 * When `--check` is enabled (default), config validation and deadlink
 * detection run as part of the build. Use `--no-check` to skip checks
 * and build with standard (noisy) Rspress output.
 */
export const buildCommand = command({
  description: 'Run sync and build the Rspress site',
  args: z.object({
    quiet: z.boolean().optional().default(false),
    clean: z.boolean().optional().default(false),
    check: z.boolean().optional().default(true),
  }),
  handler: async (ctx) => {
    const { quiet, check } = ctx.args
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
      if (configErr.errors && configErr.errors.length > 0) {
        configErr.errors.forEach((err) => {
          const path = err.path.join('.')
          ctx.logger.error(`  ${path}: ${err.message}`)
        })
      }
      process.exit(1)
    }

    if (check) {
      // Checked build: validate config, sync, then run deadlink-detecting build
      ctx.logger.step('Validating config...')
      const configResult = runConfigCheck({ config, loadError: configErr })

      ctx.logger.step('Syncing content...')
      await sync(config, { paths, quiet: true })

      ctx.logger.step('Building & checking for broken links...')
      const buildResult = await runBuildCheck({ config, paths })

      const passed = presentResults({ configResult, buildResult, logger: ctx.logger })
      if (!passed) {
        ctx.logger.outro('Build failed')
        process.exit(1)
      }

      ctx.logger.outro('Done')
    } else {
      // Unchecked build: standard sync + build (no validation, noisy output)
      await sync(config, { paths, quiet })
      await buildSite({ config, paths })
      ctx.logger.outro('Done')
    }
  },
})
