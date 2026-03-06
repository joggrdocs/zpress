---
title: Sidebar Icons
description: Add icons to sidebar sections using the icon rail.
---

# Sidebar Icons

Top-level sections can display icons in a vertical icon rail on the left side of the sidebar. This provides quick visual navigation between major documentation areas.

## Adding icons

Set the `icon` field on a top-level section entry:

```ts
{
  text: 'Guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
  icon: 'pixelarticons:book-open',
}
```

The `icon` value is an Iconify identifier in `prefix:name` format.

## Example

```ts
export default defineConfig({
  sections: [
    {
      text: 'Getting Started',
      icon: 'pixelarticons:speed-fast',
      link: '/getting-started',
      from: 'docs/getting-started.md',
    },
    {
      text: 'Guides',
      icon: 'pixelarticons:book-open',
      prefix: '/guides',
      from: 'docs/guides/*.md',
    },
    {
      text: 'API Reference',
      icon: 'pixelarticons:terminal',
      prefix: '/api',
      from: 'docs/api/**/*.md',
      recursive: true,
    },
    {
      text: 'Architecture',
      icon: 'pixelarticons:layout-sidebar',
      link: '/architecture',
      from: 'docs/architecture.md',
    },
  ],
})
```

## Behavior

- Icons only appear on top-level sections (depth 0). Nested sections ignore `icon`.
- Clicking an icon scrolls the sidebar to that section.
- Icons are resolved at build time using the Iconify API and inlined as SVGs.
