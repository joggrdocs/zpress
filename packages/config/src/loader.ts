/**
 * Config loading with c12 supporting .ts/.json/.jsonc/.yml files.
 */

import { loadConfig as c12LoadConfig } from 'c12'

import { configError } from './errors.ts'
import type { ConfigResult } from './errors.ts'
import type { ZpressConfig } from './types.ts'
import { validateConfig } from './validator.ts'

export interface LoadConfigOptions {
  /**
   * Working directory to search for config files.
   * @default process.cwd()
   */
  readonly cwd?: string
  /**
   * Specific config file path to load.
   */
  readonly configFile?: string
}

/**
 * Load and validate zpress config from filesystem.
 *
 * Supports multiple config formats:
 * - zpress.config.ts (TypeScript)
 * - zpress.config.js/mjs (JavaScript ESM)
 * - zpress.config.json/jsonc (JSON with comments)
 * - zpress.config.yml/yaml (YAML)
 *
 * @param dirOrOptions - Directory path (string) or LoadConfigOptions object
 * @returns ConfigResult tuple - [null, config] on success or [error, null] on failure
 */
export async function loadConfig(
  dirOrOptions: string | LoadConfigOptions = {}
): Promise<ConfigResult<ZpressConfig>> {
  const options = resolveOptions(dirOrOptions)
  const { cwd, configFile } = options

  return await loadAndValidateConfig({ cwd, configFile })
}

/**
 * Internal helper to load and validate config with proper error handling.
 */
async function loadAndValidateConfig(
  options: LoadConfigOptions
): Promise<ConfigResult<ZpressConfig>> {
  const { cwd, configFile } = options

  try {
    const result = await c12LoadConfig<ZpressConfig>({
      cwd,
      configFile,
      name: 'zpress',
      // Supported extensions (c12 handles these automatically)
      // .ts, .mts, .js, .mjs, .json, .jsonc, .yml, .yaml
      rcFile: false,
      packageJson: false,
      globalRc: false,
      dotenv: false,
    })

    const { config } = result

    if (!config) {
      return [
        configError('not_found', 'Failed to load zpress.config — no config file found'),
        null,
      ]
    }

    if (!config.sections || (Array.isArray(config.sections) && config.sections.length === 0)) {
      return [
        configError('empty_sections', 'Failed to load zpress.config — no sections found'),
        null,
      ]
    }

    return validateConfig(config)
  } catch (error) {
    return [
      configError('parse_error', `Failed to parse config file: ${getErrorMessage(error)}`),
      null,
    ]
  }
}

/**
 * Resolve options from string or object input.
 */
function resolveOptions(dirOrOptions: string | LoadConfigOptions): LoadConfigOptions {
  if (typeof dirOrOptions === 'string') {
    return { cwd: dirOrOptions }
  }
  return dirOrOptions
}

/**
 * Extract error message from unknown error value.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
