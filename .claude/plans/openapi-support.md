# OpenAPI Support: Workspace-Level + Global

## Current State

The codebase has **plumbing** for a single global `openapi` field on `ZpressConfig`, but the actual renderer is stubbed out with VitePress-era TODO comments. The `syncOpenAPI()` function in `packages/core/src/sync/openapi.ts` generates empty placeholder files. The sync engine at `packages/core/src/sync/index.ts:155-157` hardcodes an empty sidebar array and never calls `syncOpenAPI()`.

## Example Added

- **Spec file**: `examples/kitchen-sink/apps/api/openapi.json` — a realistic 3-tag (Users, Teams, Auth) spec with 8 operations, request/response schemas, and JWT security.
- **Config updated**: `examples/kitchen-sink/zpress.config.ts` now shows both:
  - **Global**: `openapi: { spec, prefix, title }` at root (existing type, just unused)
  - **Workspace-level**: `openapi: { spec, prefix, title }` on the API `WorkspaceItem` (new field)

---

## What Needs to Change

### 1. Types — `packages/core/src/types.ts`

**Add `openapi` to `WorkspaceItem`:**

```ts
export interface WorkspaceItem {
  // ... existing fields ...

  /**
   * OpenAPI spec integration scoped to this workspace.
   * Generates interactive API docs under the specified prefix.
   * `spec` is relative to repo root. `prefix` should be under `docsPrefix`.
   */
  readonly openapi?: OpenAPIConfig
}
```

No changes needed to `OpenAPIConfig` itself — the existing shape (`spec`, `prefix`, `title`) works for both global and workspace-level.

**Consideration**: Should workspace-level `prefix` be required to start with `docsPrefix`? e.g. if `docsPrefix: '/apps/api'` then `prefix` must start with `/apps/api/`. This keeps API docs nested under their parent workspace sidebar. Enforcing this in validation prevents orphaned sidebar namespaces.

### 2. Validation — `packages/core/src/define-config.ts`

**Add OpenAPI validation to `validateConfig()`:**

```
validateOpenAPIConfig(config.openapi)           // global
validateWorkspaceOpenAPI(config.apps)            // per-app
validateWorkspaceOpenAPI(config.packages)        // per-package
validateWorkspaceOpenAPI(workspaceGroupItems)    // per-group-item
```

**Validation rules for `OpenAPIConfig`:**
- `spec` is required (non-empty string)
- `prefix` is required (must start with `/`)
- No duplicate `prefix` values across all OpenAPI configs (global + all workspaces)
- Workspace-level: `prefix` should start with the parent `docsPrefix`

**Add to `validateWorkspaceItems()`:**
- If `item.openapi` is present, validate its fields
- Check `prefix` uniqueness against the global `openapi.prefix` and other workspace prefixes

### 3. Rewrite the OpenAPI sync module — `packages/core/src/sync/openapi.ts`

The current module generates VitePress Vue templates. It needs a full rewrite for Rspress/MDX. The core algorithm stays the same (parse spec → generate pages → build sidebar), but the output format changes.

**Key changes:**

| Current (VitePress) | Target (Rspress) |
|---|---|
| `[operationId].paths.js` (dynamic routes) | Individual `.mdx` files per operation |
| Vue template rendering | MDX with React components |
| Single global invocation | Called per-config (global + each workspace) |

**New function signature:**

```ts
interface SyncOpenAPIOptions {
  readonly config: OpenAPIConfig
  readonly ctx: SyncContext
  /** Parent sidebar namespace (e.g. '/apps/api') — for workspace-scoped specs */
  readonly parentPrefix?: string
}

function syncOpenAPI(options: SyncOpenAPIOptions): Promise<SyncOpenAPIResult>

interface SyncOpenAPIResult {
  readonly sidebar: readonly SidebarItem[]
  readonly pages: readonly PageData[]
}
```

**Per-operation page generation:**
- Parse the spec (JSON or YAML — add YAML support via `yaml` or `gray-matter`)
- For each `paths[path][method]` → generate `{prefix}/{operationId}.mdx`
- Generate overview page at `{prefix}/index.mdx`
- Return sidebar items grouped by tag + the generated page list

**The generated MDX pages need a React component** to render the operation details. This is a UI concern (see item 6 below).

### 4. Sync engine orchestration — `packages/core/src/sync/index.ts`

**Replace the hardcoded empty array:**

```ts
// Current (line 155-157):
const openapiSidebar: SidebarItem[] = []

// New:
const openapiResults = await syncAllOpenAPI(config, ctx)
```

**New `syncAllOpenAPI` function** collects all OpenAPI configs and runs them:

```
1. If config.openapi exists → syncOpenAPI({ config: config.openapi, ctx })
2. For each app/package/workspace-group item with .openapi →
     syncOpenAPI({ config: item.openapi, ctx, parentPrefix: item.docsPrefix })
3. Collect all results → merge pages into the page list, merge sidebars
```

**Integration points in sync():**
- After step 2 (collect pages) — append OpenAPI-generated pages to `sectionPages`
- Pass all OpenAPI sidebar results into `buildMultiSidebar()`

### 5. Multi-sidebar — `packages/core/src/sync/sidebar/multi.ts`

**Current**: `buildMultiSidebar` takes a single `openapiSidebar` array and mounts it under `config.openapi.prefix`.

