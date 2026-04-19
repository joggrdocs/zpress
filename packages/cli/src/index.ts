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
import sync from './commands/sync.ts'

declare const __KIDD_VERSION__: string

await cli({
  name: 'zpress',
  version: __KIDD_VERSION__,
  description: 'CLI for building and serving documentation',
  commands: { build, check, clean: cleanCmd, dev, diff, draft, dump, serve, setup, sync },
  help: {
    order: ['setup', 'dev', 'build', 'serve', 'sync', 'check', 'diff', 'draft', 'clean', 'dump'],
  },
})
