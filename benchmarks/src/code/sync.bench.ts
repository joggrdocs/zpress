import { createPaths, loadConfig, sync } from '@zpress/core'
import { afterAll, beforeAll, bench, describe } from 'vitest'

import type { GeneratedFixture } from '../helpers/fixtures.ts'
import { generateFixture } from '../helpers/fixtures.ts'

let small: GeneratedFixture
let medium: GeneratedFixture
let large: GeneratedFixture
let xl: GeneratedFixture

beforeAll(() => {
  small = generateFixture({ sections: 5, directories: 2, files: 5 })
  medium = generateFixture({ sections: 5, directories: 5, files: 6 })
  large = generateFixture({ sections: 6, directories: 5, files: 10 })
  xl = generateFixture({ sections: 5, directories: 10, files: 15 })
})

afterAll(() => {
  small.cleanup()
  medium.cleanup()
  large.cleanup()
  xl.cleanup()
})

describe('sync() (code)', () => {
  bench('small (~50 files)', async () => {
    const paths = createPaths(small.dir)
    const [, config] = await loadConfig(paths.repoRoot)
    if (config) {
      await sync(config, { paths, quiet: true })
    }
  })

  bench('medium (~150 files)', async () => {
    const paths = createPaths(medium.dir)
    const [, config] = await loadConfig(paths.repoRoot)
    if (config) {
      await sync(config, { paths, quiet: true })
    }
  })

  bench('large (~300 files)', async () => {
    const paths = createPaths(large.dir)
    const [, config] = await loadConfig(paths.repoRoot)
    if (config) {
      await sync(config, { paths, quiet: true })
    }
  })

  bench('xl (~750 files)', async () => {
    const paths = createPaths(xl.dir)
    const [, config] = await loadConfig(paths.repoRoot)
    if (config) {
      await sync(config, { paths, quiet: true })
    }
  })
})
