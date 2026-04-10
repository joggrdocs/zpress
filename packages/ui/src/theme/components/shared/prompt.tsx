import type React from 'react'
import { useCallback, useRef, useState } from 'react'
import { match } from 'ts-pattern'

import { Icon } from './icon'

export interface PromptProps {
  /**
   * Prompt text to display. Accepts inline content.
   */
  readonly children: React.ReactNode
}

/**
 * Copyable AI prompt block with sparkle icon and one-click copy.
 * Designed for sharing prompts, instructions, and reusable text snippets.
 *
 * @param props - Prompt content
 * @returns React element with copyable prompt block
 */
export function Prompt({ children }: PromptProps): React.ReactElement {
  const [copied, setCopied] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleCopy = useCallback(() => {
    const text = match(contentRef.current)
      .with(null, () => '')
      .otherwise((el) => el.textContent ?? '')

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return null
    })
  }, [])

  const buttonIcon = match(copied)
    .with(true, () => <Icon icon="pixelarticons:check" />)
    .otherwise(() => <Icon icon="pixelarticons:clipboard" />)

  const buttonLabel = match(copied)
    .with(true, () => 'Copied')
    .otherwise(() => 'Copy')

  return (
    <div className="zp-prompt">
      <div className="zp-prompt__header">
        <span className="zp-prompt__label">
          <Icon icon="pixelarticons:sparkles" />
          Prompt
        </span>
        <button type="button" className="zp-prompt__copy" onClick={handleCopy}>
          {buttonIcon}
          <span>{buttonLabel}</span>
        </button>
      </div>
      <div ref={contentRef} className="zp-prompt__content">
        {children}
      </div>
    </div>
  )
}
