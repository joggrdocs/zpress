---
'@zpress/core': major
'@zpress/ui': major
'@zpress/cli': major
'@zpress/kit': major
---

# Comprehensive Config API Refactor

Major breaking changes to the zpress configuration API for better consistency and clarity.

## Breaking Changes

### Type System Refactor

**BREAKING**: The type hierarchy has been restructured with a new base type:

- **New `Entry` base type**: Introduced with common fields (`title`, `icon`, `description`) that all config types now extend
- **Old `Entry` type renamed to `Section`**: The previous `Entry` type (representing a section/page node) is now called `Section` for clearer semantics. **No backward compatibility alias** - the name `Entry` is now used for the new base type.
- **`WorkspaceItem` → `Workspace`**: Renamed for consistency (backward compatible alias maintained)
- **`WorkspaceGroup` → `WorkspaceCategory`**: More descriptive name (backward compatible alias maintained)

All config types now extend the new `Entry` base:

```ts
// All types now extend Entry
interface Entry {
  readonly title: string | TitleConfig
  readonly icon?: IconConfig
  readonly description?: string
}

interface Section extends Entry {
  /* ... */
}
interface Workspace extends Entry {
  /* ... */
}
interface WorkspaceCategory extends Entry {
  /* ... */
}
interface Feature extends Entry {
  /* ... */
}
```

### Workspace Field Changes

**`path` → `prefix`**: Renamed for consistency with `Section.prefix`

```ts
// Before
apps: [
  {
    title: 'API',
    path: '/apps/api',
  },
]

// After
apps: [
  {
    title: 'API',
    prefix: '/apps/api',
  },
]
```

**`name` → `title`** on `WorkspaceCategory`: All types now use `title` consistently

```ts
// Before
workspaces: [
  {
    name: 'Integrations',
    items: [
      /* ... */
    ],
  },
]

// After
workspaces: [
  {
    title: 'Integrations',
    items: [
      /* ... */
    ],
  },
]
```

### Discovery Configuration

Workspace items now use a `discovery` field to configure content auto-discovery, eliminating duplication with Section fields:

```ts
// Before
apps: [
  {
    title: 'API',
    path: '/apps/api',
    from: 'docs/*.md',
    titleFrom: 'frontmatter',
    sort: 'alpha',
    recursive: false,
  },
]

// After
apps: [
  {
    title: 'API',
    prefix: '/apps/api',
    discovery: {
      from: 'docs/*.md',
      title: { from: 'auto' },
      sort: 'alpha',
      recursive: false,
    },
  },
]
```

**Note**: The `from` field in `discovery` is relative to the workspace's base path (derived from `prefix`). For example, `prefix: "/apps/api"` + `discovery.from: "docs/*.md"` resolves to `apps/api/docs/*.md` (repo-root relative).

### Title Derivation Default Changed

**Default `titleFrom` changed from `'filename'` to `'auto'`**

The `'auto'` strategy uses a smart fallback chain:

1. Try frontmatter `title` field
2. Fall back to first `# heading`
3. Fall back to filename (kebab-to-title)

This is more intuitive and matches user expectations. If you relied on `'filename'` behavior, explicitly set `titleFrom: 'filename'`.

### New TitleConfig Type

You can now use an object for the `title` field to configure derivation and transformation:

```ts
// Simple string (unchanged)
title: 'Guides'

// New: Title configuration object
title: {
  from: 'auto',  // or 'filename' | 'heading' | 'frontmatter'
  transform: (text, slug) => text.toUpperCase()
}
```

This is available on all types that extend `Entry`.

## New Features

### Discovery Configuration Type

The new `Discovery` type (with `RecursiveDiscoveryConfig` and `FlatDiscoveryConfig` variants) provides proper typing for content discovery configuration:

```ts
interface Discovery {
  from?: string | GlobPattern
  title?: TitleConfig
  sort?: 'alpha' | 'filename' | ((a, b) => number)
  exclude?: GlobPattern[]
  frontmatter?: Frontmatter
  recursive?: boolean
  indexFile?: string // Only when recursive: true
}
```

### Enhanced Icon Documentation

Icon colors are now fully documented in types with the 8-color palette rotation:

- purple (default)
- blue
- green
- amber
- cyan
- red
- pink
- slate

## Migration Guide

### Automated Find/Replace

1. **Update workspace field names**:

   ```
   Find:    path: '/
   Replace: prefix: '/
   ```

2. **Update workspace group names**:

   ```
   Find:    name: '
   Replace: title: '
   ```

3. **Update type imports** (if using types directly):

   ```ts
   // Before
   import type { Entry, WorkspaceItem, WorkspaceGroup } from '@zpress/core'

   // After
   import type { Section, Workspace, WorkspaceCategory } from '@zpress/core'
   ```

### Manual Updates

1. **Migrate workspace discovery configuration** (optional but recommended):

   ```ts
   // Before
   apps: [
     {
       title: 'API',
       path: '/apps/api',
       from: 'docs/*.md',
       titleFrom: 'frontmatter',
       sort: 'alpha',
     },
   ]

   // After
   apps: [
     {
       title: 'API',
       prefix: '/apps/api',
       discovery: {
         from: 'docs/*.md',
         title: { from: 'auto' }, // Better default!
         sort: 'alpha',
       },
     },
   ]
   ```

2. **Verify title derivation behavior**: If you have sections with `titleFrom: 'filename'` and markdown files with frontmatter or headings, the default `'auto'` mode will now use those instead of the filename. To preserve old behavior, explicitly set `titleFrom: 'filename'`.

### Backward Compatibility

- Old type names (`Entry`, `WorkspaceItem`, `WorkspaceGroup`) are re-exported as aliases
- Old field names on `Section` (`titleFrom`, `titleTransform`) still work alongside the new `TitleConfig` approach
- No immediate action required, but migrating to new API is recommended

## Documentation

See updated guides:

- [Workspaces](/guides/workspaces) - New `prefix` and `discovery` fields
- [Auto-Discovery](/guides/auto-discovery) - New `'auto'` titleFrom mode and `TitleConfig`
- [Configuration Reference](/reference/configuration) - Full field reference
