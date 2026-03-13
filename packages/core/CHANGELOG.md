# @zpress/core

## 0.6.0

### Minor Changes

- 2055c1a: **New Packages: @zpress/theme and @zpress/config**

  This release introduces two new packages that refactor configuration and theme management:

  **@zpress/theme** - Theme definitions and utilities
  - Type-safe theme definitions with `LiteralUnion` pattern for autocomplete + extensibility
  - Built-in themes: `base`, `midnight`, `arcade`, `arcade-fx`
  - Icon color types with autocomplete support
  - Zod schemas for theme validation
  - Utility functions: `resolveDefaultColorMode`, `isBuiltInTheme`, `isBuiltInIconColor`

  **@zpress/config** - Configuration loading and validation
  - Multi-format config support: `.ts`, `.js`, `.json`, `.jsonc`, `.yml`, `.yaml`
  - Type-safe `defineConfig` helper
  - `loadConfig` function with Result-based error handling
  - Zod schemas for complete config validation
  - JSON Schema generation for IDE autocomplete (`@zpress/config/schema`)
  - Re-exports theme utilities for convenience

  **@zpress/core** - Internal refactoring
  - Removed direct `c12` dependency
  - Now re-exports config and theme utilities from `@zpress/config`
  - Public API remains backwards compatible
  - Added new exports: `ICON_COLORS`, `ConfigErrorType`, `LoadConfigOptions`

  **@zpress/ui** - Dependency updates
  - Removed `@zpress/core` dependency for config types
  - Now uses `@zpress/config` and `@zpress/theme` directly
  - Added support for custom themes with fallback to 'toggle' color mode
  - Fixed: Added `arcade-fx` theme to theme switcher

  **Migration Guide**

  For most users, this is a drop-in replacement with no migration needed. All existing imports from `@zpress/core` continue to work.

  If you were importing from internal paths, update as follows:

  ```ts
  // Before
  import type { ThemeConfig } from '@zpress/core/theme'

  // After
  import type { ThemeConfig } from '@zpress/config'
  // or
  import type { ThemeConfig } from '@zpress/core' // still works via re-export
  ```

  **JSON/YAML Config Support**

  You can now use JSON or YAML config files with IDE autocomplete:

  ```json
  {
    "$schema": "https://raw.githubusercontent.com/joggrdocs/zpress/main/packages/config/schemas/schema.json",
    "title": "My Docs",
    "sections": [{ "text": "Guide", "from": "docs" }]
  }
  ```

  ```yaml
  # yaml-language-server: $schema=https://raw.githubusercontent.com/joggrdocs/zpress/main/packages/config/schemas/schema.json

  title: My Docs
  sections:
    - text: Guide
      from: docs
  ```

  **Custom Themes**

  The `ThemeName` type now supports custom theme names with autocomplete for built-ins:

  ```ts
  import { defineConfig } from '@zpress/config'

  export default defineConfig({
    theme: {
      name: 'my-custom-theme', // ✓ TypeScript accepts this
      colorMode: 'dark',
    },
  })
  ```

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
  - [Workspaces](/guides/workspaces) - New `prefix` and `discovery` fields
  - [Auto-Discovery](/guides/auto-discovery) - New `'auto'` titleFrom mode and `TitleConfig`
  - [Configuration Reference](/reference/configuration) - Full field reference

### Patch Changes

- 3cf8dc0: Improve dev command config reloading and file watching
  - **Auto-restart dev server on config changes**: Dev server now automatically restarts when config changes are detected, using Rspress ServerInstance.close() API
  - **Cache-busting for config reloads**: Use jiti with moduleCache disabled via c12's custom import option to ensure config changes are picked up immediately
  - **Fix watcher for non-existent paths**: Normalize watch paths to nearest existing ancestor before adding to chokidar, ensuring sections can be detected even if their directories don't exist yet
  - **Dynamic watch path updates**: Watcher now adds/removes paths when config sections change
  - **Fix type signature**: OnConfigReload type now correctly includes newConfig parameter

- Updated dependencies [2055c1a]
  - @zpress/theme@0.2.0
  - @zpress/config@0.2.0

## 0.5.0

### Minor Changes

- 7255aa3: Add built-in theme support with three color palettes (base, midnight, arcade), configurable color mode, user color overrides, and an optional theme switcher dropdown in the navbar

## 0.4.0

### Minor Changes

- 83cc277: Add `zpress check` command for config validation and deadlink detection

  Introduces a standalone `check` command that validates the zpress config and
  detects broken internal links by running a silent Rspress build. The `build`
  command now includes checks by default (`--check` flag, opt out with
  `--no-check`). Config validation is moved from `defineConfig` (which was
  calling `process.exit`) into `loadConfig`, returning structured `Result` tuples
  so the CLI can present friendly error messages.

### Patch Changes

- d1e2b76: Restore optional `icon` field on `Entry` for home page feature cards

  The sidebar icon removal in #9 inadvertently dropped the `icon` property from
  `Entry`, which broke auto-generated feature card icons on the home page. This
  adds the field back as optional — sections without an icon are unaffected.

## 0.3.0

### Minor Changes

- 37c2ec6: Enable clean URLs and remove sidebar icon concept
  - Enable `route.cleanUrls` in Rspress config so prod builds produce clean URLs (e.g. `/guides/foo` instead of `/guides/foo.html`)
  - Remove `Entry.icon`, `NavItem.icon`, `SidebarItem.icon`, and all icon-map threading through sidebar/nav generation
  - Remove `validateNav`/`validateNavItem` and `missing_nav_icon` error type
  - Icons on `CardConfig`, `WorkspaceItem`, `WorkspaceGroup`, and `Feature` are unchanged

## 0.2.1

### Patch Changes

- 2e43a80: Add README files to all packages and update license copyright to Joggr, Inc.
- 2e43a80: Fix type exports and dependency declarations
  - Generate bundled `.d.ts` declaration files via Rslib `dts.bundle` (previously no declaration files were emitted)
  - Point `exports.types` to generated `dist/*.d.ts` instead of raw source files
  - Move `react`, `react-dom`, and `@rspress/core` to `peerDependencies` in `@zpress/ui`
  - Surface `react`, `react-dom`, and `@rspress/core` as `peerDependencies` in `@zpress/kit`
  - Centralize shared dependency versions via pnpm catalog
  - Bump `@kidd-cli/core` to `^0.4.0` in `@zpress/cli`

## 0.2.0

### Minor Changes

- 77adac6: Auto-generate favicon icon from project title and support custom icon via config

  The favicon is now auto-generated from the first letter of the project title using FIGlet ASCII art on a dark rounded square, matching the existing banner and logo generation system. Users can override the icon path via the new `icon` field in `ZpressConfig`.

## 0.1.0

### Minor Changes

- 04d2e2b: Initial release

  Config loading via c12, entry resolution with glob-based auto-discovery, sync engine with incremental hashing, multi-sidebar and nav generation, frontmatter injection, workspace synthesis, and branded SVG asset generation.
