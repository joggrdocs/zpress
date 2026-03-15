---
'@zpress/cli': patch
---

Fix dev server crash on config-triggered restart failure. Previously, if the Rspress dev server failed to start after a config change, the entire process would exit. Now the watcher stays alive and logs a message so the user can fix the config and save again to retry.
