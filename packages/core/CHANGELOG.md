# @zpress/core

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
