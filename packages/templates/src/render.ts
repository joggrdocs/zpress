import { kebabCase } from 'es-toolkit'

import type { Template, TemplateVariables } from './types.ts'

/**
 * Render a template by replacing all `{{key}}` placeholders with
 * the corresponding values from the variables map.
 *
 * @example
 * ```ts
 * const output = render(template, { title: 'Authentication' })
 * ```
 */
export function render(template: Template, variables: TemplateVariables): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template.body
  )
}

/**
 * Convert a title string to a kebab-case filename slug.
 *
 * @example
 * ```ts
 * toSlug('Deploy to Vercel') // 'deploy-to-vercel'
 * ```
 */
export function toSlug(title: string): string {
  return kebabCase(title)
}
