import { loadConfig as c12LoadConfig } from 'c12'
import { createJiti } from 'jiti'

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
 * Uses c12's custom import option with jiti (cache disabled) to bust ESM
 * import cache on reload, ensuring config changes are picked up immediately
 * without process restart.
 *
 * @param dir - Repository root directory to search for `zpress.config.*`
 * @returns A `ConfigResult` tuple — `[null, config]` on success or `[ConfigError, null]` on failure
 */
export async function loadConfig(dir: string): Promise<ConfigResult<ZpressConfig>> {
  // Create jiti instance with cache disabled for hot reload support
  const jiti = createJiti(dir, {
    moduleCache: false,
  })

  const { config } = await c12LoadConfig<ZpressConfig>({
    cwd: dir,
    name: 'zpress',
    rcFile: false,
    packageJson: false,
    globalRc: false,
    dotenv: false,
    // Use custom jiti import to bypass ESM cache
    import: (id) => jiti.import(id),
  })

  if (!config || !config.sections) {
    return [configError('empty_sections', 'Failed to load zpress.config — no sections found'), null]
  }

  return validateConfig(config as ZpressConfig)
}
