import { loadConfig as c12LoadConfig } from 'c12'

import { validateConfig } from './define-config.ts'
import { configError } from './sync/errors.ts'
import type { ConfigResult } from './sync/errors.ts'
import type { ZpressConfig } from './types.ts'

/**
 * Load and validate zpress config at runtime via c12.
 *
 * Returns a `ConfigResult` tuple — the CLI boundary is responsible for
 * surfacing any error and exiting. Validation runs here (not in
 * `defineConfig`) so every consumer gets structured error feedback.
 *
 * NOTE: c12 caches ESM imports by default. When config files change,
 * the cache is not automatically cleared. For now, we rely on the user
 * restarting the dev server to pick up config changes. A future enhancement
 * would use `watchConfig` or implement custom cache busting.
 *
 * @param dir - Repository root directory to search for `zpress.config.*`
 * @returns A `ConfigResult` tuple — `[null, config]` on success or `[ConfigError, null]` on failure
 */
export async function loadConfig(dir: string): Promise<ConfigResult<ZpressConfig>> {
  const { config } = await c12LoadConfig<ZpressConfig>({
    cwd: dir,
    name: 'zpress',
    rcFile: false,
    packageJson: false,
    globalRc: false,
    dotenv: false,
  })

  if (!config || !config.sections) {
    return [configError('empty_sections', 'Failed to load zpress.config — no sections found'), null]
  }

  return validateConfig(config as ZpressConfig)
}
