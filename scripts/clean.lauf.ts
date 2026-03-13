import { lauf, z } from 'laufen'
import { rimraf } from 'rimraf'

export default lauf({
  description: 'Clean build artifacts, caches, and generated files',
  args: {
    all: z.boolean().default(false).describe('Clean node_modules in addition to build artifacts'),
    verbose: z.boolean().default(false).describe('Enable verbose logging'),
  },
  async run(ctx) {
    const patterns: string[] = [
      // Build outputs
      'packages/*/dist',
      'examples/*/dist',
      'extensions/*/dist',

      // Zpress outputs
      'examples/*/.zpress/dist',
      'examples/*/.zpress/cache',
      'examples/*/.zpress/content',

      // Caches
      '**/node_modules/.cache',
      '**/.turbo',

      // TypeScript
      '**/tsconfig.tsbuildinfo',
    ]

    if (ctx.args.all) {
      patterns.push('**/node_modules')
    }

    ctx.spinner.start('Cleaning build artifacts and caches')

    const cleaned: string[] = []

    for (const pattern of patterns) {
      const fullPattern = `${ctx.root}/${pattern}`

      if (ctx.args.verbose) {
        ctx.logger.info(`Removing: ${pattern}`)
      }

      try {
        const removed = await rimraf(fullPattern, {
          glob: true,
          preserveRoot: true,
        })

        if (removed.length > 0) {
          cleaned.push(pattern)
          if (ctx.args.verbose) {
            ctx.logger.info(`  Removed ${removed.length} paths`)
          }
        }
      } catch (error) {
        const errorMessage = (() => {
          if (error instanceof Error) {
            return error.message
          }
          return String(error)
        })()
        ctx.logger.warn(`Failed to clean ${pattern}: ${errorMessage}`)
      }
    }

    ctx.spinner.stop(`Cleaned ${cleaned.length} patterns`)

    if (ctx.args.verbose && cleaned.length > 0) {
      ctx.logger.info('Cleaned patterns:')
      cleaned.forEach((p) => ctx.logger.info(`  ${p}`))
    }

    if (ctx.args.all) {
      ctx.logger.info('Run "pnpm install" to reinstall dependencies')
    }
  },
})
