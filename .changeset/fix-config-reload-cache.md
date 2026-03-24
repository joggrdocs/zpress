---
'@zpress/cli': patch
---

Fix config changes not propagating during dev

Disable Rspress's persistent build cache on config-reload restarts. The cache's digest only tracks sidebar/nav structure, so changes to title, theme, colors, and other `source.define` values were invisible to it, causing stale output to be served after a restart.
