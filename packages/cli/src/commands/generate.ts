import fs from 'node:fs/promises'

import { command } from '@kidd-cli/core'
import { createPaths, generateAssets, loadConfig } from '@zpress/core'
import type { AssetConfig } from '@zpress/core'

/**
 * Standalone command to generate branded banner, logo, and icon SVGs.
 *
 * Reads the project config, generates assets from the configured title,
 * and writes them to `.zpress/public/`.
 */
export const generateCommand = command({
  description: 'Generate banner, logo, and icon SVG assets from project title',
  handler: async (ctx) => {
    ctx.logger.intro('zpress generate')

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
    const assetConfig = buildAssetConfig(config)

    if (!assetConfig) {
      ctx.logger.warn('No title configured — skipping asset generation')
      ctx.logger.outro('Done')
      return
    }

    await fs.mkdir(paths.publicDir, { recursive: true })
    const [err, written] = await generateAssets({ config: assetConfig, publicDir: paths.publicDir })

    if (err) {
      ctx.logger.error(err.message)
      ctx.logger.outro('Failed')
      return
    }

    if (written.length === 0) {
      ctx.logger.info('All assets are user-customized — nothing to generate')
    } else {
      ctx.logger.success(`Generated ${written.join(', ')}`)
    }

    ctx.logger.outro('Done')
  },
})

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Build an `AssetConfig` from the loaded zpress config.
 * Returns `null` when no title is configured (fallback to default assets).
 *
 * @private
 * @param config - Config object with optional title and tagline
 * @returns Asset config or null when no title is present
 */
function buildAssetConfig(config: {
  readonly title?: string
  readonly tagline?: string
}): AssetConfig | null {
  if (!config.title) {
    return null
  }
  return { title: config.title, tagline: config.tagline }
}
