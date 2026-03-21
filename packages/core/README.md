# @zpress/core

Sync engine, asset generation, and core utilities for zpress.

<span class="zp-badge">

[![CI](https://github.com/joggrdocs/zpress/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/joggrdocs/zpress/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@zpress/core)](https://www.npmjs.com/package/@zpress/core)
[![License](https://img.shields.io/github/license/joggrdocs/zpress)](https://github.com/joggrdocs/zpress/blob/main/LICENSE)

</span>

## Install

```bash
npm install @zpress/core
```

## API

### Config (re-exported from `@zpress/config`)

| Export         | Description                         |
| -------------- | ----------------------------------- |
| `defineConfig` | Type-safe config factory            |
| `loadConfig`   | Load and validate `zpress.config.*` |

See [@zpress/config](../config/README.md) for full config documentation.

### Sync Engine

| Export           | Description                           |
| ---------------- | ------------------------------------- |
| `sync`           | Run the full sync pipeline            |
| `resolveEntries` | Resolve glob patterns to page entries |
| `loadManifest`   | Load a previously written manifest    |

### Assets

| Export              | Description              |
| ------------------- | ------------------------ |
| `generateAssets`    | Generate all asset files |
| `generateBannerSvg` | Generate banner SVG      |
| `generateIconSvg`   | Generate icon SVG        |
| `generateLogoSvg`   | Generate logo SVG        |

### Utilities

| Export         | Description                 |
| -------------- | --------------------------- |
| `createPaths`  | Build resolved path helpers |
| `hasGlobChars` | Check if a string has globs |

## Usage

```ts
import { defineConfig, loadConfig, sync } from '@zpress/core'

const config = defineConfig({
  title: 'my-project',
  sections: [{ text: 'Guide', from: 'docs/*.md' }],
})
```

## License

[MIT](https://github.com/joggrdocs/zpress/blob/main/LICENSE) - Joggr, Inc.
