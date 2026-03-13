import { command } from '@kidd-cli/core'
import { createPaths, loadConfig, loadManifest, resolveEntries } from '@zpress/core'
import type { ResolvedEntry, SyncContext } from '@zpress/core'

/**
 * Slim shape for JSON output — drops page data and keeps only the navigation tree.
 */
interface DumpEntry {
  readonly text: string
  readonly link?: string
  readonly collapsible?: boolean
  readonly hidden?: boolean
  readonly isolated?: boolean
  readonly items?: DumpEntry[]
}

/**
 * @private
 */
function maybeLink(link: string | undefined): { readonly link: string } | Record<string, never> {
  if (link) {
    return { link }
  }
  return {}
}

/**
 * @private
 */
function maybeCollapsible(
  collapsible: boolean | undefined
): { readonly collapsible: boolean } | Record<string, never> {
  if (collapsible) {
    return { collapsible }
  }
  return {}
}

/**
 * @private
 */
function maybeHidden(
  hidden: boolean | undefined
): { readonly hidden: boolean } | Record<string, never> {
  if (hidden) {
    return { hidden }
  }
  return {}
}

/**
 * @private
 */
function maybeIsolated(
  isolated: boolean | undefined
): { readonly isolated: boolean } | Record<string, never> {
  if (isolated) {
    return { isolated }
  }
  return {}
}

/**
 * @private
 */
function maybeItems(
  items: readonly ResolvedEntry[] | undefined
): { readonly items: DumpEntry[] } | Record<string, never> {
  if (items && items.length > 0) {
    return { items: toTree(items) }
  }
  return {}
}

/**
 * @private
 */
function toTree(entries: readonly ResolvedEntry[]): DumpEntry[] {
  return entries.map(buildDumpEntry)
}

/**
 * @private
 */
function buildDumpEntry(entry: ResolvedEntry): DumpEntry {
  return {
    text: entry.title,
    ...maybeLink(entry.link),
    ...maybeCollapsible(entry.collapsible),
    ...maybeHidden(entry.hidden),
    ...maybeIsolated(entry.isolated),
    ...maybeItems(entry.items as readonly ResolvedEntry[] | undefined),
  }
}

export const dumpCommand = command({
  description: 'Resolve and print the full entry tree as JSON',
  handler: async (ctx) => {
    const paths = createPaths(process.cwd())
    const [configErr, config] = await loadConfig(paths.repoRoot)
    if (configErr) {
      ctx.logger.error(configErr.message)
      if (configErr.errors && configErr.errors.length > 0) {
        configErr.errors.map((err) => {
          const path = err.path.join('.')
          return ctx.logger.error(`  ${path}: ${err.message}`)
        })
      }
      process.exit(1)
    }
    const previousManifest = await loadManifest(paths.contentDir)

    const syncCtx: SyncContext = {
      repoRoot: paths.repoRoot,
      outDir: paths.contentDir,
      config,
      previousManifest,
      manifest: { files: {}, timestamp: Date.now() },
      quiet: true,
    }

    const [resolveErr, resolved] = await resolveEntries(config.sections, syncCtx)
    if (resolveErr) {
      ctx.logger.error(resolveErr.message)
      process.exit(1)
    }
    const tree = toTree(resolved)
    ctx.output.raw(`${JSON.stringify(tree, null, 2)}\n`)
  },
})
