# OpenAPI Support: Implementation Plan

## Overview

Add OpenAPI documentation rendering to zpress — a custom sidebar + custom page layout for OpenAPI specs, scoped to workspace items (apps/packages). Uses `react-aria-components` for accessible headless primitives, styled with existing `--rp-*` / `--zp-*` CSS variables. The layout follows the industry-standard two-column pattern (spec on left, examples on right) used by Stripe, Scalar, and GitBook.

---

## Architecture

### Layout: Two-Column Operation Page

```text
┌─────────────────────────────────────────────────────────────┐
│ Sidebar (Rspress)          │  Main Content                  │
│                            │                                │
│ ▾ API Reference            │  ┌──────────┬───────────────┐  │
│   Overview                 │  │  Spec    │  Examples     │  │
│ ▾ Users                    │  │          │               │  │
│   ● GET  List Users  ←     │  │ Summary  │ Request       │  │
│   ● POST Create User       │  │ Params   │  curl ...     │  │
│ ▾ Teams                    │  │ Body     │               │  │
│   ● GET  List Teams        │  │ Resp     │ Response      │  │
│   ● POST Create Team       │  │ Security │  { json }     │  │
│ ▾ Auth                     │  │          │               │  │
│   ● POST Login             │  └──────────┴───────────────┘  │
│   ● POST Refresh Token     │                                │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```text
openapi.json
    │
    ▼
