---
title: Scaling
description: How to evolve your documentation structure as your project grows.
---

# Scaling Your Docs

Documentation structure that works for a 5-page site doesn't work for a 500-page site. This page covers how to evolve your layout as your project grows.

## Stage 1: Single project, small team

Start minimal. You probably have a README and a few docs.

```
docs/
├── getting-started.md
├── guides/
│   └── deployment.md
└── reference/
    └── configuration.md
```

```ts
sections: [
  { title: 'Getting Started', link: '/getting-started', from: 'docs/getting-started.md' },
  {
    title: 'Guides',
    prefix: '/guides',
    from: 'docs/guides/*.md',
    titleFrom: 'heading',
  },
  {
    title: 'Reference',
    prefix: '/reference',
    from: 'docs/reference/*.md',
    titleFrom: 'heading',
  },
]
```

At this stage, auto-discovery with globs handles most of the work. New files show up automatically.

## Stage 2: Growing docs, more types

As the project matures, you'll find yourself writing conceptual docs, standards, and troubleshooting pages. Add sections for them.

```
docs/
├── getting-started/
│   ├── intro.md
│   └── quick-start.md
├── guides/
├── concepts/
├── reference/
├── standards/
└── troubleshooting/
```

```ts
sections: [
  {
    title: 'Getting Started',
    prefix: '/getting-started',
    items: [
      { title: 'Introduction', link: '/getting-started/intro', from: 'docs/getting-started/intro.md' },
      { title: 'Quick Start', link: '/getting-started/quick-start', from: 'docs/getting-started/quick-start.md' },
    ],
  },
  {
    title: 'Guides',
    prefix: '/guides',
    from: 'docs/guides/*.md',
    titleFrom: 'heading',
    sort: 'alpha',
  },
  {
    title: 'Concepts',
    prefix: '/concepts',
    from: 'docs/concepts/**/*.md',
    titleFrom: 'heading',
    recursive: true,
    sort: 'alpha',
  },
  {
    title: 'Reference',
    prefix: '/reference',
    from: 'docs/reference/**/*.md',
    titleFrom: 'heading',
    recursive: true,
    sort: 'alpha',
  },
  {
    title: 'Standards',
    prefix: '/standards',
    from: 'docs/standards/**/*.md',
    titleFrom: 'heading',
    recursive: true,
    sort: 'alpha',
  },
  {
    title: 'Troubleshooting',
    prefix: '/troubleshooting',
    from: 'docs/troubleshooting/*.md',
    titleFrom: 'heading',
    sort: 'alpha',
  },
]
```

Key changes:

- **Getting Started** becomes a section with multiple pages (intro + quickstart)
- **Concepts** and **Standards** get their own sections instead of living in Guides
- **`recursive: true`** enables nested subdirectories as sidebar groups

## Stage 3: Monorepo with workspaces

When your repo has multiple apps and packages, each workspace gets its own docs directory. Use isolated sections to give each workspace a focused sidebar.

```
apps/
├── api/
│   └── docs/
│       ├── overview.md
│       └── endpoints/
├── web/
│   └── docs/
packages/
├── auth/
│   └── docs/
├── database/
│   └── docs/
docs/
├── getting-started/
├── guides/
├── concepts/
├── reference/
├── standards/
└── troubleshooting/
```

```ts
sections: [
  // ... shared sections from Stage 2 ...

  {
    title: 'Apps',
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
    link: '/packages',
    isolated: true,
    items: [
      {
        title: 'Auth',
        link: '/packages/auth/overview',
        prefix: '/packages/auth',
        from: 'packages/auth/docs/**/*.md',
        recursive: true,
        titleFrom: 'heading',
        sort: 'alpha',
      },
      {
        title: 'Database',
        link: '/packages/database/overview',
        prefix: '/packages/database',
        from: 'packages/database/docs/**/*.md',
        recursive: true,
        titleFrom: 'heading',
        sort: 'alpha',
      },
    ],
  },
]
```

Key changes:

- **Workspace docs live next to the code** — `apps/api/docs/`, not `docs/apps/api/`
- **Isolated sidebars** keep workspace navigation separate from shared docs
- **Shared sections** (Guides, Concepts, Standards) remain for cross-cutting concerns

## Patterns that scale

### Auto-discovery over explicit lists

As you add more docs, maintaining explicit `items` arrays becomes tedious. Lean on globs:

```ts
// Instead of listing every guide manually:
from: 'docs/guides/*.md',
titleFrom: 'heading',
sort: 'alpha',
```

### Recursive directories for deep content

When a topic needs sub-grouping, use directories and `recursive: true`:

```
docs/concepts/
├── auth/
│   ├── overview.md
│   ├── oauth.md
│   └── api-keys.md
└── data/
    ├── overview.md
    └── migrations.md
```

Each directory becomes a collapsible sidebar group automatically.

### Landing pages for section entry points

Give each major section a landing page using `link` on the section:

```ts
{
  title: 'Concepts',
  link: '/concepts',
  prefix: '/concepts',
  from: 'docs/concepts/**/*.md',
}
```

The `link` page serves as an overview, orienting the reader before they dive into individual pages.

### Custom sort for intentional ordering

When alphabetical order doesn't tell the right story, use a custom comparator:

```ts
{
  title: 'Getting Started',
  prefix: '/getting-started',
  from: 'docs/getting-started/*.md',
  sort: (a, b) => {
    const order = { Introduction: 0, 'Quick Start': 1, 'Next Steps': 2 }
    return (order[a.text] ?? 99) - (order[b.text] ?? 99)
  },
}
```

## When to restructure

Signs your docs need a new stage:

- Contributors ask "where should I put this?" more than once
- Users can't find docs they know exist
- The sidebar is more than 3 scroll heights long
- You have docs that are half-guide, half-explanation

The fix is almost always the same: split a section into two, or promote a nested group into a top-level section.

## References

- [Recommended](/documentation-framework/recommended) — the full recommended layout
- [Types](/documentation-framework/types) — the seven doc types
- [Sections and Pages](/concepts/sections-and-pages) — zpress section configuration
- [Auto-Discovery](/concepts/auto-discovery) — glob patterns and sorting
