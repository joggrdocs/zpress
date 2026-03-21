---
description: Shared configuration and environment variable management.
title: Overview
---

# Config

The `@acme/config` package provides validated environment variables and shared configuration constants.

## Usage

```ts
import { env } from '@acme/config'

console.log(env.DATABASE_URL)
console.log(env.NODE_ENV)
```

## How it works

Environment variables are validated at import time using Zod:

```ts
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  STRIPE_SECRET: z.string().startsWith('sk_'),
  PORT: z.coerce.number().default(4000),
})

export const env = schema.parse(process.env)
```

If any variable is missing or invalid, the process exits immediately with a descriptive error message.

## Shared constants

```ts
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const

export const CACHE_TTL = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
} as const
```

## Adding a new variable

1. Add the variable to the Zod schema in `src/index.ts`
2. Add the variable to `.env.example` in the repo root
3. Set the value in each deployment environment
