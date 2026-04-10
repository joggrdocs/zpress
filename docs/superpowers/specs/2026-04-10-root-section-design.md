# Root Section Type — Design Spec

**Issue:** #93
**Date:** 2026-04-10
**Status:** Draft

## Problem

`standalone: true` isolates a section into its own sidebar scope, but the section title still appears as the top-level wrapping group in the sidebar. There is no way to promote child sections to top-level sidebar items while hiding the parent title from the sidebar tree.

Example with `standalone: true` today:

```
Reference          <- nav dropdown
  +- API           <- sidebar group (wrapped under "Reference")
  +- CLI
```

Desired result with `root: true`:

```
Reference          <- nav dropdown only
API                <- top-level sidebar item (no wrapper)
CLI                <- top-level sidebar item
```

## Design Decisions

### Naming: `root: true`

Using `root` as proposed in the issue. It communicates that child sections are promoted to the root level of the sidebar. Alternatives considered:
- `flat: true` — ambiguous (could mean flattening depth)
- `pages` top-level key — breaks the existing `sections` model

### `root` implies `standalone`

A root section always creates an isolated sidebar scope. Making `root` independent of `standalone` would be confusing — a root section without scope isolation would promote children into the shared sidebar, breaking the nav mental model. Implementation treats `root` as a superset of `standalone`: root sections are always scoped.

### Nav behavior

Root sections use the same nav dropdown as standalone sections. The nav item shows the section title with a dropdown listing each child section. The link resolves to the first child's entry page. No change to nav generation needed — `resolveChildren` already produces dropdowns for standalone entries.

## Architecture

The change flows through the existing pipeline:

```
Section (config)
  -> ResolvedEntry (sync engine)
    -> _meta.json (sidebar structure)
    -> scopes.json (sidebar scope isolation)
    -> Runtime sidebar filter (UI)
```

### Config Layer (`packages/config`)

**`packages/config/src/types.ts`** — Add `root?: boolean` to `Section`:

```ts
export interface Section {
  // ... existing properties ...
  readonly standalone?: boolean
  readonly root?: boolean
}
```

**`packages/config/src/schema.ts`** — Add `root` to the Zod schema:

```ts
root: z.boolean().optional(),
```

### Core Resolved Types (`packages/core`)

**`packages/core/src/sync/types.ts`** — Add `root?: boolean` to `ResolvedEntry`:

```ts
export interface ResolvedEntry {
  // ... existing properties ...
  readonly standalone?: boolean
  readonly root?: boolean
}
```

### Scope Collection (`packages/core/src/sync/index.ts`)

**`collectStandaloneScopePaths`** — Include root sections as standalone scopes. Root sections should be scoped just like standalone sections:

```ts
function collectStandaloneScopePaths(entries: readonly ResolvedEntry[]): readonly string[] {
  return entries
    .filter((e) => (e.standalone || e.root) && e.link)
    .map((e) => e.link as string)
}
```

### Meta Generation (`packages/core/src/sync/sidebar/meta.ts`)

This is the core change. Two functions need modification:

**`buildRootMeta`** — For root sections, emit the children as top-level dir items instead of the parent:

```ts
export function buildRootMeta(entries: readonly ResolvedEntry[]): readonly MetaItem[] {
  return entries
    .filter((e) => !e.hidden)
    .flatMap((entry) => {
      if (entry.root && entry.items) {
        // Promote children to top-level meta items
        return entry.items
          .filter((child) => !child.hidden)
          .flatMap((child) => {
            const name = resolveDirName(child)
            if (name === null) return []
            return [{ type: 'dir' as const, name, label: child.title }]
          })
      }

      const name = resolveDirName(entry)
      if (name === null) return []
      return [{ type: 'dir' as const, name, label: entry.title }]
    })
}
```

**`buildMetaDirectories`** — For root sections, flatten starting from children rather than the parent, so no parent group directory is emitted:

