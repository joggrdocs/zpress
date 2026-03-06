---
title: Deployment
description: How the Acme Platform is built and deployed.
---

# Deployment

## Build pipeline

All deployments go through CI:

1. **Lint and typecheck** — `pnpm check`
2. **Test** — `pnpm test`
3. **Build** — `pnpm build`
4. **Deploy** — platform-specific deploy step

## Web (Vercel)

The web app deploys to Vercel on push to `main`:

```bash
# Build command
pnpm --filter web build

# Output directory
apps/web/.next
```

Environment variables are managed in the Vercel dashboard.

## API (Railway)

The API deploys to Railway:

```bash
# Build command
pnpm --filter api build

# Start command
node apps/api/dist/index.js
```

## Database migrations

Migrations run automatically in CI before deployment:

```bash
pnpm --filter db migrate
```

Migrations are never run directly in production. Always go through the CI pipeline.

## Rollback

Both Vercel and Railway support instant rollbacks to the previous deployment. No code changes required.
