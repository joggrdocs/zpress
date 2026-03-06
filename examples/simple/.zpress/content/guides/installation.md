---
title: Installation
description: How to install my-lib with your preferred package manager.
---

# Installation

## npm

```bash
npm install my-lib
```

## pnpm

```bash
pnpm add my-lib
```

## yarn

```bash
yarn add my-lib
```

## Verify

After installing, verify the package is available:

```ts
import { clamp } from 'my-lib'

console.log(clamp(5, 0, 10)) // 5
```

## TypeScript

my-lib ships with full TypeScript declarations. No additional `@types` package is needed.

Minimum TypeScript version: **5.0**.
