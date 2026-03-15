// Types
export type {
  Template,
  TemplateType,
  TemplateVariables,
  TemplateRegistry,
  ExtendTemplateOptions,
} from './types.ts'

// Constants
export { TEMPLATE_TYPES } from './types.ts'
export { BUILT_IN_TEMPLATES } from './built-in.ts'

// Registry
export { createRegistry, createEmptyRegistry } from './registry.ts'

// Factories
export { defineTemplate } from './define.ts'

// Rendering
export { render, toSlug } from './render.ts'