```ts
export function buildMetaDirectories(entries: readonly ResolvedEntry[]): readonly MetaDirectory[] {
  // Expand root sections: replace the root entry with its children
  // so the parent directory group is never emitted
  const expanded = entries.flatMap((entry) => {
    if (entry.root && entry.items) {
      return entry.items.filter((child) => !child.hidden)
    }
    return [entry]
  })
  const { placements } = flattenToPlacements(expanded, 0)
  return groupPlacementsByDir(placements)
}
```

This approach works because `flattenToPlacements` walks the entry tree and emits placement instructions based on filesystem paths. By starting from the children instead of the parent, the parent's directory group is never created in any `_meta.json`.

### Entry Resolution (`packages/core/src/sync/resolve`)

The resolver at `packages/core/src/sync/resolve/index.ts:246` maps `section.standalone` to the resolved entry. Add `root: section.root` on the next line.

### Nav Generation (`packages/core/src/sync/sidebar/index.ts`)

**`generateNav`** — Root sections should be treated like standalone sections (included in nav with dropdown). The existing `standalone` filter already handles this — we extend it:

```ts
const nonStandalone = visible.filter((e) => !e.standalone && !e.root).slice(0, 3)
const standalone = visible.filter((e) => e.standalone || e.root)
```

**`resolveChildren`** — Already produces dropdown children for standalone entries. Extend to root:

```ts
if ((entry.standalone || entry.root) && entry.items && entry.items.length > 0) {
```

### UI Sidebar Filter (`packages/ui`)

**No changes needed.** The runtime `resolveScopedSidebar` function works on scope paths from `scopes.json`. Since root sections are added to `scopes.json` (via `collectStandaloneScopePaths`), they automatically get isolated sidebar scoping. The child items are already top-level within the scope because `buildRootMeta` promotes them.

## Testing Strategy

### Unit Tests

**`packages/core/src/sync/sidebar/meta.test.ts`** — Add tests for:
- `buildRootMeta` with a root section: children appear as top-level items, parent does not
- `buildMetaDirectories` with a root section: no parent group directory emitted, children flattened
- Root section with hidden children: hidden items excluded from promotion
- Root section with no items: gracefully produces empty output

**`packages/core/src/sync/sidebar/index.test.ts`** (if exists, or create) — Add tests for:
- `generateNav` treats root sections same as standalone (dropdown with children)

### Integration Testing

Manual verification with a test config that uses `root: true` on a section, confirming:
1. Sidebar shows child sections as top-level items (no parent wrapper)
2. Nav dropdown shows parent title with child links
3. Scope isolation works (navigating to child path shows only sibling sections)

## Example

Config:

```ts
{
  sections: [
    {
      title: 'Getting Started',
      path: '/getting-started',
      include: 'docs/getting-started/**',
    },
    {
      title: 'Reference',
      path: '/references',
      root: true,
      items: [
        { title: 'API', path: '/references/api', include: 'docs/references/api/**' },
        { title: 'CLI', path: '/references/cli', include: 'docs/references/cli/**' },
      ],
    },
  ],
}
```

Result:
- Nav: `Getting Started | Reference v` (Reference is dropdown with API, CLI)
- Sidebar at `/references/api`: `API` and `CLI` as top-level headings (no "Reference" wrapper)
- Sidebar at `/getting-started`: Only "Getting Started" items (Reference excluded, it's scoped)

## Scope

### In Scope
- `root` property on Section config type and Zod schema
- `root` propagation to ResolvedEntry
- Meta generation promotion (buildRootMeta, buildMetaDirectories)
- Scope collection for root sections
- Nav generation treating root like standalone
- Unit tests for all changed functions

### Out of Scope
- UI component changes (not needed — runtime filtering already works)
- New CLI flags or commands
- Migration from standalone to root
- Combining root with other section flags (collapsible, landing, etc.) — these are inherited by children naturally
