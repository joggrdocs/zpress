# @zpress/ui

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
