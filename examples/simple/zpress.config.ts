import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'my-lib',
  description: 'A simple utility library',
  tagline: 'Lightweight utilities for everyday TypeScript.',
  sections: [
    {
      text: 'Getting Started',
      link: '/getting-started',
      from: 'docs/getting-started.md',
      icon: 'pixelarticons:speed-fast',
    },
    {
      text: 'API Reference',
      link: '/api-reference',
      from: 'docs/api-reference.md',
      icon: 'pixelarticons:book-open',
    },
    {
      text: 'Guides',
      prefix: '/guides',
      from: 'docs/guides/*.md',
      icon: 'pixelarticons:article',
      textFrom: 'frontmatter',
      sort: 'alpha',
    },
  ],
  nav: 'auto',
})
