---
title: Frontmatter
description: Inject and inherit YAML frontmatter across pages.
---

# Frontmatter

zpress manages frontmatter automatically. Source files keep their original frontmatter, and zpress merges additional fields at build time.

## Injecting frontmatter

Set `frontmatter` on any entry to inject fields into the output page:

```ts
{
  text: 'Architecture',
  link: '/architecture',
  from: 'docs/architecture.md',
  frontmatter: {
    description: 'System architecture overview',
    aside: false,
  },
}
```

The source file is never modified. Frontmatter is merged into the synced copy.

## Inheritance

Frontmatter set on a section applies to all children:

```ts
{
  text: 'API Reference',
  frontmatter: { aside: 'left', editLink: false },
  items: [
    { text: 'Auth', link: '/api/auth', from: 'docs/api/auth.md' },
    { text: 'Users', link: '/api/users', from: 'docs/api/users.md' },
  ],
}
```

Both `auth.md` and `users.md` inherit `aside: 'left'` and `editLink: false`.

## Merge order

Fields are merged with this precedence (highest wins):

1. Source file frontmatter (what's already in the `.md` file)
2. Entry-level `frontmatter`
3. Inherited section `frontmatter`

A page's own frontmatter always takes precedence over inherited values.

## References

- [Frontmatter Fields reference](/reference/frontmatter) — complete field reference with types, defaults, and format details
