/**
 * Pure markdown generators for OpenAPI operations and overviews.
 *
 * Produces copyable markdown strings from the same spec data
 * that the React components render, enabling "Copy Markdown"
 * functionality on OpenAPI pages.
 */

import { match, P } from 'ts-pattern'

import {
  extractBodyExample,
  HTTP_METHODS,
  isBodyMethod,
  resolveBaseUrl,
  resolveOperation,
  resolveSecurities,
} from './spec-utils'

interface OperationMarkdownInput {
  readonly spec: Record<string, unknown>
  readonly method: string
  readonly path: string
  readonly operationId: string
}

interface OverviewMarkdownInput {
  readonly spec: Record<string, unknown>
}

interface ParameterGroup {
  readonly label: string
  readonly items: readonly Record<string, unknown>[]
}

/**
 * Generate a complete markdown document for an OpenAPI operation.
 *
 * Includes the header, description, parameters table, request body,
 * responses, security, and a cURL code example.
 *
 * @param input - Operation data and parsed spec
 * @returns Markdown string
 */
export function generateOperationMarkdown(input: OperationMarkdownInput): string {
  const operation = resolveOperation({ spec: input.spec, path: input.path, method: input.method })

  if (operation === null) {
    return [`# ${input.method.toUpperCase()} ${input.path}`, '', 'Operation not found.'].join('\n')
  }

  const summary = operation['summary'] as string | undefined
  const description = operation['description'] as string | undefined
  const parameters = (operation['parameters'] ?? []) as readonly Record<string, unknown>[]
  const requestBody = operation['requestBody'] as Record<string, unknown> | undefined
  const responses = (operation['responses'] ?? {}) as Record<string, unknown>
  const deprecated = operation['deprecated'] === true
  const securities = resolveSecurities({ operation, spec: input.spec })
  const baseUrl = resolveBaseUrl(input.spec)

  const sections: readonly string[] = [
    buildOperationHeader(input.method, input.path, deprecated),
    buildSummarySection(summary, description),
    buildParametersSection(parameters),
    buildRequestBodySection(requestBody),
    buildResponsesSection(responses),
    buildSecuritySection(securities),
    buildCurlSection(input.method, input.path, baseUrl, requestBody),
  ].filter((s) => s.length > 0)

  return sections.join('\n\n')
}

/**
 * Generate a complete markdown document for an OpenAPI overview page.
 *
 * Includes API title, version, description, servers, authentication
 * schemes, and tag groups.
 *
 * @param input - Parsed spec object
 * @returns Markdown string
 */
