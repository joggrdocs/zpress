/**
 * FIGlet text renderer using the ANSI Shadow character set.
 *
 * Converts a plain-text string into block-art lines suitable
 * for embedding in an SVG `<text>` element.
 */

import { range } from 'es-toolkit'

import { FIGLET_CHARS, FIGLET_CHAR_GAP, FIGLET_ROWS } from './figlet-data.ts'

// ── Types ───────────────────────────────────────────────────

/**
 * Result of rendering a FIGlet text block.
 */
export interface FigletResult {
  /**
   * The rendered text rows (one string per row).
   */
  readonly lines: readonly string[]
  /**
   * Width of the widest row in monospace character columns.
   */
  readonly width: number
}

// ── Renderer ────────────────────────────────────────────────

const SPACE_GLYPH = FIGLET_CHARS[' ']

/**
 * Look up the FIGlet glyph for a single character.
 * Falls back to the space glyph for unknown characters.
 */
function lookupGlyph(c: string): readonly [string, string, string, string, string, string] {
  const glyph = FIGLET_CHARS[c]
  if (glyph) {
    return glyph
  }
  return SPACE_GLYPH
}

/**
 * Render a plain-text string as FIGlet block art.
 *
 * Uppercases the input, maps each character to its ANSI Shadow glyph,
 * and joins rows horizontally.
 *
 * @param text - The text to render (A-Z, 0-9, space, hyphen, dot, underscore)
 * @returns Rendered lines and width in monospace columns
 */
export function renderFigletText(text: string): FigletResult {
  const chars = [...text.toUpperCase()]
  const glyphs = chars.map(lookupGlyph)

  const lines = range(FIGLET_ROWS).map((row) =>
    glyphs.map((glyph) => glyph[row]).join(FIGLET_CHAR_GAP)
  )

  const width = Math.max(...lines.map((line) => line.length))

  return { lines, width }
}
