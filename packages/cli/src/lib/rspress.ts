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
 * Callback invoked when the dev server should be notified of config changes.
 * Currently logs a message prompting manual restart, as Rspress does not
 * support runtime config reloading.
 */
export type OnConfigReload = () => void

/**
 * Start the Rspress dev server with zpress configuration.
 *
 * Returns a callback that will be invoked when config changes are detected.
 * Currently, this logs a message to the user to manually restart the server,
 * as Rspress's dev() function does not support runtime config reloading.
 *
 * The server runs asynchronously and this function returns immediately with
 * the config reload callback.
 *
 * @param options - Dev server configuration including config and paths
 * @returns A callback to invoke when config changes (currently logs restart prompt)
 */
export function startDevServer(options: ServerOptions): OnConfigReload {
  const rspressConfig = createRspressConfig(options)

  // Start server asynchronously (non-blocking)
  dev({
    appDirectory: options.paths.repoRoot,
    docDirectory: options.paths.contentDir,
    config: rspressConfig,
    configFilePath: '',
    extraBuilderConfig: {
      server: {
        port: DEFAULT_PORT,
      },
    },
  }).catch((error) => {
    const errorMessage = (() => {
      if (error instanceof Error) {
        return error.message
      }
      return String(error)
    })()
    process.stderr.write(`Dev server error: ${errorMessage}\n`)
    process.exit(1)
  })

  // Return callback that will be invoked when config changes
  return () => {
    process.stdout.write('\n⚠️  Config changed — please restart dev server (Ctrl+C then `zpress dev`)\n\n')
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
