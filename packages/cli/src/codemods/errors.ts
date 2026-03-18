/**
 * Error types for codemod loading and execution.
 */

import type { Result } from './types.ts'

export type CodemodErrorType =
  | 'no_config'
  | 'read_failed'
  | 'write_failed'
  | 'transform_failed'
  | 'manifest_corrupted'
  | 'invalid_version'

export interface CodemodError {
  readonly _tag: 'CodemodError'
  readonly type: CodemodErrorType
  readonly message: string
}

export type CodemodResult<T> = Result<T, CodemodError>

/**
 * Create a CodemodError with the given type and message.
 *
 * @param type - The error type discriminant
 * @param message - Human-readable error message
 * @returns A CodemodError object
 */
export function codemodError(type: CodemodErrorType, message: string): CodemodError {
  return {
    _tag: 'CodemodError',
    type,
    message,
  }
}
