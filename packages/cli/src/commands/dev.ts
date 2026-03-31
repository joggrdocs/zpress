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
  options: z.object({
    quiet: z.boolean().optional().default(false),
    clean: z.boolean().optional().default(false),
    port: z.number().optional(),
    theme: z.string().optional(),
    colorMode: z.string().optional(),
    vscode: z.boolean().optional().default(false),
  }),
  handler: async (ctx) => {
    const { quiet } = ctx.args
    const paths = createPaths(process.cwd())
    ctx.log.intro('zpress dev')

    if (ctx.args.clean) {
      const removed = await clean(paths)
      if (removed.length > 0 && !quiet) {
        ctx.log.info(`Cleaned: ${removed.join(', ')}`)
      }
    }

    const [configErr, config] = await loadConfig(paths.repoRoot)
    if (configErr) {
      ctx.log.error(configErr.message)
      if (configErr.errors && configErr.errors.length > 0) {
        // oxlint-disable-next-line unicorn/no-array-for-each -- side-effect: logging each validation error
        configErr.errors.forEach((err) => {
          const path = err.path.join('.')
          ctx.log.error(`  ${path}: ${err.message}`)
        })
      }
      process.exit(1)
    }

    // Shared OpenAPI spec cache — survives across sync passes
    const openapiCache = new Map<string, unknown>()

    // Initial sync
    await sync(config, { paths, quiet, openapiCache })

    // Start Rspress dev server and get config reload callback
    const onConfigReload = await startDevServer({
      config,
      paths,
      port: ctx.args.port,
      theme: ctx.args.theme,
      colorMode: ctx.args.colorMode,
      vscode: ctx.args.vscode,
    })

    // Start watcher with config reload callback
    const { createWatcher } = await import('../lib/watcher.ts')
    const watcher = createWatcher({
      initialConfig: config,
      paths,
      log: ctx.log,
      onConfigReload,
      openapiCache,
    })

    function cleanup(): void {
      watcher.close()
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
  },
})
