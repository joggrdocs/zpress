import type { ZpressConfig } from '@zpress/core'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock(import('../src/lib/rspress.ts'), () => ({
  buildSiteForCheck: vi.fn(),
}))

const { runConfigCheck, presentResults } = await import('../src/lib/check.ts')

const validConfig = { sections: [{ title: 'Test' }] } as unknown as ZpressConfig

const loadError = {
  _tag: 'ConfigError' as const,
  type: 'not_found' as const,
  message: 'Config not found',
}

const mockLogger = {
  success: vi.fn(),
  error: vi.fn(),
  message: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('runConfigCheck()', () => {
  it('should return passed: false with loadError when loadError is provided', () => {
    const result = runConfigCheck({ config: null, loadError })
    expect(result.passed).toBeFalsy()
    expect(result.errors).toContain(loadError)
  })

  it('should return passed: false with empty_sections error when config is null', () => {
    const result = runConfigCheck({ config: null, loadError: null })
    expect(result.passed).toBeFalsy()
    expect(result.errors[0]).toMatchObject({ type: 'empty_sections' })
  })

  it('should return passed: true with empty errors when config is valid', () => {
    const result = runConfigCheck({ config: validConfig, loadError: null })
    expect(result.passed).toBeTruthy()
    expect(result.errors).toHaveLength(0)
  })
})

describe('presentResults()', () => {
  it('should return true when both config passed and build passed', () => {
    const result = presentResults({
      configResult: { passed: true, errors: [] },
      buildResult: { status: 'passed' },
      logger: mockLogger,
    })
    expect(result).toBeTruthy()
  })

  it('should return false when config failed', () => {
    const result = presentResults({
      configResult: { passed: false, errors: [loadError] },
      buildResult: { status: 'passed' },
      logger: mockLogger,
    })
    expect(result).toBeFalsy()
  })

  it('should return false when build has deadlinks', () => {
    const result = presentResults({
      configResult: { passed: true, errors: [] },
      buildResult: {
        status: 'failed',
        deadlinks: [{ file: 'docs/page.md', links: ['/missing'] }],
      },
      logger: mockLogger,
    })
    expect(result).toBeFalsy()
  })

  it('should call logger.success when config is valid', () => {
    presentResults({
      configResult: { passed: true, errors: [] },
      buildResult: { status: 'passed' },
      logger: mockLogger,
    })
    expect(mockLogger.success).toHaveBeenCalledWith('Config valid')
  })

  it('should call logger.error when config failed', () => {
    presentResults({
      configResult: { passed: false, errors: [loadError] },
      buildResult: { status: 'skipped' },
      logger: mockLogger,
    })
    expect(mockLogger.error).toHaveBeenCalledWith('Config validation failed:')
  })
})
