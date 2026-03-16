import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'Acme Platform',
  description: 'The Acme Monorepo Documentation',
  tagline: 'Everything you need to build, ship, and scale.',
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
      icon: 'devicon:hono',
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
      icon: 'pixelarticons:integration',
      items: [
        {
          title: 'Stripe',
          icon: 'devicon:stripe',
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
    above: [{ text: 'Home', link: '/', icon: 'pixelarticons:home' }],
    below: [{ text: 'GitHub', link: 'https://github.com/acme', icon: 'pixelarticons:link' }],
  },
  nav: 'auto',
})
