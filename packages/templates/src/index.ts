export type {
  Template,
  TemplateType,
  TemplateVariables,
  TemplateRegistry,
  ExtendTemplateOptions,
} from './types.ts'

export { TEMPLATE_TYPES } from './types.ts'
export { BUILT_IN_TEMPLATES } from './built-in.ts'

export { createRegistry } from './registry.ts'

export { defineTemplate } from './define.ts'

export { render, toSlug } from './render.ts'
