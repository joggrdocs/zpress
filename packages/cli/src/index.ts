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

import build from './commands/build.ts'
import check from './commands/check.ts'
import cleanCmd from './commands/clean.ts'
import dev from './commands/dev.ts'
import diff from './commands/diff.ts'
import draft from './commands/draft.ts'
import dump from './commands/dump.ts'
import serve from './commands/serve.ts'
import setup from './commands/setup.ts'

declare const ZPRESS_VERSION: string

await cli({
  name: 'zpress',
  version: ZPRESS_VERSION,
  description: 'CLI for building and serving documentation',
  commands: {
    commands: { setup, dev, build, serve, check, diff, draft, clean: cleanCmd, dump },
  },
  help: {
    order: ['setup', 'dev', 'build', 'serve', 'check', 'diff', 'draft', 'clean', 'dump'],
  },
})
