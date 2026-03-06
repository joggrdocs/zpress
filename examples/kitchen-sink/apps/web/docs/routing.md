---
title: Routing
description: How pages and layouts are organized in the web app.
---

# Routing

The web app uses the Next.js App Router with file-based routing.

## Route structure

```
src/app/
├── layout.tsx           # Root layout (nav, providers)
├── page.tsx             # Home page
├── dashboard/
│   ├── layout.tsx       # Dashboard layout (sidebar)
│   ├── page.tsx         # Dashboard overview
│   ├── settings/
│   │   └── page.tsx     # User settings
│   └── @modal/
│       └── (.)invite/
│           └── page.tsx # Intercepted modal route
└── auth/
    ├── login/
    │   └── page.tsx
    └── signup/
        └── page.tsx
```

## Protected routes

Authentication is handled in the root layout middleware:

```ts
// middleware.ts
const publicPaths = ['/auth/login', '/auth/signup']

export const config = {
  matcher: ['/((?!_next|api|static).*)'],
}
```

## Dynamic routes

Product pages use dynamic segments:

```
src/app/products/[id]/page.tsx
```

Data is fetched server-side with the `db` package:

```ts
import { db } from '@acme/db'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await db.products.findById(params.id)
  // ...
}
```
