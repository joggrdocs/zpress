import { performance } from 'node:perf_hooks'
import fs from 'node:fs'
import path from 'node:path'

const FILE_COUNT = 5000
const REPO_ROOT = process.cwd()

console.log(`Generating ${FILE_COUNT}-file fixture...`)
const t0 = performance.now()

const fixtureDir = path.join(REPO_ROOT, '.bench-fixtures', 'profile-massive')
fs.rmSync(fixtureDir, { recursive: true, force: true })
fs.mkdirSync(fixtureDir, { recursive: true })

const sectionCount = Math.min(15, Math.max(2, Math.ceil(FILE_COUNT / 50)))
const dirsPerSection = Math.min(10, Math.max(1, Math.ceil(Math.ceil(FILE_COUNT / sectionCount) / 10)))
const DIRS = ['guides','api','tutorials','concepts','reference','architecture','integrations','operations','deployment','security','monitoring','migrations','workflows','plugins','internals']

const sectionNames = Array.from({ length: sectionCount }, (_, i) => DIRS[i % DIRS.length])

const sectionConfigs = sectionNames.map(name =>
  `    { title: '${name}', path: '/${name}', include: '${name}/**/*.md', recursive: true }`
).join(',\n')

fs.writeFileSync(path.join(fixtureDir, 'zpress.config.ts'),
  `import { defineConfig } from '@zpress/kit'\nexport default defineConfig({\n  title: 'Massive Fixture',\n  sections: [\n${sectionConfigs}\n  ],\n})\n`)

fs.writeFileSync(path.join(fixtureDir, 'package.json'),
  JSON.stringify({ name: 'profile-fixture', private: true, type: 'module', dependencies: { '@zpress/kit': 'workspace:*' } }, null, 2))

let remaining = FILE_COUNT
let globalIdx = 0
sectionNames.forEach((section, si) => {
  const sectionFiles = Math.ceil(remaining / (sectionCount - si))
  remaining -= sectionFiles
  let sr = sectionFiles
  const dirNames = Array.from({ length: dirsPerSection }, (_, i) => `group-${String(i+1).padStart(2,'0')}`)
  dirNames.forEach((dirName, di) => {
    const dirFiles = Math.ceil(sr / (dirsPerSection - di))
    sr -= dirFiles
    const targetDir = path.join(fixtureDir, section, dirName)
    fs.mkdirSync(targetDir, { recursive: true })
    for (let fi = 0; fi < dirFiles; fi++) {
      fs.writeFileSync(path.join(targetDir, `doc-${String(fi+1).padStart(3,'0')}.md`),
        `---\ntitle: "${section} ${dirName} doc ${fi+1}"\n---\n\n# ${section} doc ${fi+1}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\n## Overview\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n\n## Details\n\nSed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.\n\n## Configuration\n\n\`\`\`ts\nconst config = {\n  name: '${section}-${dirName}-${fi}',\n  enabled: true,\n  timeout: ${(fi + 1) * 1000},\n}\n\`\`\`\n\n## Usage\n\nAt vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum.\n`)
      globalIdx++
    }
  })
})
console.log(`fixture: ${globalIdx} files in ${(performance.now() - t0).toFixed(0)}ms`)

const start = performance.now()

const t1 = performance.now()
const { loadConfig, createPaths, sync } = await import('./packages/core/dist/index.mjs')
console.log('import core: ' + (performance.now() - t1).toFixed(0) + 'ms')

const paths = createPaths(fixtureDir)

const t2 = performance.now()
const [err, config] = await loadConfig(paths.repoRoot)
console.log('loadConfig: ' + (performance.now() - t2).toFixed(0) + 'ms')
if (err) { console.error('config error:', err.message); process.exit(1) }

const t3 = performance.now()
const result = await sync(config, { paths, quiet: true })
console.log('sync(): ' + (performance.now() - t3).toFixed(0) + 'ms')
console.log('  written=' + result.pagesWritten + ' skipped=' + result.pagesSkipped)
if (result.error) { console.error('sync error:', result.error); process.exit(1) }

const t4 = performance.now()
const { createRspressConfig } = await import('./packages/ui/dist/index.mjs')
const rspressConfig = createRspressConfig({ config, paths, logLevel: 'silent' })
console.log('createRspressConfig: ' + (performance.now() - t4).toFixed(0) + 'ms')

const t5 = performance.now()
const { dev } = await import('./packages/cli/node_modules/@rspress/core/dist/index.js')
console.log('import rspress: ' + (performance.now() - t5).toFixed(0) + 'ms')

console.log('starting dev server (5000 files)...')
const t6 = performance.now()
const server = await dev({
  appDirectory: fixtureDir,
  docDirectory: paths.contentDir,
  config: rspressConfig,
  configFilePath: '',
  extraBuilderConfig: {
    server: { port: 6176, strictPort: false },
    dev: { progressBar: false },
  },
})
console.log('dev() ready: ' + (performance.now() - t6).toFixed(0) + 'ms')
console.log('TOTAL: ' + (performance.now() - start).toFixed(0) + 'ms')
console.log('DEV_SERVER_READY on http://localhost:6176')
