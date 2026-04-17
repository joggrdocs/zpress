import { afterAll, beforeAll, bench, describe } from 'vitest'

import { runCli } from '../helpers/exec.ts'
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

describe('zpress build (cli)', () => {
  bench('small (~50 files)', () => {
    runCli(['build', '--no-check', '--quiet'], small.dir)
  })

  bench('medium (~150 files)', () => {
    runCli(['build', '--no-check', '--quiet'], medium.dir)
  })

  bench('large (~300 files)', () => {
    runCli(['build', '--no-check', '--quiet'], large.dir)
  })

  bench('xl (~750 files)', () => {
    runCli(['build', '--no-check', '--quiet'], xl.dir)
  })
})
