import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/theme',
  'packages/config',
  'packages/core',
  'packages/cli',
  'packages/ui',
])
