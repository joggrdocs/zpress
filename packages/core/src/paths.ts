import path from 'node:path'

/**
 * All user-project paths derived from a single root directory.
 */
export interface Paths {
  readonly repoRoot: string
  readonly outputRoot: string
  readonly contentDir: string
  readonly publicDir: string
  readonly distDir: string
  readonly cacheDir: string
}

/**
 * Create all derived project paths from a resolved directory.
 */
export function createPaths(dir: string): Paths {
  const repoRoot = path.resolve(dir)
  const outputRoot = path.resolve(repoRoot, '.zpress')
  return {
    repoRoot,
    outputRoot,
    contentDir: path.resolve(outputRoot, 'content'),
    publicDir: path.resolve(outputRoot, 'public'),
    distDir: path.resolve(outputRoot, 'dist'),
    cacheDir: path.resolve(outputRoot, 'cache'),
  }
}
