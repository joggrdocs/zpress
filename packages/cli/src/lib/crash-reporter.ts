import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { arch, platform, version as nodeVersion } from 'node:process'

import { toError } from './error.ts'

/**
 * Source of the crash — where it was caught.
 */
export type CrashSource = 'middleware' | 'uncaughtException' | 'unhandledRejection'

/**
 * Options for reporting a crash.
 */
export interface CrashReportOptions {
  readonly error: unknown
  readonly source: CrashSource
  readonly command?: string
  readonly args?: Record<string, unknown>
  readonly version: string
}

/**
 * Result of a crash report attempt.
 *
 * - `ok: true` — log written successfully, `logPath` is the file path
 * - `ok: false` — log write failed, `error` describes why, `logPath` is null
 *
 * `message` is always the original error's message regardless of write outcome.
 */
export interface CrashResult {
  readonly ok: boolean
  readonly message: string
  readonly logPath: string | null
  readonly error: Error | null
}

/**
 * Report a fatal crash: build a structured report and write it to disk.
 *
 * @param options - Crash context including the caught error, source, and optional command info
 * @returns A CrashResult indicating whether the log was written and where
 */
export function reportCrash(options: CrashReportOptions): CrashResult {
  const normalized = toError(options.error)
  const report = buildReport(normalized, options)
  return writeCrashLog(report, normalized.message)
}

// ---------------------------------------------------------------------------

/**
 * Structured crash report written to disk as JSON.
 *
 * @private
 */
interface CrashReport {
  readonly timestamp: string
  readonly level: 'fatal'
  readonly source: CrashSource
  readonly command: string | null
  readonly args: Record<string, unknown> | null
  readonly error: {
    readonly name: string
    readonly message: string
    readonly stack: string | null
  }
  readonly env: {
    readonly node: string
    readonly platform: string
    readonly arch: string
    readonly zpress: string
  }
}

/**
 * Assemble a CrashReport from the normalized error and options.
 *
 * @private
 * @param error - The normalized Error instance
 * @param options - Original crash report options
 * @returns A structured CrashReport object
 */
function buildReport(error: Error, options: CrashReportOptions): CrashReport {
  return {
    timestamp: new Date().toISOString(),
    level: 'fatal',
    source: options.source,
    command: options.command ?? null,
    args: options.args ?? null,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    },
    env: {
      node: nodeVersion,
      platform: platform,
      arch: arch,
      zpress: options.version,
    },
  }
}

/**
 * Write a crash report to a JSON file in the OS temp directory.
 *
 * Creates `<tmpdir>/zpress/` if it doesn't exist. Each crash gets a unique
 * filename based on the current timestamp and a random suffix.
 *
 * @private
 * @param report - The structured crash report to serialize
 * @param message - The original error message (returned in the result)
 * @returns A CrashResult with the write outcome
 */
function writeCrashLog(report: CrashReport, message: string): CrashResult {
  try {
    const dir = join(tmpdir(), 'zpress')
    mkdirSync(dir, { recursive: true })

    const timestamp = report.timestamp.replace(/[:.]/g, '-')
    const filename = `error-${timestamp}-${randomUUID()}.log`
    const logPath = join(dir, filename)

    writeFileSync(logPath, JSON.stringify(report, null, 2), 'utf-8')

    return { ok: true, message, logPath, error: null }
  } catch (caught) {
    return { ok: false, message, logPath: null, error: toError(caught) }
  }
}
