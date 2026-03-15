import { describe, it, expect } from 'vitest'

import { BUILT_IN_TEMPLATES } from '../src/built-in'
import { TEMPLATE_TYPES } from '../src/types'

describe('BUILT_IN_TEMPLATES', () => {
  it('should have an entry for every template type', () => {
    const keys = Object.keys(BUILT_IN_TEMPLATES)
    expect(keys).toEqual(expect.arrayContaining([...TEMPLATE_TYPES]))
    expect(keys.length).toBe(TEMPLATE_TYPES.length)
  })

  it('should have matching type field on every template', () => {
    Object.entries(BUILT_IN_TEMPLATES).map(([key, template]) => {
      return expect(template.type).toBe(key)
    })
  })

  it('should have non-empty label and hint on every template', () => {
    Object.values(BUILT_IN_TEMPLATES).map((template) => {
      expect(template.label.length).toBeGreaterThan(0)
      return expect(template.hint.length).toBeGreaterThan(0)
    })
  })

  it('should include {{title}} placeholder in every template body', () => {
    Object.values(BUILT_IN_TEMPLATES).map((template) => {
      return expect(template.body).toContain('{{title}}')
    })
  })

  it('should have a markdown heading in every template body', () => {
    Object.values(BUILT_IN_TEMPLATES).map((template) => {
      return expect(template.body).toMatch(/^# /m)
    })
  })
})
