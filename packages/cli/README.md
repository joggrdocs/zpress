<div align="center">
  <img src="https://raw.githubusercontent.com/joggrdocs/zpress/main/assets/banner.svg" alt="zpress" width="90%" />
  <p><strong>CLI for building and serving zpress documentation sites.</strong></p>

<a href="https://github.com/joggrdocs/zpress/actions/workflows/ci.yml"><img src="https://github.com/joggrdocs/zpress/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
<a href="https://www.npmjs.com/package/@zpress/cli"><img src="https://img.shields.io/npm/v/@zpress/cli" alt="npm version" /></a>
<a href="https://github.com/joggrdocs/zpress/blob/main/LICENSE"><img src="https://img.shields.io/github/license/joggrdocs/zpress" alt="License" /></a>

</div>

## Install

```bash
npm install @zpress/cli
```

## Commands

| Command    | Description                          |
| ---------- | ------------------------------------ |
| `dev`      | Start dev server with hot reload     |
| `build`    | Build for production                 |
| `serve`    | Preview production build             |
| `sync`     | Sync config to documentation output  |
| `clean`    | Remove generated output              |
| `dump`     | Dump resolved config for debugging   |
| `setup`    | Scaffold a new zpress project        |
| `generate` | Generate assets (banners, icons)     |

## Usage

```bash
npx zpress dev       # start dev server
npx zpress build     # production build
npx zpress serve     # preview build
```

> Most users should install [`@zpress/kit`](https://www.npmjs.com/package/@zpress/kit) instead, which re-exports the CLI alongside config helpers.

## License

[MIT](https://github.com/joggrdocs/zpress/blob/main/LICENSE) - Joggr, Inc.
