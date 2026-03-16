import { LlmsCopyButton } from '@rspress/core/theme'
import type React from 'react'
import { useCallback } from 'react'

// ── Types ────────────────────────────────────────────────────

export interface CopyMarkdownButtonProps {
  /**
   * Markdown content to copy to the clipboard.
   */
  readonly markdown: string
}

// ── Component ────────────────────────────────────────────────

/**
 * Copy Markdown button that overrides Rspress's default copy behavior.
 *
 * Uses the native Clipboard API to copy pre-generated markdown content
 * instead of the raw MDX source.
 */
export function CopyMarkdownButton({ markdown }: CopyMarkdownButtonProps): React.ReactElement {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      void navigator.clipboard.writeText(markdown)
    },
    [markdown]
  )

  return <LlmsCopyButton text="Copy Markdown" onClick={handleClick} />
}
