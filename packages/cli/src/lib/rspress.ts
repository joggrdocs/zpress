import { spawn } from 'node:child_process'
import { platform } from 'node:os'

import { dev, build, serve } from '@rspress/core'
import type { Paths, ZpressConfig } from '@zpress/core'
import { createRspressConfig } from '@zpress/ui'
import { match } from 'ts-pattern'

export const DEFAULT_PORT = 6174

interface ServerOptions {
  readonly config: ZpressConfig
  readonly paths: Paths
}

/**
 * Server instance returned by Rspress dev() - allows closing the server.
 */
interface ServerInstance {
  readonly close: () => Promise<void>
}

/**
 * Callback invoked when the dev server should restart due to config changes.
 */
export type OnConfigReload = (newConfig: ZpressConfig) => Promise<void>

/**
 * Start the Rspress dev server with zpress configuration.
 *
 * Returns a callback that will restart the server when invoked with updated config.
 * The callback closes the current server instance and starts a new one with the
 * fresh configuration values.
 *
 * @param options - Dev server configuration including config and paths
 * @returns An async callback to invoke when config changes with new config (restarts server)
 */
export async function startDevServer(
  options: ServerOptions
): Promise<(newConfig: ZpressConfig) => Promise<void>> {
  const { paths } = options
  // oxlint-disable-next-line functional/no-let -- mutable server instance for restart capability
  let serverInstance: ServerInstance | null = null

  async function startServer(config: ZpressConfig): Promise<void> {
    const rspressConfig = createRspressConfig({ config, paths })
    try {
      serverInstance = await dev({
        appDirectory: paths.repoRoot,
        docDirectory: paths.contentDir,
        config: rspressConfig,
        configFilePath: '',
        extraBuilderConfig: {
          server: {
            port: DEFAULT_PORT,
          },
        },
      })
    } catch (error) {
      const errorMessage = (() => {
        if (error instanceof Error) {
          return error.message
        }
        return String(error)
      })()
      process.stderr.write(`Dev server error: ${errorMessage}\n`)
      process.exit(1)
    }
  }

  // Start initial server
  await startServer(options.config)

  // Return callback that restarts server with new config
  return async (newConfig: ZpressConfig) => {
    process.stdout.write('\n🔄 Config changed — restarting dev server...\n')

    // Close existing server
    if (serverInstance) {
      try {
        await serverInstance.close()
      } catch (error) {
        const errorMessage = (() => {
          if (error instanceof Error) {
            return error.message
          }
          return String(error)
        })()
        process.stderr.write(`Error closing server: ${errorMessage}\n`)
      }
    }

    // Start new server with fresh config
    await startServer(newConfig)

    process.stdout.write('✅ Dev server restarted\n\n')
  }
}

/**
 * Build the Rspress site with zpress configuration.
 *
 * @param options - Build configuration including config and paths
 * @returns A promise that resolves when the build completes
 */
export async function buildSite(options: ServerOptions): Promise<void> {
  const rspressConfig = createRspressConfig(options)
  await build({
    docDirectory: options.paths.contentDir,
    config: rspressConfig,
    configFilePath: '',
  })
}

/**
 * Build the Rspress site for check/validation purposes.
 *
 * Uses the standard Rspress build (no log-level suppression) so that
 * `remarkLink`'s deadlink diagnostics are written to stderr and can be
 * captured by the calling code. The caller is responsible for swallowing
 * stderr output so it doesn't reach the terminal.
 *
 * @param options - Build configuration including config and paths
 * @returns A promise that resolves when the build completes
 */
export async function buildSiteForCheck(options: ServerOptions): Promise<void> {
  const rspressConfig = createRspressConfig(options)
  await build({
    docDirectory: options.paths.contentDir,
    config: rspressConfig,
    configFilePath: '',
  })
}

/**
 * Serve the built Rspress site (static preview).
 *
 * @param options - Serve configuration including config and paths
 * @returns A promise that resolves when the server starts
 */
export async function serveSite(options: ServerOptions): Promise<void> {
  const rspressConfig = createRspressConfig(options)
  await serve({
    config: rspressConfig,
    configFilePath: '',
    port: DEFAULT_PORT,
  })
}

/**
 * Open a URL in the default browser (cross-platform).
 *
 * @param url - The URL to open in the default browser
 */
export function openBrowser(url: string): void {
  const os = platform()
  const { cmd, args } = match(os)
    .with('darwin', () => ({ cmd: 'open', args: [url] }))
    .with('win32', () => ({ cmd: 'cmd', args: ['/c', 'start', url] }))
    .otherwise(() => ({ cmd: 'xdg-open', args: [url] }))
  spawn(cmd, args, { stdio: 'ignore', detached: true }).unref()
}
