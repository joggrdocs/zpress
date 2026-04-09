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
  sections: [{ title: 'Introduction', path: '/intro', include: 'docs/intro/*.md' }],
})
```

Configuration is loaded via [c12](https://github.com/unjs/c12), which supports `.ts`, `.js`, `.mjs`, and `.json` formats.

## Top-level fields

| Field         | Type                  | Default    | Description                                                                                    |
| ------------- | --------------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `title`       | `string`              | —          | Site title shown in browser tab and home page                                                  |
| `description` | `string`              | —          | Meta description and home page hero headline                                                   |
| `tagline`     | `string`              | —          | Hero tagline below the headline on the home page                                               |
| `sections`    | `Section[]`           | (required) | Information architecture tree                                                                  |
| `nav`         | `'auto' \| NavItem[]` | `'auto'`   | Top navigation bar                                                                             |
| `theme`       | `ThemeConfig`         | —          | Theme configuration (name, color mode, color overrides)                                        |
| `features`    | `Feature[]`           | —          | Explicit home page feature cards (replaces auto-gen)                                           |
| `actions`     | `HeroAction[]`        | —          | Home page hero call-to-action buttons                                                          |
| `sidebar`     | `SidebarConfig`       | —          | Persistent links above/below the sidebar nav tree                                              |
| `workspaces`  | `WorkspaceCategory[]` | —          | Named groups of workspace items for home/landing pages                                         |
| `openapi`     | `OpenAPIConfig`       | —          | OpenAPI spec integration for interactive API docs                                              |
| `exclude`     | `string[]`            | —          | Glob patterns excluded globally across all sources                                             |
| `home`        | `HomeConfig`          | —          | Home page grid layout for features and workspaces                                              |
| `socialLinks` | `SocialLink[]`        | —          | Social media links displayed in the navigation bar                                             |
| `footer`      | `FooterConfig`        | —          | Footer message, copyright text, and social link visibility                                     |
| `icon`        | `string`              | —          | Path to a custom favicon served from `.zpress/public/`. Defaults to auto-generated `/icon.svg` |

## Entry

Each node in `sections` is a `Section`. What you provide determines what it is:

**Page — single file:**

```ts
{ title: 'Architecture', path: '/architecture', include: 'docs/architecture.md' }
```

**Page — inline content:**

```ts
{ title: 'Overview', path: '/overview', content: '# Overview\nProject overview content.' }
```

**Page — async content generator:**

```ts
{ title: 'Status', path: '/status', content: async () => fetchStatus() }
```

**Section — explicit children:**

```ts
{
  title: 'Guides',
  items: [
    { title: 'Quick Start', path: '/guides/quick-start', include: 'docs/guides/quick-start.md' },
    { title: 'Deployment', path: '/guides/deployment', include: 'docs/guides/deployment.md' },
  ],
}
```

**Section — auto-discovered from glob:**

```ts
{ title: 'Guides', path: '/guides', include: 'docs/guides/*.md' }
```

### Section fields

| Field         | Type                                               | Description                                     |
| ------------- | -------------------------------------------------- | ----------------------------------------------- |
| `title`       | `TitleConfig`                                      | Display name or derived title config            |
| `path`        | `string`                                           | Output URL path                                 |
| `include`     | `string \| string[]`                               | Source file path(s) or glob pattern(s)          |
| `content`     | `string \| (() => string \| Promise<string>)`      | Inline or generated markdown content            |
| `items`       | `Section[]`                                        | Explicit child entries                          |
| `landing`     | `boolean`                                          | Enable/disable landing page generation          |
| `collapsible` | `boolean`                                          | Make sidebar section collapsible                |
| `exclude`     | `string[]`                                         | Exclude globs scoped to this entry              |
| `hidden`      | `boolean`                                          | Hide from sidebar (page still routable)         |
| `frontmatter` | `Frontmatter`                                      | Injected YAML frontmatter                       |
| `sort`        | `'default' \| 'alpha' \| 'filename' \| comparator` | Sort order for discovered children              |
| `recursive`   | `boolean`                                          | Directory-based nesting for recursive globs     |
| `entryFile`   | `string`                                           | Section header filename (default: `"overview"`) |
| `icon`        | `IconConfig`                                       | Icon for cards and landing pages                |
| `card`        | `CardConfig`                                       | Landing page card metadata                      |
| `standalone`  | `boolean`                                          | Separate sidebar namespace (requires `path`)    |

`TitleConfig` is either a plain `string` or `{ from: 'auto' | 'filename' | 'heading' | 'frontmatter', transform?: (text, slug) => string }` for derived titles.

`IconConfig` is either a plain Iconify identifier string (e.g. `'devicon:hono'`) or an object `{ id: string, color: string }` for explicit color control. See [Icon Colors](/reference/icons/colors) for available color values.

The `sort` field accepts `'default'`, `'alpha'`, `'filename'`, or a custom comparator function with the signature `(a: ResolvedPage, b: ResolvedPage) => number` where each `ResolvedPage` has `title`, `link`, and `frontmatter` properties. The `'default'` strategy pins intro files (`introduction`, `intro`, `overview`, `readme`) to the top, then sorts alphabetically. This is the implicit default when `sort` is omitted.

## Workspace

Metadata for a monorepo app or package. Drives home page cards, landing page cards, and introduction content. Workspaces are grouped under `WorkspaceCategory` entries in the top-level `workspaces` array.

```ts
{
  title: 'API',
  icon: { id: 'devicon:hono', color: 'blue' },
  description: 'REST API with typed routes',
  tags: ['hono', 'typescript'],
  path: '/apps/api',
  include: 'docs/*.md',
  sort: 'alpha',
}
```

| Field         | Type                                               | Required | Description                                                     |
| ------------- | -------------------------------------------------- | -------- | --------------------------------------------------------------- |
| `title`       | `TitleConfig`                                      | yes      | Display name or derived title config                            |
| `icon`        | `IconConfig`                                       | no       | Iconify identifier or `{ id: IconId, color: IconColor }` object |
| `description` | `string`                                           | yes      | Short description for cards                                     |
| `tags`        | `string[]`                                         | no       | Technology tags (kebab-case)                                    |
| `badge`       | `{ src: string; alt: string }`                     | no       | Deploy badge image                                              |
| `path`        | `string`                                           | yes      | URL prefix for this workspace's documentation                   |
| `include`     | `string \| string[]`                               | no       | Source file path(s) or glob pattern(s) for content discovery    |
| `sort`        | `'default' \| 'alpha' \| 'filename' \| comparator` | no       | Sort order for discovered content                               |
| `exclude`     | `string[]`                                         | no       | Glob patterns excluded from discovery                           |
| `recursive`   | `boolean`                                          | no       | Directory-based nesting for recursive globs                     |
| `entryFile`   | `string`                                           | no       | Section header filename (default: `"overview"`)                 |
| `frontmatter` | `Frontmatter`                                      | no       | Injected YAML frontmatter for all discovered pages              |
| `items`       | `Section[]`                                        | no       | Explicit child sections                                         |
| `openapi`     | `OpenAPIConfig`                                    | no       | OpenAPI spec integration for this workspace                     |

## WorkspaceCategory

Named groups of workspace items. Each category receives card and landing page treatment on the home page.

```ts
{
  title: 'Integrations',
  description: 'Third-party service connectors',
  icon: 'pixelarticons:integration',
  items: [
    { title: 'Stripe', description: 'Payment processing', path: '/integrations/stripe' },
  ],
}
```

| Field         | Type          | Required | Description                                            |
| ------------- | ------------- | -------- | ------------------------------------------------------ |
| `title`       | `TitleConfig` | yes      | Group display name                                     |
| `description` | `string`      | no       | Short description                                      |
| `icon`        | `string`      | yes      | Iconify identifier                                     |
| `items`       | `Workspace[]` | yes      | Workspace items in this group                          |
| `link`        | `string`      | no       | URL prefix override (defaults to `/${slugify(title)}`) |

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
  { title: 'Guides', link: '/guides/deploying-to-vercel' },
  { title: 'API', link: '/api/overview' },
]
```

