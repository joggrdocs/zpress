import { describe, it, expect } from 'vitest'

import { getBuiltInTemplates } from './built-in'
import { TEMPLATE_TYPES } from './types'

describe('built-in templates', () => {
  it('should have an entry for every template type', () => {
    const keys = Object.keys(getBuiltInTemplates())
    expect(keys).toStrictEqual(expect.arrayContaining([...TEMPLATE_TYPES]))
    expect(keys).toHaveLength(TEMPLATE_TYPES.length)
  })

  it('should have matching type field on every template', () => {
    Object.entries(getBuiltInTemplates()).map(([key, template]) => expect(template.type).toBe(key))
  })

  it('should have non-empty label and hint on every template', () => {
    Object.values(getBuiltInTemplates()).map((template) => [
      expect(template.label.length).toBeGreaterThan(0),
      expect(template.hint.length).toBeGreaterThan(0),
    ])
  })

  it('should include {{title}} placeholder in every template body', () => {
    Object.values(getBuiltInTemplates()).map((template) =>
      expect(template.body).toContain('{{title}}')
    )
  })

  it('should have a markdown heading in every template body', () => {
    Object.values(getBuiltInTemplates()).map((template) => expect(template.body).toMatch(/^# /m))
  })
})
