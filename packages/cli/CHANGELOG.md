# @zpress/cli

## 0.2.0

### Minor Changes

- 83cc277: Add `zpress check` command for config validation and deadlink detection

  Introduces a standalone `check` command that validates the zpress config and
  detects broken internal links by running a silent Rspress build. The `build`
  command now includes checks by default (`--check` flag, opt out with
  `--no-check`). Config validation is moved from `defineConfig` (which was
  calling `process.exit`) into `loadConfig`, returning structured `Result` tuples
  so the CLI can present friendly error messages.

### Patch Changes

- Updated dependencies [83cc277]
- Updated dependencies [d1e2b76]
  - @zpress/core@0.4.0
  - @zpress/ui@0.3.1

## 0.1.4

### Patch Changes

- Updated dependencies [aea7b38]
- Updated dependencies [d1b4ad5]
- Updated dependencies [37c2ec6]
  - @zpress/ui@0.3.0
  - @zpress/core@0.3.0

## 0.1.3

### Patch Changes

- Updated dependencies [f4d5388]
  - @zpress/ui@0.2.2

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
  - @zpress/core@0.2.1
  - @zpress/ui@0.2.1

## 0.1.1

### Patch Changes

- Updated dependencies [77adac6]
  - @zpress/core@0.2.0
  - @zpress/ui@0.2.0

## 0.1.0

### Minor Changes

- 04d2e2b: Initial release

  CLI commands (dev, build, serve, sync, clean, setup, dump, generate) powered by yargs and @clack/prompts, with chokidar-based file watcher for live reload during development.
