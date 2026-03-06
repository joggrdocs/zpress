import { defineConfig } from 'zpress'

export default defineConfig({
  title: 'zpress',
  description: 'Beautiful Docs, Zero Config',
  tagline: 'An opinionated documentation framework for monorepos. Just point it at your code.',
  sections: [
    {
      text: 'Getting Started',
      link: '/getting-started',
      from: 'docs/getting-started.md',
      icon: 'pixelarticons:speed-fast',
    },
    {
      text: 'Guides',
      prefix: '/guides',
      icon: 'pixelarticons:book-open',
      items: [
        {
          text: 'Sections and Pages',
          link: '/guides/sections-and-pages',
          from: 'docs/guides/sections-and-pages.md',
        },
        {
          text: 'Auto-Discovery',
          link: '/guides/auto-discovery',
          from: 'docs/guides/auto-discovery.md',
        },
        { text: 'Frontmatter', link: '/guides/frontmatter', from: 'docs/guides/frontmatter.md' },
        {
          text: 'Sidebar Icons',
          link: '/guides/sidebar-icons',
          from: 'docs/guides/sidebar-icons.md',
        },
        { text: 'Workspaces', link: '/guides/workspaces', from: 'docs/guides/workspaces.md' },
        { text: 'Navigation', link: '/guides/navigation', from: 'docs/guides/navigation.md' },
        {
          text: 'Landing Pages',
          link: '/guides/landing-pages',
          from: 'docs/guides/landing-pages.md',
        },
        {
          text: 'Dynamic Content',
          link: '/guides/dynamic-content',
          from: 'docs/guides/dynamic-content.md',
        },
        { text: 'Deployment', link: '/guides/deployment', from: 'docs/guides/deployment.md' },
      ],
    },
    {
      text: 'Reference',
      icon: 'pixelarticons:list-box',
      items: [
        {
          text: 'Configuration',
          link: '/reference/configuration',
          from: 'docs/references/configuration.md',
        },
        {
          text: 'CLI Commands',
          link: '/reference/cli',
          from: 'docs/references/cli.md',
        },
        {
          text: 'Frontmatter Fields',
          link: '/reference/frontmatter',
          from: 'docs/references/frontmatter.md',
        },
        {
          text: 'Icons',
          items: [
            {
              text: 'Overview',
              link: '/references/icons',
              from: 'docs/references/icons/overview.mdx',
            },
            {
              text: 'Colors',
              link: '/references/icons/colors',
              from: 'docs/references/icons/colors.mdx',
            },
            {
              text: 'Technology Tags',
              items: [
                {
                  text: 'Overview',
                  link: '/references/icons/technology',
                  from: 'docs/references/icons/technology/overview.mdx',
                },
                {
                  text: 'Languages',
                  link: '/references/icons/technology/languages',
                  from: 'docs/references/icons/technology/languages.mdx',
                },
                {
                  text: 'Frameworks',
                  link: '/references/icons/technology/frameworks',
                  from: 'docs/references/icons/technology/frameworks.mdx',
                },
                {
                  text: 'Databases',
                  link: '/references/icons/technology/databases',
                  from: 'docs/references/icons/technology/databases.mdx',
                },
                {
                  text: 'Infrastructure',
                  link: '/references/icons/technology/infrastructure',
                  from: 'docs/references/icons/technology/infrastructure.mdx',
                },
                {
                  text: 'Tooling',
                  link: '/references/icons/technology/tooling',
                  from: 'docs/references/icons/technology/tooling.mdx',
                },
                {
                  text: 'Integrations',
                  link: '/references/icons/technology/integrations',
                  from: 'docs/references/icons/technology/integrations.mdx',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      text: 'Contributing',
      icon: 'pixelarticons:git-merge',
      items: [
        {
          text: 'Overview',
          link: '/contributing',
          from: 'contributing/README.md',
        },
        {
          text: 'Concepts',
          prefix: '/contributing/concepts',
          from: 'contributing/concepts/*.md',
          textFrom: 'heading',
          sort: 'alpha',
        },
        {
          text: 'Guides',
          prefix: '/contributing/guides',
          from: 'contributing/guides/*.md',
          textFrom: 'heading',
          sort: 'alpha',
        },
        {
          text: 'Standards',
          icon: 'pixelarticons:check',
          items: [
            {
              text: 'TypeScript',
              prefix: '/contributing/standards/typescript',
              from: 'contributing/standards/typescript/*.md',
              textFrom: 'heading',
              sort: 'alpha',
            },
            {
              text: 'Git',
              prefix: '/contributing/standards/git',
              from: 'contributing/standards/git-*.md',
              textFrom: 'heading',
              sort: 'alpha',
            },
            {
              text: 'Documentation',
              prefix: '/contributing/standards/documentation',
              from: 'contributing/standards/documentation/*.md',
              textFrom: 'heading',
              sort: 'alpha',
            },
          ],
        },
      ],
    },
  ],
  nav: 'auto',
})
