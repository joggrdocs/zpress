import { describe, it, expect } from 'vitest'

import { defineTemplate } from './define'
import { createRegistry } from './registry'
import { TEMPLATE_TYPES } from './types'

describe('createRegistry()', () => {
  it('should include all built-in templates', () => {
    const registry = createRegistry()
    expect(registry.types()).toStrictEqual(expect.arrayContaining([...TEMPLATE_TYPES]))
  })

  it('should return correct template for each type', () => {
    const registry = createRegistry()
    TEMPLATE_TYPES.map((type) => {
      const template = registry.get(type)
      expect(template).toBeDefined()
      if (template === undefined) {
        return null
      }
      return expect(template.type).toBe(type)
    })
  })

  it('should return undefined for unknown type', () => {
    const registry = createRegistry()
    expect(registry.get('nonexistent')).toBeUndefined()
  })

  it('should report has() correctly', () => {
    const registry = createRegistry()
    expect(registry.has('guide')).toBe(true)
    expect(registry.has('nonexistent')).toBe(false)
  })

  it('should list all templates', () => {
    const registry = createRegistry()
    expect(registry.list()).toHaveLength(TEMPLATE_TYPES.length)
  })
})

describe('createRegistry([])', () => {
  it('should have no templates', () => {
    const registry = createRegistry([])
    expect(registry.list()).toHaveLength(0)
    expect(registry.types()).toHaveLength(0)
  })

  it('should return undefined for any type', () => {
    const registry = createRegistry([])
    expect(registry.get('guide')).toBeUndefined()
  })
})

describe('registry.add()', () => {
  it('should add a custom template', () => {
    const registry = createRegistry([])
    const adr = defineTemplate({
      type: 'adr',
      label: 'ADR',
      hint: 'Architecture decision record',
      body: '# {{title}}',
    })
    const updated = registry.add(adr)
    expect(updated.has('adr')).toBe(true)
    const result = updated.get('adr')
    expect(result).toBeDefined()
    if (result === undefined) {
      return
    }
    expect(result.label).toBe('ADR')
  })

  it('should not mutate the original registry', () => {
    const registry = createRegistry([])
    const adr = defineTemplate({
      type: 'adr',
      label: 'ADR',
      hint: 'test',
      body: '# {{title}}',
    })
    registry.add(adr)
    expect(registry.has('adr')).toBe(false)
  })

  it('should overwrite an existing template with the same type', () => {
    const registry = createRegistry()
    const customGuide = defineTemplate({
      type: 'guide',
      label: 'Custom Guide',
      hint: 'custom',
      body: '# Custom {{title}}',
    })
    const updated = registry.add(customGuide)
    const guide = updated.get('guide')
    expect(guide).toBeDefined()
    if (guide === undefined) {
      return
    }
    expect(guide.label).toBe('Custom Guide')
  })
})

describe('registry.extend()', () => {
  it('should extend body with a string replacement', () => {
    const registry = createRegistry()
    const updated = registry.extend('guide', { body: '# Custom Body' })
    const guide = updated.get('guide')
    expect(guide).toBeDefined()
    if (guide === undefined) {
      return
    }
    expect(guide.body).toBe('# Custom Body')
  })

  it('should extend body with a transform function', () => {
    const registry = createRegistry()
    const updated = registry.extend('guide', {
      body: (base) => `${base}\n## Internal Notes\n`,
    })
    const guide = updated.get('guide')
    expect(guide).toBeDefined()
    if (guide === undefined) {
      return
    }
    expect(guide.body).toContain('## Internal Notes')
    expect(guide.body).toContain('## Prerequisites')
  })

  it('should extend label and hint', () => {
    const registry = createRegistry()
    const updated = registry.extend('guide', {
      label: 'How-To',
      hint: 'Step-by-step instructions',
    })
    const guide = updated.get('guide')
    expect(guide).toBeDefined()
    if (guide === undefined) {
      return
    }
    expect(guide.label).toBe('How-To')
    expect(guide.hint).toBe('Step-by-step instructions')
  })

  it('should preserve original fields when not overridden', () => {
    const registry = createRegistry()
    const original = registry.get('guide')
    expect(original).toBeDefined()
    if (original === undefined) {
      return
    }
    const updated = registry.extend('guide', { label: 'How-To' })
    const guide = updated.get('guide')
    expect(guide).toBeDefined()
    if (guide === undefined) {
      return
    }
    expect(guide.hint).toBe(original.hint)
    expect(guide.body).toBe(original.body)
  })

  it('should return unchanged registry when extending nonexistent type', () => {
    const registry = createRegistry()
    const updated = registry.extend('nonexistent', { label: 'Test' })
    expect(updated.types()).toStrictEqual(registry.types())
  })

  it('should not mutate the original registry', () => {
    const registry = createRegistry()
    const original = registry.get('guide')
    expect(original).toBeDefined()
    if (original === undefined) {
      return
    }
    const originalLabel = original.label
    registry.extend('guide', { label: 'Changed' })
    const guide = registry.get('guide')
    expect(guide).toBeDefined()
    if (guide === undefined) {
      return
    }
    expect(guide.label).toBe(originalLabel)
  })
})

describe('registry.merge()', () => {
  it('should combine two registries', () => {
    const a = createRegistry([]).add(
      defineTemplate({ type: 'adr', label: 'ADR', hint: 'a', body: '# A' })
    )
    const b = createRegistry([]).add(
      defineTemplate({ type: 'rfc', label: 'RFC', hint: 'b', body: '# B' })
    )
    const merged = a.merge(b)
    expect(merged.has('adr')).toBe(true)
    expect(merged.has('rfc')).toBe(true)
  })

  it('should let the other registry win on conflicts', () => {
    const a = createRegistry([]).add(
      defineTemplate({ type: 'adr', label: 'Original', hint: 'a', body: '# A' })
    )
    const b = createRegistry([]).add(
      defineTemplate({ type: 'adr', label: 'Override', hint: 'b', body: '# B' })
    )
    const merged = a.merge(b)
    const adr = merged.get('adr')
    expect(adr).toBeDefined()
    if (adr === undefined) {
      return
    }
    expect(adr.label).toBe('Override')
  })

  it('should not mutate either source registry', () => {
    const a = createRegistry([]).add(
      defineTemplate({ type: 'adr', label: 'ADR', hint: 'a', body: '# A' })
    )
    const b = createRegistry([]).add(
      defineTemplate({ type: 'rfc', label: 'RFC', hint: 'b', body: '# B' })
    )
    a.merge(b)
    expect(a.has('rfc')).toBe(false)
    expect(b.has('adr')).toBe(false)
  })
})
