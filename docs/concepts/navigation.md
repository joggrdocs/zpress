---
title: Navigation
description: Configure the top navigation bar with auto-generation or explicit entries.
---

# Navigation

The top navigation bar provides quick access to major documentation areas. zpress supports automatic generation or explicit configuration.

## Auto navigation

Set `nav: 'auto'` (the default) to generate one nav item per non-isolated top-level section:

```ts
export default defineConfig({
  sections: [
    {
      title: 'Getting Started',
      link: '/getting-started',
      from: 'docs/getting-started.md',
    },
    {
      title: 'Guides',
      prefix: '/guides',
      from: 'docs/guides/*.md',
    },
    {
      title: 'Reference',
      prefix: '/reference',
      from: 'docs/reference/*.md',
    },
  ],
  nav: 'auto',
})
```

This produces three nav items: Getting Started, Guides, and Reference. Sections with `isolated: true` are excluded from auto-generated nav.

## Explicit navigation

Pass an array of `NavItem` objects for full control:

```ts
export default defineConfig({
  sections: [
    { title: 'Guides', prefix: '/guides', from: 'docs/guides/*.md' },
    { title: 'Reference', prefix: '/reference', from: 'docs/reference/*.md' },
  ],
  nav: [
    { title: 'Guides', link: '/guides/sections-and-pages' },
    { title: 'Reference', link: '/reference/configuration' },
  ],
})
```

## Dropdown menus

Nav items with `items` instead of `link` render as dropdown menus:

```ts
nav: [
  {
    title: 'API',
    items: [
      { title: 'REST API', link: '/api/rest' },
      { title: 'GraphQL', link: '/api/graphql' },
    ],
  },
]
```

## Isolated sections as dropdowns

Sections marked `isolated: true` get their own sidebar namespace. In auto nav mode, isolated sections are excluded from the main nav items. Use explicit nav if you want isolated sections represented as dropdowns.

## Active state

In auto mode, nav items highlight based on the current URL matching the section's link or prefix. For explicit nav, use `activeMatch` to control highlighting:

```ts
{ title: 'API', link: '/api/overview', activeMatch: '/api/' }
```

The `activeMatch` value is a regex pattern tested against the current URL path.

## References

- [Configuration reference — NavItem](/reference/configuration#navitem)
