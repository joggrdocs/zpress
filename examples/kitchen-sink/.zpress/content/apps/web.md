---
description: Architecture and structure of the Web application.
title: Overview
---

# Web

The web app is a Next.js application that serves the Acme Platform frontend.

## Stack

| Tool       | Purpose                 |
| ---------- | ----------------------- |
| Next.js 15 | Framework               |
| React 19   | UI library              |
| Tailwind   | Styling                 |
| `@acme/ui` | Shared components       |
| `@acme/db` | Server-side data access |

## Directory structure

```
apps/web/
├── src/
│   ├── app/              # App router pages
│   ├── components/       # App-specific components
│   └── lib/              # Utilities and helpers
├── public/               # Static assets
└── next.config.ts
```

## Key patterns

- **Server components** by default, `"use client"` only when needed
- **Server actions** for mutations instead of API routes
- **Parallel routes** for modals and side panels
- **Streaming** with Suspense boundaries for loading states
