<div align="center">
  <img src="https://raw.githubusercontent.com/joggrdocs/zpress/main/assets/banner.svg" alt="zpress" width="90%" />
  <p><strong>Rspress plugin, theme components, and styles for zpress.</strong></p>

<a href="https://github.com/joggrdocs/zpress/actions/workflows/ci.yml"><img src="https://github.com/joggrdocs/zpress/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
<a href="https://www.npmjs.com/package/@zpress/ui"><img src="https://img.shields.io/npm/v/@zpress/ui" alt="npm version" /></a>
<a href="https://github.com/joggrdocs/zpress/blob/main/LICENSE"><img src="https://img.shields.io/github/license/joggrdocs/zpress" alt="License" /></a>

</div>

## Install

```bash
npm install @zpress/ui
```

## Exports

| Path               | Description                       |
| ------------------ | --------------------------------- |
| `@zpress/ui`       | Rspress plugin and config builder |
| `@zpress/ui/theme` | Theme components (React)          |
| `@zpress/ui/icons` | Icon components                   |

## API

| Export                | Description                                |
| --------------------- | ------------------------------------------ |
| `createRspressConfig` | Build an Rspress config from zpress config |
| `zpressPlugin`        | Rspress plugin for zpress integration      |

## Usage

```ts
import { createRspressConfig, zpressPlugin } from '@zpress/ui'
```

## Raw Source Exports

The `./theme` and `./icons` exports ship raw `.tsx`/`.ts` source files (not compiled output). This is intentional — Rspress theme components must be bundled by the consuming Rspress build pipeline to work correctly with its module resolution and hot-reload system.

## License

[MIT](https://github.com/joggrdocs/zpress/blob/main/LICENSE) - Joggr, Inc.
