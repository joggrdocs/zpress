# @zpress/config

## 0.2.2

### Patch Changes

- 1b3b8e3: Add vitest test infrastructure and 122 unit tests across all packages
- Updated dependencies [1b3b8e3]
- Updated dependencies [c57ab70]
  - @zpress/theme@0.3.0

## 0.2.1

### Patch Changes

- 6df5ab7: fix(packages/core): map nav items with `text` instead of `title` for Rspress compatibility
  fix(packages/ui): inject critical CSS via Rsbuild `html.tags` so loading screen works in dev mode
  fix(packages/ui): re-enable `data-zp-ready` dismiss flag in ThemeProvider
  fix(packages/ui): replace pong/invaders loaders with simple dots loader
  fix(packages/theme): remove `arcade-fx` as standalone theme (effects already apply with arcade)
- Updated dependencies [6df5ab7]
  - @zpress/theme@0.2.1

## 0.2.0

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

### Patch Changes

- Updated dependencies [2055c1a]
  - @zpress/theme@0.2.0
