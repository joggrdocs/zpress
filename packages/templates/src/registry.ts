import { isFunction } from 'es-toolkit'

import { BUILT_IN_TEMPLATES } from './built-in.ts'
import type { ExtendTemplateOptions, Template, TemplateRegistry } from './types.ts'

/**
 * Resolve the body for an extension, applying the transform function if provided.
 */
function resolveBody(base: string, override: ExtendTemplateOptions['body']): string {
  if (override === undefined) {
    return base
  }
  if (isFunction(override)) {
    return override(base)
  }
  return override
}

/**
 * Apply extension options to a base template, producing a new template.
 */
function applyExtension(base: Template, options: ExtendTemplateOptions): Template {
  return {
    type: base.type,
    label: options.label ?? base.label,
    hint: options.hint ?? base.hint,
    body: resolveBody(base.body, options.body),
  }
}

/**
 * Create a new immutable template registry from a map of templates.
 */
function createFromMap(templates: ReadonlyMap<string, Template>): TemplateRegistry {
  return {
    templates,
    get: (type) => templates.get(type),
    has: (type) => templates.has(type),
    list: () => Array.from(templates.values()),
    types: () => Array.from(templates.keys()),
    add: (template) => createFromMap(new Map([...templates, [template.type, template]])),
    extend: (type, options) => {
      const base = templates.get(type)
      if (!base) {
        return createFromMap(templates)
      }
      const extended = applyExtension(base, options)
      return createFromMap(new Map([...templates, [type, extended]]))
    },
    merge: (other) => createFromMap(new Map([...templates, ...other.templates])),
  }
}

/**
 * Create a template registry pre-loaded with all built-in templates.
 *
 * @example
 * ```ts
 * import { createRegistry } from '@zpress/templates'
 *
 * // Use built-in templates as-is
 * const registry = createRegistry()
 * const guide = registry.get('guide')
 * ```
 *
 * @example
 * ```ts
 * // Add a custom template
 * const registry = createRegistry()
 *   .add(defineTemplate({
 *     type: 'adr',
 *     label: 'ADR',
 *     hint: 'Architecture decision record',
 *     body: '# {{title}}\n\n## Context\n\n## Decision\n\n## Consequences\n',
 *   }))
 * ```
 *
 * @example
 * ```ts
 * // Extend a built-in template
 * const registry = createRegistry()
 *   .extend('guide', {
 *     body: (base) => base + '\n## Internal Notes\n',
 *   })
 * ```
 */
export function createRegistry(): TemplateRegistry {
  const entries: ReadonlyArray<readonly [string, Template]> = Object.values(BUILT_IN_TEMPLATES).map(
    (t) => [t.type, t] as const
  )
  return createFromMap(new Map(entries))
}

/**
 * Create an empty template registry with no built-in templates.
 *
 * Useful when building a fully custom template set from scratch.
 *
 * @example
 * ```ts
 * const registry = createEmptyRegistry()
 *   .add(defineTemplate({ type: 'adr', label: 'ADR', hint: '...', body: '...' }))
 * ```
 */
export function createEmptyRegistry(): TemplateRegistry {
  return createFromMap(new Map())
}
