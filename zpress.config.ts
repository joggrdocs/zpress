import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'zpress',
  description: 'Beautiful Docs, Zero Config',
  tagline: 'An opinionated documentation framework for monorepos. Just point it at your code.',
  theme: { switcher: true },
  sidebar: {
    below: [{ text: 'Contributing', link: '/contributing', icon: 'pixelarticons:git-merge' }],
  },
  actions: [
    { theme: 'brand', text: 'Introduction', link: '/getting-started/introduction' },
    { theme: 'alt', text: 'Quick Start', link: '/getting-started/quick-start' },
  ],
  sections: [
    {
      title: 'Getting Started',
      icon: 'pixelarticons:speed-fast',
      prefix: '/getting-started',
      items: [
        {
          title: 'Introduction',
          link: '/getting-started/introduction',
          from: 'docs/getting-started/introduction.mdx',
        },
        {
          title: 'Quick Start',
          link: '/getting-started/quick-start',
          from: 'docs/getting-started/quick-start.md',
        },
      ],
    },
    {
      title: 'Concepts',
      icon: 'pixelarticons:book-open',
      prefix: '/concepts',
      items: [
        {
          title: 'Sections and Pages',
          link: '/concepts/sections-and-pages',
          from: 'docs/concepts/sections-and-pages.md',
        },
        {
          title: 'Auto-Discovery',
          link: '/concepts/auto-discovery',
          from: 'docs/concepts/auto-discovery.md',
        },
        {
          title: 'Frontmatter',
          link: '/concepts/frontmatter',
          from: 'docs/concepts/frontmatter.md',
        },
        { title: 'Workspaces', link: '/concepts/workspaces', from: 'docs/concepts/workspaces.md' },
        { title: 'Navigation', link: '/concepts/navigation', from: 'docs/concepts/navigation.md' },
        {
          title: 'Landing Pages',
          link: '/concepts/landing-pages',
          from: 'docs/concepts/landing-pages.md',
        },
        {
          title: 'Dynamic Content',
          link: '/concepts/dynamic-content',
          from: 'docs/concepts/dynamic-content.md',
        },
        { title: 'Themes', link: '/concepts/themes', from: 'docs/concepts/themes.mdx' },
        { title: 'Deployment', link: '/concepts/deployment', from: 'docs/concepts/deployment.md' },
      ],
    },
    {
      title: 'Documentation Framework',
      icon: 'pixelarticons:notes',
      prefix: '/documentation-framework',
      items: [
        {
          title: 'Overview',
          link: '/documentation-framework/overview',
          from: 'docs/documentation-framework/overview.md',
        },
        {
          title: 'Types',
          link: '/documentation-framework/types',
          from: 'docs/documentation-framework/types.md',
        },
        {
          title: 'Recommended',
          link: '/documentation-framework/recommended',
          from: 'docs/documentation-framework/recommended.md',
        },
        {
          title: 'Templates',
          link: '/documentation-framework/templates',
          from: 'docs/documentation-framework/templates.md',
        },
        {
          title: 'Scaling',
          link: '/documentation-framework/scaling',
          from: 'docs/documentation-framework/scaling.md',
        },
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
      link: '/contributing',
      isolated: true,
      items: [
        {
          title: 'Overview',
          link: '/contributing',
          from: 'contributing/README.md',
        },
        {
          title: { from: 'heading' },
          prefix: '/contributing/concepts',
          from: 'contributing/concepts/*.md',
          sort: 'alpha',
        },
        {
          title: { from: 'heading' },
          prefix: '/contributing/guides',
          from: 'contributing/guides/*.md',
          sort: 'alpha',
        },
        {
          title: 'Standards',
          items: [
            {
              title: { from: 'heading' },
              prefix: '/contributing/standards/typescript',
              from: 'contributing/standards/typescript/*.md',
              sort: 'alpha',
            },
            {
              title: { from: 'heading' },
              prefix: '/contributing/standards/git',
              from: 'contributing/standards/git-*.md',
              sort: 'alpha',
            },
            {
              title: { from: 'heading' },
              prefix: '/contributing/standards/documentation',
              from: 'contributing/standards/documentation/*.md',
              sort: 'alpha',
            },
          ],
        },
      ],
    },
  ],
  nav: [
    { title: 'Getting Started', link: '/getting-started/introduction' },
    { title: 'Concepts', link: '/concepts/sections-and-pages' },
    { title: 'Documentation Framework', link: '/documentation-framework/overview' },
    { title: 'Reference', link: '/reference/configuration' },
  ],
})
