# @zpress/kit

An opinionated documentation framework for monorepos. Just point it at your code.

<span class="zp-badge">

[![CI](https://github.com/joggrdocs/zpress/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/joggrdocs/zpress/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@zpress/kit)](https://www.npmjs.com/package/@zpress/kit)
[![License](https://img.shields.io/github/license/joggrdocs/zpress)](https://github.com/joggrdocs/zpress/blob/main/LICENSE)

</span>

## Features

- **Your docs, your structure** — Conforms to your repo, not the other way around.
- **Great defaults** — Sidebars, nav, landing pages, and icons from one config.
- **Beautiful themes out of the box** — Dark mode, generated banners, and polished defaults.
- **Monorepo-first** — Built for internal docs with first-class workspace support.

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
  description: 'Documentation for my-project',
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
