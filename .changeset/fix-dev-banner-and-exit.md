---
'@zpress/cli': patch
---

Fix dev TUI banner and quit hotkey

- Replace broken hand-crafted ASCII banner with `ink-big-text` (cfonts) and `ink-gradient` for properly styled terminal output
- Fix "q" hotkey not exiting by adding `process.exit(0)` after Ink's `exit()`, which only unmounts React but leaves the dev server and watcher keeping the process alive
