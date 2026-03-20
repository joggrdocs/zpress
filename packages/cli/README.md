# @zpress/cli

CLI for building and serving zpress documentation sites.

<span class="zp-badge">

[![CI](https://github.com/joggrdocs/zpress/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/joggrdocs/zpress/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@zpress/cli)](https://www.npmjs.com/package/@zpress/cli)
[![License](https://img.shields.io/github/license/joggrdocs/zpress)](https://github.com/joggrdocs/zpress/blob/main/LICENSE)

</span>

## Install

```bash
npm install @zpress/cli
```

## Commands

| Command    | Description                         |
| ---------- | ----------------------------------- |
| `dev`      | Start dev server with hot reload    |
| `build`    | Build for production                |
| `serve`    | Preview production build            |
| `sync`     | Sync config to documentation output |
| `clean`    | Remove generated output             |
| `dump`     | Dump resolved config for debugging  |
| `setup`    | Scaffold a new zpress project       |
| `generate` | Generate assets (banners, icons)    |

## Usage

```bash
npx zpress dev       # start dev server
npx zpress build     # production build
npx zpress serve     # preview build
```

> Most users should install [`@zpress/kit`](https://www.npmjs.com/package/@zpress/kit) instead, which re-exports the CLI alongside config helpers.

## License

[MIT](https://github.com/joggrdocs/zpress/blob/main/LICENSE) - Joggr, Inc.
