import fs from 'node:fs/promises'

import { command } from '@kidd-cli/core'
import { createPaths, generateAssets, loadConfig } from '@zpress/core'
import type { AssetConfig } from '@zpress/core'

/**
 * Build an `AssetConfig` from the loaded zpress config.
 * Returns `null` when no title is configured (fallback to default assets).
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

/**
 * Standalone command to generate branded banner and logo SVGs.
 *
 * Reads the project config, generates assets from the configured title,
 * and writes them to `.zpress/public/`.
 */
export const generateCommand = command({
  description: 'Generate banner and logo SVG assets from project title',
  handler: async (ctx) => {
    ctx.logger.intro('zpress generate')

    const paths = createPaths(process.cwd())
    const [configErr, config] = await loadConfig(paths.repoRoot)
    if (configErr) {
      ctx.logger.error(configErr.message)
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