export function generateOverviewMarkdown(input: OverviewMarkdownInput): string {
  const info = (input.spec['info'] ?? {}) as Record<string, unknown>
  const title = String(info['title'] ?? 'API Reference')
  const version = String(info['version'] ?? '')
  const description = info['description'] as string | undefined
  const servers = (input.spec['servers'] ?? []) as readonly Record<string, unknown>[]
  const components = (input.spec['components'] ?? {}) as Record<string, unknown>
  const securitySchemes = (components['securitySchemes'] ?? {}) as Record<
    string,
    Record<string, unknown>
  >

  const versionSuffix = match(version)
    .with(
      P.when((v): v is string => v.length > 0),
      (v) => ` (v${v})`
    )
    .otherwise(() => '')

  const sections: readonly string[] = [
    `# ${title}${versionSuffix}`,
    buildDescriptionBlock(description),
    buildServersSection(servers),
    buildAuthSchemesSection(securitySchemes),
    buildTagGroupsSection(input.spec),
  ].filter((s) => s.length > 0)

  return sections.join('\n\n')
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Build the markdown header for an operation.
 *
 * @private
 * @param method - HTTP method
 * @param urlPath - URL path template
 * @param deprecated - Whether the operation is deprecated
 * @returns Markdown heading string
 */
function buildOperationHeader(method: string, urlPath: string, deprecated: boolean): string {
  const deprecatedTag = match(deprecated)
    .with(true, () => ' ⚠️ DEPRECATED')
    .otherwise(() => '')
  return `# ${method.toUpperCase()} \`${urlPath}\`${deprecatedTag}`
}

/**
 * Build the summary/description section for an operation.
 *
 * @private
 * @param summary - Operation summary
 * @param description - Operation description
 * @returns Combined summary and description text
 */
function buildSummarySection(summary: string | undefined, description: string | undefined): string {
  const parts: string[] = []
  if (summary !== undefined) {
    parts.push(summary)
  }
  if (description !== undefined && description !== summary) {
    parts.push(description)
  }
  return parts.join('\n\n')
}

/**
 * Build the parameters section as markdown tables grouped by location.
 *
 * @private
 * @param parameters - OpenAPI parameter objects
 * @returns Markdown parameters section or empty string
 */
function buildParametersSection(parameters: readonly Record<string, unknown>[]): string {
  if (parameters.length === 0) {
    return ''
  }

  const groups = groupParametersByIn(parameters)
  const groupSections = groups.map((group) => {
    const rows = group.items.map((param) => {
      const name = String(param['name'] ?? '')
      const paramType = extractParamType(param)
      const required = match(param['required'])
        .with(true, () => 'Yes')
        .otherwise(() => 'No')
      const desc = String(param['description'] ?? '')
      return `| \`${name}\` | ${paramType} | ${required} | ${desc} |`
    })

    return [
      `**${group.label} parameters**`,
      '',
      '| Name | Type | Required | Description |',
      '| --- | --- | --- | --- |',
      ...rows,
    ].join('\n')
  })

  return ['## Parameters', '', ...groupSections].join('\n\n')
}

/**
 * Build the request body section as markdown.
 *
 * @private
 * @param requestBody - OpenAPI request body object
 * @returns Markdown request body section or empty string
 */
function buildRequestBodySection(requestBody: Record<string, unknown> | undefined): string {
  if (requestBody === undefined) {
    return ''
  }

  const description = requestBody['description'] as string | undefined
  const content = requestBody['content'] as Record<string, Record<string, unknown>> | undefined
  const lines: string[] = ['## Request Body']

  if (description !== undefined) {
    lines.push('', description)
  }

  if (content !== null && content !== undefined) {
    const entries = Object.entries(content)
    if (entries.length > 0) {
      const [[contentType, mediaType]] = entries
      lines.push('', `**Content-Type:** \`${contentType}\``)

      const schema = mediaType['schema'] as Record<string, unknown> | undefined
      if (schema !== undefined) {
        const schemaLines = renderSchemaMarkdown(schema, 0)
        lines.push('', schemaLines)
      }

      const example = mediaType['example'] as unknown
      if (example !== null && example !== undefined) {
        lines.push('', '**Example:**', '', '```json', JSON.stringify(example, null, 2), '```')
      }
    }
  }

  return lines.join('\n')
}

/**
 * Build the responses section as markdown.
 *
 * @private
 * @param responses - OpenAPI responses object keyed by status code
 * @returns Markdown responses section or empty string
 */
function buildResponsesSection(responses: Record<string, unknown>): string {
  const entries = Object.entries(responses)
  if (entries.length === 0) {
    return ''
  }

  const responseSections = entries.map(([code, value]) => {
    const response = (value ?? {}) as Record<string, unknown>
    const description = String(response['description'] ?? '')
    const schema = extractResponseSchema(response)
    const lines = [`### ${code} — ${description}`]

    if (schema !== null) {
      lines.push('', renderSchemaMarkdown(schema, 0))
    }

    return lines.join('\n')
  })

  return ['## Responses', '', ...responseSections].join('\n\n')
}

/**
 * Build the security/authentication section as markdown.
 *
 * @private
 * @param securities - Security requirement objects
 * @returns Markdown security section or empty string
 */
function buildSecuritySection(securities: readonly Record<string, unknown>[]): string {
  if (securities.length === 0) {
    return ''
  }

  const items = securities.map((requirement, index) => {
    const schemes = Object.entries(requirement).map(([name, scopes]) => {
      const scopeSuffix = match(scopes)
        .with(
          P.when((s): s is readonly string[] => Array.isArray(s) && s.length > 0),
          (s) => ` (${s.join(', ')})`
        )
        .otherwise(() => '')
      return `${name}${scopeSuffix}`
    })

    if (schemes.length === 0) {
      return '- No authentication'
    }

    const prefix = match(securities.length > 1)
      .with(true, () => `Option ${String(index + 1)}: `)
      .otherwise(() => '')
    return `- ${prefix}${schemes.join(' + ')}`
  })

  return ['## Authentication', '', ...items].join('\n')
}

/**
 * Shell-quote a string value for use in cURL commands.
 *
 * @private
 * @param value - String to quote
 * @returns Shell-quoted string
 */
function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\"'\"'")}'`
}

