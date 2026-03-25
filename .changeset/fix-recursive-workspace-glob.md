---
'@zpress/core': patch
---

Fix workspace include resolution for `apps` and `packages` items:

- Use deep glob pattern (`docs/**/*.md`) as default include when `recursive: true`. Previously the default was always `docs/*.md` regardless of the flag.
- Prevent double-prefixing when include is already repo-relative. An explicit `include: 'apps/api/docs/**/*.md'` with `path: '/apps/api'` was resolved to `apps/api/apps/api/docs/**/*.md`, silently matching zero files.
