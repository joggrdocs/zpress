import { hasGlobChars } from './glob.ts'
import type { IconConfig } from './icon.ts'
import { configError } from './sync/errors.ts'
import type { ConfigError, ConfigResult } from './sync/errors.ts'
import { THEME_NAMES, COLOR_MODES } from './theme.ts'
import type { ThemeConfig, ThemeColors } from './theme.ts'
import type { ZpressConfig, Entry, Feature, WorkspaceItem, WorkspaceGroup } from './types.ts'

/**
 * Type-safe config helper for user config files.
 *
 * This is a passthrough that provides type safety and editor
 * autocompletion in `zpress.config.ts`. Validation is deferred to
 * `loadConfig` at CLI runtime, so errors surface with structured
 * feedback rather than a raw `process.exit`.
 *
 * @param config - Raw zpress config object
 * @returns The config (unchanged)
 */
export function defineConfig(config: ZpressConfig): ZpressConfig {
  return config
}

/**
 * Validate the entire config, returning the first error found.
 *
 * @param config - Raw zpress config object to validate
 * @returns A `ConfigResult` tuple — `[null, config]` on success or `[ConfigError, null]` on failure
 */
export function validateConfig(config: ZpressConfig): ConfigResult<ZpressConfig> {
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

      if (!item.title) {
        return {
          error: configError('missing_field', 'WorkspaceItem: "title" is required'),
          seen: acc.seen,
        }
      }

      if (!item.description) {
        return {
          error: configError(
            'missing_field',
            `WorkspaceItem "${item.title}": "description" is required`
          ),
          seen: acc.seen,
        }
      }

      if (!item.path) {
        return {
          error: configError('missing_field', `WorkspaceItem "${item.title}": "path" is required`),
          seen: acc.seen,
        }
      }

      if (acc.seen.has(item.path)) {
        return {
          error: configError(
            'duplicate_prefix',
            `WorkspaceItem "${item.title}": duplicate path "${item.path}"`
          ),
          seen: acc.seen,
        }
      }

      const [iconErr] = validateIconConfig(item.icon, `WorkspaceItem "${item.title}"`)
      if (iconErr) {
        return { error: iconErr, seen: acc.seen }
      }

      return { error: null, seen: new Set([...acc.seen, item.path]) }
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
        `Entry "${entry.title}": 'from' and 'content' are mutually exclusive`
      ),
      null,
    ]
  }

  if (entry.link && !entry.from && !entry.content && !entry.items) {
    return [
      configError(
        'invalid_entry',
        `Entry "${entry.title}": page with 'link' must have 'from', 'content', or 'items'`
      ),
      null,
    ]
  }

  if (entry.from && !hasGlobChars(entry.from) && !entry.items && !entry.link) {
    return [
      configError('invalid_entry', `Entry "${entry.title}": single-file 'from' requires 'link'`),
      null,
    ]
  }

  if (entry.from && hasGlobChars(entry.from) && !entry.prefix) {
    return [
      configError('invalid_entry', `Entry "${entry.title}": glob 'from' requires 'prefix'`),
      null,
    ]
  }

  if (entry.recursive && (!entry.from || !entry.from.includes('**'))) {
    return [
      configError(
        'invalid_entry',
        `Entry "${entry.title}": 'recursive' requires a recursive glob pattern (e.g. "**/*.md")`
      ),
      null,
    ]
  }

  if (entry.recursive && !entry.prefix) {
    return [
      configError('invalid_entry', `Entry "${entry.title}": 'recursive' requires 'prefix'`),
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
 * Each feature must have `title` and `description`.
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
  if (!feature.title) {
    return configError('missing_field', 'Feature: "title" is required')
  }

  if (!feature.description) {
    return configError('missing_field', `Feature "${feature.title}": "description" is required`)
  }

  const [iconErr] = validateIconConfig(feature.icon, `Feature "${feature.title}"`)
  if (iconErr) {
    return iconErr
  }

  return null
}

/**
 * Validate an IconConfig value (string or object form).
 * String form must contain `:`. Object form must have `id` with `:`.
 */
function validateIconConfig(icon: IconConfig | undefined, context: string): ConfigResult<true> {
  if (icon === undefined) {
    return [null, true]
  }

  if (typeof icon === 'string') {
    if (!icon.includes(':')) {
      return [
        configError(
          'invalid_icon',
          `${context}: icon must be an Iconify identifier (e.g. "devicon:hono")`
        ),
        null,
      ]
    }
    return [null, true]
  }

  // Object form: { id, color }
  if (!icon.id || !icon.id.includes(':')) {
    return [
      configError(
        'invalid_icon',
        `${context}: icon.id must be an Iconify identifier (e.g. "devicon:hono")`
      ),
      null,
    ]
  }

  return [null, true]
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
