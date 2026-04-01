import { command } from '@kidd-cli/core'
import { createPaths, loadConfig, sync } from '@zpress/core'

import { presentResults, runBuildCheck, runConfigCheck } from '../lib/check.ts'

/**
 * Registers the `check` CLI command to validate config and detect deadlinks.
 */
export default command({
  description: 'Validate config and check for broken links',
  handler: async (ctx) => {
    const paths = createPaths(process.cwd())
    ctx.log.intro('zpress check')

    // Config validation — loadConfig validates via validateConfig and
    // returns a Result tuple. No process.exit, no process overrides.
    ctx.log.step('Validating config...')
    const [configErr, config] = await loadConfig(paths.repoRoot)
    const configResult = runConfigCheck({ config, loadError: configErr })

    // If config is invalid, present the error and bail — sync/build need valid config
    if (configErr || !config) {
      const buildResult = { status: 'skipped' } as const
      presentResults({ configResult, buildResult, logger: ctx.log })
      ctx.log.outro('Checks failed')
      process.exit(1)
    }

    // Sync content (quiet — no per-file output)
    ctx.log.step('Syncing content...')
    const syncResult = await sync(config, { paths, quiet: true })
    ctx.log.success(
      `Synced (${syncResult.pagesWritten} written, ${syncResult.pagesSkipped} unchanged)`
    )

    // Deadlink detection via build
    ctx.log.step('Checking for broken links...')
    const buildResult = await runBuildCheck({ config, paths })

    // Present results
    const passed = presentResults({ configResult, buildResult, logger: ctx.log })

    if (passed) {
      ctx.log.outro('All checks passed')
    } else {
      ctx.log.outro('Checks failed')
      process.exit(1)
    }
  },
})
