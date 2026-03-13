/**
 * Error types for config loading and validation.
 */

import type { ZodError } from 'zod'

import type { Result } from './types.ts'

// ── Error types ──────────────────────────────────────────────

export type ConfigErrorType =
  | 'not_found'
  | 'parse_error'
  | 'validation_failed'
  | 'empty_sections'
  | 'missing_field'
  | 'invalid_entry'
  | 'invalid_section'
  | 'invalid_field'
  | 'invalid_icon'
  | 'invalid_theme'
  | 'duplicate_prefix'
  | 'unknown'

export interface ConfigError {
  readonly _tag: 'ConfigError'
  readonly type: ConfigErrorType
  readonly message: string
  readonly errors?: readonly {
    readonly path: readonly (string | number)[]
    readonly message: string
  }[]
}

// ── Result types ─────────────────────────────────────────────

export type ConfigResult<T> = Result<T, ConfigError>

// ── Error constructors ───────────────────────────────────────

export function configError(type: ConfigErrorType, message: string): ConfigError {
  return {
    _tag: 'ConfigError',
    type,
    message,
  }
}

export function configErrorFromZod(zodError: ZodError): ConfigError {
  return {
    _tag: 'ConfigError',
    type: 'validation_failed',
    message: 'Configuration validation failed',
    errors: zodError.issues.map((err) => ({
      path: err.path.filter(
        (p): p is string | number => typeof p === 'string' || typeof p === 'number'
      ),
      message: err.message,
    })),
  }
}
