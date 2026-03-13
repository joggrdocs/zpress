import { match, P } from 'ts-pattern'

import { hasGlobChars } from './glob.ts'
import { configError } from './sync/errors.ts'
import type { ConfigError, ConfigResult } from './sync/errors.ts'
import type {
  ZpressConfig,
  Section,
  Feature,
  Workspace,
  WorkspaceCategory,
  IconConfig,
  ThemeConfig,
  ThemeColors,
} from './types.ts'
import { THEME_NAMES, COLOR_MODES } from '@zpress/theme'

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
    return [configError('empty_sections', 'config.sections must have at least one section'), null]
  }

  const [groupErr] = validateWorkspaceCategories(config.workspaces ?? [])
  if (groupErr) {
    return [groupErr, null]
  }

  const workspaceCategoryItems = (config.workspaces ?? []).flatMap((g) => g.items)
  const [wsErr] = validateWorkspaces([
    ...(config.apps ?? []),
    ...(config.packages ?? []),
    ...workspaceCategoryItems,
  ])
  if (wsErr) {
    return [wsErr, null]
  }

  const sectionErrors = config.sections.reduce<ConfigError | null>((acc, section) => {
    if (acc) {
      return acc
    }
    const [sectionErr] = validateSection(section)
    if (sectionErr) {
      return sectionErr
    }
    return null
  }, null)

  if (sectionErrors) {
    return [sectionErrors, null]
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
 * Validate workspaces (apps and packages).
 */
function validateWorkspaces(items: readonly Workspace[]): ConfigResult<true> {
  const prefixError = items.reduce<{ error: ConfigError | null; seen: ReadonlySet<string> }>(
    (acc, item) => {
      if (acc.error) {
        return acc
      }

      // title is inherited from Entry base and can be string | TitleConfig
      // For workspace items, it should be a string
      if (!item.title) {
        return {
          error: configError('missing_field', 'Workspace: "title" is required'),
          seen: acc.seen,
        }
      }

      if (typeof item.title !== 'string') {
        return {
          error: configError(
            'invalid_field',
            `Workspace "${String(item.title)}": "title" must be a string (TitleConfig not supported on Workspace)`
          ),
          seen: acc.seen,
        }
      }

      if (!item.description) {
        return {
          error: configError(
            'missing_field',
            `Workspace "${item.title}": "description" is required`
          ),
          seen: acc.seen,
        }
      }

      if (!item.prefix) {
        return {
          error: configError('missing_field', `Workspace "${item.title}": "prefix" is required`),
          seen: acc.seen,
        }
      }

      if (acc.seen.has(item.prefix)) {
        return {
          error: configError(
            'duplicate_prefix',
            `Workspace "${item.title}": duplicate prefix "${item.prefix}"`
          ),
          seen: acc.seen,
        }
      }

      const [iconErr] = validateIconConfig(item.icon, `Workspace "${item.title}"`)
      if (iconErr) {
        return { error: iconErr, seen: acc.seen }
      }

      return { error: null, seen: new Set([...acc.seen, item.prefix]) }
    },
    { error: null, seen: new Set<string>() }
  )

  if (prefixError.error) {
    return [prefixError.error, null]
  }
  return [null, true]
}

/**
 * Validate workspace categories have required fields and non-empty items.
 */
function validateWorkspaceCategories(categories: readonly WorkspaceCategory[]): ConfigResult<true> {
  const categoryError = categories.reduce<ConfigError | null>((acc, category) => {
    if (acc) {
      return acc
    }

    // title is inherited from Entry base
    if (!category.title) {
      return configError('missing_field', 'WorkspaceCategory: "title" is required')
    }

    if (typeof category.title !== 'string') {
      return configError(
        'invalid_field',
        `WorkspaceCategory: "title" must be a string (TitleConfig not supported on WorkspaceCategory)`
      )
    }

    if (!category.description) {
      return configError(
        'missing_field',
        `WorkspaceCategory "${category.title}": "description" is required`
      )
    }

    if (!category.icon) {
      return configError('missing_field', `WorkspaceCategory "${category.title}": "icon" is required`)
    }

    if (!category.items || category.items.length === 0) {
      return configError(
        'missing_field',
        `WorkspaceCategory "${category.title}": "items" must be a non-empty array`
      )
    }

    return null
  }, null)

  if (categoryError) {
    return [categoryError, null]
  }
  return [null, true]
}

/**
 * Validate a single section node (recursive).
 */
function validateSection(section: Section): ConfigResult<true> {
  // Get the title string for error messages
  const titleStr = match(section.title)
    .with(P.string, (t) => t)
    .otherwise(() => 'Section')

  if (section.from && section.content) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": 'from' and 'content' are mutually exclusive`
      ),
      null,
    ]
  }

  if (section.link && !section.from && !section.content && !section.items) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": page with 'link' must have 'from', 'content', or 'items'`
      ),
      null,
    ]
  }

  if (section.from && !hasGlobChars(section.from) && !section.items && !section.link) {
    return [
      configError('invalid_section', `Section "${titleStr}": single-file 'from' requires 'link'`),
      null,
    ]
  }

  if (section.from && hasGlobChars(section.from) && !section.prefix) {
    return [
      configError('invalid_section', `Section "${titleStr}": glob 'from' requires 'prefix'`),
      null,
    ]
  }

  if (section.recursive && (!section.from || !section.from.includes('**'))) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": 'recursive' requires a recursive glob pattern (e.g. "**/*.md")`
      ),
      null,
    ]
  }

  if (section.recursive && !section.prefix) {
    return [
      configError('invalid_section', `Section "${titleStr}": 'recursive' requires 'prefix'`),
      null,
    ]
  }

  // Validate landing field only applies when items exist
  if (section.landing !== undefined && !section.items) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": 'landing' only applies to sections with 'items'`
      ),
      null,
    ]
  }

  // Validate landing requires link
  if (section.landing !== undefined && section.landing !== false && !section.link) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": 'landing' requires 'link' to be set`
      ),
      null,
    ]
  }

  // Validate isolated requires link
  if (section.isolated && !section.link) {
    return [
      configError(
        'invalid_section',
        `Section "${titleStr}": 'isolated' requires 'link' to be set`
      ),
      null,
    ]
  }

  if (section.items) {
    const childErr = section.items.reduce<ConfigError | null>((acc, child) => {
      if (acc) {
        return acc
      }
      const [err] = validateSection(child)
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
  // title is inherited from Entry base
  if (!feature.title) {
    return configError('missing_field', 'Feature: "title" is required')
  }

  const titleStr = match(feature.title)
    .with(P.string, (t) => t)
    .otherwise(() => 'Feature')

  if (typeof feature.title !== 'string') {
    return configError(
      'invalid_field',
      `Feature "${titleStr}": "title" must be a string (TitleConfig not supported on Feature)`
    )
  }

  if (!feature.description) {
    return configError('missing_field', `Feature "${feature.title}": "description" is required`)
  }

  if (!feature.link) {
    return configError('missing_field', `Feature "${feature.title}": "link" is required`)
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
