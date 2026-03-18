/**
 * Codemod system — version-aware config file migrations for zpress.
 */

export { builtInCodemods } from './definitions/index.ts'

export { allCodemods } from './registry.ts'
export { migrate, listPending } from './runner.ts'
