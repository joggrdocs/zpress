# @zpress/core

## 0.11.0

### Minor Changes

- ca4f487: feat: support root sections that promote children to top-level sidebar and nav

### Patch Changes

- f26cf74: fix: resolve SWC decorator panic by upgrading rsbuild to 2.0.0-rc.1
- Updated dependencies [f26cf74]
  - @zpress/config@0.5.2

## 0.10.2

### Patch Changes

- 81d5928: Fix OpenAPI sidebar scoping, meta ordering, and sync error surfacing
  - Add root-level OpenAPI entries (e.g. petstore) to root `_meta.json` and `scopes.json` so they get their own standalone sidebar scope
  - Add workspace-level OpenAPI entries to their parent directory's `_meta.json` for proper sidebar discovery
  - Fix `_meta.json` ordering: leaf files appear before collapsible directory sections
  - Remove duplicate Overview highlight for root-level OpenAPI sections
  - Surface sync errors to CLI callers instead of silently swallowing them

## 0.10.1

### Patch Changes

- d25fea5: Fix standalone sidebar scoping and package label deduplication
  - Fix sidebar scope filtering using URL pathname instead of file path for scope matching
  - Fix `_meta.json` deduplication preferring section labels over leaf labels when both share the same name

## 0.10.0

### Minor Changes

- c169109: Sync engine now only processes what changed instead of running a full sync on every pass.
  - **mtime-based page skip**: pages whose source mtime and frontmatter hash match the previous manifest skip the entire read/transform/hash pipeline
  - **Parallel page copy**: all pages are copied concurrently via `Promise.all` instead of sequential reduce
  - **Parallel `copyAll`**: public asset directory copy runs in parallel
  - **Asset generation skip**: banner/logo/icon SVGs skip generation entirely when the asset config hash is unchanged; `shouldGenerate` also compares content to avoid redundant writes
  - **Image copy skip**: destination images are skipped when their mtime is at least as recent as the source
  - **OpenAPI spec caching**: specs are only re-parsed when their file mtime changes; a shared cache persists across dev-mode sync passes and is cleared on config reload
  - **Structural change detection**: `resolvedCount` mismatch between syncs forces a full resync to handle added/removed pages correctly
  - **Build system migration**: switched CLI from rslib to kidd's native build system (tsdown-based), with static command imports, proper dependency externalization, and React/Ink TUI dev screen

### Patch Changes

- c169109: Fix build crash when sidebar references empty section directories

  Pre-create all directories referenced in the root `_meta.json` before Rspress reads them. Previously, sections with no synced content would be listed in `_meta.json` as `dir` items but the directory wouldn't exist on disk, causing Rspress's `auto-nav-sidebar` to crash with an ENOENT error during build.

## 0.9.0

### Minor Changes

- 7a5954f: Sync engine now only processes what changed instead of running a full sync on every pass.
  - **mtime-based page skip**: pages whose source mtime and frontmatter hash match the previous manifest skip the entire read/transform/hash pipeline
  - **Parallel page copy**: all pages are copied concurrently via `Promise.all` instead of sequential reduce
  - **Parallel `copyAll`**: public asset directory copy runs in parallel
  - **Asset generation skip**: banner/logo/icon SVGs skip generation entirely when the asset config hash is unchanged; `shouldGenerate` also compares content to avoid redundant writes
  - **Image copy skip**: destination images are skipped when their mtime is at least as recent as the source
  - **OpenAPI spec caching**: specs are only re-parsed when their file mtime changes; a shared cache persists across dev-mode sync passes and is cleared on config reload
  - **Structural change detection**: `resolvedCount` mismatch between syncs forces a full resync to handle added/removed pages correctly
  - **Build system migration**: switched CLI from rslib to kidd's native build system (tsdown-based), with static command imports, proper dependency externalization, and React/Ink TUI dev screen

## 0.8.1

### Patch Changes

- e3b8c86: Fix multi-sidebar routing for workspace children whose paths live outside the parent prefix. When `packages` items use paths like `/libs/ai` instead of `/packages/ai`, Rspress prefix matching could not find a sidebar key — the sidebar silently disappeared. Extra sidebar keys are now emitted for orphaned child paths so they resolve correctly.
- 1e966e1: Fix workspace include resolution for `apps` and `packages` items:
  - Use deep glob pattern (`docs/**/*.md`) as default include when `recursive: true`. Previously the default was always `docs/*.md` regardless of the flag.
  - Add config check warning when an explicit include pattern already starts with the basePath derived from `path`, which causes double-prefixing and silently matches zero files. Surfaces during `zpress check` before the build step.

