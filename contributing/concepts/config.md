# Config

The single source of truth for the entire documentation site.

## Overview

The config file (`zpress.config.ts`) defines the information architecture -- content structure, navigation, metadata, and workspaces. It is loaded via [c12](https://github.com/unjs/c12) and validated at the boundary in `defineConfig()`. Validation errors exit immediately with a descriptive message.

## Supported Formats

| Format | Files |
| --- | --- |
| TypeScript | `zpress.config.ts`, `.mts`, `.cts` |
| JavaScript | `zpress.config.js`, `.mjs`, `.cjs` |
| Data | `zpress.config.json`, `.jsonc`, `.yml`, `.yaml` |

## Shape

```ts
import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'My Docs',
  description: 'Platform documentation',
  tagline: 'A short tagline for the hero section',
  sections: [
    /* entry tree */
  ],
  apps: [
    /* workspace items */
  ],
  packages: [
    /* workspace items */
  ],
  nav: 'auto',
})
```

| Field | Purpose |
| --- | --- |
| `title` | Site title, used in hero and metadata |
| `description` | Site description for SEO |
| `tagline` | Hero section subtitle |
| `sections` | Entry tree defining the information architecture |
| `apps` | Workspace items for application docs |
| `packages` | Workspace items for shared package docs |
| `workspaces` | Custom workspace groups |
| `nav` | Top-level navigation (`'auto'` or explicit array) |

## Output Structure

The sync engine writes everything to `.zpress/`:

```tree
.zpress/
├── content/                 # Synced markdown + generated MDX (Rspress root)
│   ├── index.md             # Home page (auto-generated or from source)
│   ├── getting-started.md
│   ├── guides/
│   └── .generated/          # Machine-generated metadata
│       ├── sidebar.json     # Multi-sidebar config
│       ├── nav.json         # Top-level navigation
│       └── workspaces.json  # Workspace data for home page
├── public/                  # Static assets (logos, icons, banners)
├── dist/                    # Build output (HTML, CSS, JS)
└── cache/                   # Rspress build cache
```

Rspress's root is set to `.zpress/content/`. It never sees the original repo layout.

## Rspress Integration

`createRspressConfig()` in `@zpress/ui` bridges sync output to Rspress:

- Sets Rspress `root` to `.zpress/content/`
- Reads generated `sidebar.json`, `nav.json`, `workspaces.json` from `.generated/`
- Registers the zpress plugin (theme provider, edit-source button, mermaid, file trees)
- Configures Rsbuild aliases so generated MDX can import `@zpress/ui/theme` components

## References

- [Architecture](./architecture.md)
- [Engine](./engine/overview.md)
- [CLI Reference](../references/cli.md)
