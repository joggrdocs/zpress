/**
 * SVG banner composer.
 *
 * Generates a terminal-themed banner SVG with:
 * 1. macOS title bar with traffic lights
 * 2. FIGlet ASCII art of the project title (or monospace fallback)
 * 3. Optional tagline in dim text
 * 4. Separator line
 * 5. Fake CLI output showing a dev server startup
 */

import { match, P } from 'ts-pattern'

import { renderFigletText } from './figlet.ts'
import {
  ART_FONT_SIZE,
  ART_LINE_HEIGHT,
  CHAR_WIDTH_PX,
  CODE_FONT_SIZE,
  COLORS,
  CONTENT_PADDING,
  FALLBACK_FONT_SIZE,
  FIGLET_MAX_LENGTH,
  FONT_STACK,
  GENERATED_MARKER,
  MIN_BANNER_WIDTH,
  TITLE_BAR_HEIGHT,
  escapeXml,
} from './svg-shared.ts'

// ── Layout constants ────────────────────────────────────────

const ART_TOP_PAD = 26
const FIGLET_ROWS = 6
const TAGLINE_GAP = 24
const SEPARATOR_GAP = 16
const CLI_SECTION_HEIGHT = 240

// ── SVG section builders ────────────────────────────────────

function buildStyles(): string {
  return [
    '  <defs>',
    '    <style>',
    `      .text { font-family: ${FONT_STACK}; }`,
    `      .code { font-family: ${FONT_STACK}; font-size: ${CODE_FONT_SIZE}px; }`,
    `      .brand { fill: ${COLORS.brand}; }`,
    `      .dim { fill: ${COLORS.overlay0}; }`,
    `      .tx { fill: ${COLORS.text}; }`,
    `      .st { fill: ${COLORS.green}; }`,
    `      .prompt { fill: ${COLORS.blue}; }`,
    `      .tab { font-family: ${FONT_STACK}; font-size: 11px; fill: ${COLORS.text}; }`,
    '    </style>',
    '  </defs>',
  ].join('\n')
}

function buildBackground(params: { readonly width: number; readonly height: number }): string {
  return [
    '',
    '  <!-- Background -->',
    `  <rect width="${params.width}" height="${params.height}" rx="10" ry="10" fill="${COLORS.base}" />`,
  ].join('\n')
}

function buildTitleBar(params: { readonly width: number; readonly name: string }): string {
  const centerX = Math.round(params.width / 2)
  const escaped = escapeXml(params.name)
  return [
    '',
    '  <!-- Title bar -->',
    `  <rect width="${params.width}" height="${TITLE_BAR_HEIGHT}" rx="10" ry="10" fill="${COLORS.mantle}" />`,
    `  <rect y="26" width="${params.width}" height="10" fill="${COLORS.mantle}" />`,
    '',
    '  <!-- Traffic lights -->',
    `  <circle cx="20" cy="18" r="6" fill="${COLORS.red}" />`,
    `  <circle cx="40" cy="18" r="6" fill="${COLORS.yellow}" />`,
    `  <circle cx="60" cy="18" r="6" fill="${COLORS.green}" />`,
    '',
    '  <!-- Title bar text -->',
    `  <text class="text dim" font-size="12" x="${centerX}" y="22" text-anchor="middle">${escaped}</text>`,
  ].join('\n')
}

function buildFigletArt(params: {
  readonly lines: readonly string[]
  readonly translateX: number
  readonly startY: number
}): string {
  const textLines = params.lines
    .map((line, i) => {
      const y = params.startY + i * ART_LINE_HEIGHT
      return `    <text class="text brand" font-size="${ART_FONT_SIZE}" y="${y}" xml:space="preserve">${line}</text>`
    })
    .join('\n')

  return [
    '',
    '  <!-- ASCII art -->',
    `  <g transform="translate(${params.translateX}, 0)">`,
    textLines,
    '  </g>',
  ].join('\n')
}

function buildFallbackArt(params: {
  readonly title: string
  readonly centerX: number
  readonly y: number
}): string {
  const escaped = escapeXml(params.title)
  return [
    '',
    '  <!-- Title (fallback) -->',
    `  <text class="text brand" font-size="${FALLBACK_FONT_SIZE}" x="${params.centerX}" y="${params.y}" text-anchor="middle">${escaped}</text>`,
  ].join('\n')
}

function buildTagline(params: {
  readonly text: string
  readonly centerX: number
  readonly y: number
}): string {
  const escaped = escapeXml(params.text)
  return [
    '',
    '  <!-- Tagline -->',
    `  <text class="text dim" font-size="12" x="${params.centerX}" y="${params.y}" text-anchor="middle">${escaped}</text>`,
  ].join('\n')
}

function buildSeparator(params: { readonly width: number; readonly y: number }): string {
  return [
    '',
    '  <!-- Separator -->',
    `  <line x1="16" y1="${params.y}" x2="${params.width - 16}" y2="${params.y}" stroke="${COLORS.surface0}" stroke-width="1" />`,
  ].join('\n')
}

