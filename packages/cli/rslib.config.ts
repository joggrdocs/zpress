import { createRequire } from 'node:module'

import { defineConfig } from '@rslib/core'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')

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
        define: {
          ZPRESS_VERSION: JSON.stringify(pkg.version),
        },
      },
      output: {
        filename: {
          js: '[name].mjs',
        },
      },
    },
  ],
  tools: {
    swc: {
      jsc: {
        transform: {
          react: {
            runtime: 'automatic',
          },
        },
      },
    },
  },
  output: {
    target: 'node',
    cleanDistPath: true,
  },
})
