import { match, P } from 'ts-pattern'

// ── Constants ────────────────────────────────────────────────

export const HTTP_METHODS: readonly string[] = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
  'trace',
]

// ── Spec traversal helpers ───────────────────────────────────

/**
 * Resolve an operation object from the spec by path and method.
 */
export function resolveOperation(input: {
  readonly spec: Record<string, unknown>
  readonly path: string
  readonly method: string
}): Record<string, unknown> | null {
  const paths = input.spec['paths'] as Record<string, Record<string, unknown>> | undefined
  return match(paths)
    .with(P.nonNullable, (p) => {
      const pathItem = p[input.path]
      return match(pathItem)
        .with(P.nonNullable, (pi) => {
          const op = pi[input.method.toLowerCase()]
          return match(op)
            .with(P.nonNullable, (o) => o as Record<string, unknown>)
            .otherwise(() => null)
        })
        .otherwise(() => null)
    })
    .otherwise(() => null)
}

/**
 * Extract the first server URL from the spec, falling back to a placeholder.
 */
export function resolveBaseUrl(spec: Record<string, unknown>): string {
  const servers = spec['servers'] as readonly Record<string, unknown>[] | undefined
  return match(servers)
    .with(
      P.when((s): s is readonly Record<string, unknown>[] => s !== undefined && s.length > 0),
      (s) => String(s[0]['url'] ?? 'https://api.example.com')
    )
    .otherwise(() => 'https://api.example.com')
}

/**
 * Resolve security requirements from the operation or global spec.
 */
export function resolveSecurities(input: {
  readonly operation: Record<string, unknown>
  readonly spec: Record<string, unknown>
}): readonly Record<string, unknown>[] {
  const opSecurity = input.operation['security'] as readonly Record<string, unknown>[] | undefined
  const globalSecurity = input.spec['security'] as readonly Record<string, unknown>[] | undefined
  return match(opSecurity)
    .with(P.nonNullable, (s) => s)
    .otherwise(() =>
      match(globalSecurity)
        .with(P.nonNullable, (s) => s)
        .otherwise(() => [] as readonly Record<string, unknown>[])
    )
}

/**
 * Extract the first example value from a request body's content map.
 */
export function extractBodyExample(
  requestBody: Record<string, unknown> | undefined
): unknown | null {
  return match(requestBody)
    .with(P.nonNullable, (rb) => {
      const content = rb['content'] as Record<string, Record<string, unknown>> | undefined
      return match(content)
        .with(P.nonNullable, (c) => {
          const entries = Object.entries(c)
          return match(entries)
            .with(
              P.when((e): e is [string, Record<string, unknown>][] => e.length > 0),
              (e) => {
                const [[, mediaType]] = e
                const { example } = mediaType as { readonly example?: unknown }
                return match(example)
                  .with(P.nonNullable, (ex) => ex)
                  .otherwise(() => null)
              }
            )
            .otherwise(() => null)
        })
        .otherwise(() => null)
    })
    .otherwise(() => null)
}

/**
 * Check if an HTTP method typically carries a request body.
 */
export function isBodyMethod(method: string): boolean {
  return method === 'post' || method === 'put' || method === 'patch'
}
