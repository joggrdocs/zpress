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
  sections: [{ title: 'Introduction', prefix: '/intro', from: 'docs/intro/*.md' }],
})
```

Configuration is loaded via [c12](https://github.com/unjs/c12), which supports `.ts`, `.js`, `.mjs`, and `.json` formats.

## Top-level fields

| Field         | Type                       | Default    | Description                                                                                    |
| ------------- | -------------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `title`       | `string`                   | —          | Site title shown in browser tab and home page                                                  |
| `description` | `string`                   | —          | Meta description and home page hero headline                                                   |
| `tagline`     | `string`                   | —          | Hero tagline below the headline on the home page                                               |
| `sections`    | `Section[]`                | (required) | Information architecture tree                                                                  |
| `nav`         | `'auto' \| NavItem[]`      | `'auto'`   | Top navigation bar                                                                             |
| `theme`       | `ThemeConfig`              | —          | Theme configuration (name, color mode, color overrides)                                        |
| `features`    | `Feature[]`                | —          | Explicit home page feature cards (replaces auto-gen)                                           |
| `actions`     | `HeroAction[]`             | —          | Home page hero call-to-action buttons                                                          |
| `seo`         | `SeoConfig`                | —          | SEO meta tag configuration                                                                     |
| `sidebar`     | `SidebarConfig`            | —          | Persistent links above/below the sidebar nav tree                                              |
| `apps`        | `Workspace[]`              | —          | Monorepo app metadata for home/landing pages                                                   |
| `packages`    | `Workspace[]`              | —          | Monorepo package metadata for home/landing pages                                               |
| `workspaces`  | `WorkspaceCategory[]`      | —          | Custom named groups of workspace items                                                         |
| `openapi`     | `OpenAPIConfig`            | —          | OpenAPI spec integration for interactive API docs                                              |
| `exclude`     | `string[]`                 | —          | Glob patterns excluded globally across all sources                                             |
| `icon`        | `string`                   | —          | Path to a custom favicon served from `.zpress/public/`. Defaults to auto-generated `/icon.svg` |

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

### Section fields

| Field            | Type                                                    | Description                                     |
| ---------------- | ------------------------------------------------------- | ----------------------------------------------- |
| `title`          | `TitleConfig`                                           | Display name or derived title config            |
| `link`           | `string`                                                | Output URL path                                 |
| `from`           | `string`                                                | Source file path or glob pattern                |
| `prefix`         | `string`                                                | URL prefix for glob-discovered children         |
| `content`        | `string \| (() => string \| Promise<string>)`           | Inline or generated markdown content            |
| `items`          | `Section[]`                                             | Explicit child entries                          |
| `landing`        | `'auto' \| 'cards' \| 'overview' \| false`              | Landing page generation mode                    |
| `collapsible`    | `boolean`                                               | Make sidebar section collapsible                |
| `exclude`        | `string[]`                                              | Exclude globs scoped to this entry              |
| `hidden`         | `boolean`                                               | Hide from sidebar (page still routable)         |
| `frontmatter`    | `Frontmatter`                                           | Injected YAML frontmatter                       |
| `sort`           | `'default' \| 'alpha' \| 'filename' \| comparator`     | Sort order for discovered children              |
| `recursive`      | `boolean`                                               | Directory-based nesting for recursive globs     |
| `indexFile`      | `string`                                                | Section header filename (default: `"overview"`) |
| `icon`           | `IconConfig`                                            | Icon for cards and landing pages                |
| `card`           | `CardConfig`                                            | Landing page card metadata                      |
| `isolated`       | `boolean`                                               | Separate sidebar namespace (requires `link`)    |

`TitleConfig` is either a plain `string` or `{ from: 'auto' | 'filename' | 'heading' | 'frontmatter', transform?: (text, slug) => string }` for derived titles.

The `'default'` sort strategy pins intro files (`introduction`, `intro`, `overview`, `readme`) to the top, then sorts alphabetically. This is the implicit default when `sort` is omitted.

**Deprecated fields** (still accepted, will be removed in a future release):

| Field            | Replacement                                  |
| ---------------- | -------------------------------------------- |
| `titleFrom`      | `title: { from: '...' }`                    |
| `titleTransform` | `title: { from: '...', transform: fn }`     |

## Workspace

Metadata for monorepo apps and packages. Drives home page cards, landing page cards, and introduction content.

```ts
{
  title: 'API',
  icon: { id: 'devicon:hono', color: 'blue' },
  description: 'REST API with typed routes',
  tags: ['hono', 'typescript'],
  prefix: '/apps/api',
  discovery: {
    from: 'docs/*.md',
    title: { from: 'auto' },
    sort: 'alpha',
  },
}
```

| Field         | Type                           | Required | Description                                                     |
| ------------- | ------------------------------ | -------- | --------------------------------------------------------------- |
| `title`       | `TitleConfig`                  | yes      | Display name or derived title config                            |
| `icon`        | `IconConfig`                   | no       | Iconify identifier or `{ id: IconId, color: IconColor }` object |
| `description` | `string`                       | yes      | Short description for cards                                     |
| `tags`        | `string[]`                     | no       | Technology tags (kebab-case)                                    |
| `badge`       | `{ src: string; alt: string }` | no       | Deploy badge image                                              |
| `prefix`      | `string`                       | yes      | URL prefix for this workspace's documentation                   |
| `discovery`   | `Discovery`                    | no       | Content discovery config (glob, title, sort, etc.)              |
| `items`       | `Section[]`                    | no       | Explicit child sections                                         |
| `openapi`     | `OpenAPIConfig`                | no       | OpenAPI spec integration for this workspace                     |

The `discovery` field accepts the same auto-discovery options documented in `DiscoveryConfig`: `from`, `title`, `sort`, `exclude`, `frontmatter`, `recursive`, and `indexFile`.

## WorkspaceCategory

Custom named groups beyond the built-in `apps` and `packages`. Each group receives the same card and landing page treatment.

```ts
{
  title: 'Integrations',
  description: 'Third-party service connectors',
  icon: 'pixelarticons:integration',
  items: [
    { title: 'Stripe', description: 'Payment processing', prefix: '/integrations/stripe' },
  ],
}
```

| Field         | Type            | Required | Description                                                     |
| ------------- | --------------- | -------- | --------------------------------------------------------------- |
| `title`       | `TitleConfig`   | yes      | Group display name                                              |
| `description` | `string`        | yes      | Short description                                               |
| `icon`        | `string`        | yes      | Iconify identifier                                              |
| `items`       | `Workspace[]`   | yes      | Workspace items in this group                                   |
| `link`        | `string`        | no       | URL prefix override (defaults to `/${slugify(title)}`)          |

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

| Field         | Type          | Description                                                     |
| ------------- | ------------- | --------------------------------------------------------------- |
| `title`       | `TitleConfig` | Card title (string or derived title config)                     |
| `description` | `string`      | Short description below title                                   |
| `link`        | `string`      | Click target URL                                                |
| `icon`        | `string`      | Iconify identifier                                              |

## OpenAPIConfig

Configuration for OpenAPI spec integration.

| Field           | Type                       | Default          | Description                                    |
| --------------- | -------------------------- | ---------------- | ---------------------------------------------- |
| `spec`          | `string`                   | (required)       | Path to `openapi.json` from repo root          |
| `prefix`        | `string`                   | (required)       | URL prefix for API operation pages             |
| `title`         | `string`                   | `'API Reference'`| Sidebar group title                            |
| `sidebarLayout` | `'method-path' \| 'title'` | `'method-path'`  | How operations appear in the sidebar           |

`sidebarLayout` controls how API operations are displayed in the sidebar:
- `'method-path'` — shows `GET /users` with method badge and path in code font
- `'title'` — shows the operation summary (e.g., "List Users")

## HeroAction

A call-to-action button on the home page hero section.

```ts
actions: [
  { theme: 'brand', text: 'Get Started', link: '/getting-started/quick-start' },
  { theme: 'alt', text: 'View on GitHub', link: 'https://github.com/...' },
]
```

| Field   | Type               | Description                    |
| ------- | ------------------ | ------------------------------ |
| `theme` | `'brand' \| 'alt'` | Button style variant           |
| `text`  | `string`           | Button label                   |
| `link`  | `string`           | Click target URL               |

## SidebarConfig

Persistent links rendered above or below the sidebar navigation tree.

```ts
sidebar: {
  above: [
    { text: 'Home', link: '/', icon: 'pixelarticons:home' },
  ],
  below: [
    { text: 'GitHub', link: 'https://github.com/...', icon: 'pixelarticons:github' },
  ],
}
```

| Field   | Type             | Description                          |
| ------- | ---------------- | ------------------------------------ |
| `above` | `SidebarLink[]`  | Links rendered above the nav tree    |
| `below` | `SidebarLink[]`  | Links rendered below the nav tree    |

Each `SidebarLink` has:

| Field  | Type         | Required | Description               |
| ------ | ------------ | -------- | ------------------------- |
| `text` | `string`     | yes      | Link display text         |
| `link` | `string`     | yes      | Target URL                |
| `icon` | `IconConfig` | no       | Iconify icon identifier   |

## SeoConfig

SEO meta tag configuration for social sharing and search engines.

| Field         | Type                                                        | Description              |
| ------------- | ----------------------------------------------------------- | ------------------------ |
| `title`       | `string`                                                    | Override the page title  |
| `description` | `string`                                                    | Meta description         |
| `image`       | `string`                                                    | Open Graph image URL     |
| `siteName`    | `string`                                                    | Open Graph site name     |
| `locale`      | `string`                                                    | Locale (e.g. `"en_US"`) |
| `twitterCard` | `'summary' \| 'summary_large_image' \| 'app' \| 'player'`  | Twitter card type        |
