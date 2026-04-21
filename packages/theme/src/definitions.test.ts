import { describe, it, expect } from 'vitest'

import {
  THEME_NAMES,
  COLOR_MODES,
  ICON_COLORS,
  isBuiltInTheme,
  isBuiltInIconColor,
  resolveDefaultColorMode,
} from './definitions.ts'

describe('THEME_NAMES constant', () => {
  it('should contain exactly the built-in theme names', () => {
    expect(THEME_NAMES).toStrictEqual(['base', 'midnight', 'arcade'])
  })

  it('should have exactly 3 entries', () => {
    expect(THEME_NAMES).toHaveLength(3)
  })
})

describe('COLOR_MODES constant', () => {
  it('should contain exactly the supported color modes', () => {
    expect(COLOR_MODES).toStrictEqual(['dark', 'light', 'toggle'])
  })

  it('should have exactly 3 entries', () => {
    expect(COLOR_MODES).toHaveLength(3)
  })
})

describe('ICON_COLORS constant', () => {
  it('should contain exactly the 8 built-in icon colors', () => {
    expect(ICON_COLORS).toStrictEqual([
      'purple',
      'blue',
      'green',
      'amber',
      'cyan',
      'red',
      'pink',
      'slate',
    ])
  })

  it('should have exactly 8 entries', () => {
    expect(ICON_COLORS).toHaveLength(8)
  })
})

describe('isBuiltInTheme()', () => {
  it('should return true for base', () => {
    expect(isBuiltInTheme('base')).toBe(true)
  })

  it('should return true for midnight', () => {
    expect(isBuiltInTheme('midnight')).toBe(true)
  })

  it('should return true for arcade', () => {
    expect(isBuiltInTheme('arcade')).toBe(true)
  })

  it('should return false for an unknown theme name', () => {
    expect(isBuiltInTheme('unknown')).toBe(false)
  })

  it('should return false for an empty string', () => {
    expect(isBuiltInTheme('')).toBe(false)
  })
})

describe('isBuiltInIconColor()', () => {
  it('should return true for purple', () => {
    expect(isBuiltInIconColor('purple')).toBe(true)
  })

  it('should return true for blue', () => {
    expect(isBuiltInIconColor('blue')).toBe(true)
  })

  it('should return true for green', () => {
    expect(isBuiltInIconColor('green')).toBe(true)
  })

  it('should return true for amber', () => {
    expect(isBuiltInIconColor('amber')).toBe(true)
  })

  it('should return true for cyan', () => {
    expect(isBuiltInIconColor('cyan')).toBe(true)
  })

  it('should return true for red', () => {
    expect(isBuiltInIconColor('red')).toBe(true)
  })

  it('should return true for pink', () => {
    expect(isBuiltInIconColor('pink')).toBe(true)
  })

  it('should return true for slate', () => {
    expect(isBuiltInIconColor('slate')).toBe(true)
  })

  it('should return false for an unknown color', () => {
    expect(isBuiltInIconColor('orange')).toBe(false)
  })

  it('should return false for an empty string', () => {
    expect(isBuiltInIconColor('')).toBe(false)
  })
})

describe('resolveDefaultColorMode()', () => {
  it('should return toggle for base', () => {
    expect(resolveDefaultColorMode('base')).toBe('toggle')
  })

  it('should return dark for midnight', () => {
    expect(resolveDefaultColorMode('midnight')).toBe('dark')
  })

  it('should return dark for arcade', () => {
    expect(resolveDefaultColorMode('arcade')).toBe('dark')
  })
})
