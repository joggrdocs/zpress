---
title: Code Style
description: Coding standards and style conventions for the Acme Platform.
---

# Code Style

## TypeScript

- **Strict mode** is enabled across all packages
- Use `const` exclusively — no `let` or `var`
- Prefer pure functions and immutable data
- Use explicit return types on exported functions

## Formatting

We use Prettier with the following configuration:

| Rule            | Value |
| --------------- | ----- |
| Print width     | 100   |
| Tab width       | 2     |
| Semicolons      | Yes   |
| Single quotes   | Yes   |
| Trailing commas | All   |

Run the formatter:

```bash
pnpm format
```

## Linting

ESLint enforces code quality rules:

```bash
pnpm lint
```

## Naming conventions

| Element    | Convention  | Example           |
| ---------- | ----------- | ----------------- |
| Files      | kebab-case  | `user-profile.ts` |
| Functions  | camelCase   | `getUserById`     |
| Types      | PascalCase  | `UserProfile`     |
| Constants  | UPPER_SNAKE | `MAX_RETRIES`     |
| Components | PascalCase  | `UserProfile.tsx` |

## Imports

Imports are sorted automatically by the formatter:

1. Node.js built-ins
2. External packages
3. Internal packages (`@acme/*`)
4. Relative imports
