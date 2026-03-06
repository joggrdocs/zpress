---
title: Overview
description: Shared React component library for the Acme Platform.
---

# UI

The `@acme/ui` package provides shared React components used across all Acme applications.

## Design principles

- **Composable** — small, single-purpose components that compose together
- **Accessible** — WAI-ARIA compliant with keyboard navigation
- **Themeable** — CSS custom properties for design token overrides
- **Type-safe** — fully typed props with discriminated unions for variants

## Installation

From any app in the monorepo:

```bash
pnpm --filter web add @acme/ui
```

## Usage

```tsx
import { Button, Card, Input } from '@acme/ui'

export const LoginForm = () => (
  <Card>
    <Input label="Email" type="email" />
    <Input label="Password" type="password" />
    <Button variant="primary">Sign in</Button>
  </Card>
)
```
