---
title: VSCode Extension
description: Preview your zpress docs site directly inside VS Code.
---

# VSCode Extension

The zpress VSCode extension lets you preview your documentation site directly inside your editor as you write. No need to switch between your terminal and browser — see changes live in a VS Code panel.

## Installation

Search for **zpress** in the VS Code extensions marketplace, or install from the command line:

```bash
code --install-extension joggr.zpress
```

## Live Preview

The extension embeds a live preview of your zpress dev server directly in VS Code. As you edit markdown files, the preview updates automatically.

To open the preview:

1. Open the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run **zpress: Open Preview**

The preview panel opens alongside your editor. Navigate between pages, and the preview follows your cursor — when you open a different markdown file, the preview jumps to the corresponding page.

## Requirements

- A zpress project with a `zpress.config.ts` file
- The zpress dev server running (`zpress dev`) — the extension connects to it for live preview

See the [Quick Start](/getting-started/quick-start) guide for initial setup.

## References

- [Quick Start](/getting-started/quick-start) — set up your first zpress project
- [CLI reference — dev](/reference/cli#dev) — dev server options
