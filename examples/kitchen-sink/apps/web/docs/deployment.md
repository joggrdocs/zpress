---
title: Deployment
description: How the web app is built and deployed to Vercel.
---

# Deployment

## Platform

The web app deploys to **Vercel** with automatic deployments on push to `main`.

## Build configuration

| Setting          | Value                     |
| ---------------- | ------------------------- |
| Framework preset | Next.js                   |
| Build command    | `pnpm --filter web build` |
| Output directory | `apps/web/.next`          |
| Node.js version  | 20.x                      |

## Environment variables

Variables are managed in the Vercel dashboard per environment:

| Variable       | Production             | Preview           |
| -------------- | ---------------------- | ----------------- |
| `DATABASE_URL` | Production DB          | Preview DB        |
| `API_URL`      | `https://api.acme.com` | Branch deploy URL |
| `STRIPE_KEY`   | Live key               | Test key          |

## Preview deployments

Every pull request gets a unique preview URL. Preview deployments use:

- A separate preview database
- Stripe test mode
- Relaxed CSP headers for debugging
