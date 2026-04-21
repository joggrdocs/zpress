import { middleware } from '@kidd-cli/core'

import { reportCrash } from '../lib/crash-reporter.ts'
import type { CrashResult } from '../lib/crash-reporter.ts'

/**
 * Create an error boundary middleware that catches unhandled exceptions
 * from command handlers, writes a crash log, and exits with a fatal message.
 *
 * Must be registered as the **first** middleware in the `cli()` stack so
 * it wraps the entire handler chain.
 *
 * @returns A kidd-cli Middleware instance
 */
export function errorBoundary(): ReturnType<typeof middleware> {
  return middleware(async (ctx, next) => {
    try {
      await next()
    } catch (error) {
      const commandPath = ctx.meta.command.join(' ')
      const result = reportCrash({
        error,
        source: 'middleware',
        command: commandPath || undefined,
        args: ctx.args as Record<string, unknown>,
        version: ctx.meta.version,
      })

      writeFatalToStderr(result)
      process.exit(1)
    }
  })
}

// ---------------------------------------------------------------------------

/**
 * Write a fatal error message to stderr based on the crash result.
 *
 * @private
 * @param result - The CrashResult from reportCrash
 */
function writeFatalToStderr(result: CrashResult): void {
  if (result.ok) {
    process.stderr.write(`\n✖ Fatal Error: ${result.message}\n  Full log: ${result.logPath}\n\n`)
  } else {
    process.stderr.write(`\n✖ Fatal Error: ${result.message}\n\n`)
  }
}
