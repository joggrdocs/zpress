import type React from 'react'
import { useMemo } from 'react'
import { match, P } from 'ts-pattern'

import { CodeSample } from './code-sample'
import { CopyMarkdownButton } from './copy-markdown-button'
import { generateOperationMarkdown } from './markdown'
import { MethodBadge } from './method-badge'
import { ParametersTable } from './parameters-table'
import { RequestBody } from './request-body'
import { ResponseList } from './response-list'
import { SecurityBadges } from './security-badges'

// ── Types ────────────────────────────────────────────────────

export interface OpenAPIOperationProps {
  /**
   * Parsed OpenAPI spec object.
   */
  readonly spec: Record<string, unknown>
  /**
   * HTTP method (get, post, put, patch, delete).
   */
  readonly method: string
  /**
   * URL path (e.g. /users/{id}).
   */
  readonly path: string
  /**
   * Operation ID for identification.
   */
  readonly operationId: string
}

// ── Helpers ──────────────────────────────────────────────────

function resolveOperation(
  spec: Record<string, unknown>,
  path: string,
  method: string
): Record<string, unknown> | null {
  const paths = spec['paths'] as Record<string, Record<string, unknown>> | undefined
  return match(paths)
    .with(P.nonNullable, (p) => {
      const pathItem = p[path]
      return match(pathItem)
        .with(P.nonNullable, (pi) => {
          const op = pi[method.toLowerCase()]
          return match(op)
            .with(P.nonNullable, (o) => o as Record<string, unknown>)
            .otherwise(() => null)
        })
        .otherwise(() => null)
    })
    .otherwise(() => null)
}

function resolveBaseUrl(spec: Record<string, unknown>): string {
  const servers = spec['servers'] as readonly Record<string, unknown>[] | undefined
  return match(servers)
    .with(
      P.when((s): s is readonly Record<string, unknown>[] => s !== undefined && s.length > 0),
      (s) => String(s[0]['url'] ?? 'https://api.example.com')
    )
    .otherwise(() => 'https://api.example.com')
}

function resolveSecurities(
  operation: Record<string, unknown>,
  spec: Record<string, unknown>
): Record<string, unknown> {
  const opSecurity = operation['security'] as readonly Record<string, unknown>[] | undefined
  const globalSecurity = spec['security'] as readonly Record<string, unknown>[] | undefined
  const securityList = match(opSecurity)
    .with(P.nonNullable, (s) => s)
    .otherwise(() =>
      match(globalSecurity)
        .with(P.nonNullable, (s) => s)
        .otherwise(() => [] as readonly Record<string, unknown>[])
    )

  return securityList.reduce<Record<string, unknown>>((acc, item) => Object.assign(acc, item), {})
}

// ── Sub-components ───────────────────────────────────────────

function OperationHeader({
  method,
  path,
  operationId,
  summary,
  deprecated,
}: {
  readonly method: string
  readonly path: string
  readonly operationId: string
  readonly summary: string | undefined
  readonly deprecated: boolean
}): React.ReactElement {
  const summaryEl = match(summary)
    .with(P.nonNullable, (s) => <div className="zp-oas-operation-summary">{s}</div>)
    .otherwise(() => null)

  const deprecatedEl = match(deprecated)
    .with(true, () => <span className="zp-oas-operation-deprecated">Deprecated</span>)
    .otherwise(() => null)

  return (
    <div>
      <div className="zp-oas-operation-header">
        <MethodBadge method={method} />
        <span className="zp-oas-operation-header__path">{path}</span>
        {deprecatedEl}
      </div>
      <div className="zp-oas-operation-header__id">{operationId}</div>
      {summaryEl}
    </div>
  )
}

function NotFound({
  method,
  path,
}: {
  readonly method: string
  readonly path: string
}): React.ReactElement {
  return (
    <div className="zp-oas-operation">
      <div className="zp-oas-operation-spec">
        <div className="zp-oas-operation-header">
          <MethodBadge method={method} />
          <span className="zp-oas-operation-header__path">{path}</span>
        </div>
        <div className="zp-oas-operation-summary">Operation not found in the provided spec.</div>
      </div>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────

/**
 * Main OpenAPI operation page component.
 *
 * Two-column layout: left column shows spec details (header,
 * parameters, request body, responses, security), right column
 * shows auto-generated code examples.
 */
export function OpenAPIOperation({
  spec,
  method,
  path,
  operationId,
}: OpenAPIOperationProps): React.ReactElement {
  const operation = resolveOperation(spec, path, method)
  const markdown = useMemo(
    () => generateOperationMarkdown({ spec, method, path, operationId }),
    [spec, method, path, operationId]
  )

  return match(operation)
    .with(P.nonNullable, (op) => {
      const parameters = (op['parameters'] ?? []) as readonly Record<string, unknown>[]
      const requestBody = op['requestBody'] as Record<string, unknown> | undefined
      const responses = (op['responses'] ?? {}) as Record<string, unknown>
      const summary = op['summary'] as string | undefined
      const description = op['description'] as string | undefined
      const deprecated = op['deprecated'] === true
      const securities = resolveSecurities(op, spec)
      const baseUrl = resolveBaseUrl(spec)

      const displaySummary: string | undefined = match(summary)
        .with(P.nonNullable, (s) => s)
        .otherwise(() =>
          match(description)
            .with(P.nonNullable, (d) => d as string | undefined)
            .otherwise(() => undefined as string | undefined)
        )

      const parametersEl = match(parameters)
        .with(
          P.when((p): p is readonly Record<string, unknown>[] => p.length > 0),
          (p) => <ParametersTable parameters={p} />
        )
        .otherwise(() => null)

      const requestBodyEl = match(requestBody)
        .with(P.nonNullable, (rb) => <RequestBody requestBody={rb} />)
        .otherwise(() => null)

      const responsesEl = match(Object.keys(responses))
        .with(
          P.when((k): k is string[] => k.length > 0),
          () => <ResponseList responses={responses} />
        )
        .otherwise(() => null)

      const securityEl = match(Object.keys(securities))
        .with(
          P.when((k): k is string[] => k.length > 0),
          () => <SecurityBadges securities={securities} />
        )
        .otherwise(() => null)

      return (
        <div className="zp-oas-operation">
          <div className="zp-oas-operation__copy">
            <CopyMarkdownButton markdown={markdown} />
          </div>
          <div className="zp-oas-operation-spec">
            <OperationHeader
              method={method}
              path={path}
              operationId={operationId}
              summary={displaySummary}
              deprecated={deprecated}
            />
            {parametersEl}
            {requestBodyEl}
            {responsesEl}
            {securityEl}
          </div>
          <div className="zp-oas-operation-examples">
            <CodeSample
              method={method}
              path={path}
              baseUrl={baseUrl}
              parameters={parameters}
              requestBody={requestBody}
            />
          </div>
        </div>
      )
    })
    .otherwise(() => <NotFound method={method} path={path} />)
}
