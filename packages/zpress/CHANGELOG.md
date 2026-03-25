# @zpress/kit

## 0.2.14

### Patch Changes

- Updated dependencies [3e5f014]
- Updated dependencies [e3b8c86]
- Updated dependencies [1e966e1]
- Updated dependencies [0113fb1]
  - @zpress/cli@0.6.0
  - @zpress/core@0.8.1
  - @zpress/ui@0.8.8

## 0.2.13

### Patch Changes

- Updated dependencies [f88d0f7]
  - @zpress/cli@0.5.4

## 0.2.12

### Patch Changes

- b912b2d: Update and add READMEs
- Updated dependencies [9b5099b]
- Updated dependencies [9b5099b]
- Updated dependencies [b912b2d]
  - @zpress/core@0.8.0
  - @zpress/cli@0.5.3
  - @zpress/ui@0.8.7

## 0.2.11

### Patch Changes

- Updated dependencies [9388cce]
  - @zpress/core@0.7.5
  - @zpress/cli@0.5.2
  - @zpress/ui@0.8.6

## 0.2.10

### Patch Changes

- Updated dependencies [4179cee]
  - @zpress/core@0.7.4
  - @zpress/cli@0.5.1
  - @zpress/ui@0.8.5

## 0.2.9

### Patch Changes

- Updated dependencies [56862d1]
- Updated dependencies [56862d1]
  - @zpress/cli@0.5.0
  - @zpress/ui@0.8.4

## 0.2.8

### Patch Changes

- Updated dependencies [71af7e9]
  - @zpress/core@0.7.3
  - @zpress/cli@0.4.3
  - @zpress/ui@0.8.3

## 0.2.7

### Patch Changes

- Updated dependencies [3f36be0]
  - @zpress/core@0.7.2
  - @zpress/cli@0.4.2
  - @zpress/ui@0.8.2

## 0.2.6

### Patch Changes

- Updated dependencies [03f1229]
- Updated dependencies [b090c88]
  - @zpress/ui@0.8.1
  - @zpress/cli@0.4.1

## 0.2.5

### Patch Changes

- Updated dependencies [1f6b8c1]
- Updated dependencies [d8cf9b2]
- Updated dependencies [03b0726]
- Updated dependencies [8a125b8]
- Updated dependencies [179ae48]
  - @zpress/cli@0.4.0
  - @zpress/ui@0.8.0
  - @zpress/core@0.7.1

## 0.2.4

### Patch Changes

- 3e7a28a: Enforce consistent file structure conventions across all packages and upgrade dependencies to latest versions.

  ### File Structure

  Apply a standardized file layout pattern to every source file in the monorepo:
  - **Exports first**: All exported functions, constants, and types appear at the top of each file immediately after imports.
  - **Private separator**: Non-exported (private) helper functions are placed below a `// --- Private ---` section separator comment.
  - **Complete JSDoc**: Every function now has full JSDoc documentation including `@param` and `@returns` tags. Non-exported helpers include the `@private` tag.
  - **Spacing cleanup**: Removed inconsistent double blank lines between declarations across all packages.

  ### Test Colocation

  Moved all test files from `packages/*/test/` directories to sit alongside their source files in `packages/*/src/`:
  - `packages/cli/test/` → `packages/cli/src/lib/`
  - `packages/config/test/` → `packages/config/src/`
  - `packages/core/test/` → `packages/core/src/` (including `sync/` and `sync/sidebar/` subdirectories)
  - `packages/templates/test/` → `packages/templates/src/`
  - `packages/theme/test/` → `packages/theme/src/`
  - `packages/ui/test/` → `packages/ui/src/`

  ### Standards

  Updated `.claude/rules/typescript.md` to codify the file structure conventions so all future code follows the same pattern.

  ### Dependency Upgrades
  - `oxlint` 1.55.0 → 1.56.0
  - `oxfmt` 0.40.0 → 0.41.0
  - `@kidd-cli/core` 0.4.0 → 0.7.0
  - `c12` 4.0.0-beta.3 → 4.0.0-beta.4
  - `laufen` 1.1.0 → 1.2.1
  - `@iconify-json/material-icon-theme` 1.2.55 → 1.2.56
  - `@iconify-json/simple-icons` 1.2.73 → 1.2.74

