/**
 * Codemod: Migrate deprecated `titleFrom` / `titleTransform` to `title: { from, transform }`.
 *
 * Introduced in 0.4.0 — the `titleFrom` and `titleTransform` properties on Section
 * are replaced by the unified `title: { from, transform }` object syntax.
 *
 * @example
 * Before:
 * ```ts
 * { title: 'Guides', titleFrom: 'heading', titleTransform: myFn }
 * ```
 *
 * After:
 * ```ts
 * { title: { from: 'heading', transform: myFn } }
 * ```
 */

import type { Codemod, TransformChange, TransformOutput, TransformParams } from '../types.ts'

/**
 * Matches `titleFrom: 'value'` with surrounding whitespace/comma.
 * Captures: [1] = value (e.g. 'heading')
 */
const TITLE_FROM_PATTERN = /[ \t]*titleFrom:\s*['"](\w+)['"][, \t]*/g

/**
 * Matches `titleTransform: <expression>` where the expression may span
 * multiple lines (arrow functions, block-bodied arrows, etc.).
 *
 * Terminates at the first of:
 * - Optional comma + newline + next property key (`\w+:`)
 * - Optional comma + newline + closing brace/bracket (end of object/array)
 *
 * The newline requirement prevents inline `}` in block bodies like
 * `(v) => { return v.trim() }` from prematurely ending the capture.
 *
 * Captures: [1] = expression value
 */
const TITLE_TRANSFORM_PATTERN = /[ \t]*titleTransform:\s*([\s\S]+?)(?=,?\s*\n\s*(?:\w+:|[}\]]))/g

/**
 * Matches a `title: 'string'` or `title: "string"` property (the old
 * string form that is replaced by the object form).
 * Captures: [1] = the quoted string value
 */
const TITLE_STRING_PATTERN = /[ \t]*title:\s*(['"][^'"]*['"])[, \t]*/g

/**
 * Maximum character distance between `titleFrom` and `titleTransform` to
 * consider them part of the same section object. Keeps the proximity
 * heuristic from silently mis-pairing properties separated by large
 * comment blocks.
 */
const MAX_PROPERTY_DISTANCE = 500

/**
 * A region of text to be removed or replaced, identified by exact indices.
 */
interface EditRegion {
  readonly start: number
  readonly end: number
  readonly replacement: string
  readonly change: TransformChange
}

/**
 * Transform config source to replace `titleFrom` / `titleTransform`
 * with `title: { from, transform }`.
 *
 * Uses index-based splicing to guarantee edits land at the exact match
 * position, avoiding issues when identical patterns appear multiple times.
 *
 * @param params - The config file path and source text
 * @returns Transform output with updated source and change descriptions
 */
function transform(params: TransformParams): TransformOutput {
  const { source } = params

  const titleFromMatches = [...source.matchAll(TITLE_FROM_PATTERN)]
  const titleTransformMatches = [...source.matchAll(TITLE_TRANSFORM_PATTERN)]

  if (titleFromMatches.length === 0 && titleTransformMatches.length === 0) {
    return { source, changes: [] }
  }

  const titleStringMatches = [...source.matchAll(TITLE_STRING_PATTERN)]

  // Track which titleTransform and title-string entries have been consumed
  const consumedTransforms = new Set<number>()
  const consumedTitleStrings = new Set<number>()

  // Build edit regions for each titleFrom match
  const edits = titleFromMatches.flatMap((m) =>
    buildEditsForTitleFrom({
      match: m,
      titleTransformMatches,
      titleStringMatches,
      consumedTransforms,
      consumedTitleStrings,
    })
  )

  // Also remove any orphaned titleTransform entries not paired with a titleFrom
  const orphanedTransforms = titleTransformMatches
    .filter((m) => !consumedTransforms.has(m.index ?? 0))
    .map((m) => ({
      start: m.index ?? 0,
      end: (m.index ?? 0) + m[0].length,
      replacement: '',
      change: { description: 'Removed orphaned `titleTransform` property' } as TransformChange,
    }))

  const allEdits = [...edits, ...orphanedTransforms]

  if (allEdits.length === 0) {
    return { source, changes: [] }
  }

  return applyEdits({ source, edits: allEdits })
}

/**
 * The codemod definition for titleFrom -> title config migration.
 */
