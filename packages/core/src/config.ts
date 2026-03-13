import { existsSync } from 'node:fs'
import path from 'node:path'

import { loadConfig as c12LoadConfig } from 'c12'
import { createJiti } from 'jiti'

import { validateConfig } from './define-config.ts'
import { configError } from './sync/errors.ts'
import type { ConfigResult } from './sync/errors.ts'
import type { ZpressConfig } from './types.ts'

const CONFIG_EXTENSIONS = ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs', '.json'] as const

/**
 * Find the zpress config file in the given directory.
 */
function findConfigFile(dir: string): string | null {
  const candidates = CONFIG_EXTENSIONS.map((ext) => path.resolve(dir, `zpress.config${ext}`))
  const found = candidates.find((file) => existsSync(file))
  return found ?? null
}

/**
 * Load and validate zpress config at runtime.
 *
 * Returns a `ConfigResult` tuple — the CLI boundary is responsible for
 * surfacing any error and exiting. Validation runs here (not in
 * `defineConfig`) so every consumer gets structured error feedback.
 *
 * Uses jiti with cache disabled to bust ESM import cache on reload,
 * ensuring config changes are picked up immediately without process restart.
 *
 * @param dir - Repository root directory to search for `zpress.config.*`
 * @returns A `ConfigResult` tuple — `[null, config]` on success or `[ConfigError, null]` on failure
 */
export async function loadConfig(dir: string): Promise<ConfigResult<ZpressConfig>> {
  const configFile = findConfigFile(dir)

  if (!configFile) {
    return [configError('empty_sections', 'No zpress.config.* file found'), null]
  }

  // Create jiti instance with cache disabled for hot reload support
  const jiti = createJiti(dir, {
    moduleCache: false,
    requireCache: false,
  })

  try {
    // Use jiti to load config file directly, bypassing c12's cache
    const loaded: unknown = await jiti.import(configFile, { default: true })
    const config = (loaded as { default?: ZpressConfig }).default ?? (loaded as ZpressConfig)

    if (!config || !config.sections) {
      return [configError('empty_sections', 'Failed to load zpress.config — no sections found'), null]
    }

    return validateConfig(config as ZpressConfig)
  } catch (error) {
    const errorMessage = (() => {
      if (error instanceof Error) {
        return error.message
      }
      return String(error)
    })()
    return [configError('missing_field', `Failed to load config: ${errorMessage}`), null]
  }
}
