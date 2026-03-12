import { hasGlobChars } from './glob.ts'
import { configError } from './sync/errors.ts'
import type { ConfigError, ConfigResult } from './sync/errors.ts'
import { THEME_NAMES, COLOR_MODES } from './theme.ts'
import type { ThemeConfig, ThemeColors } from './theme.ts'
import type { ZpressConfig, Entry, Feature, WorkspaceItem, WorkspaceGroup } from './types.ts'

/**
 * Type-safe config helper with validation.
 *
 * Validates the config structure and exits with a clear error message
 * if any issues are found. This is the primary entry point for user-
 * provided config — validation happens at the boundary.
 *
 * `defineConfig` is called in user config files (e.g. `zpress.config.ts`)
 * where the return value is consumed by the c12 config loader, which
 * expects a plain `ZpressConfig` object — not a `Result` tuple.
 * Because this is the outermost user-facing boundary (not a library
 * function), `process.exit(1)` is acceptable here: the user must fix
 * their config before any downstream code can run.
 *
 * @param config - Raw zpress config object
 * @returns The validated config (unchanged)
 */
export function defineConfig(config: ZpressConfig): ZpressConfig {
  const [err] = validateConfig(config)
  if (err) {
    // Boundary exit — c12 expects a plain config object, so we cannot
    // return a Result tuple here. The user must fix their config.
    process.stderr.write(`[zpress] ${err.message}\n`)
    process.exit(1)
  }
  return config
}

/**
 * Validate the entire config, returning the first error found.
 */
function validateConfig(config: ZpressConfig): ConfigResult<ZpressConfig> {
  if (!config.sections || config.sections.length === 0) {
    return [configError('empty_sections', 'config.sections must have at least one entry'), null]
  }

  const [groupErr] = validateWorkspaceGroups(config.workspaces ?? [])
  if (groupErr) {
    return [groupErr, null]
  }

  const workspaceGroupItems = (config.workspaces ?? []).flatMap((g) => g.items)
  const [wsErr] = validateWorkspaceItems([
    ...(config.apps ?? []),
    ...(config.packages ?? []),
    ...workspaceGroupItems,
  ])
  if (wsErr) {
    return [wsErr, null]
  }

  const entryErrors = config.sections.reduce<ConfigError | null>((acc, entry) => {
    if (acc) {
      return acc
    }
    const [entryErr] = validateEntry(entry)
    if (entryErr) {
      return entryErr
    }
    return null
  }, null)

  if (entryErrors) {
    return [entryErrors, null]
  }

  const [featErr] = validateFeatures(config.features)
  if (featErr) {
    return [featErr, null]
  }

  const [themeErr] = validateTheme(config.theme)
  if (themeErr) {
    return [themeErr, null]
  }

  return [null, config]
}

/**
 * Validate workspace items (apps and packages).
 */
function validateWorkspaceItems(items: readonly WorkspaceItem[]): ConfigResult<true> {
  const prefixError = items.reduce<{ error: ConfigError | null; seen: ReadonlySet<string> }>(
    (acc, item) => {
      if (acc.error) {
        return acc
      }

      if (!item.text) {
        return {
          error: configError('missing_field', 'WorkspaceItem: "text" is required'),
          seen: acc.seen,
        }
      }

      if (!item.description) {
        return {
          error: configError(
            'missing_field',
            `WorkspaceItem "${item.text}": "description" is required`
          ),
          seen: acc.seen,
        }
      }

      if (!item.docsPrefix) {
        return {
          error: configError(
            'missing_field',
            `WorkspaceItem "${item.text}": "docsPrefix" is required`
          ),
          seen: acc.seen,
        }
      }

      if (acc.seen.has(item.docsPrefix)) {
        return {
          error: configError(
            'duplicate_prefix',
            `WorkspaceItem "${item.text}": duplicate docsPrefix "${item.docsPrefix}"`
          ),
          seen: acc.seen,
        }
      }

      if (item.icon && !item.icon.includes(':')) {
        return {
          error: configError(
            'invalid_icon',
            `WorkspaceItem "${item.text}": icon must be an Iconify identifier (e.g. "devicon:hono")`
          ),
          seen: acc.seen,
        }
      }

      return { error: null, seen: new Set([...acc.seen, item.docsPrefix]) }
    },
    { error: null, seen: new Set<string>() }
  )

  if (prefixError.error) {
    return [prefixError.error, null]
  }
  return [null, true]
}

/**
 * Validate workspace groups have required fields and non-empty items.
 */
function validateWorkspaceGroups(groups: readonly WorkspaceGroup[]): ConfigResult<true> {
  const groupError = groups.reduce<ConfigError | null>((acc, group) => {
    if (acc) {
      return acc
    }

    if (!group.name) {
      return configError('missing_field', 'WorkspaceGroup: "name" is required')
    }

    if (!group.description) {
      return configError(
        'missing_field',
        `WorkspaceGroup "${group.name}": "description" is required`
      )
    }

    if (!group.icon) {
      return configError('missing_field', `WorkspaceGroup "${group.name}": "icon" is required`)
    }

    if (!group.items || group.items.length === 0) {
      return configError(
        'missing_field',
        `WorkspaceGroup "${group.name}": "items" must be a non-empty array`
      )
    }

    return null
  }, null)

  if (groupError) {
    return [groupError, null]
  }
  return [null, true]
}

