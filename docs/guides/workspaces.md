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
      title: 'API',
      icon: { id: 'devicon:hono', color: 'blue' },
      description: 'REST API with typed routes',
      tags: ['hono', 'typescript', 'node'],
      path: '/apps/api',
    },
    {
      title: 'Console',
      icon: { id: 'devicon:react', color: 'purple' },
      description: 'Admin dashboard',
      tags: ['react', 'vite'],
      path: '/apps/console',
    },
  ],
  packages: [
    {
      title: 'SDK',
      description: 'TypeScript client SDK',
      tags: ['typescript', 'npm'],
      path: '/packages/sdk',
    },
  ],
  sections: [
    { title: 'Getting Started', link: '/getting-started', from: 'docs/getting-started.md' },
  ],
})
```

## Fields

| Field         | Type                           | Required | Description                                                     |
| ------------- | ------------------------------ | -------- | --------------------------------------------------------------- |
| `title`       | `string`                       | yes      | Display name                                                    |
| `icon`        | `IconConfig`                   | no       | Iconify identifier or `{ id: IconId, color: IconColor }` object |
| `description` | `string`                       | yes      | Short description for cards                                     |
| `tags`        | `string[]`                     | no       | Technology tags (kebab-case)                                    |
| `badge`       | `{ src: string; alt: string }` | no       | Deploy badge image                                              |
| `path`        | `string`                       | yes      | Docs path prefix matching sections                              |

## How it works

Workspace items are matched to sections by `path`. When a section's `link` or `prefix` matches a workspace item's `path`, the workspace metadata is injected into that section's auto-generated landing page as a card.

Cards display:

- Icon with color styling
- Scope label (derived from path, e.g. `apps/`)
- Name and description
- Technology tag badges
- Optional deploy badge

## Landing pages

Sections with children but no explicit page source automatically get a generated landing page. When workspace metadata matches, the landing page uses workspace-style cards. Without workspace metadata, sections use simpler section cards with descriptions extracted from child page frontmatter.

See the [Landing Pages guide](/guides/landing-pages) for details on auto-generated pages, section cards, and overview file promotion.

## Custom workspace groups

The `workspaces` config field accepts `WorkspaceGroup[]` for defining custom named groups beyond the built-in `apps` and `packages` arrays. Each group has a `name`, `description`, `icon`, and `items` array of `WorkspaceItem` entries. Custom groups receive the same card and landing page treatment as the built-in groups, letting you organize workspace metadata into any number of categories.

See the [Configuration reference — WorkspaceGroup](/reference/configuration#workspacegroup) for the full field reference.
