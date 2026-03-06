---
description: 'Database client, schema definitions, and migration tooling.'
title: Overview
---

# DB

The `@acme/db` package provides the database client, Drizzle schema definitions, and migration tooling.

## Stack

| Tool       | Purpose           |
| ---------- | ----------------- |
| Drizzle    | Type-safe ORM     |
| PostgreSQL | Database engine   |
| node-pg    | PostgreSQL driver |

## Usage

```ts
import { db } from '@acme/db'

const users = await db.query.users.findMany({
  where: (users, { eq }) => eq(users.role, 'admin'),
  with: { posts: true },
})
```

## Directory structure

```
packages/db/
├── src/
│   ├── index.ts          # Client export
│   ├── schema/           # Table definitions
│   │   ├── users.ts
│   │   ├── products.ts
│   │   └── orders.ts
│   └── seed.ts           # Development seed data
├── migrations/           # SQL migration files
└── drizzle.config.ts
```
