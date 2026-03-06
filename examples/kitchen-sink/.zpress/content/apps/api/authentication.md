---
description: How authentication and authorization work in the API.
title: Authentication
---

# Authentication

## Overview

The API uses **JWT bearer tokens** for authentication. Tokens are issued on login and verified on every protected request.

## Flow

1. Client sends credentials to `POST /auth/login`
2. API validates credentials against the database
3. On success, API returns a signed JWT
4. Client includes the token in subsequent requests via the `Authorization` header

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Token structure

```json
{
  "sub": "user_abc123",
  "email": "alice@acme.com",
  "role": "admin",
  "iat": 1700000000,
  "exp": 1700086400
}
```

## Middleware

The `authMiddleware` extracts and verifies the token:

```ts
import { jwt } from 'hono/jwt'

app.use('/api/*', jwt({ secret: env.JWT_SECRET }))
```

## Authorization

Role-based access control is handled per-route:

| Role    | Access                     |
| ------- | -------------------------- |
| `admin` | Full access                |
| `user`  | Own resources only         |
| `guest` | Read-only public endpoints |
