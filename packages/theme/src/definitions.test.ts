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
    expect(THEME_NAMES).toEqual(['base', 'midnight', 'arcade'])
  })

  it('should have exactly 3 entries', () => {
    expect(THEME_NAMES).toHaveLength(3)
  })
})

describe('COLOR_MODES constant', () => {
  it('should contain exactly the supported color modes', () => {
    expect(COLOR_MODES).toEqual(['dark', 'light', 'toggle'])
  })

  it('should have exactly 3 entries', () => {
    expect(COLOR_MODES).toHaveLength(3)
  })
})

describe('ICON_COLORS constant', () => {
  it('should contain exactly the 8 built-in icon colors', () => {
    expect(ICON_COLORS).toEqual([
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
    expect(isBuiltInTheme('base')).toBeTruthy()
  })

  it('should return true for midnight', () => {
    expect(isBuiltInTheme('midnight')).toBeTruthy()
  })

  it('should return true for arcade', () => {
    expect(isBuiltInTheme('arcade')).toBeTruthy()
  })

  it('should return false for an unknown theme name', () => {
    expect(isBuiltInTheme('unknown')).toBeFalsy()
  })

  it('should return false for an empty string', () => {
    expect(isBuiltInTheme('')).toBeFalsy()
  })
})

describe('isBuiltInIconColor()', () => {
  it('should return true for purple', () => {
    expect(isBuiltInIconColor('purple')).toBeTruthy()
  })

  it('should return true for blue', () => {
    expect(isBuiltInIconColor('blue')).toBeTruthy()
  })

  it('should return true for green', () => {
    expect(isBuiltInIconColor('green')).toBeTruthy()
  })

  it('should return true for amber', () => {
    expect(isBuiltInIconColor('amber')).toBeTruthy()
  })

  it('should return true for cyan', () => {
    expect(isBuiltInIconColor('cyan')).toBeTruthy()
  })

  it('should return true for red', () => {
    expect(isBuiltInIconColor('red')).toBeTruthy()
  })

  it('should return true for pink', () => {
    expect(isBuiltInIconColor('pink')).toBeTruthy()
  })

  it('should return true for slate', () => {
    expect(isBuiltInIconColor('slate')).toBeTruthy()
  })

  it('should return false for an unknown color', () => {
    expect(isBuiltInIconColor('orange')).toBeFalsy()
  })

  it('should return false for an empty string', () => {
    expect(isBuiltInIconColor('')).toBeFalsy()
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
