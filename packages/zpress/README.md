<div align="center">
  <img src="https://raw.githubusercontent.com/joggrdocs/zpress/main/assets/banner.svg" alt="zpress" width="90%" />
  <p><strong>An opinionated documentation framework for monorepos. Just point it at your code.</strong></p>

<a href="https://github.com/joggrdocs/zpress/actions/workflows/ci.yml"><img src="https://github.com/joggrdocs/zpress/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
<a href="https://www.npmjs.com/package/@zpress/kit"><img src="https://img.shields.io/npm/v/@zpress/kit" alt="npm version" /></a>
<a href="https://github.com/joggrdocs/zpress/blob/main/LICENSE"><img src="https://img.shields.io/github/license/joggrdocs/zpress" alt="License" /></a>

</div>

## Features

- :gear: **Config over convention** — Define sections, pages, and nav in one declarative config.
- :zap: **Zero-config defaults** — Smart conventions for sidebars, nav, icons, and landing pages.
- :package: **Monorepo-native** — Workspace metadata with auto-generated package cards.
- :mag: **Auto-discovery** — Glob patterns to find and organize markdown files.
- :art: **Beautiful out of the box** — Catppuccin-themed UI with responsive layouts.

## Install

```bash
npm install @zpress/kit
```

## Usage

### Define your docs

```ts
// zpress.config.ts
import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'my-project',
  description: 'Internal developer docs',
  sections: [
    {
      text: 'Getting Started',
      link: '/getting-started',
      from: 'docs/getting-started.md',
      icon: 'pixelarticons:speed-fast',
    },
    {
      text: 'Guides',
      prefix: '/guides',
      icon: 'pixelarticons:book-open',
      from: 'docs/guides/*.md',
      textFrom: 'heading',
      sort: 'alpha',
    },
  ],
  nav: 'auto',
})
```

### Run it

```bash
npx zpress dev       # start dev server with hot reload
npx zpress build     # build for production
npx zpress serve     # preview production build
```

## Packages

| Package                                                      | Description                         |
| ------------------------------------------------------------ | ----------------------------------- |
| [`@zpress/core`](https://www.npmjs.com/package/@zpress/core) | Config loading, sync engine, assets |
| [`@zpress/cli`](https://www.npmjs.com/package/@zpress/cli)   | CLI commands and file watcher       |
| [`@zpress/ui`](https://www.npmjs.com/package/@zpress/ui)     | Rspress plugin, theme, and styles   |

## Why `@zpress/kit`?

> [!NOTE]
> Published as `@zpress/kit` because npm's overly aggressive moniker rules block the `zpress` name.

## License

[MIT](https://github.com/joggrdocs/zpress/blob/main/LICENSE) - Joggr, Inc.
