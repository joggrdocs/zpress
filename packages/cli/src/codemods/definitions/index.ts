/**
 * Built-in codemod definitions.
 *
 * Each codemod is imported as a named export and registered
 * into the global registry via `registerCodemod()`.
 */

import { registerCodemod } from '../registry.ts'
import { titleFromToTitleConfig } from './title-from-to-title-config.ts'

export const builtInCodemods = [titleFromToTitleConfig] as const

builtInCodemods.map(registerCodemod)
