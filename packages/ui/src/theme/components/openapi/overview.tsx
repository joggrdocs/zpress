import type React from 'react'
import { useMemo } from 'react'
import { match, P } from 'ts-pattern'

import { CopyMarkdownButton } from './copy-markdown-button'
import { generateOverviewMarkdown } from './markdown'
import { MethodBadge } from './method-badge'

// ── Types ────────────────────────────────────────────────────

export interface OpenAPIOverviewProps {
  /**
   * Parsed OpenAPI spec object.
   */
  readonly spec: Record<string, unknown>
}

// ── Helpers ──────────────────────────────────────────────────

function LockIcon(): React.ReactElement {
  return (
    <svg
      className="zp-oas-security__lock"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

interface TagInfo {
  readonly name: string
  readonly description: string
  readonly operationCount: number
  readonly firstOperationPath: string
  readonly firstOperationMethod: string
}

function collectTags(spec: Record<string, unknown>): readonly TagInfo[] {
  const paths = (spec['paths'] ?? {}) as Record<string, Record<string, unknown>>
  const tagMap: Record<string, { count: number; firstPath: string; firstMethod: string }> = {}

  Object.entries(paths).map(([pathStr, pathItem]) => {
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']
    methods.map((method) => {
      const operation = pathItem[method] as Record<string, unknown> | undefined
      if (operation !== undefined) {
        const tags = (operation['tags'] ?? ['default']) as readonly string[]
        tags.map((tag) => {
          const existing = tagMap[tag]
          if (existing === undefined) {
            tagMap[tag] = { count: 1, firstPath: pathStr, firstMethod: method }
          } else {
            existing.count += 1
          }
          return tag
        })
      }
      return method
    })
    return pathStr
  })

  const specTags = (spec['tags'] ?? []) as readonly Record<string, unknown>[]
  const specTagMap = Object.fromEntries(
    specTags.map((t) => [String(t['name'] ?? ''), String(t['description'] ?? '')])
  )

  return Object.entries(tagMap).map(([name, data]) => ({
    name,
    description: specTagMap[name] ?? '',
    operationCount: data.count,
    firstOperationPath: data.firstPath,
    firstOperationMethod: data.firstMethod,
  }))
}

// ── Sub-components ───────────────────────────────────────────

function ServerList({
  servers,
}: {
  readonly servers: readonly Record<string, unknown>[]
}): React.ReactElement | null {
  return match(servers)
    .with(
      P.when((s): s is readonly Record<string, unknown>[] => s.length > 0),
      (s) => (
        <div className="zp-oas-servers">
          <div className="zp-oas-overview__section-title">Servers</div>
          {s.map((server) => {
            const url = String(server['url'] ?? '')
            const description = server['description'] as string | undefined
            const descEl = match(description)
              .with(P.nonNullable, (d) => (
                <span className="zp-oas-server__description">{` — ${d}`}</span>
              ))
              .otherwise(() => null)
            return (
              <div key={url} className="zp-oas-server">
                <span className="zp-oas-server__url">{url}</span>
                {descEl}
              </div>
            )
          })}
        </div>
      )
    )
    .otherwise(() => null)
}

function AuthSchemes({
  schemes,
}: {
  readonly schemes: Record<string, Record<string, unknown>>
}): React.ReactElement | null {
  const entries = Object.entries(schemes)
  return match(entries)
    .with(
      P.when((e): e is [string, Record<string, unknown>][] => e.length > 0),
      (e) => (
        <div className="zp-oas-auth-schemes">
          <div className="zp-oas-overview__section-title">Authentication</div>
          {e.map(([name, scheme]) => (
            <div key={name} className="zp-oas-auth-scheme">
              <LockIcon />
              <span className="zp-oas-auth-scheme__name">{name}</span>
              <span className="zp-oas-auth-scheme__type">{String(scheme['type'] ?? '')}</span>
            </div>
          ))}
        </div>
      )
    )
    .otherwise(() => null)
}

function TagGroups({ tags }: { readonly tags: readonly TagInfo[] }): React.ReactElement | null {
  return match(tags)
    .with(
      P.when((t): t is readonly TagInfo[] => t.length > 0),
      (t) => (
        <div className="zp-oas-tags">
          <div className="zp-oas-overview__section-title">Operations</div>
          {t.map((tag) => {
            const descEl = match(tag.description)
              .with(
                P.when((d): d is string => d.length > 0),
                (d) => <div className="zp-oas-tag-group__description">{d}</div>
              )
              .otherwise(() => null)
            return (
              <div key={tag.name} className="zp-oas-tag-group">
                <div className="zp-oas-tag-group__header">
                  <span className="zp-oas-tag-group__name">{tag.name}</span>
                  <span className="zp-oas-tag-group__count">
                    {`${String(tag.operationCount)} operations`}
                  </span>
                </div>
                {descEl}
                <div style={{ marginTop: '0.375rem' }}>
                  <MethodBadge method={tag.firstOperationMethod} />
                  <span
                    style={{
                      fontFamily: 'var(--zp-font-family-mono, monospace)',
                      fontSize: '0.8125rem',
                      color: 'var(--zp-c-text-2)',
                      marginLeft: '0.5rem',
                    }}
                  >
                    {tag.firstOperationPath}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )
    )
    .otherwise(() => null)
}

// ── Component ────────────────────────────────────────────────

/**
 * API overview page component.
 *
 * Renders the API title, version, description, server URLs,
 * authentication schemes, and tag groups with operation counts.
 */
export function OpenAPIOverview({ spec }: OpenAPIOverviewProps): React.ReactElement {
  const markdown = useMemo(() => generateOverviewMarkdown({ spec }), [spec])
  const info = (spec['info'] ?? {}) as Record<string, unknown>
  const title = String(info['title'] ?? 'API Reference')
  const version = String(info['version'] ?? '')
  const description = info['description'] as string | undefined
  const servers = (spec['servers'] ?? []) as readonly Record<string, unknown>[]
  const components = (spec['components'] ?? {}) as Record<string, unknown>
  const securitySchemes = (components['securitySchemes'] ?? {}) as Record<
    string,
    Record<string, unknown>
  >
  const tags = collectTags(spec)

  const descEl = match(description)
    .with(P.nonNullable, (d) => <div className="zp-oas-overview__description">{d}</div>)
    .otherwise(() => null)

  const versionEl = match(version)
    .with(
      P.when((v): v is string => v.length > 0),
      (v) => <span className="zp-oas-overview__version">{v}</span>
    )
    .otherwise(() => null)

  return (
    <div className="zp-oas-overview">
      <div className="zp-oas-overview__copy">
        <CopyMarkdownButton markdown={markdown} />
      </div>
      <div className="zp-oas-overview__header">
        <h1 className="zp-oas-overview__title">
          {title}
          {versionEl}
        </h1>
        {descEl}
      </div>
      <ServerList servers={servers} />
      <AuthSchemes schemes={securitySchemes} />
      <TagGroups tags={tags} />
    </div>
  )
}
