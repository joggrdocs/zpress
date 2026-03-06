import path from 'node:path'

import { match } from 'ts-pattern'

/**
 * Convert "/guides/add-api-route" → "guides/add-api-route.md"
 *
 * Accepts an optional extension override (e.g. `'.mdx'`) to preserve
 * the source file format through to the output path.
 *
 * @param link - URL-style link path (e.g. "/guides/add-api-route")
 * @param ext - Output file extension (defaults to ".md")
 * @returns Relative output path with extension (e.g. "guides/add-api-route.md")
 */
export function linkToOutputPath(link: string, ext = '.md'): string {
  const clean = match(link.startsWith('/'))
    .with(true, () => link.slice(1))
    .otherwise(() => link)
  if (clean === '' || clean === '/') {
    return `index${ext}`
  }
  return `${clean}${ext}`
}

/**
 * Return the output extension for a source file path.
 *
 * Preserves `.mdx` when present so Rspress processes the file through
 * the MDX pipeline. All other extensions default to `.md`.
 *
 * @param filePath - Absolute or relative path to a source file
 * @returns ".mdx" for MDX files, ".md" for everything else
 */
export function sourceExt(filePath: string): string {
  return match(path.extname(filePath))
    .with('.mdx', () => '.mdx')
    .otherwise(() => '.md')
}

/**
 * Extract the static base directory from a glob pattern.
 *
 * @param globPattern - Glob pattern to extract the base from
 * @returns Static directory path before any glob characters
 */
export function extractBaseDir(globPattern: string): string {
  const firstGlobChar = globPattern.search(/[*?{}[\]]/)
  if (firstGlobChar === -1) {
    return path.dirname(globPattern)
  }
  const beforeGlob = globPattern.slice(0, firstGlobChar)
  return match(beforeGlob.endsWith('/'))
    .with(true, () => beforeGlob.slice(0, -1))
    .otherwise(() => path.dirname(beforeGlob))
}
