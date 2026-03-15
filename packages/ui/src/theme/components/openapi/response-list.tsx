import type React from 'react'
import { Button, Disclosure, DisclosurePanel } from 'react-aria-components'
import { match, P } from 'ts-pattern'

import { SchemaViewer } from './schema-viewer'

// ── Types ────────────────────────────────────────────────────

export interface ResponseListProps {
  /**
   * OpenAPI responses object keyed by status code.
   */
  readonly responses: Record<string, unknown>
}

// ── Helpers ──────────────────────────────────────────────────

function ChevronIcon(): React.ReactElement {
  return (
    <svg
      className="zp-oas-response__chevron"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function statusClass(code: string): string {
  return match(code.charAt(0))
    .with('2', () => 'zp-oas-response__status--2xx')
    .with('3', () => 'zp-oas-response__status--3xx')
    .with('4', () => 'zp-oas-response__status--4xx')
    .with('5', () => 'zp-oas-response__status--5xx')
    .otherwise(() => '')
}

function extractSchema(response: Record<string, unknown>): Record<string, unknown> | null {
  const content = response['content'] as Record<string, Record<string, unknown>> | undefined
  return match(content)
    .with(P.nonNullable, (c) => {
      const entries = Object.entries(c)
      return match(entries)
        .with(
          P.when((e): e is [string, Record<string, unknown>][] => e.length > 0),
          (e) => {
            const [[, mediaType]] = e
            return (mediaType['schema'] ?? null) as Record<string, unknown> | null
          }
        )
        .otherwise(() => null)
    })
    .otherwise(() => null)
}

function renderResponseItem([code, value]: readonly [string, unknown]): React.ReactElement {
  const response = (value ?? {}) as Record<string, unknown>
  const description = String(response['description'] ?? '')
  const schema = extractSchema(response)

  const schemaEl = match(schema)
    .with(P.nonNullable, (s) => <SchemaViewer schema={s} />)
    .otherwise(() => <div className="zp-oas-response__description">No response body</div>)

  return (
    <Disclosure key={code} className="zp-oas-response">
      <Button className="zp-oas-response__trigger" slot="trigger">
        <span className={`zp-oas-response__status ${statusClass(code)}`}>{code}</span>
        <span className="zp-oas-response__description">{description}</span>
        <ChevronIcon />
      </Button>
      <DisclosurePanel>
        <div className="zp-oas-response__content">{schemaEl}</div>
      </DisclosurePanel>
    </Disclosure>
  )
}

// ── Component ────────────────────────────────────────────────

/**
 * Renders the list of response status codes for an OpenAPI operation.
 *
 * Each response is collapsible via react-aria-components Disclosure,
 * showing the response schema when expanded.
 */
export function ResponseList({ responses }: ResponseListProps): React.ReactElement {
  const entries = Object.entries(responses)

  return (
    <div className="zp-oas-responses">
      <div className="zp-oas-responses__title">Responses</div>
      {entries.map(renderResponseItem)}
    </div>
  )
}
