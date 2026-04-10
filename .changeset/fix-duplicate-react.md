---
'@zpress/ui': patch
'@zpress/cli': patch
'@zpress/kit': patch
---

fix(packages/ui,packages/cli,packages/zpress): resolve duplicate React instances in consumer repos

Added `react` and `react-dom` resolve aliases to the Rspress builder config so rspack always uses the consumer's single React copy. Moved `react` from direct dependencies to peer dependencies in `@zpress/cli` to prevent pnpm from installing a private copy. Aligned React peer version range in `@zpress/kit` to `^19.2.5`.
