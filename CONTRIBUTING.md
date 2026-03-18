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

## Breaking Changes

Every breaking change **must** include a codemod so users can migrate automatically:

1. Add a changeset with a `BREAKING CHANGE:` footer describing what changed and why
2. Create a codemod in `packages/cli/src/codemods/definitions/` that transforms the old config to the new format
3. Register it in `packages/cli/src/codemods/definitions/index.ts`
4. Set `breaking: true` and include a `changelog` URL

Users run `zpress migrate` after upgrading to apply all pending codemods. See `packages/cli/src/codemods/definitions/title-from-to-title-config.ts` for a reference implementation.

## Code Style

- TypeScript, strict mode
- Formatting and linting are handled by [OXC](https://oxc.rs/) (oxfmt + oxlint) — run `pnpm format:fix` and `pnpm lint:fix` to auto-fix
- Prefer pure functions and immutable data
- Avoid classes, `let`, and imperative mutation where possible

## License

By contributing, you agree that your contributions will be licensed under the project's license.
