/**
 * Core types for the zpress codemod system.
 */

/**
 * Result type for error handling without exceptions.
 *
 * Success: `[null, value]`
 * Failure: `[error, null]`
 */
export type Result<T, E = Error> = readonly [E, null] | readonly [null, T]

/**
 * Describes a single change made by a codemod transform.
 */
export interface TransformChange {
  readonly description: string
  readonly line?: number
}

/**
 * Output of a successful codemod transform.
 */
export interface TransformOutput {
  readonly source: string
  readonly changes: readonly TransformChange[]
}

/**
 * Parameters passed to a codemod's transform function.
 */
export interface TransformParams {
  readonly configPath: string
  readonly source: string
}

/**
 * A single codemod definition.
 *
 * Each codemod targets a specific version range and contains a transform
 * function that modifies the config file source text.
 */
export interface Codemod {
  /**
   * Unique identifier (e.g. `'title-from-to-title-config'`).
   */
  readonly id: string
  /**
   * Semver version this codemod was introduced in.
   */
  readonly version: string
  /**
   * Human-readable description of what this codemod does.
   */
  readonly description: string
  /**
   * URL to the relevant changelog entry.
   */
  readonly changelog?: string
  /**
   * Whether this codemod addresses a breaking change.
   */
  readonly breaking: boolean
  /**
   * Transform function that modifies config source text.
   */
  readonly transform: (params: TransformParams) => TransformOutput
}

/**
 * Record of a codemod that has been applied.
 */
export interface AppliedCodemod {
  readonly id: string
  readonly appliedAt: string
}

/**
 * Persistent manifest tracking which codemods have been applied.
 */
export interface CodemodManifest {
  readonly version: string
  readonly applied: readonly AppliedCodemod[]
}

/**
 * Summary of a single codemod run (applied or dry-run).
 */
export interface CodemodRunSummary {
  readonly id: string
  readonly description: string
  readonly breaking: boolean
  readonly changes: readonly TransformChange[]
  readonly changelog?: string
}

/**
 * Result of running all pending codemods.
 */
export interface MigrateResult {
  readonly applied: readonly CodemodRunSummary[]
  readonly skipped: readonly string[]
  readonly source: string
}

/**
 * Options for the migrate runner.
 */
export interface MigrateOptions {
  readonly configPath: string
  readonly source: string
  readonly fromVersion: string
  readonly toVersion: string
  readonly dryRun?: boolean
  readonly ids?: readonly string[]
}
