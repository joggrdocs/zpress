---
'@zpress/core': patch
---

Fix multi-sidebar routing for workspace children whose paths live outside the parent prefix. When `packages` items use paths like `/libs/ai` instead of `/packages/ai`, Rspress prefix matching could not find a sidebar key — the sidebar silently disappeared. Extra sidebar keys are now emitted for orphaned child paths so they resolve correctly.
