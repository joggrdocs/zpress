import { defineConfig } from '@rslib/core'

export default defineConfig({
  lib: [
    {
      format: 'esm',
      bundle: true,
      syntax: 'esnext',
      autoExtension: false,
      autoExternal: true,
      dts: { bundle: true },
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
      output: {
        filename: {
          js: '[name].mjs',
        },
      },
    },
  ],
  output: {
    target: 'node',
    cleanDistPath: true,
    copy: [
      {
        from: './src/theme',
        to: 'theme',
      },
      {
        from: './src/plugins/mermaid/MermaidRenderer.tsx',
        to: 'plugins/mermaid/MermaidRenderer.tsx',
      },
      {
        from: './src/plugins/mermaid/mermaid.css',
        to: 'plugins/mermaid/mermaid.css',
      },
    ],
  },
})
