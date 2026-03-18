import { spawn } from 'node:child_process'
import { once } from 'node:events'
import type { Server } from 'node:http'
import { platform } from 'node:os'

import { dev, build, serve } from '@rspress/core'
import type { Paths, ZpressConfig } from '@zpress/core'
import { createRspressConfig } from '@zpress/ui'
import { match } from 'ts-pattern'

import { toError } from './error'

/**
 * Default port used by the development and preview servers.
 */
export const DEFAULT_PORT = 6174

interface ServerOptions {
  readonly config: ZpressConfig
  readonly paths: Paths
}

/**
 * Server instance returned by Rspress dev() — the RsbuildDevServer.
 *
 * The `httpServer` property is the underlying Node.js HTTP server,
 * needed to confirm the port is fully released after close().
 */
interface ServerInstance {
  readonly close: () => Promise<void>
  readonly httpServer: Server | null
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

  async function startServer(config: ZpressConfig): Promise<boolean> {
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
            strictPort: true,
          },
        },
      })
      return true
    } catch (error) {
      process.stderr.write(`Dev server error: ${toError(error).message}\n`)
      return false
    }
  }

  // Start initial server — exit if it fails on first boot
  const started = await startServer(options.config)
  if (!started) {
    process.exit(1)
  }

  // Return callback that restarts server with new config
  return async (newConfig: ZpressConfig) => {
    process.stdout.write('\n🔄 Config changed — restarting dev server...\n')

    // Close existing server and wait for port release
    if (serverInstance) {
      const httpServer = serverInstance.httpServer
      // Snapshot listening state before close() flips it to false
      const listeningServer =
        httpServer !== null && httpServer.listening ? httpServer : null
      try {
        await serverInstance.close()
      } catch (error) {
        process.stderr.write(`Error closing server: ${toError(error).message}\n`)
      }
      // Rsbuild's close() destroys tracked sockets and calls httpServer.close(),
      // but the 'close' event fires only once the port is actually freed.
      if (listeningServer) {
        const PORT_RELEASE_TIMEOUT = 5_000
        await Promise.race([
          once(listeningServer, 'close'),
          new Promise((resolve) => setTimeout(resolve, PORT_RELEASE_TIMEOUT)),
        ])
      }
      serverInstance = null
    }

    // Start new server with fresh config
    const restarted = await startServer(newConfig)
    if (restarted) {
      process.stdout.write('✅ Dev server restarted\n\n')
    } else {
      process.stderr.write('⚠️  Dev server failed to restart — fix the config and save again\n\n')
    }
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
