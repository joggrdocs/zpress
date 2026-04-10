import type React from 'react'
import { useCallback, useRef, useState } from 'react'
import { match, P } from 'ts-pattern'

import { Icon } from './icon'

export type PromptAction = 'copy' | 'cursor'

export interface PromptProps {
  /**
   * Short description of what the prompt does.
   * Displayed as the visible summary.
   */
  readonly description?: string
  /**
   * Iconify icon ID rendered before the description.
   * Defaults to `pixelarticons:sparkles`.
   */
  readonly icon?: string
  /**
   * Action buttons to display. Defaults to `['copy']`.
   * - `copy` — copy prompt text to clipboard
   * - `cursor` — copy prompt text for use in Cursor IDE
   */
  readonly actions?: readonly PromptAction[]
  /**
   * The raw prompt text. Rendered inside an expandable code block.
   */
  readonly children: React.ReactNode
}

/**
 * AI prompt block with description, action buttons, and an expandable
 * code view for the full prompt text.
 *
 * @param props - Prompt configuration with description, icon, and actions
 * @returns React element with prompt card
 */
export function Prompt({
  description,
  icon = 'pixelarticons:sparkles',
  actions = ['copy'],
  children,
}: PromptProps): React.ReactElement {
  const [expanded, setExpanded] = useState(false)
  const [copiedAction, setCopiedAction] = useState<PromptAction | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const getRawText = useCallback(
    (): string =>
      match(contentRef.current)
        .with(null, () => '')
        .otherwise((el) => el.textContent ?? ''),
    []
  )

  const handleCopy = useCallback(
    (action: PromptAction) => {
      navigator.clipboard.writeText(getRawText()).then(() => {
        setCopiedAction(action)
        setTimeout(() => setCopiedAction(null), 2000)
        return null
      })
    },
    [getRawText]
  )

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  const descEl = match(description)
    .with(P.nonNullable, (d) => <span className="zp-prompt__description">{d}</span>)
    .otherwise(() => null)

  return (
    <div className="zp-prompt">
      <div className="zp-prompt__header">
        <span className="zp-prompt__icon">
          <Icon icon={icon} />
        </span>
        {descEl}
        <span className="zp-prompt__actions">
          {actions.map((action) => (
            <ActionButton
              key={action}
              action={action}
              copied={copiedAction === action}
              onPress={handleCopy}
            />
          ))}
          <button
            type="button"
            className="zp-prompt__action"
            onClick={toggleExpanded}
            title={match(expanded)
              .with(true, () => 'Hide prompt')
              .otherwise(() => 'Show prompt')}
          >
            <Icon
              icon={match(expanded)
                .with(true, () => 'pixelarticons:collapse')
                .otherwise(() => 'pixelarticons:expand')}
            />
          </button>
        </span>
      </div>
      <div ref={contentRef} className="zp-prompt__raw" hidden>
        {children}
      </div>
      {match(expanded)
        .with(true, () => (
          <pre className="zp-prompt__code">
            <code>{getRawText()}</code>
          </pre>
        ))
        .otherwise(() => null)}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

interface ActionButtonProps {
  readonly action: PromptAction
  readonly copied: boolean
  readonly onPress: (action: PromptAction) => void
}

/**
 * Render an action button for the prompt header.
 *
 * @private
 * @param props - Action type, copied state, and press handler
 * @returns Action button element
 */
function ActionButton({ action, copied, onPress }: ActionButtonProps): React.ReactElement {
  const handleClick = useCallback(() => {
    onPress(action)
  }, [action, onPress])

  return match(action)
    .with('copy', () => (
      <button
        type="button"
        className="zp-prompt__action"
        onClick={handleClick}
        title={match(copied)
          .with(true, () => 'Copied!')
          .otherwise(() => 'Copy to clipboard')}
      >
        <Icon
          icon={match(copied)
            .with(true, () => 'pixelarticons:check')
            .otherwise(() => 'pixelarticons:clipboard')}
        />
      </button>
    ))
    .with('cursor', () => (
      <button
        type="button"
        className="zp-prompt__action zp-prompt__action--cursor"
        onClick={handleClick}
        title={match(copied)
          .with(true, () => 'Copied for Cursor!')
          .otherwise(() => 'Copy for Cursor')}
      >
        <CursorIcon copied={copied} />
      </button>
    ))
    .exhaustive()
}

interface CursorIconProps {
  readonly copied: boolean
}

/**
 * Cursor IDE logo icon with copied state overlay.
 *
 * @private
 * @param props - Whether the copy was successful
 * @returns SVG element
 */
function CursorIcon({ copied }: CursorIconProps): React.ReactElement {
  if (copied) {
    return <Icon icon="pixelarticons:check" />
  }

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2L14 8L8 9.5L5.5 14L2 2Z" fill="currentColor" />
    </svg>
  )
}
