import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'Acme Platform',
  description: 'The Acme Monorepo Documentation',
  tagline: 'Everything you need to build, ship, and scale.',
  apps: [
    {
      text: 'Web',
      icon: 'devicon:nextjs',
      description: 'Next.js frontend application',
      tags: ['nextjs', 'react', 'typescript'],
      docsPrefix: '/apps/web',
      textFrom: 'frontmatter',
    },
    {
      text: 'API',
      icon: 'devicon:hono',
      description: 'Hono REST API with typed routes',
      tags: ['hono', 'typescript'],
      docsPrefix: '/apps/api',
      textFrom: 'frontmatter',
    },
  ],
  packages: [
    {
      text: 'UI',
      icon: 'devicon:react',
      description: 'Shared React component library',
      tags: ['react', 'typescript'],
      docsPrefix: '/packages/ui',
      textFrom: 'frontmatter',
    },
    {
      text: 'DB',
      icon: 'devicon:postgresql',
      description: 'Database client and schema definitions',
      tags: ['drizzle', 'postgresql'],
      docsPrefix: '/packages/db',
      textFrom: 'frontmatter',
    },
    {
      text: 'Config',
      icon: 'devicon:typescript',
      description: 'Shared configuration and environment variables',
      tags: ['typescript'],
      docsPrefix: '/packages/config',
      textFrom: 'frontmatter',
    },
  ],
  workspaces: [
    {
      name: 'Integrations',
      description: 'Third-party service connectors',
      icon: 'pixelarticons:integration',
      items: [
        {
          text: 'Stripe',
          icon: 'devicon:stripe',
          description: 'Payment processing and subscription management',
          tags: ['stripe', 'payments'],
          docsPrefix: '/integrations/stripe',
        },
      ],
    },
  ],
  sections: [
    {
      text: 'Getting Started',
      link: '/getting-started',
      from: 'docs/getting-started.md',
    },
    {
      text: 'Architecture',
      link: '/architecture',
      from: 'docs/architecture.md',
    },
    {
      text: 'Guides',
      prefix: '/guides',
      from: 'docs/guides/*.md',
      textFrom: 'frontmatter',
      sort: 'alpha',
    },
    {
      text: 'Contributing',
      items: [
        {
          text: 'Overview',
          link: '/contributing',
          from: 'contributing/README.md',
        },
        {
          text: 'Guides',
          prefix: '/contributing/guides',
          from: 'contributing/guides/*.md',
          textFrom: 'frontmatter',
          sort: 'alpha',
        },
      ],
    },
  ],
  nav: 'auto',
})
