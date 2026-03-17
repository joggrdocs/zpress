import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { UserConfig } from '@rspress/core'
import type { BuiltInThemeName, ThemeColors, ThemeName, ZpressConfig } from '@zpress/config'
import type { Paths } from '@zpress/core'
import { isBuiltInTheme, resolveDefaultColorMode } from '@zpress/theme'

import { getThemeCss } from './css.ts'
import { readJs } from './head/read.ts'
import { zpressPlugin } from './plugin.ts'

interface CreateRspressConfigOptions {
  readonly config: ZpressConfig
  readonly paths: Paths
  readonly logLevel?: 'info' | 'warn' | 'error' | 'silent'
}

interface HeadScriptOptions {
  readonly colorMode: string
  readonly themeName: string
}

const COLOR_MODE_DARK_JS = readJs('js/color-mode-dark.js')
const COLOR_MODE_LIGHT_JS = readJs('js/color-mode-light.js')
const VSCODE_DETECT_JS = readJs('js/vscode-detect.js')
const LOADER_DOTS_JS = readJs('js/loader-dots.js')

/**
 * Translate zpress config + sync engine output into a complete
 * Rspress configuration object.
 *
 * @param options - Config, paths, and optional log level
 * @returns Complete Rspress UserConfig object
 */
export function createRspressConfig(options: CreateRspressConfigOptions): UserConfig {
  const { config, paths, logLevel } = options

  const sidebar = loadGenerated({
    contentDir: paths.contentDir,
    name: 'sidebar.json',
    fallback: {},
  })
  const nav = loadGenerated({ contentDir: paths.contentDir, name: 'nav.json', fallback: [] })
  const workspaces = loadGenerated({
    contentDir: paths.contentDir,
    name: 'workspaces.json',
    fallback: [],
  })
  const gitBranch = detectGitBranch()

  const themeName = resolveThemeName(config)
  const colorMode = resolveColorMode({ config, themeName })
  const themeSwitcher = resolveThemeSwitcher(config)
  const themeColors = resolveThemeColors(config)
  const themeDarkColors = resolveThemeDarkColors(config)

  const themeCss = getThemeCss(themeName)
  const headScriptBody = buildHeadScriptBody({ colorMode, themeName })

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
      html: {
        tags: [
          {
            tag: 'style',
            children: themeCss,
            attrs: { 'data-zpress-theme-css': true },
            append: false,
            head: true,
          },
          {
            tag: 'script',
            children: `(function(){${headScriptBody}})()`,
            append: false,
            head: true,
          },
        ],
      },
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
      ...({
        sidebarAbove: resolveSidebarLinks({ config, position: 'above' }),
        sidebarBelow: resolveSidebarLinks({ config, position: 'below' }),
      } as Record<string, unknown>),
    },
  }
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Load a generated JSON file from the sync engine output, falling back
 * to a default value if the file does not exist yet.
 *
 * @private
 * @param params - Content directory, file name, and fallback value
 * @returns Parsed JSON content or the fallback value
 */
function loadGenerated<T>(params: {
  readonly contentDir: string
  readonly name: string
  readonly fallback: T
}): T {
  const p = path.resolve(params.contentDir, '.generated', params.name)
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: derived from known output directory
  if (!existsSync(p)) {
    process.stderr.write(
      `[zpress] Generated file not found: ${params.name} — run "zpress sync" first\n`
    )
    return params.fallback
  }
  try {
    // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: derived from known output directory
    return JSON.parse(readFileSync(p, 'utf8')) as T
  } catch {
    process.stderr.write(`[zpress] Failed to parse ${params.name} — returning fallback\n`)
    return params.fallback
  }
}

/**
 * Detect current git branch at build time — falls back to empty string.
 *
 * @private
 * @returns Current git branch name or empty string
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
 *
 * @private
 * @param config - Zpress config object
 * @returns Resolved theme name
 */
