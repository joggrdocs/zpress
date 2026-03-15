import path from 'node:path'

import { describe, it, expect } from 'vitest'

import { createPaths } from '../src/paths'

describe('createPaths()', () => {
  it('should set repoRoot to resolved path', () => {
    const paths = createPaths('/project')
    expect(paths.repoRoot).toBe(path.resolve('/project'))
  })

  it('should set outputRoot ending with .zpress', () => {
    const paths = createPaths('/project')
    expect(paths.outputRoot).toMatch(/\.zpress$/)
  })

  it('should set contentDir under outputRoot', () => {
    const paths = createPaths('/project')
    expect(paths.contentDir.startsWith(paths.outputRoot)).toBeTruthy()
  })

  it('should set all paths as absolute', () => {
    const paths = createPaths('/project')
    expect(path.isAbsolute(paths.repoRoot)).toBeTruthy()
    expect(path.isAbsolute(paths.outputRoot)).toBeTruthy()
    expect(path.isAbsolute(paths.contentDir)).toBeTruthy()
    expect(path.isAbsolute(paths.publicDir)).toBeTruthy()
    expect(path.isAbsolute(paths.distDir)).toBeTruthy()
    expect(path.isAbsolute(paths.cacheDir)).toBeTruthy()
  })
})
