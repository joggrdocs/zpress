import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { Template, TemplateType } from './types.ts'

/**
 * Get all built-in documentation templates keyed by type.
 * Templates are lazily loaded on first access via a closure-based cache.
 *
 * @returns Record of all built-in templates keyed by type
 */
export const getBuiltInTemplates: () => Record<TemplateType, Template> = createTemplateLoader()

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Create a closure-based loader that caches templates after first read.
 *
 * @private
 * @returns Factory function that returns cached templates
 */
function createTemplateLoader(): () => Record<TemplateType, Template> {
  const state: { cache: Record<TemplateType, Template> | undefined } = { cache: undefined }
  return () => {
    if (state.cache) {
      return state.cache
    }
    const loaded: Record<TemplateType, Template> = {
      tutorial: {
        type: 'tutorial',
        label: 'Tutorial',
        hint: 'Guided learning experience',
        body: readTemplate('tutorial.liquid'),
      },
      guide: {
        type: 'guide',
        label: 'Guide',
        hint: 'Step-by-step task instructions',
        body: readTemplate('guide.liquid'),
      },
      quickstart: {
        type: 'quickstart',
        label: 'Quickstart',
        hint: 'Fast-track to working result',
        body: readTemplate('quickstart.liquid'),
      },
      explanation: {
        type: 'explanation',
        label: 'Explanation',
        hint: 'Conceptual background',
        body: readTemplate('explanation.liquid'),
      },
      reference: {
        type: 'reference',
        label: 'Reference',
        hint: 'Technical descriptions',
        body: readTemplate('reference.liquid'),
      },
      standard: {
        type: 'standard',
        label: 'Standard',
        hint: 'Rules and conventions',
        body: readTemplate('standard.liquid'),
      },
      troubleshooting: {
        type: 'troubleshooting',
        label: 'Troubleshooting',
        hint: 'Common problems and fixes',
        body: readTemplate('troubleshooting.liquid'),
      },
      runbook: {
        type: 'runbook',
        label: 'Runbook',
        hint: 'Operational procedures',
        body: readTemplate('runbook.liquid'),
      },
    }
    state.cache = loaded
    return loaded
  }
}

/**
 * Reads a `.liquid` template file from the `templates/` directory.
 *
 * @private
 * @param filename - The filename of the template to read (e.g. `'guide.liquid'`)
 * @returns The raw template string
 */
function readTemplate(filename: string): string {
  // oxlint-disable-next-line security/detect-non-literal-fs-filename -- safe: reads from known templates directory
  return readFileSync(join(import.meta.dirname, '..', 'templates', filename), 'utf8')
}
