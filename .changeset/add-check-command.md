---
'@zpress/cli': minor
'@zpress/core': minor
'@zpress/ui': patch
---

Add `zpress check` command for config validation and deadlink detection

Introduces a standalone `check` command that validates the zpress config and
detects broken internal links by running a silent Rspress build. The `build`
command now includes checks by default (`--check` flag, opt out with
`--no-check`). Config validation is moved from `defineConfig` (which was
calling `process.exit`) into `loadConfig`, returning structured `Result` tuples
so the CLI can present friendly error messages.
