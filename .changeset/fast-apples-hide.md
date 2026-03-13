---
'@zpress/cli': patch
'@zpress/core': patch
---

Improve dev command config reloading and file watching

- **Auto-restart dev server on config changes**: Dev server now automatically restarts when config changes are detected, using Rspress ServerInstance.close() API
- **Cache-busting for config reloads**: Use jiti with moduleCache disabled via c12's custom import option to ensure config changes are picked up immediately
- **Fix watcher for non-existent paths**: Normalize watch paths to nearest existing ancestor before adding to chokidar, ensuring sections can be detected even if their directories don't exist yet
- **Dynamic watch path updates**: Watcher now adds/removes paths when config sections change
- **Fix type signature**: OnConfigReload type now correctly includes newConfig parameter
