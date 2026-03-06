---
title: Architecture
description: High-level architecture of the Acme Platform monorepo.
---

# Architecture

## Overview

The Acme Platform is a monorepo containing two applications and three shared packages:

```
apps/
├── web/          # Next.js frontend
└── api/          # Hono REST API

packages/
├── ui/           # Shared React components
├── db/           # Database client and schema
└── config/       # Shared configuration
```

## Dependency graph

```
web ──→ ui ──→ config
 │              ↑
 └──→ db ───────┘
       ↑
api ───┘
```

Both apps depend on `db` for data access and `config` for shared environment variables. The `web` app additionally uses the `ui` component library.

## Data flow

1. **Web** renders pages using React components from `ui`
2. **Web** calls **API** endpoints for data mutations
3. **API** validates requests and queries the database via `db`
4. **DB** manages connection pooling, schema, and migrations

## Key decisions

| Decision        | Choice     | Rationale                             |
| --------------- | ---------- | ------------------------------------- |
| Frontend        | Next.js    | SSR, file-based routing, React RSC    |
| API             | Hono       | Lightweight, typed routes, edge-ready |
| Database        | PostgreSQL | Relational integrity, JSONB support   |
| ORM             | Drizzle    | Type-safe, SQL-first, no codegen      |
| Monorepo        | Turborepo  | Fast builds, task caching             |
| Package manager | pnpm       | Strict, efficient, workspace support  |
