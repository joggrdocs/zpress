import { CodeBlockRuntime } from '@rspress/core/theme'
import type React from 'react'
import { useState } from 'react'
import { match, P } from 'ts-pattern'

// ── Types ────────────────────────────────────────────────────

export interface CodeSampleProps {
  /**
   * HTTP method (get, post, etc.).
   */
  readonly method: string
  /**
   * URL path (e.g. /users/{id}).
   */
  readonly path: string
  /**
   * Base URL for the API server.
   */
  readonly baseUrl: string
  /**
   * Operation parameters for generating sample values.
   */
  readonly parameters?: readonly Record<string, unknown>[]
  /**
   * Request body for POST/PUT/PATCH examples.
   */
  readonly requestBody?: Record<string, unknown>
}

// ── Helpers ──────────────────────────────────────────────────

function buildUrl(baseUrl: string, urlPath: string): string {
  return `${baseUrl}${urlPath}`
}

function isBodyMethod(method: string): boolean {
  return method === 'post' || method === 'put' || method === 'patch'
}

function extractBodyExample(requestBody: Record<string, unknown> | undefined): unknown | null {
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
                const { example } = mediaType as { readonly example: unknown }
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

// ── Language generators ──────────────────────────────────────

function generateCurl(props: CodeSampleProps): string {
  const url = buildUrl(props.baseUrl, props.path)
  const method = props.method.toUpperCase()
  const headers = match(isBodyMethod(props.method.toLowerCase()))
    .with(true, () => " \\\n  -H 'Content-Type: application/json'")
    .otherwise(() => '')
  const body = match(extractBodyExample(props.requestBody))
    .with(P.nonNullable, (ex) => ` \\\n  -d '${JSON.stringify(ex)}'`)
    .otherwise(() => '')
  return `curl -X ${method} '${url}'${headers}${body}`
}

function generatePython(props: CodeSampleProps): string {
  const url = buildUrl(props.baseUrl, props.path)
  const method = props.method.toLowerCase()
  const bodyExample = extractBodyExample(props.requestBody)
  const hasBody = isBodyMethod(method) && bodyExample !== null

  const payloadLines = match(hasBody)
    .with(true, () => [`payload = ${JSON.stringify(bodyExample, null, 4)}`, ''])
    .otherwise(() => [])

  const jsonArg = match(hasBody)
    .with(true, () => ',\n    json=payload')
    .otherwise(() => '')

  return [
    'import requests',
    '',
    ...payloadLines,
    `response = requests.${method}(`,
    `    "${url}"${jsonArg}`,
    ')',
    '',
    'print(response.json())',
  ].join('\n')
}

function generateJavascript(props: CodeSampleProps): string {
  const url = buildUrl(props.baseUrl, props.path)
  const method = props.method.toUpperCase()
  const hasBody = isBodyMethod(props.method.toLowerCase())
  const bodyExample = extractBodyExample(props.requestBody)

  const headersStr = match(hasBody)
    .with(true, () => "\n  headers: { 'Content-Type': 'application/json' },")
    .otherwise(() => '')

  const bodyStr = match(hasBody && bodyExample !== null)
    .with(true, () => `\n  body: JSON.stringify(${JSON.stringify(bodyExample, null, 2)}),`)
    .otherwise(() => '')

  return [
    `const response = await fetch('${url}', {`,
    `  method: '${method}',${headersStr}${bodyStr}`,
    '})',
    '',
    'const data = await response.json()',
    'console.log(data)',
  ].join('\n')
}

function generateGo(props: CodeSampleProps): string {
  const url = buildUrl(props.baseUrl, props.path)
  const method = props.method.toUpperCase()
  const hasBody = isBodyMethod(props.method.toLowerCase())
  const bodyExample = extractBodyExample(props.requestBody)

  const hasBodyPayload = hasBody && bodyExample !== null
  const escapedBody = match(hasBodyPayload)
    .with(true, () => JSON.stringify(bodyExample).replaceAll('"', String.raw`\"`))
    .otherwise(() => '')

  const bodySetup = match(hasBodyPayload)
    .with(true, () =>
      [
        `\tpayload := strings.NewReader("${escapedBody}")`,
        `\treq, err := http.NewRequest("${method}", "${url}", payload)`,
      ].join('\n')
    )
    .otherwise(() => `\treq, err := http.NewRequest("${method}", "${url}", nil)`)

  const contentTypeHeader = match(hasBody)
    .with(true, () => '\treq.Header.Set("Content-Type", "application/json")')
    .otherwise(() => '')

  const stringsImport = match(hasBodyPayload)
    .with(true, () => ['\t"strings"'])
    .otherwise(() => [])

  return [
    'package main',
    '',
    'import (',
    '\t"fmt"',
    '\t"io"',
    '\t"net/http"',
    ...stringsImport,
    ')',
    '',
    'func main() {',
    bodySetup,
    '\tif err != nil {',
    '\t\tpanic(err)',
    '\t}',
    contentTypeHeader,
    '',
    '\tresp, err := http.DefaultClient.Do(req)',
    '\tif err != nil {',
    '\t\tpanic(err)',
    '\t}',
    '\tdefer resp.Body.Close()',
    '',
    '\tbody, _ := io.ReadAll(resp.Body)',
    '\tfmt.Println(string(body))',
    '}',
  ].join('\n')
}

function generateRuby(props: CodeSampleProps): string {
  const url = buildUrl(props.baseUrl, props.path)
  const method = props.method.toLowerCase()
  const hasBody = isBodyMethod(method)
  const bodyExample = extractBodyExample(props.requestBody)

  const uriLines = ["require 'net/http'", "require 'json'", '', `uri = URI('${url}')`]

  const methodClass = match(method)
    .with('get', () => 'Get')
    .with('post', () => 'Post')
    .with('put', () => 'Put')
    .with('patch', () => 'Patch')
    .with('delete', () => 'Delete')
    .otherwise(() => 'Get')

  const requestLines = [`request = Net::HTTP::${methodClass}.new(uri)`]

  const bodyLines = match(hasBody && bodyExample !== null)
    .with(true, () => [
      "request['Content-Type'] = 'application/json'",
      `request.body = '${JSON.stringify(bodyExample)}'`,
    ])
    .otherwise(() => [])

  return [
    ...uriLines,
    ...requestLines,
    ...bodyLines,
    '',
    'response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|',
    '  http.request(request)',
    'end',
    '',
    'puts JSON.parse(response.body)',
  ].join('\n')
}

function generateJava(props: CodeSampleProps): string {
  const url = buildUrl(props.baseUrl, props.path)
  const method = props.method.toUpperCase()
  const hasBody = isBodyMethod(props.method.toLowerCase())
  const bodyExample = extractBodyExample(props.requestBody)

  const builderMethod = match(hasBody && bodyExample !== null)
    .with(
      true,
      () =>
        `    .method("${method}", HttpRequest.BodyPublishers.ofString("${JSON.stringify(bodyExample).replaceAll('"', String.raw`\"`)}"))`
    )
    .otherwise(() => `    .method("${method}", HttpRequest.BodyPublishers.noBody())`)

  const contentTypeHeader = match(hasBody)
    .with(true, () => '\n    .header("Content-Type", "application/json")')
    .otherwise(() => '')

  return [
    'import java.net.http.*;',
    'import java.net.URI;',
    '',
    'HttpClient client = HttpClient.newHttpClient();',
    '',
    'HttpRequest request = HttpRequest.newBuilder()',
    `    .uri(URI.create("${url}"))`,
    `${builderMethod}${contentTypeHeader}`,
    '    .build();',
    '',
    'HttpResponse<String> response = client.send(',
    '    request, HttpResponse.BodyHandlers.ofString()',
    ');',
    '',
    'System.out.println(response.body());',
  ].join('\n')
}

// ── Tab config ───────────────────────────────────────────────

interface TabConfig {
  readonly label: string
  readonly lang: string
  readonly generator: (props: CodeSampleProps) => string
}

const TABS: readonly TabConfig[] = [
  { label: 'cURL', lang: 'bash', generator: generateCurl },
  { label: 'JavaScript', lang: 'javascript', generator: generateJavascript },
  { label: 'Python', lang: 'python', generator: generatePython },
  { label: 'Go', lang: 'go', generator: generateGo },
  { label: 'Ruby', lang: 'ruby', generator: generateRuby },
  { label: 'Java', lang: 'java', generator: generateJava },
]

// ── Component ────────────────────────────────────────────────

/**
 * Auto-generated code examples for an API operation.
 *
 * Renders cURL, JavaScript, Python, Go, Ruby, and Java code
 * using Rspress's CodeBlockRuntime for full syntax highlighting.
 */
export function CodeSample(props: CodeSampleProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string>('cURL')

  const activeConfig = TABS.find((tab) => tab.label === activeTab)
  const resolved = match(activeConfig)
    .with(P.nonNullable, (config) => ({
      code: config.generator(props),
      lang: config.lang,
    }))
    .otherwise(() => ({ code: generateCurl(props), lang: 'bash' }))

  return (
    <div className="zp-oas-code-sample">
      <div className="zp-oas-code-sample__title">Code Examples</div>
      <div className="zp-oas-code-sample__tabs">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            className={match(activeTab === tab.label)
              .with(true, () => 'zp-oas-code-sample__tab zp-oas-code-sample__tab--active')
              .otherwise(() => 'zp-oas-code-sample__tab')}
            onClick={() => {
              setActiveTab(tab.label)
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="zp-oas-code-sample__block">
        <CodeBlockRuntime lang={resolved.lang} code={resolved.code} />
      </div>
    </div>
  )
}
