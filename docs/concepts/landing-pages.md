---
title: Landing Pages
description: How zpress auto-generates landing pages for sections and workspaces.
---

# Landing Pages

Sections with children but no explicit page source automatically get a generated landing page. These pages display cards linking to child entries.

## When landing pages generate

A landing page is created when a section has:

- A `link` field (defines the landing page URL)
- Child entries (via `items` or glob `from`)
- No `from` pointing to a single file (that would make it a regular page)

```ts
{
  title: 'Guides',
  link: '/guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
}
```

Navigating to `/guides` shows a landing page with cards for each discovered guide.

## Overview file promotion

When using `recursive: true`, the `indexFile` field controls which filename is promoted to the section header (default: `"overview"`). That file's content becomes the section's landing page instead of auto-generated cards.

To promote a different file, set `indexFile` to the filename without extension (e.g. `indexFile: 'index'` or `indexFile: 'readme'`):

```ts
{
  title: 'Reference',
  prefix: '/reference',
  from: 'docs/reference/**/*.md',
  recursive: true,
  indexFile: 'overview',
}
```

## Section cards

Sections without workspace metadata display simple cards. Each card shows:

- Entry name (from `title`)
- Description (from child page frontmatter `description`)
- Icon colors rotate automatically across cards

## Workspace cards

When workspace metadata (from `apps`, `packages`, or `workspaces`) matches a section by `prefix`, the landing page uses workspace-style cards. These show:

- Icon with color styling
- Scope label (e.g. `apps/`)
- Name and description
- Technology tag badges
- Optional deploy badge

See the [Workspaces guide](/concepts/workspaces) for workspace configuration.

## Controlling card content

Card descriptions are resolved in this order (highest priority first):

1. `card.description` on the entry
2. `description` from the entry's frontmatter
3. Auto-extracted description from the page content

```ts
{
  title: 'API Docs',
  link: '/api',
  from: 'docs/api/overview.md',
  card: {
    description: 'Complete API reference with examples',
    icon: 'pixelarticons:terminal',
  },
}
```

## References

- [Configuration reference — CardConfig](/references/configuration#cardconfig)
- [Workspaces guide](/concepts/workspaces)
