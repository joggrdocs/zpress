import type React from 'react'
import { useCallback, useRef, useState } from 'react'
import { match } from 'ts-pattern'

export interface PromptProps {
  /**
   * Prompt or command text to display. Accepts inline content.
   */
  readonly children: React.ReactNode
}

/**
 * Copyable prompt block for CLI commands and AI prompts.
 * Visually distinct from code blocks with a prompt icon
 * and one-click copy button.
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

  const buttonLabel = match(copied)
    .with(true, () => 'Copied!')
    .otherwise(() => 'Copy')

  return (
    <div className="zp-prompt">
      <div className="zp-prompt__icon">
        <PromptIcon />
      </div>
      <div ref={contentRef} className="zp-prompt__content">
        {children}
      </div>
      <button type="button" className="zp-prompt__copy" onClick={handleCopy}>
        {buttonLabel}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Inline SVG prompt/terminal icon.
 *
 * @private
 * @returns SVG element
 */
function PromptIcon(): React.ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 4L6 8L2 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