| Field         | Type        | Description                             |
| ------------- | ----------- | --------------------------------------- |
| `title`       | `string`    | Display text                            |
| `link`        | `string`    | Target URL path                         |
| `items`       | `NavItem[]` | Dropdown children                       |
| `activeMatch` | `string`    | Regex pattern for active state matching |

Set `nav: 'auto'` to generate one nav item per non-standalone top-level section.

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

| Field         | Type          | Description                                 |
| ------------- | ------------- | ------------------------------------------- |
| `title`       | `TitleConfig` | Card title (string or derived title config) |
| `description` | `string`      | Short description below title               |
| `link`        | `string`      | Click target URL                            |
| `icon`        | `string`      | Iconify identifier                          |

## OpenAPIConfig

Configuration for OpenAPI spec integration.

| Field           | Type                       | Default           | Description                                              |
| --------------- | -------------------------- | ----------------- | -------------------------------------------------------- |
| `spec`          | `string`                   | (required)        | Path to OpenAPI JSON or YAML file, relative to repo root |
| `path`          | `string`                   | (required)        | URL prefix for API operation pages                       |
| `title`         | `string`                   | `'API Reference'` | Sidebar group title                                      |
| `sidebarLayout` | `'method-path' \| 'title'` | `'method-path'`   | How operations appear in the sidebar                     |

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

