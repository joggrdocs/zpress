import { defineConfig } from '@zpress/kit'

export default defineConfig({
  title: 'zpress',
  description: 'Beautiful Docs, Zero Effort',
  tagline: 'An opinionated documentation framework for monorepos. No restructuring, no plugins, no theme wiring — just point it at your markdown.',
  theme: {
    switcher: true,
  },
  home: {
    features: { truncate: { description: 2 } },
  },
  sidebar: {
    below: [{ text: 'Contributing', link: '/contributing', icon: 'pixelarticons:git-merge' }],
  },
  actions: [
    { theme: 'brand', text: 'Introduction', link: '/getting-started/introduction' },
    { theme: 'alt', text: 'Quick Start', link: '/getting-started/quick-start' },
  ],
  features: [
    {
      title: 'Zero Effort',
      description: 'No restructuring, no plugins, no theme wiring. Point it at markdown and ship.',
      link: '/getting-started/quick-start',
      icon: 'pixelarticons:speed-fast',
    },
    {
      title: 'Your Structure',
      description: 'Config maps to how you already organize markdown. The tool fits your docs.',
      link: '/concepts/content',
      icon: 'pixelarticons:layout',
    },
    {
      title: 'AI-Friendly',
      description: 'Auto llms.txt generation, raw markdown served as text/markdown, and glob discovery that picks up new files without config changes.',
      link: '/concepts/machine-readable',
      icon: 'pixelarticons:robot',
    },
    {
      title: 'Monorepo Native',
      description: 'First-class workspace support with standalone sidebars and landing pages.',
      link: '/concepts/workspaces',
      icon: 'pixelarticons:git-merge',
    },
    {
      title: 'VSCode Extension',
      description: 'Preview your docs site directly inside VS Code as you write.',
      link: '/reference/vscode-extension',
      icon: 'simple-icons:visualstudiocode',
    },
    {
      title: 'OpenAPI Support',
      description: 'Drop in an OpenAPI spec and get interactive API reference pages with try-it-out requests.',
      link: '/concepts/content',
      icon: 'simple-icons:openapiinitiative',
    },
  ],
  workspaces: [
    {
      title: 'Packages',
      description: 'Internal packages that power the zpress documentation framework',
      icon: 'pixelarticons:archive',
      items: [
        {
          title: '@zpress/kit',
          icon: { id: 'pixelarticons:archive', color: 'purple' },
          description: 'Documentation framework powered by Rspress with a config-driven information architecture',
          tags: ['typescript', 'node'],
          path: '/packages/zpress',
          items: [
            { title: 'Overview', path: '/packages/zpress', include: 'packages/zpress/README.md' },
          ],
        },
        {
          title: '@zpress/cli',
          icon: { id: 'pixelarticons:terminal', color: 'green' },
          description: 'CLI for building and serving zpress documentation sites',
          tags: ['typescript', 'node'],
          path: '/packages/cli',
          items: [
            { title: 'Overview', path: '/packages/cli', include: 'packages/cli/README.md' },
          ],
        },
        {
          title: '@zpress/core',
          icon: { id: 'pixelarticons:cpu', color: 'blue' },
          description: 'Sync engine and asset utilities for zpress',
          tags: ['typescript', 'node'],
          path: '/packages/core',
          items: [
            { title: 'Overview', path: '/packages/core', include: 'packages/core/README.md' },
          ],
        },
        {
          title: '@zpress/config',
          icon: { id: 'pixelarticons:sliders', color: 'amber' },
          description: 'Configuration loading and validation for zpress',
          tags: ['typescript', 'zod'],
          path: '/packages/config',
          items: [
            { title: 'Overview', path: '/packages/config', include: 'packages/config/README.md' },
          ],
        },
        {
          title: '@zpress/ui',
          icon: { id: 'pixelarticons:paint-bucket', color: 'pink' },
          description: 'Rspress plugin, theme components, and styles for zpress',
          tags: ['typescript', 'react'],
          path: '/packages/ui',
          items: [
            { title: 'Overview', path: '/packages/ui', include: 'packages/ui/README.md' },
          ],
        },
        {
          title: '@zpress/theme',
          icon: { id: 'pixelarticons:mood-happy', color: 'cyan' },
          description: 'Theme types and definitions for zpress',
          tags: ['typescript'],
          path: '/packages/theme',
          items: [
            { title: 'Overview', path: '/packages/theme', include: 'packages/theme/README.md' },
          ],
        },
        {
          title: '@zpress/templates',
          icon: { id: 'pixelarticons:note', color: 'slate' },
          description: 'Documentation templates SDK — built-in templates, extensions, and custom registrations',
          tags: ['typescript', 'liquid'],
          path: '/packages/templates',
        },
      ],
    },
  ],
  openapi: {
    spec: 'docs/examples/petstore.json',
    path: '/petstore',
    title: 'Petstore API',
  },
  sections: [
    {
      title: 'Getting Started',
      icon: 'pixelarticons:speed-fast',
      path: '/getting-started',
      items: [
        {
          title: 'Introduction',
          path: '/getting-started/introduction',
          include: 'docs/getting-started/introduction.mdx',
        },
        {
          title: 'Quick Start',
          path: '/getting-started/quick-start',
          include: 'docs/getting-started/quick-start.md',
        },
      ],
    },
    {
      title: 'Concepts',
      icon: 'pixelarticons:book-open',
      path: '/concepts',
      items: [
        { title: 'Content', path: '/concepts/content', include: 'docs/concepts/content.md' },
        { title: 'Navigation', path: '/concepts/navigation', include: 'docs/concepts/navigation.md' },
        { title: 'Workspaces', path: '/concepts/workspaces', include: 'docs/concepts/workspaces.md' },
        { title: 'Themes', path: '/concepts/themes', include: 'docs/concepts/themes.mdx' },
        {
          title: 'Machine-Readable Output',
          path: '/concepts/machine-readable',
          include: 'docs/concepts/machine-readable.md',
        },
      ],
    },
    {
      title: 'Guides',
      icon: 'pixelarticons:bookmark',
      path: '/guides',
      items: [
        {
          title: 'Deploy to Vercel',
          path: '/guides/deploying-to-vercel',
          include: 'docs/guides/deploying-to-vercel.md',
        },
        {
          title: 'Deploy to GitHub Pages',
          path: '/guides/deploying-to-github-pages',
          include: 'docs/guides/deploying-to-github-pages.md',
        },
      ],
    },
    {
      title: 'Framework',
      icon: 'pixelarticons:notes',
      path: '/framework',
      items: [
        {
          title: 'Overview',
          path: '/framework/overview',
          include: 'docs/framework/overview.md',
        },
        {
          title: 'Types',
          path: '/framework/types',
          include: 'docs/framework/types.md',
        },
        {
          title: 'Recommended',
          path: '/framework/recommended',
          include: 'docs/framework/recommended.md',
        },
        {
          title: 'Templates',
          path: '/framework/templates',
          include: 'docs/framework/templates.md',
          items: [
            {
              title: 'Concept',
              path: '/framework/templates/concept',
              include: 'docs/framework/templates/concept.md',
            },
            {
              title: 'Guide',
              path: '/framework/templates/guide',
              include: 'docs/framework/templates/guide.md',
            },
          ],
        },
        {
          title: 'Scaling',
          path: '/framework/scaling',
          include: 'docs/framework/scaling.md',
        },
      ],
    },
    {
      title: 'Reference',
      icon: 'pixelarticons:list-box',
      items: [
        {
          title: 'Configuration',
          path: '/reference/configuration',
          include: 'docs/references/configuration.md',
        },
        {
          title: 'CLI Commands',
          path: '/reference/cli',
          include: 'docs/references/cli.md',
        },
        {
          title: 'Frontmatter Fields',
          path: '/reference/frontmatter',
          include: 'docs/references/frontmatter.md',
        },
        {
          title: 'VSCode Extension',
          path: '/reference/vscode-extension',
          include: 'docs/references/vscode-extension.md',
        },
        {
          title: 'Built-ins',
          path: '/references/built-ins',
          items: [
            {
              title: 'Code Blocks',
              path: '/references/built-ins/code-blocks',
              include: 'docs/references/built-ins/code-blocks.md',
            },
            {
              title: 'Cards',
              path: '/references/built-ins/cards',
              include: 'docs/references/built-ins/cards.mdx',
            },
            {
              title: 'File Tree',
              path: '/references/built-ins/file-tree',
              include: 'docs/references/built-ins/file-tree.md',
            },
            {
              title: 'Desktop Window',
              path: '/references/built-ins/desktop-window',
              include: 'docs/references/built-ins/desktop-window.mdx',
            },
            {
              title: 'Browser Window',
              path: '/references/built-ins/browser-window',
              include: 'docs/references/built-ins/browser-window.mdx',
            },
            {
              title: 'IDE Window',
              path: '/references/built-ins/ide-window',
              include: 'docs/references/built-ins/ide-window.mdx',
            },
            {
              title: 'Terminal Window',
              path: '/references/built-ins/terminal-window',
              include: 'docs/references/built-ins/terminal-window.mdx',
            },
            {
              title: 'Mermaid Diagrams',
              path: '/references/built-ins/mermaid',
              include: 'docs/references/built-ins/mermaid.md',
            },
            {
              title: 'Math (KaTeX)',
              path: '/references/built-ins/math',
              include: 'docs/references/built-ins/math.md',
            },
            {
              title: 'Superscript & Subscript',
              path: '/references/built-ins/superscript-subscript',
              include: 'docs/references/built-ins/superscript-subscript.md',
            },
            {
              title: 'OpenAPI',
              path: '/references/built-ins/openapi',
              include: 'docs/references/built-ins/openapi.mdx',
            },
          ],
        },
        {
          title: 'Icons',
          path: '/references/icons',
          items: [
            {
              title: 'Overview',
              path: '/references/icons',
              include: 'docs/references/icons/overview.mdx',
            },
            {
              title: 'Colors',
              path: '/references/icons/colors',
              include: 'docs/references/icons/colors.mdx',
            },
          ],
        },
        {
          title: 'Tags',
          path: '/references/technology',
          items: [
            {
              title: 'Overview',
              path: '/references/technology',
              include: 'docs/references/technology/overview.mdx',
            },
            {
              title: 'Languages',
              path: '/references/technology/languages',
              include: 'docs/references/technology/languages.mdx',
            },
            {
              title: 'Frameworks',
              path: '/references/technology/frameworks',
              include: 'docs/references/technology/frameworks.mdx',
            },
            {
              title: 'Databases',
              path: '/references/technology/databases',
              include: 'docs/references/technology/databases.mdx',
            },
            {
              title: 'Infrastructure',
              path: '/references/technology/infrastructure',
              include: 'docs/references/technology/infrastructure.mdx',
            },
            {
              title: 'Tooling',
              path: '/references/technology/tooling',
              include: 'docs/references/technology/tooling.mdx',
            },
            {
              title: 'Integrations',
              path: '/references/technology/integrations',
              include: 'docs/references/technology/integrations.mdx',
            },
          ],
        },
      ],
    },
    {
      title: 'Packages',
      icon: 'pixelarticons:archive',
      path: '/packages',
      standalone: true,
      items: [
        { title: 'Overview', path: '/packages/zpress', include: 'packages/zpress/README.md' },
        { title: 'Overview', path: '/packages/cli', include: 'packages/cli/README.md' },
        { title: 'Overview', path: '/packages/core', include: 'packages/core/README.md' },
        { title: 'Overview', path: '/packages/config', include: 'packages/config/README.md' },
        { title: 'Overview', path: '/packages/ui', include: 'packages/ui/README.md' },
        { title: 'Overview', path: '/packages/theme', include: 'packages/theme/README.md' },
      ],
    },
    {
      title: 'Contributing',
      icon: 'pixelarticons:git-merge',
      path: '/contributing',
      standalone: true,
      items: [
        {
          title: 'Overview',
          path: '/contributing',
          include: 'contributing/README.md',
        },
        {
          title: { from: 'heading' },
          path: '/contributing/concepts',
          include: 'contributing/concepts/*.md',
          sort: 'alpha',
        },
        {
          title: { from: 'heading' },
          path: '/contributing/guides',
          include: 'contributing/guides/*.md',
          sort: 'alpha',
        },
        {
          title: 'Standards',
          items: [
            {
              title: { from: 'heading' },
              path: '/contributing/standards/typescript',
              include: 'contributing/standards/typescript/*.md',
              sort: 'alpha',
            },
            {
              title: { from: 'heading' },
              path: '/contributing/standards/git',
              include: 'contributing/standards/git-*.md',
              sort: 'alpha',
            },
            {
              title: { from: 'heading' },
              path: '/contributing/standards/documentation',
              include: 'contributing/standards/documentation/*.md',
              sort: 'alpha',
            },
          ],
        },
      ],
    },
  ],
  nav: [
    { title: 'Getting Started', link: '/getting-started/introduction' },
    { title: 'Concepts', link: '/concepts/content' },
    { title: 'Guides', link: '/guides/deploying-to-vercel' },
    { title: 'Framework', link: '/framework/overview' },
    { title: 'Reference', link: '/reference/configuration' },
  ],
  socialLinks: [
    { icon: 'github', mode: 'link', content: 'https://github.com/joggrdocs/zpress' },
    { icon: 'npm', mode: 'link', content: 'https://www.npmjs.com/package/@zpress/kit' },
  ],
  footer: {
    message: 'Built with zpress',
    copyright: `Copyright © ${new Date().getFullYear()} Joggr`,
    socials: true,
  },
})
