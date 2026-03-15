import { readFileSync } from 'node:fs'
import path from 'node:path'

interface AssetError {
  readonly _tag: 'AssetError'
  readonly type: 'missing'
  readonly message: string
  readonly path: string
}

type AssetResult = readonly [AssetError, null] | readonly [null, string]

/**
 * Resolve path relative to dist/head/.
 *
 * After Rslib bundles this into dist/index.mjs, import.meta.dirname
 * points to dist/. The pre-minified assets live in dist/head/, so
 * we join with 'head' to reach them.
 *
 * Assumption: this module must be loaded from a filesystem-backed ESM
 * context. If re-bundled by a downstream tool, import.meta.dirname may
 * be rewritten to a virtual path and resolution will fail.
 */
function resolveAsset(relativePath: string): string {
  return path.resolve(import.meta.dirname, 'head', relativePath)
}

/**
 * Read a pre-minified asset file from the head asset directory.
 *
 * Returns a Result tuple: [null, content] on success, [AssetError, null]
 * if the asset is missing (e.g. postbuild has not run).
 */
function readAsset(relativePath: string): AssetResult {
  const fullPath = resolveAsset(relativePath)
  try {
    // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: relative to known asset directory
    const content = readFileSync(fullPath, 'utf8').trim()
    return [null, content]
  } catch {
    const error: AssetError = {
      _tag: 'AssetError',
      type: 'missing',
      message: `Missing head asset: ${relativePath} — run "pnpm build" in packages/ui first`,
      path: fullPath,
    }
    return [error, null]
  }
}

/**
 * Read a CSS file from the head asset directory.
 * Files are pre-minified at build time by scripts/minify-head.mjs.
 */
export function readCss(relativePath: string): string {
  const [error, content] = readAsset(relativePath)
  if (error) {
    process.stderr.write(`[zpress] ${error.message}\n`)
    return ''
  }
  return content
}

/**
 * Read a JS file from the head asset directory.
 * Files are pre-minified at build time by scripts/minify-head.mjs.
 */
export function readJs(relativePath: string): string {
  const [error, content] = readAsset(relativePath)
  if (error) {
    process.stderr.write(`[zpress] ${error.message}\n`)
    return ''
  }
  return content
}
