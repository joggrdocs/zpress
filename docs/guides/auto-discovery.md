---
title: Auto-Discovery
description: Use glob patterns to automatically discover and organize documentation pages.
---

# Auto-Discovery

Glob patterns let you add pages without updating the config every time a new file is created.

## Basic glob

```ts
{
  text: 'Guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
}
```

`prefix` is required with globs. Each matched file gets the URL `prefix + "/" + slug`.

## Text derivation

Control how page titles are derived from discovered files with `textFrom`:

| Strategy        | Source                             | Example                                         |
| --------------- | ---------------------------------- | ----------------------------------------------- |
| `'filename'`    | Filename converted to title        | `add-api-route.md` → "Add Api Route"            |
| `'heading'`     | First `# heading` in the file      | `# Adding an API Route` → "Adding an API Route" |
| `'frontmatter'` | `title` field in YAML front matter | `title: API Routes` → "API Routes"              |

Default is `'filename'`. Each strategy falls back to the next: frontmatter → heading → filename.

```ts
{
  text: 'Guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
  textFrom: 'frontmatter',
}
```

## Text transform

Apply a custom transform to derived text:

```ts
{
  text: 'ADRs',
  prefix: '/adrs',
  from: 'docs/adrs/*.md',
  textTransform: (text, slug) => slug.replace(/^(\d+)-/, '$1. '),
}
```

This only applies to auto-discovered children. Entries with explicit `text` are not transformed.

## Sorting

| Strategy      | Behavior                            |
| ------------- | ----------------------------------- |
| `'alpha'`     | Alphabetical by derived text        |
| `'filename'`  | Alphabetical by filename            |
| `(a, b) => n` | Custom comparator on `ResolvedPage` |

When `sort` is omitted, entries appear in glob discovery order.

```ts
{
  text: 'ADRs',
  prefix: '/adrs',
  from: 'docs/adrs/*.md',
  sort: 'filename',
}
```

## Excluding files

Exclude specific files from a glob match:

```ts
{
  text: 'Guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
  exclude: ['**/draft-*.md', '**/internal/**'],
}
```

Global excludes in the top-level `exclude` field apply to all sections.

## Deduplication

When combining `items` with `from`, explicit entries win. If an explicit entry has the same slug as a glob-discovered file, the glob match is dropped.

## References

- [Configuration — Entry fields](/reference/configuration#entry-fields)
- [Sections and pages](/guides/sections-and-pages)
