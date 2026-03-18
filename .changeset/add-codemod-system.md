---
'@zpress/cli': minor
---

Add codemod system for automated config migrations via `zpress migrate`

- Introduces version-aware codemod registry with semver filtering
- Adds persistent manifest tracking at `.zpress/.generated/codemods.json`
- Supports `--dry-run`, `--list`, `--from`, and `--to` flags
- Includes first codemod: `title-from-to-title-config` (v0.4.0 breaking change)