function resolveThemeName(config: ZpressConfig): ThemeName {
  if (config.theme && config.theme.name) {
    return config.theme.name
  }
  return 'base'
}

/**
 * Resolve the color mode from config, defaulting to the theme's natural mode.
 * For custom themes, defaults to 'toggle'.
 *
 * @private
 * @param params - Config and theme name
 * @returns Color mode string ('dark', 'light', or 'toggle')
 */
function resolveColorMode(params: {
  readonly config: ZpressConfig
  readonly themeName: ThemeName
}): string {
  if (params.config.theme && params.config.theme.colorMode) {
    return params.config.theme.colorMode
  }
  if (isBuiltInTheme(params.themeName)) {
    return resolveDefaultColorMode(params.themeName as BuiltInThemeName)
  }
  return 'toggle'
}

/**
 * Resolve whether the theme switcher is enabled.
 *
 * @private
 * @param config - Zpress config object
 * @returns True if the theme switcher is enabled
 */
function resolveThemeSwitcher(config: ZpressConfig): boolean {
  if (config.theme && config.theme.switcher) {
    return config.theme.switcher
  }
  return false
}

/**
 * Resolve theme color overrides, defaulting to empty object.
 *
 * @private
 * @param config - Zpress config object
 * @returns Theme color overrides
 */
function resolveThemeColors(config: ZpressConfig): ThemeColors {
  if (config.theme && config.theme.colors) {
    return config.theme.colors
  }
  return {}
}

/**
 * Resolve dark mode color overrides, defaulting to empty object.
 *
 * @private
 * @param config - Zpress config object
 * @returns Dark mode color overrides
 */
function resolveThemeDarkColors(config: ZpressConfig): ThemeColors {
  if (config.theme && config.theme.darkColors) {
    return config.theme.darkColors
  }
  return {}
}

/**
 * Resolve sidebar link items for a given position, defaulting to empty array.
 *
 * @private
 * @param params - Config and sidebar position
 * @returns Array of sidebar link items
 */
function resolveSidebarLinks(params: {
  readonly config: ZpressConfig
  readonly position: 'above' | 'below'
}): readonly { text: string; link: string; icon?: string | { id: string; color: string } }[] {
  const items = params.config.sidebar && params.config.sidebar[params.position]
  if (items) {
    return items
  }
  return []
}

/**
 * Generate the color mode fragment of the inline head script.
 * Reads from pre-minified JS asset files.
 *
 * @private
 * @param colorMode - Color mode string ('dark', 'light', or 'toggle')
 * @returns Inline JS string for forcing color mode
 */
function buildColorModeJs(colorMode: string): string {
  if (colorMode === 'dark') {
    return COLOR_MODE_DARK_JS
  }
  if (colorMode === 'light') {
    return COLOR_MODE_LIGHT_JS
  }
  // 'toggle' mode — no forced color mode; Rspress controls the toggle natively
  return ''
}

/**
 * Build the raw JS body for the inline head script (no wrapping tags).
 *
 * Handles three concerns synchronously, before React hydration:
 * 1. Force color mode — sets localStorage and toggles rp-dark class
 * 2. Set data-zp-theme — enables theme-scoped CSS immediately
 * 3. Detect vscode env — sets data-zpress-env so static vscode.css applies
 *
 * @private
 * @param options - Color mode and theme name
 * @returns Concatenated inline JS string
 */
function buildHeadScriptBody(options: HeadScriptOptions): string {
  const colorModeJs = buildColorModeJs(options.colorMode)
  const themeAttrJs = `document.documentElement.dataset.zpTheme=function(){try{var t=localStorage.getItem('zpress-theme');if(t)return t}catch(_){}return ${JSON.stringify(options.themeName)}}();`
  return [colorModeJs, themeAttrJs, VSCODE_DETECT_JS, LOADER_DOTS_JS].filter(Boolean).join(';')
}
