# @zpress/kit

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
