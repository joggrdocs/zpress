# @zpress/ui

Rspress plugin, theme components, and styles for zpress.

<span class="zp-badge">

[![CI](https://github.com/joggrdocs/zpress/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/joggrdocs/zpress/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@zpress/ui)](https://www.npmjs.com/package/@zpress/ui)
[![License](https://img.shields.io/github/license/joggrdocs/zpress)](https://github.com/joggrdocs/zpress/blob/main/LICENSE)

</span>

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

The `./theme` and `./icons` exports ship raw `.tsx`/`.ts` source files (not compiled output). Rspress requires theme components to be bundled by the consuming build pipeline.

## License

[MIT](https://github.com/joggrdocs/zpress/blob/main/LICENSE) - Joggr, Inc.
