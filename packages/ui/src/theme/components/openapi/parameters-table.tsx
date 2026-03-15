import type React from 'react'
import { match, P } from 'ts-pattern'

// ── Types ────────────────────────────────────────────────────

export interface ParametersTableProps {
  /**
   * OpenAPI parameter objects.
   */
  readonly parameters: readonly Record<string, unknown>[]
}

interface ParameterGroup {
  readonly label: string
  readonly items: readonly Record<string, unknown>[]
}

// ── Helpers ──────────────────────────────────────────────────

function groupByIn(params: readonly Record<string, unknown>[]): readonly ParameterGroup[] {
  const groups: Record<string, Record<string, unknown>[]> = {}
  params.map((param) => {
    const location = String(param['in'] ?? 'other')
    const existing = groups[location]
    if (existing === undefined) {
      groups[location] = [param]
    } else {
      existing.push(param)
    }
    return param
  })
  return Object.entries(groups).map(([label, items]) => ({ label, items }))
}

function renderRequired(param: Record<string, unknown>): React.ReactElement | null {
  return match(param['required'])
    .with(true, () => <span className="zp-oas-parameters__required">required</span>)
    .otherwise(() => null)
}

function renderDefault(param: Record<string, unknown>): React.ReactElement | null {
  return match(param['schema'])
    .with(P.nonNullable, (schema) =>
      match((schema as Record<string, unknown>)['default'])
        .with(P.nonNullable, (def) => (
          <span className="zp-oas-parameters__default">{String(def)}</span>
        ))
        .otherwise(() => null)
    )
    .otherwise(() => null)
}

function extractType(param: Record<string, unknown>): string {
  return match(param['schema'])
    .with(P.nonNullable, (schema) => String((schema as Record<string, unknown>)['type'] ?? '—'))
    .otherwise(() => '—')
}

function renderRow(param: Record<string, unknown>): React.ReactElement {
  return (
    <tr key={String(param['name'])}>
      <td>
        <span className="zp-oas-parameters__name">{String(param['name'] ?? '')}</span>
      </td>
      <td>
        <span className="zp-oas-parameters__type">{extractType(param)}</span>
      </td>
      <td>{renderRequired(param)}</td>
      <td>{String(param['description'] ?? '')}</td>
      <td>{renderDefault(param)}</td>
    </tr>
  )
}

function renderGroup(group: ParameterGroup): React.ReactElement {
  return (
    <div key={group.label}>
      <div className="zp-oas-parameters__group-label">{group.label}</div>
      <table className="zp-oas-parameters__table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
            <th>Default</th>
          </tr>
        </thead>
        <tbody>{group.items.map(renderRow)}</tbody>
      </table>
    </div>
  )
}

// ── Component ────────────────────────────────────────────────

/**
 * Renders operation parameters grouped by location (path, query, header).
 *
 * Each group displays a table with name, type, required, description, and default columns.
 */
export function ParametersTable({ parameters }: ParametersTableProps): React.ReactElement {
  const groups = groupByIn(parameters)

  return match(groups)
    .with(
      P.when((g): g is readonly ParameterGroup[] => g.length > 0),
      (g) => (
        <div className="zp-oas-parameters">
          <div className="zp-oas-parameters__title">Parameters</div>
          {g.map(renderGroup)}
        </div>
      )
    )
    .otherwise(() => <div />)
}
