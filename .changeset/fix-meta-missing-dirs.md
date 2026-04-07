---
'@zpress/core': patch
---

Fix build crash when sidebar references empty section directories

Pre-create all directories referenced in the root `_meta.json` before Rspress reads them. Previously, sections with no synced content would be listed in `_meta.json` as `dir` items but the directory wouldn't exist on disk, causing Rspress's `auto-nav-sidebar` to crash with an ENOENT error during build.
