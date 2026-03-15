/**
 * Built-in template type identifiers.
 */
export const TEMPLATE_TYPES = [
  'tutorial',
  'guide',
  'quickstart',
  'explanation',
  'reference',
  'standard',
  'troubleshooting',
  'runbook',
] as const

/**
 * A built-in template type identifier.
 */
export type TemplateType = (typeof TEMPLATE_TYPES)[number]

/**
 * Variables available for template rendering.
 * `title` is always required; additional custom variables are allowed.
 */
export interface TemplateVariables {
  readonly title: string
  readonly [key: string]: string
}

/**
 * A documentation template definition.
 */
export interface Template {
  readonly type: string
  readonly label: string
  readonly hint: string
  readonly body: string
}

/**
 * Options for extending an existing template.
 */
export interface ExtendTemplateOptions {
  readonly label?: string
  readonly hint?: string
  readonly body?: string | ((base: string) => string)
}

/**
 * An immutable registry of templates.
 */
export interface TemplateRegistry {
  readonly templates: ReadonlyMap<string, Template>
  readonly get: (type: string) => Template | undefined
  readonly has: (type: string) => boolean
  readonly list: () => readonly Template[]
  readonly types: () => readonly string[]
  readonly add: (template: Template) => TemplateRegistry
  readonly extend: (type: string, options: ExtendTemplateOptions) => TemplateRegistry
  readonly merge: (other: TemplateRegistry) => TemplateRegistry
}
