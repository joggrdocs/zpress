import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'zpress',
  description: 'Beautiful Docs, Zero Config',
  tagline: 'An opinionated documentation framework for monorepos. Just point it at your code.',
  theme: { switcher: true },
  sections: [
    {
      title: 'Getting Started',
      link: '/getting-started',
      from: 'docs/getting-started.md',
      icon: 'pixelarticons:speed-fast',
    },
    {
      title: 'Guides',
      icon: 'pixelarticons:book-open',
      prefix: '/guides',
      items: [
        {
          title: 'Sections and Pages',
          link: '/guides/sections-and-pages',
          from: 'docs/guides/sections-and-pages.md',
        },
        {
          title: 'Auto-Discovery',
          link: '/guides/auto-discovery',
          from: 'docs/guides/auto-discovery.md',
        },
        { title: 'Frontmatter', link: '/guides/frontmatter', from: 'docs/guides/frontmatter.md' },
        { title: 'Workspaces', link: '/guides/workspaces', from: 'docs/guides/workspaces.md' },
        { title: 'Navigation', link: '/guides/navigation', from: 'docs/guides/navigation.md' },
        {
          title: 'Landing Pages',
          link: '/guides/landing-pages',
          from: 'docs/guides/landing-pages.md',
        },
        {
          title: 'Dynamic Content',
          link: '/guides/dynamic-content',
          from: 'docs/guides/dynamic-content.md',
        },
        { title: 'Themes', link: '/guides/themes', from: 'docs/guides/themes.mdx' },
        { title: 'Deployment', link: '/guides/deployment', from: 'docs/guides/deployment.md' },
      ],
    },
    {
      title: 'Reference',
      icon: 'pixelarticons:list-box',
      items: [
        {
          title: 'Configuration',
          link: '/reference/configuration',
          from: 'docs/references/configuration.md',
        },
        {
          title: 'CLI Commands',
          link: '/reference/cli',
          from: 'docs/references/cli.md',
        },
        {
          title: 'Frontmatter Fields',
          link: '/reference/frontmatter',
          from: 'docs/references/frontmatter.md',
        },
        {
          title: 'Icons',
          items: [
            {
              title: 'Overview',
              link: '/references/icons',
              from: 'docs/references/icons/overview.mdx',
            },
            {
              title: 'Colors',
              link: '/references/icons/colors',
              from: 'docs/references/icons/colors.mdx',
            },
            {
              title: 'Technology Tags',
              items: [
                {
                  title: 'Overview',
                  link: '/references/icons/technology',
                  from: 'docs/references/icons/technology/overview.mdx',
                },
                {
                  title: 'Languages',
                  link: '/references/icons/technology/languages',
                  from: 'docs/references/icons/technology/languages.mdx',
                },
                {
                  title: 'Frameworks',
                  link: '/references/icons/technology/frameworks',
                  from: 'docs/references/icons/technology/frameworks.mdx',
                },
                {
                  title: 'Databases',
                  link: '/references/icons/technology/databases',
                  from: 'docs/references/icons/technology/databases.mdx',
                },
                {
                  title: 'Infrastructure',
                  link: '/references/icons/technology/infrastructure',
                  from: 'docs/references/icons/technology/infrastructure.mdx',
                },
                {
                  title: 'Tooling',
                  link: '/references/icons/technology/tooling',
                  from: 'docs/references/icons/technology/tooling.mdx',
                },
                {
                  title: 'Integrations',
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
      title: 'Contributing',
      icon: 'pixelarticons:git-merge',
      items: [
        {
          title: 'Overview',
          link: '/contributing',
          from: 'contributing/README.md',
        },
        {
          title: 'Concepts',
          prefix: '/contributing/concepts',
          from: 'contributing/concepts/*.md',
          titleFrom: 'heading',
          sort: 'alpha',
        },
        {
          title: 'Guides',
          prefix: '/contributing/guides',
          from: 'contributing/guides/*.md',
          titleFrom: 'heading',
          sort: 'alpha',
        },
        {
          title: 'Standards',
          items: [
            {
              title: 'TypeScript',
              prefix: '/contributing/standards/typescript',
              from: 'contributing/standards/typescript/*.md',
              titleFrom: 'heading',
              sort: 'alpha',
            },
            {
              title: 'Git',
              prefix: '/contributing/standards/git',
              from: 'contributing/standards/git-*.md',
              titleFrom: 'heading',
              sort: 'alpha',
            },
            {
              title: 'Documentation',
              prefix: '/contributing/standards/documentation',
              from: 'contributing/standards/documentation/*.md',
              titleFrom: 'heading',
              sort: 'alpha',
            },
          ],
        },
      ],
    },
  ],
  nav: 'auto',
})
