---
title: Recommended
description: The recommended section layout for a zpress documentation site.
---

# Recommended Layout

This is the section structure we recommend for most projects. It maps each doc type to a clear section in the sidebar.

## The layout

```ts
import { defineConfig } from '@zpress/kit'

export default defineConfig({
  sections: [
    // Onboarding — tutorials and quickstarts
    {
      title: 'Getting Started',
      icon: 'pixelarticons:speed-fast',
      prefix: '/getting-started',
      items: [
        { title: 'Introduction', link: '/getting-started/intro', from: 'docs/getting-started/intro.md' },
        { title: 'Quick Start', link: '/getting-started/quick-start', from: 'docs/getting-started/quick-start.md' },
      ],
    },

    // Task-oriented how-tos
    {
      title: 'Guides',
      icon: 'pixelarticons:article',
      prefix: '/guides',
      from: 'docs/guides/*.md',
      titleFrom: 'heading',
      sort: 'alpha',
    },

    // Conceptual explanations
    {
      title: 'Concepts',
      icon: 'pixelarticons:label',
      prefix: '/concepts',
      from: 'docs/concepts/**/*.md',
      titleFrom: 'heading',
      recursive: true,
      sort: 'alpha',
    },

    // API, config, CLI reference
    {
      title: 'Reference',
      icon: 'pixelarticons:list-box',
      prefix: '/reference',
      from: 'docs/reference/**/*.md',
      titleFrom: 'heading',
      recursive: true,
      sort: 'alpha',
    },

    // Rules and conventions
    {
      title: 'Standards',
      icon: 'pixelarticons:clipboard',
      prefix: '/standards',
      from: 'docs/standards/**/*.md',
      titleFrom: 'heading',
      recursive: true,
      sort: 'alpha',
    },

    // Common problems and fixes
    {
      title: 'Troubleshooting',
      icon: 'pixelarticons:alert',
      prefix: '/troubleshooting',
      from: 'docs/troubleshooting/*.md',
      titleFrom: 'heading',
      sort: 'alpha',
    },
  ],
})
```

## Section-to-type mapping

| Section           | Doc types                | Directory            |
| ----------------- | ------------------------ | -------------------- |
| Getting Started   | Tutorials, Quickstarts   | `docs/getting-started/` |
| Guides            | Guides                   | `docs/guides/`       |
| Concepts          | Explanations             | `docs/concepts/`     |
| Reference         | Reference                | `docs/reference/`    |
| Standards         | Standards                | `docs/standards/`    |
| Troubleshooting   | Troubleshooting, Runbooks | `docs/troubleshooting/` |

## Monorepo additions

For monorepos with multiple apps or packages, add isolated sections for each workspace:

```ts
{
  title: 'Apps',
  icon: 'pixelarticons:device-laptop',
  link: '/apps',
  isolated: true,
  items: [
    {
      title: 'API',
      link: '/apps/api/overview',
      prefix: '/apps/api',
      from: 'apps/api/docs/**/*.md',
      recursive: true,
      titleFrom: 'heading',
      sort: 'alpha',
    },
    {
      title: 'Web',
      link: '/apps/web/overview',
      prefix: '/apps/web',
      from: 'apps/web/docs/**/*.md',
      recursive: true,
      titleFrom: 'heading',
      sort: 'alpha',
    },
  ],
},
{
  title: 'Packages',
  icon: 'pixelarticons:archive',
  link: '/packages',
  isolated: true,
  items: [
    {
      title: 'UI',
      link: '/packages/ui/overview',
      prefix: '/packages/ui',
      from: 'packages/ui/docs/**/*.md',
      recursive: true,
      titleFrom: 'heading',
      sort: 'alpha',
    },
  ],
},
```

Using `isolated: true` gives each app or package its own sidebar, keeping navigation focused.

## File structure

The recommended directory layout mirrors the sections:

```
docs/
├── getting-started/
│   ├── intro.md
│   └── quick-start.md
├── guides/
│   ├── add-a-plugin.md
│   ├── configure-ci.md
│   └── deploy-to-vercel.md
├── concepts/
│   ├── authentication.md
│   └── data-flow.md
├── reference/
│   ├── configuration.md
│   ├── cli.md
│   └── api/
│       ├── overview.md
│       └── endpoints.md
├── standards/
│   ├── typescript.md
│   └── git-commits.md
└── troubleshooting/
    └── deployments.md
```

## Adapting the layout

Not every project needs all sections. Start with what you have:

| Project size | Recommended sections                                |
| ------------ | --------------------------------------------------- |
| Small        | Getting Started, Reference                          |
| Medium       | Getting Started, Guides, Concepts, Reference        |
| Large        | All sections                                        |
| Monorepo     | All sections + isolated Apps/Packages               |

Add sections as your docs grow. Removing an empty section is easier than reorganizing a flat pile of docs later.

## References

- [Overview](/documentation-framework/overview) — why this framework exists
- [Types](/documentation-framework/types) — the seven doc types in detail
- [Scaling](/documentation-framework/scaling) — how the layout evolves over time
- [Sections and Pages](/concepts/sections-and-pages) — zpress section configuration
