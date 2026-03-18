---
title: Auto-Discovery
description: Use glob patterns to automatically discover and organize documentation pages.
---

# Auto-Discovery

Glob patterns let you add pages without updating the config every time a new file is created.

## Basic glob

```ts
{
  title: 'Guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
}
```

`prefix` is required with globs. Each matched file gets the URL `prefix + "/" + slug`.

## Title derivation

Control how page titles are derived from discovered files with `titleFrom`:

| Strategy        | Source                             | Example                                         |
| --------------- | ---------------------------------- | ----------------------------------------------- |
| `'auto'`        | Fallback chain (default)           | Frontmatter → heading → filename                |
| `'filename'`    | Filename converted to title        | `add-api-route.md` → "Add Api Route"            |
| `'heading'`     | First `# heading` in the file      | `# Adding an API Route` → "Adding an API Route" |
| `'frontmatter'` | `title` field in YAML front matter | `title: API Routes` → "API Routes"              |

Default is `'auto'`, which tries frontmatter first, falls back to heading, then filename. This gives you the most intuitive behavior: explicit titles in frontmatter win, but markdown headings and filenames work too.

```ts
{
  title: 'Guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
  titleFrom: 'frontmatter',  // Only use frontmatter, no fallback
}
```

### Advanced: TitleConfig

You can also use the `title` field with a configuration object for more control:

```ts
{
  title: {
    from: 'auto',
    transform: (title, slug) => slug.replace(/^(\d+)-/, '$1. '),
  },
  prefix: '/adrs',
  from: 'docs/adrs/*.md',
}
```

This applies a custom transform to derived titles. The transform function receives the derived title and the filename slug, returning the final display title.

Transforms only apply to auto-discovered children. Sections with explicit `title` strings are not transformed.

## Sorting

| Strategy      | Behavior                                                              |
| ------------- | --------------------------------------------------------------------- |
| `'default'`   | Pins intro files (`introduction`, `intro`, `overview`, `readme`) to the top, then alpha |
| `'alpha'`     | Alphabetical by derived text                                          |
| `'filename'`  | Alphabetical by filename                                              |
| `(a, b) => n` | Custom comparator on `ResolvedPage`                                   |

When `sort` is omitted, the `'default'` strategy is used — intro files are pinned to the top, remaining entries are sorted alphabetically.

```ts
{
  title: 'ADRs',
  prefix: '/adrs',
  from: 'docs/adrs/*.md',
  sort: 'filename',
}
```

## Excluding files

Exclude specific files from a glob match:

```ts
{
  title: 'Guides',
  prefix: '/guides',
  from: 'docs/guides/*.md',
  exclude: ['**/draft-*.md', '**/internal/**'],
}
```

Global excludes in the top-level `exclude` field apply to all sections.

## Deduplication

When combining `items` with `from`, explicit entries win. If an explicit entry has the same slug as a glob-discovered file, the glob match is dropped.

## References

- [Configuration — Section fields](/references/configuration#section-fields)
- [Sections and pages](/concepts/sections-and-pages)
