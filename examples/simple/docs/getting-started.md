---
title: Getting Started
description: Install and start using my-lib in under a minute.
---

# Getting Started

## Installation

```bash
npm install my-lib
```

## Quick start

Import the utilities you need:

```ts
import { clamp, debounce, groupBy } from 'my-lib'

const value = clamp(150, 0, 100) // 100

const log = debounce(console.log, 300)

const groups = groupBy(
  [
    { type: 'a', v: 1 },
    { type: 'b', v: 2 },
    { type: 'a', v: 3 },
  ],
  (item) => item.type
)
// { a: [{ type: 'a', v: 1 }, { type: 'a', v: 3 }], b: [{ type: 'b', v: 2 }] }
```

## Requirements

- Node.js 24+
- TypeScript 5.0+ (for type-level features)

## Next steps

- Browse the [API Reference](/api-reference) for all available functions
- Read the [Guides](/guides/usage) for common patterns
