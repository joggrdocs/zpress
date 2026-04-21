import { describe, it, expect, vi } from 'vitest'

vi.mock(import('./head/read.ts'), () => ({
  readCss: vi.fn<(name: string) => string>((name: string) => `/* mock ${name} */`),
  readJs: vi.fn<(name: string) => string>((name: string) => `/* mock ${name} */`),
}))

const { getThemeCss } = await import('./css.ts')

const LOADER_CSS = '/* mock css/loader-backdrop.css *//* mock css/loader-dots.css */'

describe('getThemeCss()', () => {
  it('should return a string for built-in theme base', () => {
    expect(getThemeCss('base')).toStrictEqual(expect.any(String))
  })

  it('should return a string for built-in theme midnight', () => {
    expect(getThemeCss('midnight')).toStrictEqual(expect.any(String))
  })

  it('should return a string for built-in theme arcade', () => {
    expect(getThemeCss('arcade')).toStrictEqual(expect.any(String))
  })

  it('should return loader CSS for unknown theme name', () => {
    expect(getThemeCss('unknown')).toBe(LOADER_CSS)
  })

  it('should contain theme-specific CSS for built-in themes', () => {
    expect(getThemeCss('base')).toContain('/* mock css/themes/base.css */')
  })

  it('should contain loader CSS for built-in themes', () => {
    expect(getThemeCss('base')).toContain(LOADER_CSS)
  })
})
