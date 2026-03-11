---
'@zpress/cli': patch
'@zpress/core': patch
'@zpress/ui': patch
'@zpress/kit': patch
---

Fix type exports and dependency declarations

- Generate bundled `.d.ts` declaration files via Rslib `dts.bundle` (previously no declaration files were emitted)
- Point `exports.types` to generated `dist/*.d.ts` instead of raw source files
- Move `react`, `react-dom`, and `@rspress/core` to `peerDependencies` in `@zpress/ui`
- Surface `react`, `react-dom`, and `@rspress/core` as `peerDependencies` in `@zpress/kit`
- Centralize shared dependency versions via pnpm catalog
- Bump `@kidd-cli/core` to `^0.4.0` in `@zpress/cli`
