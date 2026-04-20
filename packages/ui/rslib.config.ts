import { defineConfig } from '@rslib/core'

export default defineConfig({
  lib: [
    {
      format: 'esm',
      bundle: true,
      syntax: 'esnext',
      autoExtension: false,
      autoExternal: true,
      shims: { esm: { __dirname: true, __filename: true, require: true } },
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
    externals: [
      // Safety net: rspress-plugin-devkit's barrel re-exports TSSourceParser
      // which depends on ts-morph (bundles the entire TypeScript compiler).
      // The deep import in mermaid/plugin.ts avoids this path, but if Rslib
      // resolves through the barrel anyway, these regexes prevent the 15MB
      // inlining.
      /ts-morph/,
    ],
    // Raw-copied files that Rspress's webpack compiles at runtime as global
    // components. These are NOT bundled by Rslib — they must exist as standalone
    // files on disk because Rspress injects absolute-path `import` statements
    // into compiled MDX and webpack resolves them at build time.
    // See: packages/ui/CLAUDE.md for constraints on raw-copied components.
    copy: [
      // Theme directory: copied as-is so Rspress can resolve it via themeDir config
      {
        from: './src/theme',
        to: 'theme',
      },
      // MermaidRenderer: raw .tsx global component compiled by Rspress's webpack.
      // Must only import packages available in Rspress's webpack context (see CLAUDE.md).
      {
        from: './src/plugins/mermaid/MermaidRenderer.tsx',
        to: 'plugins/mermaid/MermaidRenderer.tsx',
      },
      {
        from: './src/plugins/mermaid/mermaid.css',
        to: 'plugins/mermaid/mermaid.css',
      },
      // rspress-plugin-file-tree: the plugin registers its FileTree component via
      // an absolute path (PACKAGE_ROOT/dist/components/FileTree/FileTree). When
      // bundled into our index.mjs, __dirname shifts so the resolved path points
      // to packages/ui/dist/components/FileTree/FileTree — so the component files
      // must exist here.
      {
        from: './node_modules/rspress-plugin-file-tree/dist/components',
        to: 'components',
      },
      // 🚨 DANGER: This copies files into the dist root and could clobber our own
      // output if the plugin adds new non-chunk files. We exclude index.* and
      // components/** to avoid known collisions, but this is brittle — if the
      // plugin's dist layout changes, verify nothing gets overwritten.
      //
      // FileTree's Rslib build code-splits icon/language definitions into chunk
      // files (0~*.js) at the dist root. FileTree.js imports them via relative
      // paths (../../0~311.js), which resolve from dist/components/FileTree/ to
      // dist/. We cannot nest these elsewhere — the relative paths are hardcoded.
      {
        from: './node_modules/rspress-plugin-file-tree/dist',
        to: '',
        globOptions: {
          ignore: ['**/components/**', '**/index.*'],
        },
      },
    ],
  },
})
