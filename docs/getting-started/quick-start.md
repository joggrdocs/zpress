---
title: Quick Start
description: Install zpress and create your first documentation site in minutes.
---

# Quick Start

## Install

```bash
pnpm add @zpress/kit
```

## Initialize

Run `zpress setup` or create a `zpress.config.ts` at your repo root:

```ts
import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'My Project',
  description: 'Project documentation',
  sections: [
    {
      title: 'Getting Started',
      path: '/getting-started',
      include: 'docs/getting-started/*.md',
    },
  ],
})
```

Add a section that auto-discovers pages from a directory:

```ts
{
  title: 'Guides',
  path: '/guides',
  include: 'docs/guides/*.md',
  icon: 'pixelarticons:book-open',
}
```

Every `.md` file matching the glob becomes a page under `/guides/`.

## Start the dev server

```bash
zpress dev
```

This runs `sync` to copy and process your source files, starts a file watcher for live reload, and launches the dev server. Open the URL printed in the terminal to see your site.

## Commands

| Command           | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `zpress setup`    | Create a starter config and generate SVG assets    |
| `zpress sync`     | Sync source files into the content dir             |
| `zpress dev`      | Start the dev server with live reload              |
| `zpress build`    | Build the static site for production               |
| `zpress serve`    | Preview the production build locally               |
| `zpress check`    | Validate config and check for broken links         |
| `zpress draft`    | Scaffold a new documentation file from a template  |
| `zpress clean`    | Remove build artifacts, synced content, and cache  |
| `zpress dump`     | Print the resolved entry tree as JSON              |
| `zpress generate` | Generate banner, logo, and icon SVG assets         |

## Project structure

After running `zpress dev`, the `.zpress/` directory is created:

```
your-repo/
├── docs/                       # Your source markdown
│   ├── intro.md
│   └── guides/
├── zpress.config.ts         # Information architecture
└── .zpress/                 # Generated (gitignore this)
    ├── content/                # Synced pages
    │   └── .generated/         # sidebar.json, nav.json
    ├── public/                 # Static assets
    ├── dist/                   # Build output
    └── cache/                  # Build cache
```

Add `.zpress/` to your `.gitignore`.

## Next steps

- [Content](/concepts/content) — understand the building blocks of your information architecture
- [Configuration reference](/reference/configuration) — complete field reference for `zpress.config.ts`
