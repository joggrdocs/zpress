---
'@zpress/core': patch
---

Use deep glob pattern (`docs/**/*.md`) as default include for recursive workspace items. Previously the default was `docs/*.md` regardless of the `recursive` flag, which meant nested files were never discovered.
