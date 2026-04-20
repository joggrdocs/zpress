---
'@zpress/ui': patch
'@zpress/cli': patch
---

perf: reduce @zpress/ui bundle from 15MB to 767KB by externalizing ts-morph

fix: close Rspress dev server on quit (no more double ctrl+c / blank screen)