function buildCliOutput(params: { readonly name: string; readonly separatorY: number }): string {
  const baseY = params.separatorY
  const x = 18

  return [
    '',
    '  <!-- Terminal tab -->',
    `  <rect x="4" y="${baseY + 4}" width="80" height="24" rx="4" ry="4" fill="${COLORS.mantle}" />`,
    `  <text class="tab" x="${x}" y="${baseY + 20}">terminal</text>`,
    '',
    '  <!-- CLI output -->',
    `  <text class="code" x="${x}" y="${baseY + 48}"><tspan class="prompt">~</tspan><tspan class="dim"> $ </tspan><tspan class="tx">${escapeXml(params.name)} dev</tspan></text>`,
    '',
    `  <text class="code" x="${x}" y="${baseY + 76}"><tspan class="dim">Starting </tspan><tspan class="brand">${escapeXml(params.name)}</tspan><tspan class="dim">...</tspan></text>`,
    '',
    `  <text class="code" x="${x}" y="${baseY + 100}" xml:space="preserve"><tspan class="st">  ✓</tspan><tspan class="tx"> Loaded config</tspan></text>`,
    `  <text class="code" x="${x}" y="${baseY + 116}" xml:space="preserve"><tspan class="st">  ✓</tspan><tspan class="tx"> Built 24 pages</tspan></text>`,
    `  <text class="code" x="${x}" y="${baseY + 132}" xml:space="preserve"><tspan class="st">  ✓</tspan><tspan class="tx"> Generated sidebar</tspan></text>`,
    `  <text class="code" x="${x}" y="${baseY + 148}" xml:space="preserve"><tspan class="st">  ✓</tspan><tspan class="tx"> Ready — dev server on :5173</tspan></text>`,
    '',
    '  <!-- New prompt with cursor -->',
    `  <text class="code" x="${x}" y="${baseY + 180}"><tspan class="prompt">~</tspan><tspan class="dim"> $ </tspan><tspan class="tx">&#x2588;</tspan></text>`,
  ].join('\n')
}

// ── Layout computation ──────────────────────────────────────

interface BannerLayout {
  readonly width: number
  readonly height: number
  readonly artSection: string
  readonly artEndY: number
}

function computeArtLayout(params: {
  readonly title: string
  readonly minWidth: number
}): BannerLayout {
  const useFiglet = params.title.length <= FIGLET_MAX_LENGTH

  if (useFiglet) {
    const figlet = renderFigletText(params.title)
    const artPixelWidth = figlet.width * CHAR_WIDTH_PX
    const contentWidth = Math.ceil(artPixelWidth + CONTENT_PADDING * 2)
    const width = Math.max(params.minWidth, contentWidth)
    const artStartY = TITLE_BAR_HEIGHT + ART_TOP_PAD
    const translateX = Math.round((width - artPixelWidth) / 2)
    const artEndY = artStartY + (FIGLET_ROWS - 1) * ART_LINE_HEIGHT

    const artSection = buildFigletArt({
      lines: figlet.lines,
      translateX,
      startY: artStartY,
    })

    return { width, height: 0, artSection, artEndY }
  }

  const textPixelWidth = params.title.length * FALLBACK_FONT_SIZE * 0.6
  const contentWidth = Math.ceil(textPixelWidth + CONTENT_PADDING * 2)
  const width = Math.max(params.minWidth, contentWidth)
  const centerX = Math.round(width / 2)
  const artCenterY = TITLE_BAR_HEIGHT + ART_TOP_PAD + 40
  const artEndY = artCenterY + 12

  const artSection = buildFallbackArt({
    title: params.title,
    centerX,
    y: artCenterY,
  })

  return { width, height: 0, artSection, artEndY }
}

// ── Public API ──────────────────────────────────────────────

/**
 * Compose a banner SVG string from the project title and optional tagline.
 *
 * For titles ≤ 12 characters, renders FIGlet block art.
 * For longer titles, falls back to large monospace text.
 * The banner includes a terminal chrome frame and fake CLI output.
 *
 * @param params - Banner configuration
 * @returns Complete SVG markup string with generated marker
 */
export function composeBanner(params: {
  readonly title: string
  readonly tagline: string | undefined
}): string {
  const cmdName = params.title.toLowerCase().replaceAll(/\s+/g, '')
  const art = computeArtLayout({ title: params.title, minWidth: MIN_BANNER_WIDTH })

  const taglineSection = match(params.tagline)
    .with(P.string, (tagline) => {
      const taglineY = art.artEndY + TAGLINE_GAP
      const separatorY = taglineY + SEPARATOR_GAP
      const centerX = Math.round(art.width / 2)

      return {
        markup: buildTagline({ text: tagline, centerX, y: taglineY }),
        separatorY,
      }
    })
    .otherwise(() => ({
      markup: '',
      separatorY: art.artEndY + SEPARATOR_GAP,
    }))

  const height = taglineSection.separatorY + CLI_SECTION_HEIGHT

  const sections = [
    GENERATED_MARKER,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.width} ${height}">`,
    buildStyles(),
    buildBackground({ width: art.width, height }),
    buildTitleBar({ width: art.width, name: cmdName }),
    art.artSection,
    taglineSection.markup,
    buildSeparator({ width: art.width, y: taglineSection.separatorY }),
    buildCliOutput({ name: cmdName, separatorY: taglineSection.separatorY }),
    '</svg>',
  ]

  return sections.filter((s) => s.length > 0).join('\n')
}
