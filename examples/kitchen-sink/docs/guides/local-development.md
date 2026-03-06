---
title: Local Development
description: Guide to running the full stack locally.
---

# Local Development

## Running services

Start all apps and packages in development mode:

```bash
pnpm dev
```

This starts:

- **Web** on `http://localhost:3000` with hot reload
- **API** on `http://localhost:4000` with watch mode

## Database

### Local PostgreSQL

```bash
# Start with Docker
docker compose up -d postgres

# Run migrations
pnpm --filter db migrate
```

### Seed data

```bash
pnpm --filter db seed
```

This populates the database with test users, products, and orders.

## Debugging

### API logs

The API outputs structured JSON logs. Use `jq` for readability:

```bash
pnpm --filter api dev 2>&1 | jq .
```

### Database queries

Enable query logging by setting `DB_LOG=true` in your `.env` file.

## Common issues

| Issue                       | Solution                         |
| --------------------------- | -------------------------------- |
| Port 3000 already in use    | `lsof -ti:3000 \| xargs kill`    |
| Database connection refused | Ensure PostgreSQL is running     |
| Type errors after pull      | Run `pnpm install && pnpm build` |