syncOpenAPI()                    (packages/core — build time)
    │
    ├─► SidebarItem[]            (tag groups → operations)
    │     └─► sidebar.json       (merged into multi-sidebar)
    │
    └─► PageData[]               (one .mdx per operation + index)
          └─► .zpress/content/apps/api/reference/*.mdx
                │
                ▼
          <OpenAPIOperation />   (packages/ui — runtime)
                │
                ├─► OperationHeader     (method badge + path + summary)
                ├─► ParametersTable     (path/query/header params)
                ├─► RequestBody         (schema + example)
                ├─► ResponseList        (status codes + schemas)
                ├─► SecurityBadges      (auth requirements)
                └─► CodeSample          (curl/fetch examples)
```

### Dependency Additions

| Package | Dep | Why |
|---|---|---|
| `packages/core` | `js-yaml` | Parse YAML OpenAPI specs |
| `packages/core` | `@apidevtools/swagger-parser` | Resolve `$ref`s, validate spec structure |
| `packages/ui` | `react-aria-components` | Headless accordion, select, tooltip, disclosure |
| `packages/ui` | `openapi-sampler` | Generate example values from JSON Schema |

---

## Implementation Steps

### Step 1: Config — Add `openapi` to Workspace type

**Files:**
- `packages/config/src/types.ts`
- `packages/config/src/schema.ts`

**Changes:**

Add `openapi?: OpenAPIConfig` to the `Workspace` interface (the canonical type for apps/packages/workspace items):

```ts
export interface Workspace {
  // ... existing fields ...
  readonly openapi?: OpenAPIConfig
}
```

Update the Zod schema in `schema.ts` — add `openapi: openapiConfigSchema.optional()` to `workspaceItemSchema` (or whatever the workspace item schema is named).

**No changes to `OpenAPIConfig` itself** — the existing `{ spec, prefix, title }` shape works.

---

### Step 2: Validation — Enforce OpenAPI config rules

**Files:**
- `packages/core/src/define-config.ts`

**Rules:**
- `spec` must be a non-empty string pointing to an existing file
- `prefix` must start with `/`
- Workspace-level `prefix` must start with the parent workspace's `prefix` (e.g., API app at `/apps/api` → OpenAPI prefix must be `/apps/api/reference` or similar)
- No duplicate `prefix` values across all OpenAPI configs

---

### Step 3: Sync — Parse spec and generate pages + sidebar

**Files:**
- `packages/core/src/sync/openapi.ts` (new)
- `packages/core/src/sync/index.ts` (wire in)
- `packages/core/src/sync/sidebar/multi.ts` (implement stub)

#### 3a. New `packages/core/src/sync/openapi.ts`

**Responsibilities:**
1. Read the spec file (JSON or YAML via `js-yaml`)
2. Resolve all `$ref`s via `@apidevtools/swagger-parser`
3. Extract operations from `paths[path][method]`
4. Group operations by their first tag (fallback: "default")
5. Generate one `.mdx` file per operation at `{contentDir}/{prefix}/{operationId}.mdx`
6. Generate an `index.mdx` overview page at `{contentDir}/{prefix}/index.mdx`
7. Return `{ sidebar: SidebarItem[], pages: PageData[] }`

**Generated MDX per operation:**

```mdx
---
title: List Users
---

import { OpenAPIOperation } from '@zpress/ui/theme'

<OpenAPIOperation
  specPath="apps/api/openapi.json"
  method="get"
  path="/users"
  operationId="listUsers"
/>
```

The component receives the operation identifier and resolves the spec at build time via Rsbuild's JSON import. The spec JSON is copied into the content directory alongside the MDX files so the import path is stable.

**Generated index.mdx (overview page):**

```mdx
---
title: API Reference
---

import { OpenAPIOverview } from '@zpress/ui/theme'

<OpenAPIOverview specPath="apps/api/openapi.json" />
```

**Sidebar output** (grouped by tag):

```ts
[
  {
    text: 'API Reference',
    link: '/apps/api/reference',
    items: [
      {
        text: 'Users',
        collapsed: false,
        items: [
          { text: 'GET List Users',    link: '/apps/api/reference/list-users' },
          { text: 'POST Create User',  link: '/apps/api/reference/create-user' },
          { text: 'GET Get User',      link: '/apps/api/reference/get-user' },
          { text: 'PATCH Update User', link: '/apps/api/reference/update-user' },
          { text: 'DELETE Delete User', link: '/apps/api/reference/delete-user' },
        ],
      },
      {
        text: 'Teams',
        collapsed: false,
        items: [
          { text: 'GET List Teams',         link: '/apps/api/reference/list-teams' },
          { text: 'POST Create Team',       link: '/apps/api/reference/create-team' },
          { text: 'GET List Team Members',  link: '/apps/api/reference/list-team-members' },
        ],
      },
      {
        text: 'Auth',
        collapsed: false,
        items: [
          { text: 'POST Login',         link: '/apps/api/reference/login' },
          { text: 'POST Refresh Token', link: '/apps/api/reference/refresh-token' },
        ],
      },
    ],
  },
]
```

#### 3b. Wire into `packages/core/src/sync/index.ts`

Replace the hardcoded empty array:

```ts
// Before:
const openapiSidebar: SidebarItem[] = []

// After:
const openapiResults = await syncAllOpenAPI({ config, ctx })
```

New `syncAllOpenAPI` function:
1. Collect all `OpenAPIConfig` sources: global `config.openapi` + each workspace item's `.openapi`
2. Call `syncOpenAPI()` for each
3. Append generated `PageData[]` to the page list
4. Pass `OpenAPISidebarEntry[]` to `buildMultiSidebar`

#### 3c. Implement `buildOpenapiSidebarEntries` in `sidebar/multi.ts`

Change signature from `SidebarItem[]` to `OpenAPISidebarEntry[]`:

```ts
interface OpenAPISidebarEntry {
  readonly prefix: string
  readonly sidebar: readonly SidebarItem[]
}

function buildOpenapiSidebarEntries(
  entries: readonly OpenAPISidebarEntry[]
): Record<string, readonly SidebarItem[]>
```

Each entry produces two sidebar keys (`{prefix}/` and `{prefix}`) for Rspress route matching.

---

### Step 4: UI Components — Operation page renderer

**Files (all new under `packages/ui/src/theme/components/openapi/`):**

```text
openapi/
├── index.ts                        # barrel export
├── operation.tsx + operation.css    # <OpenAPIOperation /> — full operation page
├── overview.tsx + overview.css      # <OpenAPIOverview /> — spec overview/index page
├── method-badge.tsx                 # HTTP method badge (GET/POST/PATCH/DELETE)
├── parameters-table.tsx             # Path, query, header params table
├── request-body.tsx                 # Request body schema + example
├── response-list.tsx                # Response status codes + schemas
├── security-badges.tsx              # Auth requirement badges
├── schema-viewer.tsx                # Recursive JSON Schema renderer (accordion)
├── code-sample.tsx                  # Generated curl/fetch code samples
├── openapi.css                      # Shared OpenAPI styles
└── utils.ts                         # Spec parsing helpers, example generation
```

#### Component Details

**`<OpenAPIOperation />`** — Top-level page component

Props:
```ts
interface OpenAPIOperationProps {
  readonly specPath: string
  readonly method: string
  readonly path: string
  readonly operationId: string
}
```

Renders the two-column layout:
- **Left column (spec):** `OperationHeader` → `ParametersTable` → `RequestBody` → `ResponseList` → `SecurityBadges`
- **Right column (examples):** `CodeSample` → response example JSON

Uses Rspress's built-in `Tabs`/`Tab` for language switching in code samples. Uses Rspress's `Badge` for status codes. Uses `react-aria-components` `Disclosure` for collapsible schema sections.

**`<OpenAPIOverview />`** — Index page for the API reference

Renders:
- API title, version, description (from `info`)
- Server URLs
- Authentication overview
- Tag list with operation counts (each links to first operation in tag)

**`<MethodBadge />`** — Colored HTTP method indicator

```text
GET    → green    (--zp-openapi-get)
POST   → blue     (--zp-openapi-post)
PUT    → amber    (--zp-openapi-put)
PATCH  → amber    (--zp-openapi-patch)
DELETE → red      (--zp-openapi-delete)
```

**`<ParametersTable />`** — Renders path/query/header parameters

Grouped by `in` value. Each row shows: name, type, required badge, description, default value. Uses a simple `<table>` (inherits Rspress table styles).

**`<RequestBody />`** — Request body with content type tabs

Uses Rspress `Tabs` to switch between content types (e.g., `application/json` vs `multipart/form-data`). Shows the schema via `<SchemaViewer />` and a generated example via `openapi-sampler`.

**`<ResponseList />`** — All responses, grouped by status code

Uses `react-aria-components` `Disclosure` to collapse/expand each status code. Shows response description, headers, and body schema.

**`<SchemaViewer />`** — Recursive JSON Schema tree

The core rendering primitive. Handles:
- Primitive types (string, number, boolean, integer)
- Objects (properties rendered as nested disclosures)
- Arrays (shows item schema)
- `oneOf` / `anyOf` / `allOf` (tabs or union display)
- `enum` values
- `required` markers
- `description` rendered inline
- `example` values
- Circular `$ref` detection (shows "Circular reference" badge)

Uses `react-aria-components` `Disclosure` for nested object expansion. Max depth: 6 levels, then shows "[Expand]" link.

**`<CodeSample />`** — Auto-generated request examples

Generates `curl` and `fetch` snippets from the operation's path, method, parameters, and request body. Uses Rspress's `Tabs` for language switching and `CodeBlock` (or `CodeBlockRuntime`) for syntax highlighting.

**`<SecurityBadges />`** — Auth requirements

Shows which security schemes apply (e.g., "Bearer Auth (JWT)") with a lock icon. Links to the overview page's auth section.

#### CSS Architecture

**New file: `openapi/openapi.css`**

All classes prefixed with `openapi-` following the existing BEM-like convention:

```css
.openapi-operation { }
.openapi-operation-columns { }
.openapi-operation-spec { }
.openapi-operation-examples { }
.openapi-method-badge { }
.openapi-method-badge--get { }
.openapi-method-badge--post { }
.openapi-params-table { }
.openapi-schema-viewer { }
.openapi-schema-property { }
.openapi-schema-property-name { }
.openapi-schema-property-type { }
.openapi-response-item { }
.openapi-code-sample { }
.openapi-security-badge { }
```

**New CSS variables** (defined per-theme in existing theme CSS files):

```css
/* Light/dark tokens added to each theme file */
--zp-openapi-get: #16a34a;
--zp-openapi-post: #2563eb;
--zp-openapi-put: #d97706;
--zp-openapi-patch: #d97706;
--zp-openapi-delete: #dc2626;
--zp-openapi-deprecated: var(--zp-c-text-3);
--zp-openapi-required: #dc2626;
--zp-openapi-col-spec-width: 55%;
--zp-openapi-col-example-width: 45%;
```

---

### Step 5: Theme exports — Register components

**Files:**
- `packages/ui/src/theme/index.tsx`

Add to the barrel exports:

```ts
export {
  OpenAPIOperation,
  OpenAPIOverview,
} from './components/openapi'
```

Add CSS import:

```ts
import './components/openapi/openapi.css'
```

**Note:** No changes to `plugin.ts` — the components are imported directly in the generated MDX via `@zpress/ui/theme`, which is already aliased by `config.ts`.

---

### Step 6: Theme CSS — Add OpenAPI tokens to each theme

**Files:**
- `packages/ui/src/theme/styles/themes/base.css`
- `packages/ui/src/theme/styles/themes/midnight.css`
- `packages/ui/src/theme/styles/themes/arcade.css`

Add the `--zp-openapi-*` color tokens to each theme's light and dark selectors. Each theme gets its own flavor:

- **base** — standard semantic colors (green/blue/amber/red)
- **midnight** — softer, blue-shifted variants
- **arcade** — neon-tinted variants matching the retro palette

---

### Step 7: Kitchen-sink example — Wire up the API app

**Files:**
- `examples/kitchen-sink/zpress.config.ts`

Add `openapi` to the API app entry:

```ts
{
  title: 'API',
  icon: 'devicon:hono',
  description: 'Hono REST API with typed routes',
  tags: ['hono', 'typescript'],
  prefix: '/apps/api',
  discovery: {
    from: 'docs/*.md',
    title: { from: 'auto' },
    sort: 'alpha',
  },
  openapi: {
    spec: 'apps/api/openapi.json',
    prefix: '/apps/api/reference',
    title: 'API Reference',
  },
},
```

**Expected result:**

The API app sidebar becomes:

```text
API
├── Authentication
├── Endpoints
├── Overview
└── API Reference →
      ├── Overview (index)
      ├── Users
      │   ├── GET  List Users
      │   ├── POST Create User
      │   ├── GET  Get User
      │   ├── PATCH Update User
      │   └── DELETE Delete User
      ├── Teams
      │   ├── GET  List Teams
      │   ├── POST Create Team
      │   └── GET  List Team Members
      └── Auth
          ├── POST Login
          └── POST Refresh Token
