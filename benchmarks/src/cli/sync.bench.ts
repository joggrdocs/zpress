import { afterAll, beforeAll, bench, describe } from 'vitest'

import { runCli } from '../helpers/exec.ts'
import { FIXTURES, generateLargeFixture } from '../helpers/fixtures.ts'

let largeFixture: { readonly dir: string; readonly cleanup: () => void }

beforeAll(() => {
  largeFixture = generateLargeFixture()
})

afterAll(() => {
  largeFixture.cleanup()
})

describe('zpress sync (cli)', () => {
  bench('small project', () => {
    runCli(['sync', '--quiet'], FIXTURES.small)
  })

  bench('medium project', () => {
    runCli(['sync', '--quiet'], FIXTURES.medium)
  })

  bench('large project', () => {
    runCli(['sync', '--quiet'], largeFixture.dir)
  })
})
