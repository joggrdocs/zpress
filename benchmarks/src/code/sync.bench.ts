import { afterAll, beforeAll, bench, describe } from 'vitest'

import { createPaths, loadConfig, sync } from '@zpress/core'

import { FIXTURES, generateLargeFixture } from '../helpers/fixtures.ts'

let largeFixture: { readonly dir: string; readonly cleanup: () => void }

beforeAll(() => {
  largeFixture = generateLargeFixture()
})

afterAll(() => {
  largeFixture.cleanup()
})

describe('sync() (code)', () => {
  bench('small project', async () => {
    const paths = createPaths(FIXTURES.small)
    const [, config] = await loadConfig(paths.repoRoot)
    if (config) {
      await sync(config, { paths, quiet: true })
    }
  })

  bench('medium project', async () => {
    const paths = createPaths(FIXTURES.medium)
    const [, config] = await loadConfig(paths.repoRoot)
    if (config) {
      await sync(config, { paths, quiet: true })
    }
  })

  bench('large project', async () => {
    const paths = createPaths(largeFixture.dir)
    const [, config] = await loadConfig(paths.repoRoot)
    if (config) {
      await sync(config, { paths, quiet: true })
    }
  })
})
