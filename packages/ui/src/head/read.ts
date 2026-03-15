import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Resolve path relative to dist/head/.
 *
 * After Rslib bundles this into dist/index.mjs, import.meta.dirname
 * points to dist/. The pre-minified assets live in dist/head/, so
 * we join with 'head' to reach them.
 */
function resolveAsset(relativePath: string): string {
  return path.resolve(import.meta.dirname, 'head', relativePath)
}

/**
 * Read a CSS file from the head asset directory.
 * Files are pre-minified at build time by scripts/minify-head.mjs.
 */
export function readCss(relativePath: string): string {
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: relative to known asset directory
  return readFileSync(resolveAsset(relativePath), 'utf8').trim()
}

/**
 * Read a JS file from the head asset directory.
 * Files are pre-minified at build time by scripts/minify-head.mjs.
 */
export function readJs(relativePath: string): string {
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: relative to known asset directory
  return readFileSync(resolveAsset(relativePath), 'utf8').trim()
}
