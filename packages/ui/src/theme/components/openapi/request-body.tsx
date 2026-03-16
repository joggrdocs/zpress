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

interface ParsedContent {
  readonly contentType: string
  readonly schema: Record<string, unknown>
  readonly example: unknown | null
}

function extractFirstContent(requestBody: Record<string, unknown>): ParsedContent | null {
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
            const { example } = mediaType as { readonly example?: unknown }
            return { contentType, schema, example: example ?? null }
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

  const exampleEl = match(parsed)
    .with(P.nonNullable, (p) =>
      match(p.example)
        .with(P.nonNullable, (ex) => (
          <CodeBlockRuntime lang="json" code={JSON.stringify(ex, null, 2)} />
        ))
        .otherwise(() => null)
    )
    .otherwise(() => null)

  return (
    <div className="zp-oas-request-body">
      <div className="zp-oas-request-body__title">Request Body</div>
      {descEl}
      {bodyEl}
      {exampleEl}
    </div>
  )
}
