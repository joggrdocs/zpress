import { createPaths, loadConfig, sync } from '@zpress/core'
import { afterAll, beforeAll, bench, describe } from 'vitest'

import type { GeneratedFixture } from '../helpers/fixtures.ts'
import { TIERS, generateFixture } from '../helpers/fixtures.ts'

const fixtures = new Map<string, GeneratedFixture>()

beforeAll(() => {
  TIERS.forEach((tier) => fixtures.set(tier.name, generateFixture({ files: tier.files })))
})

afterAll(() => {
  fixtures.forEach((f) => f.cleanup())
})

describe('sync() (code)', () => {
  TIERS.forEach((tier) => {
    bench(`${tier.name} (~${tier.files} files)`, async () => {
      const fixture = fixtures.get(tier.name)
      if (fixture) {
        const paths = createPaths(fixture.dir)
        const [, config] = await loadConfig(paths.repoRoot)
        if (config) {
          await sync(config, { paths, quiet: true })
        }
      }
    })
  })
})
