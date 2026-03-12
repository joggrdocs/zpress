import * as esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

/** @type {import('esbuild').BuildOptions} */
const config = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
}

if (isWatch) {
  const ctx = await esbuild.context(config)
  await ctx.watch()
  console.log('[zpress-vscode] watching for changes...')
} else {
  await esbuild.build(config)
  console.log('[zpress-vscode] build complete')
}
