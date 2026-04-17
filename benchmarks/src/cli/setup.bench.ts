import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, bench, beforeEach, describe } from 'vitest'

import { runCli } from '../helpers/exec.ts'

let tempDir: string

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zpress-bench-setup-'))
  // setup needs a package.json
  fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name":"bench-setup","private":true}', 'utf8')
})

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true })
})

describe('zpress setup (cli)', () => {
  bench('fresh project', () => {
    runCli(['setup'], tempDir)
  })
})
