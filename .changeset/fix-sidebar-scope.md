---
'@zpress/ui': patch
'@zpress/core': patch
---

Fix standalone sidebar scoping and package label deduplication

- Fix sidebar scope filtering using URL pathname instead of file path for scope matching
- Fix `_meta.json` deduplication preferring section labels over leaf labels when both share the same name
