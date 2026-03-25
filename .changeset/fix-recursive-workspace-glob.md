---
'@zpress/core': patch
'@zpress/config': patch
'@zpress/cli': patch
---

Fix workspace include resolution for `apps` and `packages` items:

- Use deep glob pattern (`docs/**/*.md`) as default include when `recursive: true`. Previously the default was always `docs/*.md` regardless of the flag.
- Add config check warning when an explicit include pattern already starts with the basePath derived from `path`, which causes double-prefixing and silently matches zero files. Surfaces during `zpress check` before the build step.
