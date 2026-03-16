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
      prefix: '/apps/api',
      discovery: {
        from: 'docs/*.md',
        title: { from: 'auto' },
        sort: 'alpha',
      },
    },
    {
      title: 'Console',
      icon: { id: 'devicon:react', color: 'purple' },
      description: 'Admin dashboard',
      tags: ['react', 'vite'],
      prefix: '/apps/console',
      discovery: {
        from: 'docs/*.md',
        title: { from: 'auto' },
      },
    },
  ],
  packages: [
    {
      title: 'SDK',
      description: 'TypeScript client SDK',
      tags: ['typescript', 'npm'],
      prefix: '/packages/sdk',
      discovery: {
        from: 'docs/*.md',
        title: { from: 'auto' },
      },
    },
  ],
  sections: [
    { title: 'Getting Started', link: '/getting-started', from: 'docs/getting-started.md' },
  ],
})
```

## Fields

| Field         | Type                           | Required | Description                                                                                                                                          |
| ------------- | ------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`       | `string`                       | yes      | Display name                                                                                                                                         |
| `icon`        | `IconConfig`                   | no       | Icon ID string (from bundled collections) or `{ id: IconId, color: IconColor }` object. See [icon reference](/references/icons) for supported icons. |
| `description` | `string`                       | yes      | Short description for cards                                                                                                                          |
| `tags`        | `string[]`                     | no       | Technology tags (kebab-case)                                                                                                                         |
| `badge`       | `{ src: string; alt: string }` | no       | Deploy badge image                                                                                                                                   |
| `prefix`      | `string`                       | yes      | URL prefix for this workspace's documentation                                                                                                        |
| `discovery`   | `Discovery`                    | no       | Content discovery configuration (glob, title, sort, etc.)                                                                                            |

## How it works

Workspace items are matched to sections by `prefix`. When a section's `link` or `prefix` matches a workspace item's `prefix`, the workspace metadata is injected into that section's auto-generated landing page as a card.

The `discovery` field controls how documentation pages are auto-discovered for this workspace. The `from` pattern is relative to the workspace's base path (derived from `prefix`). For example, `prefix: "/apps/api"` + `discovery.from: "docs/*.md"` resolves to `apps/api/docs/*.md` (repo-root relative).

Cards display:

- Icon with color styling
- Scope label (derived from path, e.g. `apps/`)
- Name and description
- Technology tag badges
- Optional deploy badge

## Landing pages

Sections with children but no explicit page source automatically get a generated landing page. When workspace metadata matches, the landing page uses workspace-style cards. Without workspace metadata, sections use simpler section cards with descriptions extracted from child page frontmatter.

See the [Landing Pages guide](/concepts/landing-pages) for details on auto-generated pages, section cards, and overview file promotion.

## Custom workspace categories

The `workspaces` config field accepts `WorkspaceCategory[]` for defining custom named groups beyond the built-in `apps` and `packages` arrays. Each category has a `title`, `description`, `icon`, and `items` array of `Workspace` entries. Custom categories receive the same card and landing page treatment as the built-in groups, letting you organize workspace metadata into any number of categories.

See the [Configuration reference — WorkspaceCategory](/reference/configuration#workspacecategory) for the full field reference.
