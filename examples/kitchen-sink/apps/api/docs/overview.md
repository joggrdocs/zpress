---
title: Overview
description: Architecture and structure of the API service.
---

# API

The API is a Hono application that serves REST endpoints for the Acme Platform.

## Stack

| Tool       | Purpose            |
| ---------- | ------------------ |
| Hono       | HTTP framework     |
| Zod        | Request validation |
| `@acme/db` | Database access    |
| JWT        | Authentication     |

## Directory structure

```
apps/api/
├── src/
│   ├── index.ts          # Entry point
│   ├── routes/           # Route handlers
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   └── products.ts
│   ├── middleware/        # Auth, logging, cors
│   └── lib/              # Shared utilities
└── tsconfig.json
```

## Design principles

- **Typed routes** — every endpoint has typed request and response schemas
- **Middleware-first** — auth, validation, and logging run before handlers
- **Stateless** — no server-side sessions, JWT-only authentication
- **Edge-compatible** — runs on Cloudflare Workers, Vercel Edge, or Node.js
