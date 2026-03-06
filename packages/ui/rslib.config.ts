import { defineConfig } from '@rslib/core'

export default defineConfig({
  lib: [
    {
      format: 'esm',
      bundle: true,
      syntax: 'esnext',
      autoExtension: false,
      autoExternal: true,
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
    ],
  },
})
