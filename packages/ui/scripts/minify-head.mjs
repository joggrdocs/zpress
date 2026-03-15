/**
 * Pre-minify head asset files (CSS/JS) into dist/head/.
 *
 * Runs after rslib build. Uses esbuild (devDep) to minify
 * so the runtime read.ts has no dependency on esbuild.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, extname } from 'node:path'

import { transformSync } from 'esbuild'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = resolve(ROOT, 'src/head')
const DIST = resolve(ROOT, 'dist/head')

const SUPPORTED = new Set(['.css', '.js'])

function processDir(src, dist) {
  mkdirSync(dist, { recursive: true })
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = resolve(src, entry.name)
    const distPath = resolve(dist, entry.name)
    if (entry.isDirectory()) {
      processDir(srcPath, distPath)
      continue
    }
    const ext = extname(entry.name)
    if (!SUPPORTED.has(ext)) continue
    const content = readFileSync(srcPath, 'utf8')
    const { code } = transformSync(content, { loader: ext.slice(1), minify: true })
    writeFileSync(distPath, code)
  }
}

processDir(SRC, DIST)
