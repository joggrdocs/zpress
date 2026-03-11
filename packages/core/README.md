<div align="center">
  <img src="https://raw.githubusercontent.com/joggrdocs/zpress/main/assets/banner.svg" alt="zpress" width="90%" />
  <p><strong>Config loading, sync engine, and asset utilities for zpress.</strong></p>

<a href="https://github.com/joggrdocs/zpress/actions/workflows/ci.yml"><img src="https://github.com/joggrdocs/zpress/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
<a href="https://www.npmjs.com/package/@zpress/core"><img src="https://img.shields.io/npm/v/@zpress/core" alt="npm version" /></a>
<a href="https://github.com/joggrdocs/zpress/blob/main/LICENSE"><img src="https://img.shields.io/github/license/joggrdocs/zpress" alt="License" /></a>

</div>

## Install

```bash
npm install @zpress/core
```

## API

### Config

| Export         | Description                         |
| -------------- | ----------------------------------- |
| `defineConfig` | Type-safe config factory            |
| `loadConfig`   | Load and validate `zpress.config.*` |

### Sync Engine

| Export           | Description                            |
| ---------------- | -------------------------------------- |
| `sync`           | Run the full sync pipeline             |
| `resolveEntries` | Resolve glob patterns to page entries  |
| `loadManifest`   | Load a previously written manifest     |

### Assets

| Export              | Description                     |
| ------------------- | ------------------------------- |
| `generateAssets`    | Generate all asset files        |
| `generateBannerSvg` | Generate banner SVG             |
| `generateIconSvg`   | Generate icon SVG               |
| `generateLogoSvg`   | Generate logo SVG               |

### Utilities

| Export         | Description                    |
| -------------- | ------------------------------ |
| `createPaths`  | Build resolved path helpers    |
| `hasGlobChars` | Check if a string has globs    |

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
