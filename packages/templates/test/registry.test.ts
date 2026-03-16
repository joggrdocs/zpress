import { describe, it, expect } from 'vitest'

import { defineTemplate } from '../src/define'
import { createRegistry, createEmptyRegistry } from '../src/registry'
import { TEMPLATE_TYPES } from '../src/types'

describe('createRegistry()', () => {
  it('should include all built-in templates', () => {
    const registry = createRegistry()
    expect(registry.types()).toEqual(expect.arrayContaining([...TEMPLATE_TYPES]))
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
    expect(registry.has('guide')).toBeTruthy()
    expect(registry.has('nonexistent')).toBeFalsy()
  })

  it('should list all templates', () => {
    const registry = createRegistry()
    expect(registry.list().length).toBe(TEMPLATE_TYPES.length)
  })
})

describe('createEmptyRegistry()', () => {
  it('should have no templates', () => {
    const registry = createEmptyRegistry()
    expect(registry.list().length).toBe(0)
    expect(registry.types().length).toBe(0)
  })

  it('should return undefined for any type', () => {
    const registry = createEmptyRegistry()
    expect(registry.get('guide')).toBeUndefined()
  })
})

describe('registry.add()', () => {
  it('should add a custom template', () => {
    const registry = createEmptyRegistry()
    const adr = defineTemplate({
      type: 'adr',
      label: 'ADR',
      hint: 'Architecture decision record',
      body: '# {{title}}',
    })
    const updated = registry.add(adr)
    expect(updated.has('adr')).toBeTruthy()
    const result = updated.get('adr')
    expect(result).toBeDefined()
    if (result === undefined) {
      return
    }
    expect(result.label).toBe('ADR')
  })

  it('should not mutate the original registry', () => {
    const registry = createEmptyRegistry()
    const adr = defineTemplate({
      type: 'adr',
      label: 'ADR',
      hint: 'test',
      body: '# {{title}}',
    })
    registry.add(adr)
    expect(registry.has('adr')).toBeFalsy()
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
    expect(updated.types()).toEqual(registry.types())
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
    const a = createEmptyRegistry().add(
      defineTemplate({ type: 'adr', label: 'ADR', hint: 'a', body: '# A' })
    )
    const b = createEmptyRegistry().add(
      defineTemplate({ type: 'rfc', label: 'RFC', hint: 'b', body: '# B' })
    )
    const merged = a.merge(b)
    expect(merged.has('adr')).toBeTruthy()
    expect(merged.has('rfc')).toBeTruthy()
  })

  it('should let the other registry win on conflicts', () => {
    const a = createEmptyRegistry().add(
      defineTemplate({ type: 'adr', label: 'Original', hint: 'a', body: '# A' })
    )
    const b = createEmptyRegistry().add(
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
    const a = createEmptyRegistry().add(
      defineTemplate({ type: 'adr', label: 'ADR', hint: 'a', body: '# A' })
    )
    const b = createEmptyRegistry().add(
      defineTemplate({ type: 'rfc', label: 'RFC', hint: 'b', body: '# B' })
    )
    a.merge(b)
    expect(a.has('rfc')).toBeFalsy()
    expect(b.has('adr')).toBeFalsy()
  })
})
