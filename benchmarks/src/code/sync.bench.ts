import { createPaths, loadConfig, sync } from '@zpress/core'
import type { ZpressConfig } from '@zpress/core'
import { afterAll, beforeAll, bench, describe } from 'vitest'

import type { GeneratedFixture } from '../helpers/fixtures.ts'
import { TIERS, generateFixture } from '../helpers/fixtures.ts'

interface PreparedFixture {
  readonly fixture: GeneratedFixture
  readonly config: ZpressConfig
  readonly paths: ReturnType<typeof createPaths>
}

const prepared = new Map<string, PreparedFixture>()

beforeAll(async () => {
  for (const tier of TIERS) {
    const fixture = generateFixture({ files: tier.files })
    const paths = createPaths(fixture.dir)
    const [, config] = await loadConfig(paths.repoRoot)
    if (config) {
      prepared.set(tier.name, { fixture, config, paths })
    }
  }
})

afterAll(() => {
  prepared.forEach((p) => p.fixture.cleanup())
})

describe('sync() (code)', () => {
  TIERS.forEach((tier) => {
    bench(`${tier.name} (~${tier.files} files)`, async () => {
      const p = prepared.get(tier.name)
      if (p) {
        await sync(p.config, { paths: p.paths, quiet: true })
      }
    })
  })
})