export const titleFromToTitleConfig: Codemod = {
  id: 'title-from-to-title-config',
  version: '0.4.0',
  description:
    'Migrate deprecated `titleFrom` / `titleTransform` to unified `title: { from, transform }` syntax',
  changelog: 'https://github.com/joggrdocs/zpress/releases/tag/v0.4.0',
  breaking: true,
  transform,
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Build edit regions for a single `titleFrom` match, pairing it with
 * nearby `titleTransform` and `title:` string entries.
 *
 * @private
 * @param params - The match and available pairing candidates
 * @returns Edit regions for this titleFrom occurrence
 */
function buildEditsForTitleFrom(params: {
  readonly match: RegExpExecArray
  readonly titleTransformMatches: readonly RegExpExecArray[]
  readonly titleStringMatches: readonly RegExpExecArray[]
  readonly consumedTransforms: Set<number>
  readonly consumedTitleStrings: Set<number>
}): readonly EditRegion[] {
  const { match, titleTransformMatches, titleStringMatches, consumedTransforms, consumedTitleStrings } =
    params
  const fromIndex = match.index ?? 0
  const fromEnd = fromIndex + match[0].length
  const [, fromValue] = match

  // Find nearest unconsumed titleTransform within range
  const pairedTransform = findNearest({
    matches: titleTransformMatches,
    anchorIndex: fromIndex,
    consumed: consumedTransforms,
  })
  if (pairedTransform) {
    consumedTransforms.add(pairedTransform.index ?? 0)
  }

  // Find nearest unconsumed title-string within range (to remove the old title key)
  const pairedTitle = findNearest({
    matches: titleStringMatches,
    anchorIndex: fromIndex,
    consumed: consumedTitleStrings,
  })
  if (pairedTitle) {
    consumedTitleStrings.add(pairedTitle.index ?? 0)
  }

  const titleObject = buildTitleObject({ fromValue, matchingTransform: pairedTransform })

  const transformEdits = buildTransformRemovalEdit(pairedTransform)
  const titleStringEdits = buildTitleStringRemovalEdit(pairedTitle)

  // Replace titleFrom with the new title object
  const fromEdit: EditRegion = {
    start: fromIndex,
    end: fromEnd,
    replacement: titleObject,
    change: { description: `Replaced \`titleFrom: '${fromValue}'\` with \`${titleObject}\`` },
  }

  return [...transformEdits, ...titleStringEdits, fromEdit]
}

/**
 * Build an edit region to remove a paired titleTransform match.
 *
 * @private
 * @param pairedTransform - The matched titleTransform, or undefined
 * @returns Array with one edit if paired, empty otherwise
 */
function buildTransformRemovalEdit(
  pairedTransform: RegExpExecArray | undefined
): readonly EditRegion[] {
  if (!pairedTransform) {
    return []
  }
  return [
    {
      start: pairedTransform.index ?? 0,
      end: (pairedTransform.index ?? 0) + pairedTransform[0].length,
      replacement: '',
      change: { description: 'Removed deprecated `titleTransform` property' },
    },
  ]
}

/**
 * Build an edit region to remove a paired title-string match.
 *
 * @private
 * @param pairedTitle - The matched title string, or undefined
 * @returns Array with one edit if paired, empty otherwise
 */
function buildTitleStringRemovalEdit(
  pairedTitle: RegExpExecArray | undefined
): readonly EditRegion[] {
  if (!pairedTitle) {
    return []
  }
  return [
    {
      start: pairedTitle.index ?? 0,
      end: (pairedTitle.index ?? 0) + pairedTitle[0].length,
      replacement: '',
      change: { description: `Removed old \`title: ${pairedTitle[1]}\` string property` },
    },
  ]
}

/**
 * Find the nearest unconsumed match within MAX_PROPERTY_DISTANCE.
 *
 * @private
 * @param params - Search parameters
 * @param params.matches - All regex matches to search
 * @param params.anchorIndex - The character index to measure distance from
 * @param params.consumed - Set of already-consumed match indices
 * @returns The nearest match, or undefined
 */
function findNearest(params: {
  readonly matches: readonly RegExpExecArray[]
  readonly anchorIndex: number
  readonly consumed: Set<number>
}): RegExpExecArray | undefined {
  const { matches, anchorIndex, consumed } = params
  return matches
    .filter((m) => {
      const idx = m.index ?? 0
      return !consumed.has(idx) && Math.abs(idx - anchorIndex) < MAX_PROPERTY_DISTANCE
    })
    .toSorted(
      (a, b) => Math.abs((a.index ?? 0) - anchorIndex) - Math.abs((b.index ?? 0) - anchorIndex)
    )
    .at(0)
}

/**
 * Apply a set of non-overlapping edit regions to a source string.
 *
 * Sorts edits in descending order by start index so earlier indices
 * remain valid as later portions of the string are modified.
 *
 * @private
 * @param params - Source text and edit regions
 * @param params.source - Original source text
 * @param params.edits - Edit regions to apply
 * @returns Transform output with the modified source and change log
 */
function applyEdits(params: {
  readonly source: string
  readonly edits: readonly EditRegion[]
}): TransformOutput {
  const sorted = params.edits.toSorted((a, b) => b.start - a.start)

  return sorted.reduce<TransformOutput>(
    (acc, edit) => ({
      source: acc.source.slice(0, edit.start) + edit.replacement + acc.source.slice(edit.end),
      changes: [...acc.changes, edit.change],
    }),
    { source: params.source, changes: [] }
  )
}

/**
 * Build a title object string from a `from` value and optional transform.
 *
 * @private
 * @param params - Title object components
 * @param params.fromValue - The title derivation strategy value
 * @param params.matchingTransform - Optional matched titleTransform regex result
 * @returns The formatted title object expression
 */
function buildTitleObject(params: {
  readonly fromValue: string
  readonly matchingTransform: RegExpExecArray | undefined
}): string {
  const { fromValue, matchingTransform } = params
  if (matchingTransform) {
    const value = matchingTransform[1].replace(/,\s*$/, '').trim()
    return `title: { from: '${fromValue}', transform: ${value} },`
  }
  return `title: { from: '${fromValue}' },`
}
