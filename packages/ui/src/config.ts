import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { UserConfig } from '@rspress/core'
import { resolveDefaultColorMode } from '@zpress/core'
import type { Paths, ThemeColors, ThemeName, ZpressConfig } from '@zpress/core'

import { zpressPlugin } from './plugin.ts'

interface CreateRspressConfigOptions {
  readonly config: ZpressConfig
  readonly paths: Paths
  readonly logLevel?: 'info' | 'warn' | 'error' | 'silent'
}

/**
 * Load a generated JSON file from the sync engine output, falling back
 * to a default value if the file does not exist yet.
 */
function loadGenerated<T>(contentDir: string, name: string, fallback: T): T {
  const p = path.resolve(contentDir, '.generated', name)
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: derived from known output directory
  if (!existsSync(p)) {
    process.stderr.write(`[zpress] Generated file not found: ${name} — run "zpress sync" first\n`)
    return fallback
  }
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: derived from known output directory
  return JSON.parse(readFileSync(p, 'utf8')) as T
}

/**
 * Detect current git branch at build time — falls back to empty string.
 */
function detectGitBranch(): string {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: 'pipe' }).trim()
  } catch {
    return ''
  }
}

/**
 * Resolve the theme name from config, defaulting to 'base'.
 */
function resolveThemeName(config: ZpressConfig): ThemeName {
  if (config.theme && config.theme.name) {
    return config.theme.name
  }
  return 'base'
}

/**
 * Resolve the color mode from config, defaulting to the theme's natural mode.
 */
function resolveColorMode(config: ZpressConfig, themeName: ThemeName): string {
  if (config.theme && config.theme.colorMode) {
    return config.theme.colorMode
  }
  return resolveDefaultColorMode(themeName)
}

/**
 * Resolve whether the theme switcher is enabled.
 */
function resolveThemeSwitcher(config: ZpressConfig): boolean {
  if (config.theme && config.theme.switcher) {
    return config.theme.switcher
  }
  return false
}

/**
 * Resolve theme color overrides, defaulting to empty object.
 */
function resolveThemeColors(config: ZpressConfig): ThemeColors {
  if (config.theme && config.theme.colors) {
    return config.theme.colors
  }
  return {}
}

/**
 * Resolve dark mode color overrides, defaulting to empty object.
 */
function resolveThemeDarkColors(config: ZpressConfig): ThemeColors {
  if (config.theme && config.theme.darkColors) {
    return config.theme.darkColors
  }
  return {}
}

/**
 * Translate zpress config + sync engine output into a complete
 * Rspress configuration object.
 */
export function createRspressConfig(options: CreateRspressConfigOptions): UserConfig {
  const { config, paths, logLevel } = options

  const sidebar = loadGenerated(paths.contentDir, 'sidebar.json', {})
  const nav = loadGenerated(paths.contentDir, 'nav.json', [])
  const workspaces = loadGenerated(paths.contentDir, 'workspaces.json', [])
  const gitBranch = detectGitBranch()

  const themeName = resolveThemeName(config)
  const colorMode = resolveColorMode(config, themeName)
  const themeSwitcher = resolveThemeSwitcher(config)
  const themeColors = resolveThemeColors(config)
  const themeDarkColors = resolveThemeDarkColors(config)

  return {
    root: paths.contentDir,
    outDir: paths.distDir,

    route: { cleanUrls: true },

    llms: true,

    title: config.title ?? 'zpress',
    description: config.description ?? 'Documentation',

    icon: config.icon ?? '/icon.svg',
    logo: '/logo.svg',
    logoText: '',

    themeDir: path.resolve(import.meta.dirname, 'theme'),

    plugins: [zpressPlugin()],

    builderConfig: {
      ...(() => {
        if (logLevel) {
          return { logLevel }
        }
        return {}
      })(),
      resolve: {
        alias: {
          // Allow generated MDX files in .zpress/content/ to import
          // zpress React components used in landing pages.
          '@zpress/ui/theme': path.resolve(import.meta.dirname, 'theme', 'index.tsx'),
        },
      },
      source: {
        define: {
          __ZPRESS_GIT_BRANCH__: JSON.stringify(gitBranch),
          __ZPRESS_THEME_NAME__: JSON.stringify(themeName),
          __ZPRESS_COLOR_MODE__: JSON.stringify(colorMode),
          __ZPRESS_THEME_COLORS__: JSON.stringify(JSON.stringify(themeColors)),
          __ZPRESS_THEME_DARK_COLORS__: JSON.stringify(JSON.stringify(themeDarkColors)),
          __ZPRESS_THEME_SWITCHER__: JSON.stringify(themeSwitcher),
        },
      },
      output: {
        distPath: {
          root: paths.distDir,
        },
      },
    },

    themeConfig: {
      sidebar,
      nav,
      darkMode: colorMode === 'toggle',
      search: true,
      // Custom zpress data injected alongside standard Rspress themeConfig.
      // Accessed at runtime via useSite().site.themeConfig cast to unknown.
      ...({ workspaces } as Record<string, unknown>),
    },
  }
}