/**
 * Validate a single entry node (recursive).
 */
function validateEntry(entry: Entry): ConfigResult<true> {
  if (entry.from && entry.content) {
    return [
      configError(
        'invalid_entry',
        `Entry "${entry.text}": 'from' and 'content' are mutually exclusive`
      ),
      null,
    ]
  }

  if (entry.link && !entry.from && !entry.content && !entry.items) {
    return [
      configError(
        'invalid_entry',
        `Entry "${entry.text}": page with 'link' must have 'from', 'content', or 'items'`
      ),
      null,
    ]
  }

  if (entry.from && !hasGlobChars(entry.from) && !entry.items && !entry.link) {
    return [
      configError('invalid_entry', `Entry "${entry.text}": single-file 'from' requires 'link'`),
      null,
    ]
  }

  if (entry.from && hasGlobChars(entry.from) && !entry.prefix) {
    return [
      configError('invalid_entry', `Entry "${entry.text}": glob 'from' requires 'prefix'`),
      null,
    ]
  }

  if (entry.recursive && (!entry.from || !entry.from.includes('**'))) {
    return [
      configError(
        'invalid_entry',
        `Entry "${entry.text}": 'recursive' requires a recursive glob pattern (e.g. "**/*.md")`
      ),
      null,
    ]
  }

  if (entry.recursive && !entry.prefix) {
    return [
      configError('invalid_entry', `Entry "${entry.text}": 'recursive' requires 'prefix'`),
      null,
    ]
  }

  if (entry.items) {
    const childErr = entry.items.reduce<ConfigError | null>((acc, child) => {
      if (acc) {
        return acc
      }
      const [err] = validateEntry(child)
      if (err) {
        return err
      }
      return null
    }, null)

    if (childErr) {
      return [childErr, null]
    }
  }

  return [null, true]
}

/**
 * Validate explicit features when provided.
 * Each feature must have `text` and `description`.
 */
function validateFeatures(features: ZpressConfig['features']): ConfigResult<true> {
  if (features === undefined) {
    return [null, true]
  }

  const featureError = features.reduce<ConfigError | null>((acc, feature) => {
    if (acc) {
      return acc
    }
    return validateFeature(feature)
  }, null)

  if (featureError) {
    return [featureError, null]
  }
  return [null, true]
}

/**
 * Validate a single feature has required fields and valid icon format.
 */
function validateFeature(feature: Feature): ConfigError | null {
  if (!feature.text) {
    return configError('missing_field', 'Feature: "text" is required')
  }

  if (!feature.description) {
    return configError('missing_field', `Feature "${feature.text}": "description" is required`)
  }

  if (feature.icon && !feature.icon.includes(':')) {
    return configError(
      'invalid_icon',
      `Feature "${feature.text}": icon must be an Iconify identifier (e.g. "pixelarticons:speed-fast")`
    )
  }

  return null
}
/**
 * Validate a single ThemeColors object.
 */
function validateThemeColors(colors: ThemeColors, label: string): ConfigResult<true> {
  const colorPattern = /^(?:#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgba?\([^)]*\))$/
  const keys: readonly (keyof ThemeColors)[] = [
    'brand',
    'brandLight',
    'brandDark',
    'brandSoft',
    'bg',
    'bgAlt',
    'bgElv',
    'bgSoft',
    'text1',
    'text2',
    'text3',
    'divider',
    'border',
    'homeBg',
  ]

  const firstError = keys.reduce<ConfigError | null>((acc, key) => {
    if (acc) {
      return acc
    }
    const value = colors[key]
    if (value !== undefined && !colorPattern.test(value)) {
      return configError(
        'invalid_theme',
        `theme.${label}.${key}: "${value}" is not a valid color (use hex #xxx/#xxxxxx or rgba())`
      )
    }
    return null
  }, null)

  if (firstError) {
    return [firstError, null]
  }
  return [null, true]
}

/**
 * Validate theme configuration when provided.
 */
function validateTheme(theme: ThemeConfig | undefined): ConfigResult<true> {
  if (theme === undefined) {
    return [null, true]
  }

  if (theme.name !== undefined && !(THEME_NAMES as readonly string[]).includes(theme.name)) {
    return [
      configError(
        'invalid_theme',
        `theme.name: "${theme.name}" is not a valid theme (use ${THEME_NAMES.map((n) => `"${n}"`).join(', ')})`
      ),
      null,
    ]
  }

  if (
    theme.colorMode !== undefined &&
    !(COLOR_MODES as readonly string[]).includes(theme.colorMode)
  ) {
    return [
      configError(
        'invalid_theme',
        `theme.colorMode: "${theme.colorMode}" is not valid (use ${COLOR_MODES.map((m) => `"${m}"`).join(', ')})`
      ),
      null,
    ]
  }

  if (theme.colors) {
    const [colorsErr] = validateThemeColors(theme.colors, 'colors')
    if (colorsErr) {
      return [colorsErr, null]
    }
  }

  if (theme.darkColors) {
    const [darkErr] = validateThemeColors(theme.darkColors, 'darkColors')
    if (darkErr) {
      return [darkErr, null]
    }
  }

  return [null, true]
}
