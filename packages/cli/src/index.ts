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

import { cli } from '@kidd-cli/core'

import { buildCommand } from './commands/build.ts'
import { checkCommand } from './commands/check.ts'
import { cleanCommand } from './commands/clean.ts'
import { devCommand } from './commands/dev.ts'
import { draftCommand } from './commands/draft.ts'
import { dumpCommand } from './commands/dump.ts'
import { generateCommand } from './commands/generate.ts'
import { migrateCommand } from './commands/migrate.ts'
import { serveCommand } from './commands/serve.ts'
import { setupCommand } from './commands/setup.ts'
import { syncCommand } from './commands/sync.ts'

declare const ZPRESS_VERSION: string

await cli({
  name: 'zpress',
  version: ZPRESS_VERSION,
  description: 'CLI for building and serving documentation',
  commands: {
    sync: syncCommand,
    dev: devCommand,
    build: buildCommand,
    check: checkCommand,
    draft: draftCommand,
    serve: serveCommand,
    clean: cleanCommand,
    dump: dumpCommand,
    setup: setupCommand,
    generate: generateCommand,
    migrate: migrateCommand,
  },
})
