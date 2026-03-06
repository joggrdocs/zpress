---
title: Dynamic Content
description: Generate pages from inline content, async functions, and hidden routes.
---

# Dynamic Content

Not all pages need a source markdown file. zpress supports inline content, async generators, and hidden pages for dynamic use cases.

## Inline content

Set `content` to a string to create a page without a source file:

```ts
{
  text: 'Changelog',
  link: '/changelog',
  content: '# Changelog\n\nAll notable changes are tracked in this document.',
}
```

The string is treated as markdown and processed the same as file-sourced pages.

## Async generators

Set `content` to an async function to generate page content at build time:

```ts
{
  text: 'Status',
  link: '/status',
  content: async () => {
    const res = await fetch('https://api.example.com/status')
    const data = await res.json()
    return `# System Status\n\nAll systems: **${data.status}**`
  },
}
```

The function runs during `sync` and its return value becomes the page content. Use this for:

- Changelogs pulled from an API
- Status pages with live data at build time
- Generated documentation from schemas or specs

## Frontmatter on virtual pages

Virtual pages (those using `content`) support injected frontmatter the same way as file-sourced pages:

```ts
{
  text: 'Generated API Docs',
  link: '/api/generated',
  content: async () => generateApiDocs(),
  frontmatter: {
    description: 'Auto-generated from OpenAPI spec',
    aside: false,
  },
}
```

## Hidden pages

Set `hidden: true` to build and route a page without showing it in the sidebar:

```ts
{
  text: 'Internal Notes',
  link: '/internal/notes',
  from: 'docs/internal/notes.md',
  hidden: true,
}
```

Hidden pages are still accessible by URL and can be linked to from other pages. Use this for:

- Pages linked from other content but not worth a sidebar entry
- Redirect targets
- Utility pages

## References

- [Configuration reference — Entry fields](/reference/configuration#entry-fields)
- [Sections and Pages guide](/guides/sections-and-pages)
