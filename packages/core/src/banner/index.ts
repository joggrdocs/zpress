/**
 * Auto-generated SVG banner and logo assets.
 *
 * Produces committable SVG files from the project title so users
 * get branded assets with zero manual work.
 */

import fs from 'node:fs/promises'
import path from 'node:path'

import { composeBanner } from './svg-banner.ts'
import { composeIcon } from './svg-icon.ts'
import { composeLogo } from './svg-logo.ts'
import { GENERATED_MARKER } from './svg-shared.ts'
import { assetError } from './types.ts'
import type { AssetConfig, AssetResult, GeneratedAsset } from './types.ts'

// ── Re-exports ──────────────────────────────────────────────

export type { AssetConfig, AssetError, AssetResult, GeneratedAsset } from './types.ts'

// ── Single-asset generators ─────────────────────────────────

/**
 * Generate a banner SVG from the project config.
 *
 * @param config - Title and optional tagline
 * @returns Result containing the generated asset or an error
 */
export function generateBannerSvg(config: AssetConfig): AssetResult<GeneratedAsset> {
  if (config.title.trim().length === 0) {
    return [assetError('empty_title', 'Cannot generate banner: title is empty'), null]
  }

  return [
    null,
    {
      filename: 'banner.svg',
      content: composeBanner({ title: config.title, tagline: config.tagline }),
    },
  ]
}

/**
 * Generate a logo SVG from the project config.
 *
 * @param config - Title (tagline is ignored for logos)
 * @returns Result containing the generated asset or an error
 */
export function generateLogoSvg(config: AssetConfig): AssetResult<GeneratedAsset> {
  if (config.title.trim().length === 0) {
    return [assetError('empty_title', 'Cannot generate logo: title is empty'), null]
  }

  return [
    null,
    {
      filename: 'logo.svg',
      content: composeLogo({ title: config.title }),
    },
  ]
}

/**
 * Generate an icon (favicon) SVG from the project config.
 *
 * @param config - Title (first character is used for the icon glyph)
 * @returns Result containing the generated asset or an error
 */
export function generateIconSvg(config: AssetConfig): AssetResult<GeneratedAsset> {
  if (config.title.trim().length === 0) {
    return [assetError('empty_title', 'Cannot generate icon: title is empty'), null]
  }

  return [
    null,
    {
      filename: 'icon.svg',
      content: composeIcon({ title: config.title }),
    },
  ]
}

// ── File-level helpers ──────────────────────────────────────

/**
 * Determine whether a file should be (re)generated.
 *
 * Returns `true` when:
 * - The file does not exist (first generation)
 * - The file exists and contains the zpress-generated marker (regeneration)
 *
 * Returns `false` when:
 * - The file exists without the marker (user-customized)
 */
async function shouldGenerate(filePath: string): Promise<boolean> {
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- path is constructed from trusted publicDir + known filenames
  const content = await fs.readFile(filePath, 'utf8').catch(() => null)
  if (content === null) {
    return true
  }
  const [firstLine] = content.split('\n')
  if (firstLine === GENERATED_MARKER) {
    return true
  }
  return false
}

/**
 * Write a generated asset to disk, returning either the filename or an error.
 */
async function writeAsset(asset: GeneratedAsset, publicDir: string): Promise<AssetResult<string>> {
  const filePath = path.resolve(publicDir, asset.filename)
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- path is constructed from trusted publicDir + known filenames
  const result = await fs
    .writeFile(filePath, asset.content, 'utf8')
    .catch((error: unknown) => error)
  if (result !== undefined) {
    if (result instanceof Error) {
      return [
        assetError('write_failed', `Failed to write ${asset.filename}: ${result.message}`),
        null,
      ]
    }
    return [
      assetError('write_failed', `Failed to write ${asset.filename}: ${String(result)}`),
      null,
    ]
  }
  return [null, asset.filename]
}

// ── Batch generator ─────────────────────────────────────────

interface GenerateAssetsParams {
  readonly config: AssetConfig
  readonly publicDir: string
}

/**
 * Generate banner and logo SVGs, writing them to the public directory.
 *
 * For each asset:
 * 1. If the file is missing or has the zpress-generated marker → write it
 * 2. If the file exists without the marker → skip (user-customized)
 *
 * @param params - Config and target directory
 * @returns Result containing the list of filenames written, or an error
 */
export async function generateAssets(
  params: GenerateAssetsParams
): Promise<AssetResult<readonly string[]>> {
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- publicDir comes from trusted Paths config
  await fs.mkdir(params.publicDir, { recursive: true })

  const generators: readonly (() => AssetResult<GeneratedAsset>)[] = [
    () => generateBannerSvg(params.config),
    () => generateLogoSvg(params.config),
    () => generateIconSvg(params.config),
  ]

  const written = await generators.reduce<Promise<readonly string[]>>(
    async (accPromise, generate) => {
      const acc = await accPromise
      const [err, asset] = generate()
      if (err) {
        return acc
      }

      const filePath = path.resolve(params.publicDir, asset.filename)
      const shouldWrite = await shouldGenerate(filePath)
      if (!shouldWrite) {
        return acc
      }

      const [writeErr, filename] = await writeAsset(asset, params.publicDir)
      if (writeErr) {
        return acc
      }

      return [...acc, filename]
    },
    Promise.resolve([])
  )

  return [null, written]
}
