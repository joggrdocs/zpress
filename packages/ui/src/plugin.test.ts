import { describe, it, expect } from 'vitest'

import { zpressPlugin } from './plugin.ts'

describe('zpressPlugin()', () => {
  it('should return plugin with name zpress', () => {
    const plugin = zpressPlugin()
    expect(plugin.name).toBe('zpress')
  })

  it('should return plugin with globalUIComponents array', () => {
    const plugin = zpressPlugin()
    expect(Array.isArray(plugin.globalUIComponents)).toBeTruthy()
  })

  it('should contain a path ending with theme-provider.tsx', () => {
    const plugin = zpressPlugin()
    const components = plugin.globalUIComponents as string[]
    expect(components.some((c) => c.endsWith('theme-provider.tsx'))).toBeTruthy()
  })
})
