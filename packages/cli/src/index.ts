#!/usr/bin/env node
/*
|==========================================================================
| zpress CLI
|==========================================================================
|
| CLI for building and serving documentation.
| Provides commands for sync, dev, build, and serve.
|
*/

// oxlint-disable-next-line import/no-unassigned-import -- side-effect: installs globalThis.require for ESM compat
import './shims/require.ts'
import { cli } from '@kidd-cli/core'

import { buildCommand } from './commands/build.ts'
import { checkCommand } from './commands/check.ts'
import { cleanCommand } from './commands/clean.ts'
import { devCommand } from './commands/dev.ts'
import { diffCommand } from './commands/diff.ts'
import { draftCommand } from './commands/draft.ts'
import { dumpCommand } from './commands/dump.ts'
import { serveCommand } from './commands/serve.ts'
import { setupCommand } from './commands/setup.ts'

declare const ZPRESS_VERSION: string

await cli({
  name: 'zpress',
  version: ZPRESS_VERSION,
  description: 'CLI for building and serving documentation',
  commands: {
    commands: {
      setup: setupCommand,
      dev: devCommand,
      build: buildCommand,
      serve: serveCommand,
      check: checkCommand,
      diff: diffCommand,
      draft: draftCommand,
      clean: cleanCommand,
      dump: dumpCommand,
    },
    order: ['setup', 'dev', 'build', 'serve', 'check', 'diff', 'draft', 'clean', 'dump'],
  },
})
