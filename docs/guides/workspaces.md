---
title: Workspaces
description: Define monorepo app and package metadata for landing pages and cards.
---

# Workspaces

The `apps` and `packages` arrays define metadata for your monorepo's services and libraries. This metadata drives the home page, landing page cards, and introduction content.

## Defining workspace items

```ts
import { defineConfig } from '@zpress/kit'

export default defineConfig({
  apps: [
    {
      text: 'API',
      icon: 'devicon:hono',
      iconColor: 'blue',
      description: 'REST API with typed routes',
      tags: ['hono', 'typescript', 'node'],
      docsPrefix: '/apps/api',
    },
    {
      text: 'Console',
      icon: 'devicon:react',
      iconColor: 'purple',
      description: 'Admin dashboard',
      tags: ['react', 'vite'],
      docsPrefix: '/apps/console',
    },
  ],
  packages: [
    {
      text: 'SDK',
      description: 'TypeScript client SDK',
      tags: ['typescript', 'npm'],
      docsPrefix: '/packages/sdk',
    },
  ],
  sections: [
    { text: 'Getting Started', link: '/getting-started', from: 'docs/getting-started.md' },
  ],
})
```

## Fields

| Field         | Type                           | Required | Description                        |
| ------------- | ------------------------------ | -------- | ---------------------------------- |
| `text`        | `string`                       | yes      | Display name                       |
| `icon`        | `string`                       | no       | Iconify identifier                 |
| `iconColor`   | `string`                       | no       | CSS class suffix for icon color    |
| `description` | `string`                       | yes      | Short description for cards        |
| `tags`        | `string[]`                     | no       | Technology tags (kebab-case)       |
| `badge`       | `{ src: string; alt: string }` | no       | Deploy badge image                 |
| `docsPrefix`  | `string`                       | yes      | Docs path prefix matching sections |

## How it works

Workspace items are matched to sections by `docsPrefix`. When a section's `link` or `prefix` matches a workspace item's `docsPrefix`, the workspace metadata is injected into that section's auto-generated landing page as a card.

Cards display:

- Icon with color styling
- Scope label (derived from path, e.g. `apps/`)
- Name and description
- Technology tag badges
- Optional deploy badge

## Landing pages

Sections with children but no explicit page source automatically get a generated landing page. When workspace metadata matches, the landing page uses workspace-style cards. Without workspace metadata, sections use simpler section cards with descriptions extracted from child page frontmatter.

See the [Landing Pages guide](/guides/landing-pages) for details on auto-generated pages, section cards, and overview file promotion.
