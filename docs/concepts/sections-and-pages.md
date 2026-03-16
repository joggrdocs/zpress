---
title: Sections and Pages
description: How to structure your documentation with sections and pages.
---

# Sections and Pages

The `sections` array defines your entire information architecture. Each entry is either a **page** or a **section** depending on what fields you provide.

## Pages

A page maps a source markdown file to a URL.

```ts
{
  title: 'Architecture',
  link: '/architecture',
  from: 'docs/architecture.md',
}
```

Pages can also use inline content instead of a file:

```ts
{
  title: 'Changelog',
  link: '/changelog',
  content: '# Changelog\n\nSee GitHub releases.',
}
```

Or generate content dynamically:

```ts
{
  title: 'Status',
  link: '/status',
  content: async () => {
    const data = await fetchStatus()
    return `# Status\n\n${data}`
  },
}
```

## Sections

A section groups pages under a collapsible sidebar heading.

### Explicit children

```ts
{
  title: 'Guides',
  items: [
    { title: 'Quick Start', link: '/guides/quick-start', from: 'docs/guides/quick-start.md' },
    { title: 'Deployment', link: '/guides/deployment', from: 'docs/guides/deployment.md' },
  ],
}
```

### Auto-discovered children

Use a glob pattern with `prefix` to discover pages automatically:

```ts
{
  title: 'Guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
}
```

Every `.md` file matching the glob becomes a child page. The URL is derived as `prefix + "/" + filename-slug`.

### Mixed

Combine explicit entries with auto-discovery. Explicit entries take precedence over glob matches with the same slug:

```ts
{
  title: 'Guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
  items: [
    { title: 'Start Here', link: '/guides/start', from: 'docs/intro.md' },
  ],
}
```

## Nesting

Sections can nest arbitrarily. Sections deeper than level 1 are collapsible by default:

```ts
{
  title: 'API',
  items: [
    {
      title: 'Authentication',
      items: [
        { title: 'OAuth', link: '/api/auth/oauth', from: 'docs/api/auth/oauth.md' },
        { title: 'API Keys', link: '/api/auth/keys', from: 'docs/api/auth/keys.md' },
      ],
    },
  ],
}
```

## Recursive directories

For large doc trees that mirror a directory structure, use `recursive: true`:

```ts
{
  title: 'Reference',
  prefix: '/reference',
  from: 'docs/reference/**/*.md',
  recursive: true,
  indexFile: 'overview',
}
```

This maps directory nesting to sidebar nesting. In each directory, the `indexFile` (default `"overview"`) becomes the section header page.

```
docs/reference/
├── overview.md          → Section header for /reference
├── auth/
│   ├── overview.md      → Section header for /reference/auth
│   ├── oauth.md         → /reference/auth/oauth
│   └── api-keys.md      → /reference/auth/api-keys
└── database/
    ├── overview.md      → Section header for /reference/database
    └── migrations.md    → /reference/database/migrations
```

## Isolated sidebars

By default all sections share one sidebar. Set `isolated: true` to give a section its own sidebar namespace:

```ts
{
  title: 'API Reference',
  link: '/api/',
  isolated: true,
  items: [
    { title: 'Auth', link: '/api/auth', from: 'docs/api/auth.md' },
    { title: 'Users', link: '/api/users', from: 'docs/api/users.md' },
  ],
}
```

When navigating to `/api/`, only that section's sidebar appears.

## References

- [Navigation guide](/concepts/navigation) — configuring the top navigation bar