/**
 * Build a cURL example section as markdown.
 *
 * @private
 * @param method - HTTP method
 * @param urlPath - URL path template
 * @param baseUrl - API base URL
 * @param requestBody - Optional request body object
 * @returns Markdown cURL example section
 */
function buildCurlSection(
  method: string,
  urlPath: string,
  baseUrl: string,
  requestBody: Record<string, unknown> | undefined
): string {
  const normalizedMethod = method.toLowerCase()
  const url = `${baseUrl}${urlPath}`
  const upper = normalizedMethod.toUpperCase()

  const headerPart = match(isBodyMethod(normalizedMethod))
    .with(true, () => " \\\n  -H 'Content-Type: application/json'")
    .otherwise(() => '')

  const bodyExample = extractBodyExample(requestBody)
  const bodyPart = match(bodyExample)
    .with(P.nonNullable, (ex) => ` \\\n  -d ${shellQuote(JSON.stringify(ex))}`)
    .otherwise(() => '')

  const curl = `curl -X ${upper} ${shellQuote(url)}${headerPart}${bodyPart}`

  return ['## Example', '', '```bash', curl, '```'].join('\n')
}

/**
 * Build a description block, returning empty string if undefined.
 *
 * @private
 * @param description - Optional description text
 * @returns Description string or empty string
 */
function buildDescriptionBlock(description: string | undefined): string {
  if (description === undefined) {
    return ''
  }
  return description
}

/**
 * Build the servers section as markdown.
 *
 * @private
 * @param servers - Array of server objects
 * @returns Markdown servers section or empty string
 */
function buildServersSection(servers: readonly Record<string, unknown>[]): string {
  if (servers.length === 0) {
    return ''
  }

  const items = servers.map((server) => {
    const url = String(server['url'] ?? '')
    const desc = server['description'] as string | undefined
    const suffix = match(desc)
      .with(P.nonNullable, (d) => ` — ${d}`)
      .otherwise(() => '')
    return `- \`${url}\`${suffix}`
  })

  return ['## Servers', '', ...items].join('\n')
}

/**
 * Build the authentication schemes section as markdown.
 *
 * @private
 * @param schemes - Security scheme definitions keyed by name
 * @returns Markdown auth schemes section or empty string
 */
function buildAuthSchemesSection(schemes: Record<string, Record<string, unknown>>): string {
  const entries = Object.entries(schemes)
  if (entries.length === 0) {
    return ''
  }

  const items = entries.map(([name, scheme]) => {
    const schemeType = String(scheme['type'] ?? '')
    return `- **${name}** — ${schemeType}`
  })

  return ['## Authentication', '', ...items].join('\n')
}

/**
 * Build the tag groups / operations section as markdown.
 *
 * @private
 * @param spec - Parsed OpenAPI spec object
 * @returns Markdown operations section or empty string
 */
function buildTagGroupsSection(spec: Record<string, unknown>): string {
  const paths = (spec['paths'] ?? {}) as Record<string, Record<string, unknown>>

  const allTags = Object.values(paths).flatMap((pathItem) =>
    HTTP_METHODS.filter((method) => pathItem[method] !== undefined).flatMap((method) => {
      const operation = pathItem[method] as Record<string, unknown>
      return (operation['tags'] ?? ['default']) as readonly string[]
    })
  )

  if (allTags.length === 0) {
    return ''
  }

  const tagCounts = Map.groupBy(allTags, (tag) => tag)
  const items = [...tagCounts.entries()].map(
    ([tag, occurrences]) => `- **${tag}** — ${String(occurrences.length)} operations`
  )

  return ['## Operations', '', ...items].join('\n')
}

/**
 * Recursively render a JSON Schema as a markdown string.
 *
 * @private
 * @param schema - JSON Schema object
 * @param depth - Current nesting depth (max 4)
 * @returns Markdown representation of the schema
 */
