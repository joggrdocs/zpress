/**
 * Zod schemas for theme configuration validation.
 */

import { z } from 'zod'

/**
 * Zod schema for the color mode setting.
 *
 * Accepts `'dark'`, `'light'`, or `'toggle'`.
 */
export const colorModeSchema = z.enum(['dark', 'light', 'toggle'])

/**
 * Zod schema for partial theme color overrides.
 *
 * Each field maps to one or more `--zp-c-*` / `--rp-c-*` CSS custom properties.
 * All fields are optional; omitted fields fall back to the active theme's defaults.
 */
export const themeColorsSchema = z
  .object({
    brand: z.string().optional(),
    brandLight: z.string().optional(),
    brandDark: z.string().optional(),
    brandSoft: z.string().optional(),
    bg: z.string().optional(),
    bgAlt: z.string().optional(),
    bgElv: z.string().optional(),
    bgSoft: z.string().optional(),
    text1: z.string().optional(),
    text2: z.string().optional(),
    text3: z.string().optional(),
    divider: z.string().optional(),
    border: z.string().optional(),
    homeBg: z.string().optional(),
  })
  .strict()

/**
 * Zod schema for the top-level theme configuration block in `zpress.config.ts`.
 *
 * Validates and coerces the `theme` key, applying defaults where fields are omitted.
 */
export const themeConfigSchema = z
  .object({
    name: z.string().default('base'),
    colorMode: colorModeSchema.optional(),
    switcher: z.boolean().optional(),
    colors: themeColorsSchema.optional(),
    darkColors: themeColorsSchema.optional(),
  })
  .strict()
