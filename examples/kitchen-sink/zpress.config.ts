import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'Acme Platform',
  description: 'The Acme Monorepo Documentation',
  tagline: 'Everything you need to build, ship, and scale.',
  home: {
    features: { truncate: { description: 2 } },
    workspaces: { columns: 2, truncate: { title: 1, description: 2 } },
  },
  apps: [
    {
      title: 'Web',
      icon: 'devicon:nextjs',
      description: 'Next.js frontend application',
      tags: ['nextjs', 'react', 'typescript'],
      prefix: '/apps/web',
      discovery: {
        from: 'docs/*.md',
        title: { from: 'auto' },
        sort: 'alpha',
      },
    },
    {
      title: 'API',
      icon: 'logos:hono',
      description: 'Hono REST API with typed routes',
      tags: ['hono', 'typescript'],
      prefix: '/apps/api',
      openapi: {
        spec: 'apps/api/openapi.json',
        prefix: '/apps/api/reference',
        title: 'API Reference',
        sidebarLayout: 'method-path',
      },
    },
  ],
  packages: [
    {
      title: 'UI',
      icon: 'devicon:react',
      description: 'Shared React component library',
      tags: ['react', 'typescript'],
      prefix: '/packages/ui',
      discovery: {
        from: 'docs/*.md',
        title: { from: 'auto' },
        sort: 'alpha',
      },
    },
    {
      title: 'DB',
      icon: 'devicon:postgresql',
      description: 'Database client and schema definitions',
      tags: ['drizzle', 'postgresql'],
      prefix: '/packages/db',
      discovery: {
        from: 'docs/*.md',
        title: { from: 'auto' },
        sort: 'alpha',
      },
    },
    {
      title: 'Config',
      icon: 'devicon:typescript',
      description: 'Shared configuration and environment variables',
      tags: ['typescript'],
      prefix: '/packages/config',
      discovery: {
        from: 'docs/*.md',
        title: { from: 'auto' },
        sort: 'alpha',
      },
    },
  ],
  workspaces: [
    {
      title: 'Integrations',
      description: 'Third-party service connectors',
      icon: 'mdi:puzzle',
      items: [
        {
          title: 'Stripe',
          icon: 'logos:stripe',
          description: 'Payment processing and subscription management',
          tags: ['stripe', 'payments'],
          prefix: '/integrations/stripe',
          discovery: {
            from: 'docs/*.md',
            title: { from: 'auto' },
            sort: 'alpha',
          },
        },
      ],
    },
  ],
  sections: [
    {
      title: 'Getting Started',
      link: '/getting-started',
      from: 'docs/getting-started.md',
      icon: 'pixelarticons:speed-fast',
    },
    {
      title: 'Architecture',
      icon: 'pixelarticons:layout-header',
      link: '/architecture',
      from: 'docs/architecture.md',
    },
    {
      title: 'Guides',
      prefix: '/guides',
      from: 'docs/guides/*.md',
      icon: 'pixelarticons:book-open',
      titleFrom: 'frontmatter',
      sort: 'alpha',
    },
    {
      title: 'Contributing',
      icon: 'pixelarticons:git-merge',
      items: [
        {
          title: 'Overview',
          link: '/contributing',
          from: 'contributing/README.md',
        },
        {
          title: 'Guides',
          prefix: '/contributing/guides',
          from: 'contributing/guides/*.md',
          titleFrom: 'frontmatter',
          sort: 'alpha',
        },
      ],
    },
  ],
  sidebar: {
    above: [
      { text: 'Home', link: '/', icon: 'pixelarticons:home' },
      { text: 'Brand Square', link: '/', icon: 'pixelarticons:speed-fast', style: 'brand' },
      { text: 'Brand Rounded', link: '/', icon: 'pixelarticons:speed-fast', style: 'brand', shape: 'rounded' },
      { text: 'Alt Square', link: '/', icon: 'pixelarticons:book-open', style: 'alt' },
      { text: 'Alt Rounded', link: '/', icon: 'pixelarticons:book-open', style: 'alt', shape: 'rounded' },
    ],
    below: [
      { text: 'Ghost (default)', link: '/', icon: 'pixelarticons:home' },
      { text: 'Ghost Rounded', link: '/', icon: 'pixelarticons:home', shape: 'rounded' },
      { text: 'GitHub', link: 'https://github.com/acme', icon: 'pixelarticons:link', style: 'alt' },
    ],
  },
  nav: 'auto',
})
