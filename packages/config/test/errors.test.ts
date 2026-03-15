import { describe, it, expect } from 'vitest'
import { z } from 'zod/v3'

import { configError, configErrorFromZod } from '../src/errors.ts'

describe('configError()', () => {
  it('should return object with _tag ConfigError', () => {
    const result = configError('not_found', 'Config not found')
    expect(result._tag).toBe('ConfigError')
  })

  it('should return object with correct type', () => {
    const result = configError('parse_error', 'Parse failed')
    expect(result.type).toBe('parse_error')
  })

  it('should return object with correct message', () => {
    const result = configError('validation_failed', 'Validation failed')
    expect(result.message).toBe('Validation failed')
  })

  it('should return object with no errors property', () => {
    const result = configError('not_found', 'Config not found')
    expect(result.errors).toBeUndefined()
  })
})

describe('configErrorFromZod()', () => {
  it('should return object with _tag ConfigError', () => {
    const parseResult = z.string().safeParse(123)
    if (!parseResult.success) {
      const result = configErrorFromZod(parseResult.error)
      expect(result._tag).toBe('ConfigError')
    }
  })

  it('should return type validation_failed', () => {
    const parseResult = z.string().safeParse(123)
    if (!parseResult.success) {
      const result = configErrorFromZod(parseResult.error)
      expect(result.type).toBe('validation_failed')
    }
  })

  it('should return message Configuration validation failed', () => {
    const parseResult = z.string().safeParse(123)
    if (!parseResult.success) {
      const result = configErrorFromZod(parseResult.error)
      expect(result.message).toBe('Configuration validation failed')
    }
  })

  it('should map ZodError issues to errors array with path and message', () => {
    const parseResult = z.object({ name: z.string() }).safeParse({ name: 123 })
    if (!parseResult.success) {
      const result = configErrorFromZod(parseResult.error)
      expect(result.errors).toBeDefined()
      expect(result.errors).toHaveLength(1)
      if (result.errors) {
        expect(result.errors[0]).toMatchObject({
          path: ['name'],
          message: expect.any(String),
        })
      }
    }
  })
})
