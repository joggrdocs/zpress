import { describe, it, expect } from 'vitest'

import { renderFigletText, renderPixelText } from './figlet'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SPECIALS = ' -._'

describe('renderFigletText (ANSI Shadow)', () => {
  const letters = [...ALPHABET]

  letters.forEach((letter) => {
    it(`should render letter ${letter}`, () => {
      const result = renderFigletText(letter)
      expect(result.lines.join('\n')).toMatchSnapshot()
    })
  })

  const digits = [...DIGITS]

  digits.forEach((digit) => {
    it(`should render digit ${digit}`, () => {
      const result = renderFigletText(digit)
      expect(result.lines.join('\n')).toMatchSnapshot()
    })
  })

  const specials = [...SPECIALS]

  specials.forEach((char) => {
    it(`should render special char ${JSON.stringify(char)}`, () => {
      const result = renderFigletText(char)
      expect(result.lines.join('\n')).toMatchSnapshot()
    })
  })

  it('should render full word "zpress"', () => {
    const result = renderFigletText('zpress')
    expect(result.lines.join('\n')).toMatchSnapshot()
  })

  it('should return 6 rows', () => {
    const result = renderFigletText('A')
    expect(result.rows).toBe(6)
  })
})

describe('renderPixelText (RubiFont)', () => {
  const letters = [...ALPHABET]

  letters.forEach((letter) => {
    it(`should render letter ${letter}`, () => {
      const result = renderPixelText(letter)
      expect(result.lines.join('\n')).toMatchSnapshot()
    })
  })

  it('should render full word "zpress"', () => {
    const result = renderPixelText('zpress')
    expect(result.lines.join('\n')).toMatchSnapshot()
  })

  it('should render a long title', () => {
    const result = renderPixelText('my-long-project')
    expect(result.lines.join('\n')).toMatchSnapshot()
  })

  it('should return 4 rows', () => {
    const result = renderPixelText('A')
    expect(result.rows).toBe(4)
  })

  it('should fall back to space for unknown characters', () => {
    const result = renderPixelText('A1B')
    const known = renderPixelText('A B')
    expect(result.lines).toEqual(known.lines)
  })
})
