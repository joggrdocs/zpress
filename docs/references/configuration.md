---
title: Configuration
description: Complete reference for zpress.config.ts fields, entry shapes, and workspace metadata.
---

# Configuration

All configuration lives in `zpress.config.ts` at your repo root. Use `defineConfig` for type safety and autocompletion.

```ts
import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'My Docs',
  description: 'Project documentation',
  sections: [{ title: 'Introduction', link: '/intro', from: 'docs/intro.md' }],
})
```

Configuration is loaded via [c12](https://github.com/unjs/c12), which supports `.ts`, `.js`, `.mjs`, and `.json` formats.

## Top-level fields

| Field         | Type                  | Default    | Description                                                                                    |
| ------------- | --------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `title`       | `string`              | —          | Site title shown in browser tab and home page                                                  |
| `description` | `string`              | —          | Meta description and home page hero headline                                                   |
| `tagline`     | `string`              | —          | Hero tagline below the headline on the home page                                               |
| `sections`    | `Entry[]`             | (required) | Information architecture tree                                                                  |
| `nav`         | `'auto' \| NavItem[]` | `'auto'`   | Top navigation bar                                                                             |
| `features`    | `Feature[]`           | —          | Explicit home page feature cards (replaces auto-gen)                                           |
| `apps`        | `WorkspaceItem[]`     | —          | Monorepo app metadata for home/landing pages                                                   |
| `packages`    | `WorkspaceItem[]`     | —          | Monorepo package metadata for home/landing pages                                               |
| `workspaces`  | `WorkspaceGroup[]`    | —          | Custom named groups of workspace items                                                         |
| `openapi`     | `OpenAPIConfig`       | —          | OpenAPI spec integration for interactive API docs                                              |
| `exclude`     | `string[]`            | —          | Glob patterns excluded globally across all sources                                             |
| `icon`        | `string`              | —          | Path to a custom favicon served from `.zpress/public/`. Defaults to auto-generated `/icon.svg` |

## Entry

Each node in `sections` is an `Entry`. What you provide determines what it is:

**Page — single file:**

```ts
{ title: 'Architecture', link: '/architecture', from: 'docs/architecture.md' }
```

**Page — inline content:**

```ts
{ title: 'Overview', link: '/overview', content: '# Overview\nProject overview content.' }
```

**Page — async content generator:**

```ts
{ title: 'Status', link: '/status', content: async () => fetchStatus() }
```

**Section — explicit children:**

```ts
{
  title: 'Guides',
  items: [
    { title: 'Quick Start', link: '/guides/quick-start', from: 'docs/guides/quick-start.md' },
    { title: 'Deployment', link: '/guides/deployment', from: 'docs/guides/deployment.md' },
  ],
}
```

**Section — auto-discovered from glob:**

```ts
{ title: 'Guides', prefix: '/guides', from: 'docs/guides/*.md' }
```

### Entry fields

| Field            | Type                                          | Description                                     |
| ---------------- | --------------------------------------------- | ----------------------------------------------- |
| `title`          | `string`                                      | Display name in sidebar and nav                 |
| `link`           | `string`                                      | Output URL path                                 |
| `from`           | `string`                                      | Source file path or glob pattern                |
| `prefix`         | `string`                                      | URL prefix for glob-discovered children         |
| `content`        | `string \| (() => string \| Promise<string>)` | Inline or generated markdown content            |
| `items`          | `Entry[]`                                     | Explicit child entries                          |
| `collapsible`    | `boolean`                                     | Make sidebar section collapsible                |
| `exclude`        | `string[]`                                    | Exclude globs scoped to this entry              |
| `hidden`         | `boolean`                                     | Hide from sidebar (page still routable)         |
| `frontmatter`    | `Frontmatter`                                 | Injected YAML frontmatter                       |
| `titleFrom`      | `'filename' \| 'heading' \| 'frontmatter'`    | Title derivation for discovered children        |
| `titleTransform` | `(title, slug) => string`                     | Transform derived title                         |
| `sort`           | `'alpha' \| 'filename' \| comparator`         | Sort order for discovered children              |
| `recursive`      | `boolean`                                     | Directory-based nesting for recursive globs     |
| `indexFile`      | `string`                                      | Section header filename (default: `"overview"`) |
| `icon`           | `IconConfig`                                  | Icon for home page feature cards                |
| `card`           | `CardConfig`                                  | Landing page card metadata                      |
| `isolated`       | `boolean`                                     | Separate sidebar namespace (requires `link`)    |

## WorkspaceItem

Metadata for monorepo apps and packages. Drives home page cards, landing page cards, and introduction content.

```ts
{
  title: 'API',
  icon: { id: 'devicon:hono', color: 'blue' },
  description: 'REST API with typed routes',
  tags: ['hono', 'typescript'],
  path: '/apps/api',
}
```

| Field            | Type                                       | Required | Description                                                     |
| ---------------- | ------------------------------------------ | -------- | --------------------------------------------------------------- |
| `title`          | `string`                                   | yes      | Display name                                                    |
| `icon`           | `IconConfig`                               | no       | Iconify identifier or `{ id: IconId, color: IconColor }` object |
| `description`    | `string`                                   | yes      | Short description for cards                                     |
| `tags`           | `string[]`                                 | no       | Technology tags (kebab-case)                                    |
| `badge`          | `{ src: string; alt: string }`             | no       | Deploy badge image                                              |
| `path`           | `string`                                   | yes      | Docs path prefix matching sections                              |
| `from`           | `string`                                   | no       | Content source relative to workspace base                       |
| `items`          | `Entry[]`                                  | no       | Explicit child entries                                          |
| `sort`           | `'alpha' \| 'filename' \| fn`              | no       | Sort order for auto-discovered children                         |
| `titleFrom`      | `'filename' \| 'heading' \| 'frontmatter'` | no       | Title derivation for discovered children                        |
| `titleTransform` | `(title, slug) => string`                  | no       | Transform derived title                                         |
| `recursive`      | `boolean`                                  | no       | Enable recursive directory nesting                              |
| `indexFile`      | `string`                                   | no       | Section header filename (default: `"overview"`)                 |
| `exclude`        | `string[]`                                 | no       | Exclude globs scoped to this item                               |
| `collapsible`    | `boolean`                                  | no       | Make sidebar section collapsible                                |
| `frontmatter`    | `Frontmatter`                              | no       | Injected frontmatter for all child pages                        |

## WorkspaceGroup

Custom named groups beyond the built-in `apps` and `packages`. Each group receives the same card and landing page treatment.

```ts
{
  name: 'Integrations',
  description: 'Third-party service connectors',
  icon: 'pixelarticons:integration',
  items: [
    { title: 'Stripe', description: 'Payment processing', path: '/integrations/stripe' },
  ],
}
```

| Field         | Type              | Required | Description                                                     |
| ------------- | ----------------- | -------- | --------------------------------------------------------------- |
| `name`        | `string`          | Yes      | Group display name                                              |
| `description` | `string`          | Yes      | Short description                                               |
| `icon`        | `IconConfig`      | Yes      | Iconify identifier or `{ id: IconId, color: IconColor }` object |
| `items`       | `WorkspaceItem[]` | Yes      | Workspace items in this group                                   |
| `link`        | `string`          | No       | URL prefix override (defaults to `/${slugify(name)}`)           |

## CardConfig

Controls how an entry appears as a card on its parent section's auto-generated landing page.

```ts
{
  icon: { id: 'devicon:hono', color: 'blue' },
  scope: 'apps/',
  description: 'REST API with typed routes',
  tags: ['Hono', 'REST'],
  badge: { src: '/logos/vercel.svg', alt: 'Vercel' },
}
```

| Field         | Type                           | Description                                                     |
| ------------- | ------------------------------ | --------------------------------------------------------------- |
| `icon`        | `IconConfig`                   | Iconify identifier or `{ id: IconId, color: IconColor }` object |
| `scope`       | `string`                       | Scope label above the card name                                 |
| `description` | `string`                       | Short description (overrides auto-extracted)                    |
| `tags`        | `string[]`                     | Technology tag badges                                           |
| `badge`       | `{ src: string; alt: string }` | Deploy badge image                                              |

## NavItem

Explicit navigation bar configuration. Used when `nav` is an array instead of `'auto'`.

```ts
nav: [
  { title: 'Guides', link: '/guides/sections-and-pages' },
  { title: 'API', link: '/api/overview' },
]
```

| Field         | Type        | Description                             |
| ------------- | ----------- | --------------------------------------- |
| `title`       | `string`    | Display text                            |
| `link`        | `string`    | Target URL path                         |
| `items`       | `NavItem[]` | Dropdown children                       |
| `activeMatch` | `string`    | Regex pattern for active state matching |

Set `nav: 'auto'` to generate one nav item per non-isolated top-level section.

## Feature

Explicit feature card for the home page. Replaces the auto-generated cards derived from top-level sections.

```ts
features: [
  {
    title: 'Getting Started',
    description: 'Set up zpress and create your first site.',
    link: '/getting-started',
    icon: 'pixelarticons:speed-fast',
  },
]
```

| Field         | Type         | Description                                                     |
| ------------- | ------------ | --------------------------------------------------------------- |
| `title`       | `string`     | Card title                                                      |
| `description` | `string`     | Short description below title                                   |
| `link`        | `string`     | Click target URL                                                |
| `icon`        | `IconConfig` | Iconify identifier or `{ id: IconId, color: IconColor }` object |

## OpenAPIConfig

Configuration for OpenAPI spec integration.

| Field    | Type     | Default           | Description                           |
| -------- | -------- | ----------------- | ------------------------------------- |
| `spec`   | `string` | (required)        | Path to `openapi.json` from repo root |
| `prefix` | `string` | (required)        | URL prefix for API operation pages    |
| `title`  | `string` | `'API Reference'` | Sidebar group title                   |
