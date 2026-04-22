import { middleware } from '@kidd-cli/core'

import { reportCrash, writeFatalToStderr } from '../lib/crash-reporter.ts'

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
