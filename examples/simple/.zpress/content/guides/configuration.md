---
title: Configuration
description: Configure my-lib behavior for your project.
---

# Configuration

my-lib works out of the box with zero configuration. All functions are pure and stateless.

## Tree shaking

my-lib is fully tree-shakeable. Import only what you need:

```ts
// Only `clamp` is included in your bundle
import { clamp } from 'my-lib'
```

## Bundle size

| Function   | Minified  | Gzipped   |
| ---------- | --------- | --------- |
| `clamp`    | 45 B      | 38 B      |
| `debounce` | 120 B     | 95 B      |
| `groupBy`  | 150 B     | 110 B     |
| **Total**  | **315 B** | **243 B** |

## ESM only

my-lib ships as ESM only. If your project uses CommonJS, you will need a bundler or the `--experimental-vm-modules` flag in Node.js.

```json
{
  "type": "module"
}
```
