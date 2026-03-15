---
'@zpress/config': patch
'@zpress/core': patch
'@zpress/theme': patch
'@zpress/ui': patch
---

fix(packages/core): map nav items with `text` instead of `title` for Rspress compatibility
fix(packages/ui): inject critical CSS via Rsbuild `html.tags` so loading screen works in dev mode
fix(packages/ui): re-enable `data-zp-ready` dismiss flag in ThemeProvider
fix(packages/ui): replace pong/invaders loaders with simple dots loader
fix(packages/theme): remove `arcade-fx` as standalone theme (effects already apply with arcade)