- Updated dependencies [77796f1]
- Updated dependencies [7d074af]
- Updated dependencies [429846c]
- Updated dependencies [3e7a28a]
  - @zpress/core@0.7.0
  - @zpress/ui@0.7.0
  - @zpress/cli@0.3.4

## 0.2.3

### Patch Changes

- Updated dependencies [77e872e]
  - @zpress/ui@0.6.1
  - @zpress/cli@0.3.3

## 0.2.2

### Patch Changes

- Updated dependencies [1b3b8e3]
- Updated dependencies [c57ab70]
  - @zpress/core@0.6.2
  - @zpress/cli@0.3.2
  - @zpress/ui@0.6.0

## 0.2.1

### Patch Changes

- Updated dependencies [6df5ab7]
  - @zpress/core@0.6.1
  - @zpress/ui@0.5.1
  - @zpress/cli@0.3.1

## 0.2.0

### Minor Changes

- 1361d59: # Comprehensive Config API Refactor

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
  - Workspaces - New `prefix` and `discovery` fields
  - Auto-Discovery - New `'auto'` titleFrom mode and `TitleConfig`
  - Configuration Reference - Full field reference

### Patch Changes

- Updated dependencies [2055c1a]
- Updated dependencies [3cf8dc0]
- Updated dependencies [1361d59]
- Updated dependencies [941550c]
  - @zpress/core@0.6.0
  - @zpress/ui@0.5.0
  - @zpress/cli@0.3.0

## 0.1.7

### Patch Changes

- Updated dependencies [2f01fa4]
  - @zpress/ui@0.4.1
  - @zpress/cli@0.2.2

## 0.1.6

### Patch Changes

- Updated dependencies [7255aa3]
  - @zpress/core@0.5.0
  - @zpress/ui@0.4.0
  - @zpress/cli@0.2.1

## 0.1.5

### Patch Changes

- Updated dependencies [83cc277]
- Updated dependencies [d1e2b76]
  - @zpress/cli@0.2.0
  - @zpress/core@0.4.0
  - @zpress/ui@0.3.1

## 0.1.4

### Patch Changes

- Updated dependencies [aea7b38]
- Updated dependencies [d1b4ad5]
- Updated dependencies [37c2ec6]
  - @zpress/ui@0.3.0
  - @zpress/core@0.3.0
  - @zpress/cli@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies [f4d5388]
  - @zpress/ui@0.2.2
  - @zpress/cli@0.1.3

## 0.1.2

### Patch Changes

- 2e43a80: Add README files to all packages and update license copyright to Joggr, Inc.
- 2e43a80: Fix type exports and dependency declarations
  - Generate bundled `.d.ts` declaration files via Rslib `dts.bundle` (previously no declaration files were emitted)
  - Point `exports.types` to generated `dist/*.d.ts` instead of raw source files
  - Move `react`, `react-dom`, and `@rspress/core` to `peerDependencies` in `@zpress/ui`
  - Surface `react`, `react-dom`, and `@rspress/core` as `peerDependencies` in `@zpress/kit`
  - Centralize shared dependency versions via pnpm catalog
  - Bump `@kidd-cli/core` to `^0.4.0` in `@zpress/cli`

- Updated dependencies [2e43a80]
- Updated dependencies [2e43a80]
  - @zpress/cli@0.1.2
  - @zpress/core@0.2.1
  - @zpress/ui@0.2.1

## 0.1.1

### Patch Changes

- Updated dependencies [77adac6]
  - @zpress/core@0.2.0
  - @zpress/ui@0.2.0
  - @zpress/cli@0.1.1

## 0.1.0

### Minor Changes

- 04d2e2b: Initial release

  Public wrapper package re-exporting @zpress/core, @zpress/ui, and @zpress/cli. Provides the `zpress` CLI bin and the `defineConfig` entry point for user config files.
