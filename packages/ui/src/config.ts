import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import type { UserConfig } from '@rspress/core'
import type { Paths, ZpressConfig } from '@zpress/core'

import { zpressPlugin } from './plugin.ts'

interface CreateRspressConfigOptions {
  readonly config: ZpressConfig
  readonly paths: Paths
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
 * Translate zpress config + sync engine output into a complete
 * Rspress configuration object.
 */
export function createRspressConfig(options: CreateRspressConfigOptions): UserConfig {
  const { config, paths } = options

  const sidebar = loadGenerated(paths.contentDir, 'sidebar.json', {})
  const nav = loadGenerated(paths.contentDir, 'nav.json', [])
  const workspaces = loadGenerated(paths.contentDir, 'workspaces.json', [])
  const gitBranch = detectGitBranch()

  return {
    root: paths.contentDir,
    outDir: paths.distDir,

    llms: true,

    title: config.title ?? 'zpress',
    description: config.description ?? 'Documentation',

    logo: '/logo.svg',
    logoText: '',

    themeDir: path.resolve(import.meta.dirname, 'theme'),

    plugins: [zpressPlugin()],

    builderConfig: {
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
      darkMode: true,
      search: true,
      // Custom zpress data injected alongside standard Rspress themeConfig.
      // Accessed at runtime via useSite().site.themeConfig cast to unknown.
      ...({ workspaces } as Record<string, unknown>),
    },
  }
}
