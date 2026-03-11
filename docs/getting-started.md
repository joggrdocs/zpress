---
title: Getting Started
description: Install zpress and create your first documentation site.
---

# Getting Started

## What is zpress

zpress is an information-architecture-driven documentation framework for monorepos. Your config file _is_ the architecture — it defines what content exists, where it comes from, and how it's organized in a single tree. Source markdown files are never edited by the tool. zpress syncs them into a build directory, injects frontmatter, generates sidebars and nav, and produces a static site.

## Why zpress

There are excellent documentation tools out there — [VitePress](https://vitepress.dev), [Rspress](https://rspress.dev), [Docusaurus](https://docusaurus.io), and others. They were direct inspirations for this project. So why build another one?

**Zero config, real defaults.** Most documentation tools need significant setup before they produce anything useful. zpress ships with opinionated defaults that work immediately. Point it at a repo with a `docs/` directory and you get a working site — sidebar, navigation, and all.

**Your structure, not ours.** When you _do_ configure zpress, the config maps to how you already organize your markdown. You describe where your files are and how they should be grouped. You don't restructure your docs to fit the tool — the tool fits your docs.

**Built for the vibe.** AI coding tools are everywhere now. When you're vibing on a project — spinning up features with Claude, Copilot, Cursor, or whatever you reach for — documentation shouldn't be the part that slows you down. Tell your AI to create a `docs/` directory, write some markdown, and run `zpress dev`. It just works. No plugin config, no theme wiring, no boilerplate. The whole point is that a docs site is one command away from existing.

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
      text: 'Introduction',
      link: '/intro',
      from: 'docs/intro.md',
    },
  ],
})
```

Add a section that auto-discovers pages from a directory:

```ts
{
  text: 'Guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
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

| Command           | Purpose                                |
| ----------------- | -------------------------------------- |
| `zpress setup`    | Create a starter config file           |
| `zpress sync`     | Sync source files into the content dir |
| `zpress dev`      | Start the dev server with live reload  |
| `zpress build`    | Build the static site for production   |
| `zpress serve`    | Preview the production build locally   |
| `zpress clean`    | Remove build cache and output          |
| `zpress dump`     | Print the resolved entry tree as JSON  |
| `zpress generate` | Generate branded SVG assets            |

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

Add `.zpress/content/`, `.zpress/dist/`, and `.zpress/cache/` to your `.gitignore`.

## Next steps

- [Sections and Pages](/guides/sections-and-pages) — understand the building blocks of your information architecture
- [Configuration reference](/reference/configuration) — complete field reference for `zpress.config.ts`