- Updated dependencies [1e966e1]
  - @zpress/config@0.5.1

## 0.8.0

### Minor Changes

- 9b5099b: Add pixel-art retro font as fallback for long titles in generated SVG assets

  Titles within the 12-character limit continue to use the original ANSI Shadow FIGlet font. Titles exceeding the limit now render in a compact pixel-art style instead of plain monospace text. Adds `renderPixelText` alongside `renderFigletText` with a separate glyph set.

- 9b5099b: Restore `apps` and `packages` as first-class root config fields

  Re-adds `apps` and `packages` to `ZpressConfig` alongside the existing generic `workspaces` field. The home page renders groups in fixed order: Apps, Packages, then custom workspace categories. Each group gets its own heading, auto-generated description, and scope prefix on cards.

  Also adds `collectAllWorkspaceItems()` utility to merge all three sources consistently across the sync engine, validation, landing page injection, and OpenAPI collection.

### Patch Changes

- b912b2d: Update and add READMEs
- Updated dependencies [9b5099b]
- Updated dependencies [b912b2d]
  - @zpress/config@0.5.0
  - @zpress/theme@0.3.2

## 0.7.5

### Patch Changes

- 9388cce: Remove default asset seeding in favor of always generating banner, logo, and icon SVGs. Previously, hardcoded default SVGs without the `<!-- zpress-generated -->` marker were seeded into `.zpress/public/`, which prevented the generated assets from overwriting them. Now `generateAssets` always runs with a fallback title of "Documentation", and user-customized files (without the marker) are still preserved.

## 0.7.4

### Patch Changes

- 4179cee: Auto-nav now links to entry pages (overview, introduction, index, readme) instead of generated landing pages

## 0.7.3

### Patch Changes

- 71af7e9: Include `public/` directory in published package so default seed assets (logo, icon, banner) are available at runtime

## 0.7.2

### Patch Changes

- 3f36be0: Include `templates/` directory in published package so Liquid templates resolve at runtime

## 0.7.1

### Patch Changes

- 8a125b8: Fix all lint errors and warnings: replace ternaries with ts-pattern match, add curly braces to single-line ifs, convert arrow function components to declarations, use replaceAll over replace with global flag, fix single-line JSDoc blocks, eliminate let/accumulating-spread, and suppress intentional lint exceptions
- 179ae48: Add sidebar button variants (style/shape), site footer with social links toggle, client-side navigation via Link, typed IconId, and ESM compatibility patches for rspress plugins
- Updated dependencies [62248ba]
- Updated dependencies [179ae48]
  - @zpress/config@0.4.0

## 0.7.0

### Minor Changes

- 77796f1: Auto-generate section landing pages with SectionCard grids for all section groups with children. Fix sidebar group names, duplicate entries, and missing pages for auto-derived links. Redesign SectionCard with compact icon+title row and optional description. Remove all `&&` chains from scripts in favor of turbo task dependencies and pnpm lifecycle hooks.
- 429846c: Add OpenAPI documentation support with auto-generated API reference pages from OpenAPI specs, interactive UI components (schema viewer, code examples in 6 languages, collapsible responses), workspace-scoped sidebar merging, and Copy Markdown functionality.

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
- Updated dependencies [429846c]
- Updated dependencies [3e7a28a]
  - @zpress/config@0.3.0
  - @zpress/theme@0.3.1

## 0.6.2

### Patch Changes

- 1b3b8e3: Add vitest test infrastructure and 122 unit tests across all packages
- Updated dependencies [1b3b8e3]
- Updated dependencies [c57ab70]
  - @zpress/theme@0.3.0
  - @zpress/config@0.2.2

## 0.6.1

### Patch Changes

- 6df5ab7: fix(packages/core): map nav items with `text` instead of `title` for Rspress compatibility
  fix(packages/ui): inject critical CSS via Rsbuild `html.tags` so loading screen works in dev mode
  fix(packages/ui): re-enable `data-zp-ready` dismiss flag in ThemeProvider
  fix(packages/ui): replace pong/invaders loaders with simple dots loader
  fix(packages/theme): remove `arcade-fx` as standalone theme (effects already apply with arcade)
- Updated dependencies [6df5ab7]
  - @zpress/config@0.2.1
  - @zpress/theme@0.2.1

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
  - Workspaces - New `prefix` and `discovery` fields
  - Auto-Discovery - New `'auto'` titleFrom mode and `TitleConfig`
  - Configuration Reference - Full field reference

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