| Field   | Type               | Description          |
| ------- | ------------------ | -------------------- |
| `theme` | `'brand' \| 'alt'` | Button style variant |
| `text`  | `string`           | Button label         |
| `link`  | `string`           | Click target URL     |

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

| Field   | Type            | Description                       |
| ------- | --------------- | --------------------------------- |
| `above` | `SidebarLink[]` | Links rendered above the nav tree |
| `below` | `SidebarLink[]` | Links rendered below the nav tree |

Each `SidebarLink` has:

| Field   | Type                                | Required | Description             |
| ------- | ----------------------------------- | -------- | ----------------------- |
| `text`  | `string`                            | yes      | Link display text       |
| `link`  | `string`                            | yes      | Target URL              |
| `icon`  | `IconConfig`                        | no       | Iconify icon identifier |
| `style` | `'brand' \| 'alt' \| 'ghost'`       | no       | Visual style variant    |
| `shape` | `'square' \| 'rounded' \| 'circle'` | no       | Icon shape              |

## HomeConfig

Layout and styling options for the home page card grids.

```ts
home: {
  features: { columns: 3, truncate: { description: 2 } },
  workspaces: { columns: 2, truncate: { title: 1, description: 2 } },
}
```

| Field        | Type             | Description                        |
| ------------ | ---------------- | ---------------------------------- |
| `features`   | `HomeGridConfig` | Layout options for feature cards   |
| `workspaces` | `HomeGridConfig` | Layout options for workspace cards |

Each `HomeGridConfig` has:

| Field      | Type               | Description                                     |
| ---------- | ------------------ | ----------------------------------------------- |
| `columns`  | `1 \| 2 \| 3 \| 4` | Number of grid columns                          |
| `truncate` | `TruncateConfig`   | Max visible lines before clipping with ellipsis |

`TruncateConfig` accepts `title?: number` and `description?: number` for line-clamp values.

## SocialLink

Social media links displayed in the navigation bar.

```ts
socialLinks: [
  { icon: 'github', mode: 'link', content: 'https://github.com/acme' },
  { icon: 'discord', mode: 'link', content: 'https://discord.gg/acme' },
]
```

| Field     | Type                                 | Required | Description                                          |
| --------- | ------------------------------------ | -------- | ---------------------------------------------------- |
| `icon`    | `SocialLinkIcon \| { svg: string }`  | yes      | Built-in icon name or custom SVG                     |
| `mode`    | `'link' \| 'text' \| 'img' \| 'dom'` | yes      | How the content is rendered                          |
| `content` | `string`                             | yes      | URL, text, image source, or HTML depending on `mode` |

Built-in icon names: `github`, `discord`, `x`, `slack`, `linkedin`, `youtube`, `npm`, `gitlab`, `bluesky`, `facebook`, `instagram`.

## FooterConfig

Footer displayed below all page content.

```ts
footer: {
  message: 'Built with zpress',
  copyright: 'Copyright © 2025 Acme Inc.',
  socials: true,
}
```

| Field       | Type      | Description                                        |
| ----------- | --------- | -------------------------------------------------- |
| `message`   | `string`  | Footer message text                                |
| `copyright` | `string`  | Copyright notice                                   |
| `socials`   | `boolean` | Show social links from `socialLinks` in the footer |
