import { CodeBlockRuntime } from '@rspress/core/theme'
import type React from 'react'
import { match, P } from 'ts-pattern'

import { SchemaViewer } from './schema-viewer'

// ── Types ────────────────────────────────────────────────────

export interface RequestBodyProps {
  /**
   * OpenAPI requestBody object.
   */
  readonly requestBody: Record<string, unknown>
}

// ── Helpers ──────────────────────────────────────────────────

function extractFirstContent(
  requestBody: Record<string, unknown>
): { readonly contentType: string; readonly schema: Record<string, unknown> } | null {
  const content = requestBody['content'] as Record<string, Record<string, unknown>> | undefined
  return match(content)
    .with(P.nonNullable, (c) => {
      const entries = Object.entries(c)
      return match(entries)
        .with(
          P.when((e): e is [string, Record<string, unknown>][] => e.length > 0),
          (e) => {
            const [[contentType, mediaType]] = e
            const schema = (mediaType['schema'] ?? {}) as Record<string, unknown>
            return { contentType, schema }
          }
        )
        .otherwise(() => null)
    })
    .otherwise(() => null)
}

function renderExample(requestBody: Record<string, unknown>): React.ReactElement | null {
  const content = requestBody['content'] as Record<string, Record<string, unknown>> | undefined
  return match(content)
    .with(P.nonNullable, (c) => {
      const entries = Object.entries(c)
      return match(entries)
        .with(
          P.when((e): e is [string, Record<string, unknown>][] => e.length > 0),
          (e) => {
            const [[, mediaType]] = e
            const { example } = mediaType as { readonly example: unknown }
            return match(example)
              .with(P.nonNullable, (ex) => (
                <CodeBlockRuntime lang="json" code={JSON.stringify(ex, null, 2)} />
              ))
              .otherwise(() => null)
          }
        )
        .otherwise(() => null)
    })
    .otherwise(() => null)
}

// ── Component ────────────────────────────────────────────────

/**
 * Renders the request body section of an OpenAPI operation.
 *
 * Shows the content type, description, schema tree, and example payload.
 */
export function RequestBody({ requestBody }: RequestBodyProps): React.ReactElement {
  const description = requestBody['description'] as string | undefined
  const parsed = extractFirstContent(requestBody)

  const descEl = match(description)
    .with(P.nonNullable, (d) => <div className="zp-oas-request-body__description">{d}</div>)
    .otherwise(() => null)

  const bodyEl = match(parsed)
    .with(P.nonNullable, (p) => (
      <div>
        <div className="zp-oas-request-body__content-type">{p.contentType}</div>
        <SchemaViewer schema={p.schema} />
      </div>
    ))
    .otherwise(() => null)

  const exampleEl = renderExample(requestBody)

  return (
    <div className="zp-oas-request-body">
      <div className="zp-oas-request-body__title">Request Body</div>
      {descEl}
      {bodyEl}
      {exampleEl}
    </div>
  )
}
