---
title: Migrations
description: How to create and run database migrations.
---

# Migrations

## Generate a migration

After modifying the schema, generate a migration:

```bash
pnpm --filter db generate
```

This creates a new SQL file in `migrations/` based on the schema diff.

## Run migrations

Apply pending migrations:

```bash
pnpm --filter db migrate
```

## Rollback

Drizzle does not support automatic rollbacks. To revert a migration:

1. Write a new migration that undoes the changes
2. Apply it with `pnpm --filter db migrate`

## Migration naming

Generated migrations follow the pattern:

```
migrations/
├── 0000_initial.sql
├── 0001_add_orders_table.sql
└── 0002_add_user_role.sql
```

## CI integration

Migrations run automatically in CI before deployment:

```yaml
- name: Run migrations
  run: pnpm --filter db migrate
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Seed data

For local development, seed the database after migrations:

```bash
pnpm --filter db seed
```

The seed script creates:

- 10 test users (including 1 admin)
- 50 sample products
- 25 orders with line items
