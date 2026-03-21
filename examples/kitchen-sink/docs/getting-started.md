---
title: Getting Started
description: Set up the Acme Platform monorepo for local development.
---

# Getting Started

## Prerequisites

- Node.js 24+
- pnpm 10+
- PostgreSQL 16+
- Docker (optional, for local services)

## Clone and install

```bash
git clone https://github.com/acme/platform.git
cd platform
pnpm install
```

## Environment setup

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required variables:

| Variable        | Description           |
| --------------- | --------------------- |
| `DATABASE_URL`  | PostgreSQL connection |
| `STRIPE_SECRET` | Stripe API secret key |
| `JWT_SECRET`    | Token signing secret  |

## Start development

```bash
# Start all services
pnpm dev

# Or start individual apps
pnpm --filter web dev
pnpm --filter api dev
```

The web app runs on `http://localhost:3000` and the API on `http://localhost:4000`.

## Next steps

- Read the [Architecture](/architecture) overview
- Explore individual [Apps](/apps/web) and [Packages](/packages/ui)
