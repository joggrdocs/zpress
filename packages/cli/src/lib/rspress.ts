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
 * Start the Rspress dev server with zpress configuration.
 *
 * @param options - Dev server configuration including config and paths
 * @returns A promise that resolves when the server starts
 */
export async function startDevServer(options: ServerOptions): Promise<void> {
  const rspressConfig = createRspressConfig(options)
  await dev({
    appDirectory: options.paths.repoRoot,
    docDirectory: options.paths.contentDir,
    config: rspressConfig,
    configFilePath: '',
    extraBuilderConfig: {
      server: {
        port: DEFAULT_PORT,
      },
    },
  })
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
