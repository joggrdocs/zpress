import { describe, it, expect } from 'vitest'

import { defineTemplate } from '../src/define'

describe('defineTemplate()', () => {
  it('should return a template with all fields', () => {
    const template = defineTemplate({
      type: 'adr',
      label: 'ADR',
      hint: 'Architecture decision record',
      body: '# {{title}}\n\n## Context\n',
    })
    expect(template).toEqual({
      type: 'adr',
      label: 'ADR',
      hint: 'Architecture decision record',
      body: '# {{title}}\n\n## Context\n',
    })
  })

  it('should return a new object (not the same reference)', () => {
    const input = {
      type: 'adr',
      label: 'ADR',
      hint: 'test',
      body: '# {{title}}',
    } as const
    const template = defineTemplate(input)
    expect(template).not.toBe(input)
    expect(template).toEqual(input)
  })
})
