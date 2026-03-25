---
'@zpress/core': patch
---

Fix workspace include resolution for `apps` and `packages` items:

- Use deep glob pattern (`docs/**/*.md`) as default include when `recursive: true`. Previously the default was always `docs/*.md` regardless of the flag.
- Warn when an explicit include pattern already starts with the basePath derived from `path`, which causes double-prefixing and silently matches zero files.