function renderSchemaMarkdown(schema: Record<string, unknown>, depth: number): string {
  if (depth > 4) {
    return '_...(nested)_'
  }

  const schemaType = String(schema['type'] ?? '')
  const description = schema['description'] as string | undefined

  const oneOf = schema['oneOf'] as readonly Record<string, unknown>[] | undefined
  const anyOf = schema['anyOf'] as readonly Record<string, unknown>[] | undefined

  if (oneOf !== undefined) {
    const variants = oneOf.map(
      (v, i) => `  ${String(i + 1)}. ${renderSchemaMarkdown(v, depth + 1)}`
    )
    return [`**One of:**`, ...variants].join('\n')
  }

  if (anyOf !== undefined) {
    const variants = anyOf.map(
      (v, i) => `  ${String(i + 1)}. ${renderSchemaMarkdown(v, depth + 1)}`
    )
    return [`**Any of:**`, ...variants].join('\n')
  }

  if (schemaType === 'object') {
    return renderObjectSchemaMarkdown(schema, depth, description)
  }

  if (schemaType === 'array') {
    const items = (schema['items'] ?? {}) as Record<string, unknown>
    const itemDesc = renderSchemaMarkdown(items, depth + 1)
    const descSuffix = buildDescSuffix(description)
    return `array of ${itemDesc}${descSuffix}`
  }

  const enumValues = schema['enum'] as readonly unknown[] | undefined
  const enumSuffix = match(enumValues)
    .with(
      P.when((e): e is readonly unknown[] => e !== undefined && e.length > 0),
      (e) => ` (enum: ${e.map(String).join(', ')})`
    )
    .otherwise(() => '')
  const descSuffix = buildDescSuffix(description)

  return `\`${schemaType}\`${enumSuffix}${descSuffix}`
}

/**
 * Render an object schema as markdown with property listing.
 *
 * @private
 * @param schema - Object JSON Schema
 * @param depth - Current nesting depth
 * @param description - Optional schema description
 * @returns Markdown representation of the object schema
 */
function renderObjectSchemaMarkdown(
  schema: Record<string, unknown>,
  depth: number,
  description: string | undefined
): string {
  const properties = (schema['properties'] ?? {}) as Record<string, Record<string, unknown>>
  const requiredList = (schema['required'] ?? []) as readonly string[]
  const propEntries = Object.entries(properties)

  if (propEntries.length === 0) {
    const descSuffix = buildDescSuffix(description)
    return `\`object\`${descSuffix}`
  }

  const indent = '  '.repeat(depth)
  const rows = propEntries.map(([name, propSchema]) => {
    const required = match(requiredList.includes(name))
      .with(true, () => ' **(required)**')
      .otherwise(() => '')
    const propDesc = renderSchemaMarkdown(propSchema, depth + 1)
    return `${indent}- \`${name}\`${required}: ${propDesc}`
  })

  const descLine = buildDescSuffix(description)
  return [`\`object\`${descLine}`, ...rows].join('\n')
}

/**
 * Build a description suffix string for inline schema annotations.
 *
 * @private
 * @param description - Optional description text
 * @returns Formatted suffix string or empty string
 */
function buildDescSuffix(description: string | undefined): string {
  if (description !== undefined) {
    return ` — ${description}`
  }
  return ''
}

/**
 * Group parameters by their `in` field (path, query, header, etc.).
 *
 * @private
 * @param params - OpenAPI parameter objects
 * @returns Array of parameter groups
 */
function groupParametersByIn(
  params: readonly Record<string, unknown>[]
): readonly ParameterGroup[] {
  const grouped = Map.groupBy(params, (param) => String(param['in'] ?? 'other'))
  return [...grouped.entries()].map(([label, items]) => ({ label, items }))
}

/**
 * Extract the type string from a parameter's schema.
 *
 * @private
 * @param param - OpenAPI parameter object
 * @returns Type string or dash placeholder
 */
function extractParamType(param: Record<string, unknown>): string {
  const schema = param['schema'] as Record<string, unknown> | undefined
  if (schema !== undefined) {
    return String(schema['type'] ?? '—')
  }
  return '—'
}

/**
 * Extract the response schema from the first content type entry.
 *
 * @private
 * @param response - OpenAPI response object
 * @returns Schema object or null
 */
function extractResponseSchema(response: Record<string, unknown>): Record<string, unknown> | null {
  const content = response['content'] as Record<string, Record<string, unknown>> | undefined
  if (content === null || content === undefined) {
    return null
  }
  const entries = Object.entries(content)
  if (entries.length === 0) {
    return null
  }
  const [[, mediaType]] = entries
  return (mediaType['schema'] ?? null) as Record<string, unknown> | null
}
