# @zpress/ui

## 0.8.5

### Patch Changes

- Updated dependencies [4179cee]
  - @zpress/core@0.7.4

## 0.8.4

### Patch Changes

- 56862d1: Fix missing FileTree component by pinning rspress-plugin-file-tree to 1.0.3 and copying its component files into the published dist

## 0.8.3

### Patch Changes

- Updated dependencies [71af7e9]
  - @zpress/core@0.7.3

## 0.8.2

### Patch Changes

- Updated dependencies [3f36be0]
  - @zpress/core@0.7.2

## 0.8.1

### Patch Changes

- 03f1229: Bundle rspress-plugin-{devkit,file-tree,katex,supersub} into UI output instead of externalizing them, fixing ERR_MODULE_NOT_FOUND on Node.js 24 caused by extensionless ESM imports in plugin dist files

## 0.8.0

### Minor Changes

- d8cf9b2: Add Rspress rendering plugins for mermaid diagrams, file trees, superscript/subscript, and KaTeX math formulas
- 179ae48: Add sidebar button variants (style/shape), site footer with social links toggle, client-side navigation via Link, typed IconId, and ESM compatibility patches for rspress plugins

### Patch Changes

- 8a125b8: Fix all lint errors and warnings: replace ternaries with ts-pattern match, add curly braces to single-line ifs, convert arrow function components to declarations, use replaceAll over replace with global flag, fix single-line JSDoc blocks, eliminate let/accumulating-spread, and suppress intentional lint exceptions
- Updated dependencies [62248ba]
- Updated dependencies [8a125b8]
- Updated dependencies [179ae48]
  - @zpress/config@0.4.0
  - @zpress/core@0.7.1

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
  - @zpress/core@0.7.0
  - @zpress/config@0.3.0
  - @zpress/theme@0.3.1

## 0.6.1

### Patch Changes

- 77e872e: Fix appearance toggle not hiding for single-mode themes by using correct Rspress class selectors

## 0.6.0

### Minor Changes

- c57ab70: Add per-theme `modes` support to declare supported color modes (dark, light, or both) and hide the appearance toggle for single-mode themes like arcade and midnight

### Patch Changes

- 1b3b8e3: Add vitest test infrastructure and 122 unit tests across all packages
- Updated dependencies [1b3b8e3]
- Updated dependencies [c57ab70]
  - @zpress/theme@0.3.0
  - @zpress/config@0.2.2
  - @zpress/core@0.6.2

## 0.5.1

### Patch Changes

- 6df5ab7: fix(packages/core): map nav items with `text` instead of `title` for Rspress compatibility
  fix(packages/ui): inject critical CSS via Rsbuild `html.tags` so loading screen works in dev mode
  fix(packages/ui): re-enable `data-zp-ready` dismiss flag in ThemeProvider
  fix(packages/ui): replace pong/invaders loaders with simple dots loader
  fix(packages/theme): remove `arcade-fx` as standalone theme (effects already apply with arcade)
- Updated dependencies [6df5ab7]
  - @zpress/config@0.2.1
  - @zpress/core@0.6.1
  - @zpress/theme@0.2.1

## 0.5.0

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

- 941550c: Add VS Code mode improvements: hide mobile navigation elements and scope all VS Code overrides to `html[data-zpress-env="vscode"]` selector for cleaner CSS without !important rules.
- Updated dependencies [2055c1a]
- Updated dependencies [3cf8dc0]
- Updated dependencies [1361d59]
  - @zpress/theme@0.2.0
  - @zpress/config@0.2.0
  - @zpress/core@0.6.0

## 0.4.1

### Patch Changes

- 2f01fa4: Add VS Code extension with dev server management, sidebar navigation, CodeLens, and in-editor preview. Harden CSP with origin-scoped frame-src and crypto nonce, add restart command, rename openInBrowser to preview, validate openPage origin, theme webview with VS Code CSS variables, cap stdout buffer, and add extensionKind for remote dev. Persist VS Code environment mode via sessionStorage and clean up dataset attribute on unmount in @zpress/ui layout.

## 0.4.0

### Minor Changes

- 7255aa3: Add built-in theme support with three color palettes (base, midnight, arcade), configurable color mode, user color overrides, and an optional theme switcher dropdown in the navbar

### Patch Changes

- Updated dependencies [7255aa3]
  - @zpress/core@0.5.0

## 0.3.1

### Patch Changes

- 83cc277: Add `zpress check` command for config validation and deadlink detection

  Introduces a standalone `check` command that validates the zpress config and
  detects broken internal links by running a silent Rspress build. The `build`
  command now includes checks by default (`--check` flag, opt out with
  `--no-check`). Config validation is moved from `defineConfig` (which was
  calling `process.exit`) into `loadConfig`, returning structured `Result` tuples
  so the CLI can present friendly error messages.

- Updated dependencies [83cc277]
- Updated dependencies [d1e2b76]
  - @zpress/core@0.4.0

## 0.3.0

### Minor Changes

- 37c2ec6: Enable clean URLs and remove sidebar icon concept
  - Enable `route.cleanUrls` in Rspress config so prod builds produce clean URLs (e.g. `/guides/foo` instead of `/guides/foo.html`)
  - Remove `Entry.icon`, `NavItem.icon`, `SidebarItem.icon`, and all icon-map threading through sidebar/nav generation
  - Remove `validateNav`/`validateNavItem` and `missing_nav_icon` error type
  - Icons on `CardConfig`, `WorkspaceItem`, `WorkspaceGroup`, and `Feature` are unchanged

### Patch Changes

- aea7b38: Fix branch tag rendering in navbar on home page
  - Replace `globalUIComponents` + DOM manipulation with Rspress `beforeNavMenu` layout slot
  - Add custom `Layout` override that injects `BranchTag` via the slot prop
  - Remove `useEffect`/`useRef` DOM relocation from `BranchTag`, making it a pure render component

- d1b4ad5: Fix mobile layout issues on home page
  - Add horizontal padding to feature grid, workspace section, and card divider so cards don't touch screen edges
  - Override hero image `max-width` from `50vw` to `90vw` on mobile for full-width display
  - Add `padding-bottom` to hero when layout wraps at 1000px breakpoint
  - Reduce hero container gap to `8px` on mobile
  - Scale down hero title, subtitle, and tagline font sizes for mobile
  - Add horizontal padding to hero content on mobile
  - Reduce hero actions gap from `1.5rem` to `1.25rem`
  - Fix hero container gap override to target correct class (`__container` instead of root)

- Updated dependencies [37c2ec6]
  - @zpress/core@0.3.0

## 0.2.2

### Patch Changes

- f4d5388: Move `@iconify-json/logos`, `@iconify-json/material-icon-theme`, and `@iconify-json/vscode-icons` from devDependencies to dependencies so icons resolve correctly at runtime.

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

- Updated dependencies [2e43a80]
- Updated dependencies [2e43a80]
  - @zpress/core@0.2.1

## 0.2.0

### Minor Changes

- 77adac6: Auto-generate favicon icon from project title and support custom icon via config

  The favicon is now auto-generated from the first letter of the project title using FIGlet ASCII art on a dark rounded square, matching the existing banner and logo generation system. Users can override the icon path via the new `icon` field in `ZpressConfig`.

### Patch Changes

- Updated dependencies [77adac6]
  - @zpress/core@0.2.0

## 0.1.0

### Minor Changes

- 04d2e2b: Initial release

  Rspress plugin and theme with Catppuccin-themed UI, workspace cards, section grids, sidebar icons via Iconify, technology tag mappings, and custom font integration (Geist Sans, Geist Mono, Geist Pixel).
