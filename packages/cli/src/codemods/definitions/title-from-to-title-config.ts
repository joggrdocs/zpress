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

import { escapeRegExp } from 'es-toolkit'

import type { Codemod, TransformOutput, TransformParams } from '../types.ts'

const TITLE_FROM_PATTERN = /\s*titleFrom:\s*['"](\w+)['"]/g
const TITLE_TRANSFORM_PATTERN = /\s*titleTransform:\s*(.+)/g

/**
 * Maximum character distance between `titleFrom` and `titleTransform` to
 * consider them part of the same section object. Keeps the proximity
 * heuristic from silently mis-pairing properties separated by large
 * comment blocks.
 */
const MAX_PROPERTY_DISTANCE = 500

/**
 * Transform config source to replace `titleFrom` / `titleTransform`
 * with `title: { from, transform }`.
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

  // Collect match metadata
  const titleFromValues = titleFromMatches.map((m) => ({
    full: m[0],
    value: m[1],
    index: m.index ?? 0,
  }))

  const titleTransformValues = titleTransformMatches.map((m) => ({
    full: m[0],
    value: m[1].replace(/,\s*$/, ''),
    index: m.index ?? 0,
  }))

  // Remove titleTransform lines first (process in reverse to preserve indices)
  const sortedTransforms = titleTransformValues.toSorted((a, b) => b.index - a.index)
  const removalResult = sortedTransforms.reduce<TransformOutput>(
    (acc, entry) => {
      const lineWithComma = new RegExp(`\\n?${escapeRegExp(entry.full.trimStart())}[,]?[ ]*`, 'g')
      return {
        source: acc.source.replaceAll(lineWithComma, ''),
        changes: [...acc.changes, { description: 'Removed deprecated `titleTransform` property' }],
      }
    },
    { source, changes: [] }
  )

  // Replace titleFrom with title: { from: ... } or title: { from: ..., transform: ... }
  const sortedFroms = titleFromValues.toSorted((a, b) => b.index - a.index)
  return sortedFroms.reduce<TransformOutput>(
    (acc, entry) => {
      const matchingTransform = titleTransformValues.find((t) => {
        const distance = Math.abs(t.index - entry.index)
        return distance < MAX_PROPERTY_DISTANCE
      })

      const titleObject = buildTitleObject(entry.value, matchingTransform)
      const linePattern = new RegExp(`${escapeRegExp(entry.full.trimStart())}[,]?[ ]*`)

      return {
        source: acc.source.replace(linePattern, titleObject),
        changes: [
          ...acc.changes,
          { description: `Replaced \`titleFrom: '${entry.value}'\` with \`${titleObject}\`` },
        ],
      }
    },
    removalResult
  )
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
 * Build a title object string from a `from` value and optional transform.
 *
 * @private
 * @param fromValue - The title derivation strategy value
 * @param matchingTransform - Optional matching titleTransform entry
 * @returns The formatted title object expression
 */
function buildTitleObject(
  fromValue: string,
  matchingTransform: { readonly value: string } | undefined
): string {
  if (matchingTransform) {
    return `title: { from: '${fromValue}', transform: ${matchingTransform.value} }`
  }
  return `title: { from: '${fromValue}' }`
}