**New**: Accept an array of `{ prefix, sidebar }` tuples:

```ts
interface OpenAPISidebarEntry {
  readonly prefix: string
  readonly sidebar: readonly SidebarItem[]
}
```

Update `buildOpenapiSidebarEntries` to iterate over the array instead of a single config:

```ts
function buildOpenapiSidebarEntries(
  entries: readonly OpenAPISidebarEntry[]
): Record<string, readonly SidebarItem[]> {
  return Object.fromEntries(
    entries.flatMap(({ prefix, sidebar }) => [
      [`${prefix}/`, [...sidebar]],
      [prefix, [...sidebar]],
    ])
  )
}
```

For workspace-level specs, the sidebar should nest under the workspace's isolated sidebar namespace. If the API app's `docsPrefix` is `/apps/api` and the OpenAPI `prefix` is `/apps/api/reference`, the sidebar key `/apps/api/reference/` gets its own namespace — Rspress will match it based on the longest-prefix rule (keys are already sorted by length descending).

### 6. UI — Operation page renderer

This is the biggest piece of net-new work. The `syncOpenAPI` module generates MDX pages, but those pages need a React component to render operation details (method badge, path, parameters table, request/response body schemas, etc.).

**Options:**

| Approach | Pros | Cons |
|---|---|---|
| **A. Inline MDX generation** — generate full markdown tables/sections per operation, no React component needed | Simple, no UI package changes | Verbose generated output, harder to style, no interactivity (try-it) |
| **B. Thin React component** — generate MDX that imports `<OperationPage spec={...} operationId="..." />`, component renders everything | Clean generated pages, centralized styling, path to interactive features | Requires new component in `@zpress/ui`, spec must be importable |
| **C. Full Rspress plugin** — use Rspress's plugin system to inject routes/pages at build time | Most "native" to Rspress | Higher coupling to Rspress internals, more complex |

**Recommendation: Approach B** — it matches the existing pattern (the UI package already provides theme components that get imported into generated MDX). The component can start simple (static rendering of method, path, params, schemas) and grow toward interactivity later.

**Component location:** `packages/ui/src/theme/components/openapi/operation-page.tsx`

**Data flow:** The generated MDX imports the JSON spec and passes it + operationId to the component:

```mdx
import spec from '../openapi.json'
import { OperationPage } from '@zpress/ui/openapi'

<OperationPage spec={spec} operationId="listUsers" />
```

### 7. Workspace synthesis — `packages/core/src/sync/workspace.ts`

**No structural changes needed.** The `workspaceItemToEntry` function converts workspace items to entries. OpenAPI pages are generated separately (not through the entry tree) — they get their own sidebar namespace and their own pages. The workspace item's regular docs and its OpenAPI docs coexist as sibling sidebar namespaces.

However, we should consider adding the OpenAPI section as a **child entry** of the workspace item in the sidebar. For example, the API workspace sidebar would show:

```
API (landing)
├── Overview
├── Authentication
├── Endpoints
└── API Reference (→ links to /apps/api/reference)
```

This can be done by injecting a link entry during `synthesizeWorkspaceSections`:

```ts
// If workspace item has openapi, add a link entry pointing to the reference section
if (item.openapi) {
  items.push({
    text: item.openapi.title ?? 'API Reference',
    link: item.openapi.prefix,
  })
}
```

---

## File Change Summary

| File | Change |
|---|---|
| `packages/core/src/types.ts` | Add `openapi?: OpenAPIConfig` to `WorkspaceItem` |
| `packages/core/src/define-config.ts` | Add OpenAPI validation (global + workspace) |
| `packages/core/src/sync/openapi.ts` | Full rewrite: MDX generation, per-operation pages, multi-config support |
| `packages/core/src/sync/index.ts` | Orchestrate global + workspace OpenAPI sync, pass results to sidebar/pages |
| `packages/core/src/sync/sidebar/multi.ts` | Accept array of OpenAPI sidebar entries instead of single array |
| `packages/core/src/sync/workspace.ts` | Inject OpenAPI reference link into workspace sidebar entries |
| `packages/ui/src/theme/components/openapi/` | New: `OperationPage` React component for rendering operation details |
| `packages/ui/src/plugin.ts` | Register OpenAPI component for MDX imports |

## Open Questions

1. **YAML support?** The current parser is JSON-only. Should we add YAML parsing for OpenAPI specs? Most real-world specs are YAML. Adding `js-yaml` or leveraging `gray-matter` (already a dep) would be straightforward.

2. **Spec format validation?** Should we validate the spec is a valid OpenAPI 3.x document, or just trust the structure and fail gracefully on missing fields? A lightweight approach: check `openapi` version field exists and `paths` is an object.

3. **Try-it / interactive?** The `OperationPage` component could eventually support a "Try it" panel (send real requests). This is out of scope for initial implementation but influences the component architecture (spec data needs to be fully available client-side).

4. **Multiple specs per workspace?** The current design is one spec per workspace item. Some services expose multiple APIs (REST + GraphQL, or versioned APIs). Supporting `openapi: OpenAPIConfig | OpenAPIConfig[]` adds flexibility but complicates sidebar generation.

5. **Remote specs?** Should `spec` support URLs (e.g. `https://api.acme.dev/openapi.json`) in addition to local file paths? This would require a fetch step during sync.
