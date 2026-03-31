# Contributing to zpress

Thanks for your interest in contributing to zpress! This document covers the basics you need to get started.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 24.0.0
- [pnpm](https://pnpm.io/) 10.x (`corepack enable` to activate)

## Getting Started

1. Fork and clone the repo
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Make sure everything builds and passes checks:

   ```bash
   pnpm check && pnpm build
   ```

## Development Workflow

### Available Commands

| Command           | Description                        |
| ----------------- | ---------------------------------- |
| `pnpm build`      | Build all packages (via Turborepo) |
| `pnpm lint`       | Lint with OXLint                   |
| `pnpm lint:fix`   | Auto-fix lint issues               |
| `pnpm format`     | Check formatting with OXFmt        |
| `pnpm format:fix` | Auto-fix formatting                |
| `pnpm typecheck`  | Type check all packages            |
| `pnpm check`      | Typecheck + lint + format          |
| `pnpm clean`      | Clean all dist output              |

### Making Changes

1. Create a new branch from `main`:
   ```bash
   git checkout -b my-change
   ```
2. Make your changes
3. Run the full check suite before committing:
   ```bash
   pnpm check && pnpm build
   ```
4. Commit your changes (see [Commit Messages](#commit-messages))

## Pull Requests

- Open PRs against the `main` branch
- Keep PRs focused — one logical change per PR
- Include a clear description of **what** changed and **why**
- Make sure CI passes (lint, format, typecheck, build)

## Commit Messages

All commits follow [Conventional Commits](https://www.conventionalcommits.org/) format: `type(scope): description`.

Write clear, concise descriptions in the imperative mood ("add feature" not "added feature"). A short subject line is usually sufficient; add a body if the **why** isn't obvious from the diff.

## Project Structure

```
packages/
├── cli/              # @zpress/cli — CLI commands, watcher, Rspress integration
├── core/             # @zpress/core — config loading, sync engine, sidebar/nav generation
├── ui/               # @zpress/ui — Rspress plugin, theme components, and styles
└── zpress/           # @zpress/kit — public wrapper package (CLI + config re-exports)
```

## Architecture

zpress is a **materialization layer** — it reads a declarative config + scattered source markdown and produces a fully-formed [Rspress](https://rspress.dev) site directory. Rspress never sees the original repo layout; it only sees `.zpress/content/`.

### Output Layout

```
.zpress/
├── content/              # Rspress root — all generated pages land here
│   ├── .generated/       # sidebar.json, nav.json, workspaces.json
│   ├── public/           # static assets copied for Rspress to serve
│   └── <pages>.md        # materialized markdown (flat or nested)
├── public/               # banner.svg, logo.svg, icon.svg
├── dist/                 # Rspress build output (static site)
└── cache/                # Rspress build cache
```

### Sync Pipeline

Both `zpress build` and `zpress dev` run the same `sync()` pipeline (`packages/core/src/sync/index.ts`):

| Step               | What happens                                                                                                   | Key files                |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Asset generation   | Produce banner/logo/icon SVGs from title (skip if user-customized)                                             | `banner/index.ts`        |
| Public copy        | Copy `public/` into `content/public/` so Rspress can serve them                                                | `sync/index.ts`          |
| Section resolution | Walk `config.sections` + synthesized workspace sections, glob-discover files, derive titles, sort, deduplicate | `sync/resolve/`          |
| Card enrichment    | Attach workspace card metadata (icon, tags, badge) to matching entries                                         | `sync/workspace.ts`      |
| Landing injection  | Generate MDX landing pages for sections with children but no page                                              | `sync/sidebar/inject.ts` |
| Home page          | Auto-generate `index.md` with Rspress `pageType: home` if none exists                                          | `sync/home.ts`           |
| OpenAPI sync       | Dereference specs, generate one `.mdx` per operation + overview page                                           | `sync/openapi.ts`        |
| Page copy          | Read source → rewrite links → rewrite images → inject frontmatter → hash → write to `content/`                 | `sync/copy.ts`           |
| Stale cleanup      | Delete output files no longer in the current manifest                                                          | `sync/manifest.ts`       |
| Sidebar & nav      | Build multi-sidebar config (keyed by route prefix) + top nav                                                   | `sync/sidebar/`          |
| Manifest save      | Persist file hashes, mtimes, config hashes for incremental sync                                                | `sync/manifest.ts`       |

### Page Transformation

Each page passes through `copyPage()`:

1. Read source file (or evaluate virtual content)
2. Rewrite relative markdown links using source-to-output path map
3. Copy referenced images to `content/public/images/`, rewrite paths to `/images/<name>-<hash>.<ext>`
4. Merge frontmatter (config defaults + source frontmatter, source wins)
5. SHA-256 content hash — skip write if unchanged from previous manifest
6. Write final markdown/MDX to `.zpress/content/`

### Rspress Integration

`createRspressConfig()` (`packages/ui/src/config.ts`) bridges sync output to Rspress:

- Sets Rspress `root` to `.zpress/content/`
- Reads generated `sidebar.json`, `nav.json`, `workspaces.json`
- Registers the zpress plugin (theme provider, edit-source button, mermaid, file trees)
- Configures Rsbuild aliases so generated MDX can import `@zpress/ui/theme` components

### Build Flow (`zpress build`)

```
loadConfig() → sync() → createRspressConfig() → rspress build() → .zpress/dist/
```

Single pass — runs sync once, then hands off to Rspress for static site generation.

### Dev Flow (`zpress dev`)

```
loadConfig() → sync() → createRspressConfig() → rspress dev() → watcher
```

After initial sync, `createWatcher()` (`packages/cli/src/lib/watcher.ts`) monitors the repo with native `fs.watch(recursive: true)`:

| Event                                     | Trigger        | What happens                                                                    |
| ----------------------------------------- | -------------- | ------------------------------------------------------------------------------- |
| `.md`/`.mdx` change                       | 150ms debounce | Incremental `sync()` — unchanged pages skipped via mtime + content hash         |
| `zpress.config.*` change (repo root only) | 150ms debounce | Reload config → full `sync()` → restart Rspress dev server (clears build cache) |
| Files in ignored dirs                     | —              | Dropped silently (`node_modules`, `.git`, `.zpress`, `dist`, `.turbo`)          |

The watcher queues resyncs if one is already in progress and retries up to 5 consecutive failures before dropping pending work.

### Incremental Sync

The manifest tracks per-file metadata to skip redundant work on subsequent syncs:

| Check                                   | What's skipped                                                         |
| --------------------------------------- | ---------------------------------------------------------------------- |
| Source `mtime` + frontmatter hash match | Entire read/transform/hash pipeline for that page                      |
| Asset config hash unchanged             | All SVG generation                                                     |
| Image destination `mtime` >= source     | `copyFile` for that image                                              |
| OpenAPI spec `mtime` unchanged          | `SwaggerParser.dereference` (cached across dev passes)                 |
| Page count (`resolvedCount`) changed    | Nothing — forces full resync for one pass to handle structural changes |

## Code Style

- TypeScript, strict mode
- Formatting and linting are handled by [OXC](https://oxc.rs/) (oxfmt + oxlint) — run `pnpm format:fix` and `pnpm lint:fix` to auto-fix
- Prefer pure functions and immutable data
- Avoid classes, `let`, and imperative mutation where possible

## License

By contributing, you agree that your contributions will be licensed under the project's license.
