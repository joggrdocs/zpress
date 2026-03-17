/**
 * SVG logo composer.
 *
 * Generates a compact logo SVG containing the project title
 * rendered as FIGlet ASCII art (or plain monospace fallback for long titles).
 */

import { renderFigletText } from './figlet.ts'
import {
  ART_FONT_SIZE,
  ART_LINE_HEIGHT,
  CHAR_WIDTH_PX,
  COLORS,
  CONTENT_PADDING,
  FALLBACK_FONT_SIZE,
  FIGLET_MAX_LENGTH,
  FONT_STACK,
  GENERATED_MARKER,
  escapeXml,
} from './svg-shared.ts'


const LOGO_TOP_PAD = 28
const LOGO_BOTTOM_PAD = 28
const FIGLET_ROWS = 6


/**
 * Compose a logo SVG string from the project title.
 *
 * For titles ≤ 12 characters, renders FIGlet block art.
 * For longer titles, falls back to large monospace text.
 *
 * @param params - Logo configuration
 * @returns Complete SVG markup string with generated marker
 */
export function composeLogo(params: { readonly title: string }): string {
  const useFiglet = params.title.length <= FIGLET_MAX_LENGTH

  if (useFiglet) {
    const figlet = renderFigletText(params.title)
    const artPixelWidth = figlet.width * CHAR_WIDTH_PX
    const width = Math.ceil(artPixelWidth + CONTENT_PADDING * 2)
    const height = LOGO_TOP_PAD + (FIGLET_ROWS - 1) * ART_LINE_HEIGHT + LOGO_BOTTOM_PAD
    const artLines = buildFigletArt({ lines: figlet.lines, startY: 0 })

    return [
      GENERATED_MARKER,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
      '  <defs>',
      '    <style>',
      `      .text { font-family: ${FONT_STACK}; }`,
      `      .brand { fill: ${COLORS.brand}; }`,
      '    </style>',
      '  </defs>',
      '',
      `  <g transform="translate(${CONTENT_PADDING}, ${LOGO_TOP_PAD})">`,
      artLines,
      '  </g>',
      '</svg>',
    ].join('\n')
  }

  const textPixelWidth = params.title.length * FALLBACK_FONT_SIZE * 0.6
  const width = Math.ceil(textPixelWidth + CONTENT_PADDING * 2)
  const height = FALLBACK_FONT_SIZE + LOGO_TOP_PAD + LOGO_BOTTOM_PAD
  const textY = LOGO_TOP_PAD + FALLBACK_FONT_SIZE * 0.75
  const fallback = buildFallbackText({ title: params.title, y: textY })

  return [
    GENERATED_MARKER,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
    '  <defs>',
    '    <style>',
    `      .text { font-family: ${FONT_STACK}; }`,
    `      .brand { fill: ${COLORS.brand}; }`,
    '    </style>',
    '  </defs>',
    '',
    `  <g transform="translate(${CONTENT_PADDING}, 0)">`,
    fallback,
    '  </g>',
    '</svg>',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Build FIGlet ASCII art as SVG text elements for the logo.
 *
 * @private
 * @param params - FIGlet art configuration
 * @param params.lines - Rendered FIGlet text rows
 * @param params.startY - Vertical start position for the first line
 * @returns SVG text elements joined as a single string
 */
function buildFigletArt(params: {
  readonly lines: readonly string[]
  readonly startY: number
}): string {
  return params.lines
    .map((line, i) => {
      const y = params.startY + i * ART_LINE_HEIGHT
      return `    <text class="text brand" font-size="${ART_FONT_SIZE}" y="${y}" xml:space="preserve">${line}</text>`
    })
    .join('\n')
}

/**
 * Build a large monospace text element as a fallback for long titles.
 *
 * @private
 * @param params - Fallback text configuration
 * @param params.title - Plain text title to render
 * @param params.y - Vertical position of the text baseline
 * @returns SVG text element string
 */
function buildFallbackText(params: { readonly title: string; readonly y: number }): string {
  const escaped = escapeXml(params.title)
  return `    <text class="text brand" font-size="${FALLBACK_FONT_SIZE}" y="${params.y}">${escaped}</text>`
}