```

Clicking "GET List Users" renders the two-column operation page with parameters, response schemas, and a curl example.

---

## Implementation Order

| Phase | Steps | Packages | Description |
|---|---|---|---|
| **1. Plumbing** | 1, 2 | `config`, `core` | Types, schema, validation |
| **2. Sync engine** | 3a, 3b, 3c | `core` | Spec parsing, page gen, sidebar |
| **3. UI components** | 4, 5, 6 | `ui` | React components, CSS |
| **4. Integration** | 7 | `examples` | Kitchen-sink wiring, manual test |

Phases 1–2 can be tested independently (verify sidebar.json output, verify .mdx files are generated). Phase 3 is the bulk of the visual work. Phase 4 is validation.

---

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Rendering approach | Custom components (Approach B from prior plan) | No headless OpenAPI React lib exists; full theme integration |
| Headless primitives | `react-aria-components` | Accessible, truly unstyled, proven in this domain |
| Layout style | Two-column (spec + examples) | Industry standard (Stripe, Scalar, GitBook) |
| Spec parsing | `@apidevtools/swagger-parser` + `js-yaml` | MIT licensed, handles `$ref` resolution |
| Example generation | `openapi-sampler` | MIT licensed, generates realistic examples from JSON Schema |
| Page generation | One `.mdx` per operation | Clean URLs, individual sidebar entries, SEO-friendly |
| Sidebar grouping | By tag | Matches how most APIs organize endpoints |
| Code samples | Auto-generated curl + fetch | No external dependency, covers 90% of use cases |
| CSS approach | Plain CSS with `--zp-openapi-*` tokens | Matches existing zpress pattern, zero framework dep |

## Open Questions (Deferred)

1. **Try-it panel** — interactive request sending. Out of scope for v1, but component architecture supports adding it later via `react-aria` dialog + form primitives.
2. **Multiple specs per workspace** — `openapi: OpenAPIConfig[]`. Keep singular for v1, revisit if needed.
3. **Remote spec URLs** — `spec: 'https://...'`. Keep local-only for v1.
4. **Webhook support** — OpenAPI 3.1 webhooks. Skip for v1, add later.
5. **Search integration** — index operation descriptions in Rspress search. Deferred.
