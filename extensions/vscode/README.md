# zpress for VS Code

Run the [zpress](https://zpress.dev) dev server and preview documentation without leaving your editor.

## Features

- **Dev server management** — Start, stop, restart, and toggle the zpress dev server from the command palette or status bar.
- **In-editor preview** — Preview any tracked markdown page in a webview panel alongside your code.
- **Sidebar navigation** — Browse your documentation structure in the activity bar, organized by section.
- **CodeLens** — Click "Preview in zpress" above any tracked markdown file to open the preview.

## Getting Started

1. Open a workspace that contains a `zpress.config.ts` (or `.js`, `.mjs`, `.mts`, `.json`) file.
2. The extension activates automatically and starts the dev server.
3. Use the sidebar to browse pages, or open a markdown file and click the globe icon in the editor title bar to preview.

## Commands

| Command                      | Description                       |
| ---------------------------- | --------------------------------- |
| `zpress: Start Dev Server`   | Start the dev server              |
| `zpress: Stop Dev Server`    | Stop the dev server               |
| `zpress: Toggle Dev Server`  | Toggle the dev server on/off      |
| `zpress: Restart Dev Server` | Restart the dev server            |
| `zpress: Preview Page`       | Preview the current markdown file |

> `zpress: Open Page` is an internal command used by the sidebar tree view and is not intended to be invoked directly.

## Requirements

- [zpress](https://zpress.dev) installed in your project (`npx zpress` or `pnpm add @zpress/kit`)
