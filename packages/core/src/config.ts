import { loadConfig as c12LoadConfig } from 'c12'

import { configError } from './sync/errors.ts'
import type { ConfigResult } from './sync/errors.ts'
import type { ZpressConfig } from './types.ts'

/**
 * Load zpress config at runtime via c12.
 *
 * Returns a `ConfigResult` tuple instead of calling `process.exit` — the
 * CLI boundary is responsible for surfacing the error and exiting.
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

  return [null, config as ZpressConfig]
}
