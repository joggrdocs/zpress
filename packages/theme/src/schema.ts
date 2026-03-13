/**
 * Zod schemas for theme configuration validation.
 */

import { z } from 'zod'

// ── Color mode schema ───────────────────────────────────────

export const colorModeSchema = z.enum(['dark', 'light', 'toggle'])

// ── Theme colors schema ─────────────────────────────────────

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

// ── Theme config schema ─────────────────────────────────────

export const themeConfigSchema = z
  .object({
    name: z.string().default('base'),
    colorMode: colorModeSchema.optional(),
    switcher: z.boolean().optional(),
    colors: themeColorsSchema.optional(),
    darkColors: themeColorsSchema.optional(),
  })
  .strict()
