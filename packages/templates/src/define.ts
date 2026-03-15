import type { Template } from './types.ts'

/**
 * Define a new documentation template.
 *
 * @example
 * ```ts
 * import { defineTemplate, createRegistry } from '@zpress/templates'
 *
 * const adr = defineTemplate({
 *   type: 'adr',
 *   label: 'ADR',
 *   hint: 'Architecture decision record',
 *   body: '# {{title}}\n\n## Context\n\n## Decision\n\n## Consequences\n',
 * })
 *
 * const registry = createRegistry().add(adr)
 * ```
 */
export function defineTemplate(options: Template): Template {
  return {
    type: options.type,
    label: options.label,
    hint: options.hint,
    body: options.body,
  }
}
