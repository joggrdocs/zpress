# Get Started Contributing

Set up your local environment to contribute to zpress.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 24.0.0
- [pnpm](https://pnpm.io/) 10.x (`corepack enable` to activate)
- [Git](https://git-scm.com/)
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) (optional but recommended)

## Steps

### 1. Fork and clone

```bash
gh repo fork joggr/zpress --clone
cd zpress
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Verify the build

Run the full CI check suite to confirm everything works:

```bash
pnpm lint && pnpm format && pnpm typecheck
```

### 4. Run the dev server

Start the zpress documentation site locally:

```bash
pnpm zpress dev
```

This runs a sync + Rspress dev server on `http://localhost:6174` with file watching.

### 5. Understand the project

Read the project docs in this order:

1. `CLAUDE.md` (repo root) -- tech stack, project structure, available commands
2. [`contributing/concepts/architecture.md`](../concepts/architecture.md) -- packages, sync engine, and data flow
3. [`contributing/concepts/cli.md`](../concepts/cli.md) -- commands, dev server, and build pipeline
4. Relevant standards in the [Contributing](../README.md) overview as needed

### 6. Set up Claude Code (optional)

The repo includes built-in configuration for Claude Code:

| File                          | Purpose                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `CLAUDE.md`                   | Persona, project structure, tech stack, and commands                         |
| `.claude/settings.json`       | PostToolUse hooks that auto-format and lint TypeScript files on save         |
| `.claude/rules/typescript.md` | Functional programming rules Claude follows for all `packages/**/*.ts` files |

## Verification

Confirm all checks pass:

```bash
pnpm lint && pnpm format && pnpm typecheck
```

## Troubleshooting

### pnpm not found

**Issue:** Running `pnpm` returns "command not found."

**Fix:**

```bash
corepack enable
```

### Lockfile mismatch after switching branches

**Issue:** Build or install fails after checking out a different branch.

**Fix:**

```bash
pnpm install
```

## References

- [Architecture](../concepts/architecture.md)
- [Contributing](../README.md)
