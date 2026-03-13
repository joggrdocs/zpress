import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'my-lib',
  description: 'A simple utility library',
  tagline: 'Lightweight utilities for everyday TypeScript.',
  sections: [
    {
      title: 'Getting Started',
      link: '/getting-started',
      from: 'docs/getting-started.md',
      icon: 'pixelarticons:speed-fast',
    },
    {
      title: 'API Reference',
      link: '/api-reference',
      from: 'docs/api-reference.md',
      icon: 'pixelarticons:book-open',
    },
    {
      title: 'Guides',
      prefix: '/guides',
      from: 'docs/guides/*.md',
      icon: 'pixelarticons:article',
      titleFrom: 'frontmatter',
      sort: 'alpha',
    },
  ],
  nav: 'auto',
})
