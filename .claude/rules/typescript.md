---
paths:
  - 'packages/**/*.ts'
---

# TypeScript Rules

These rules are enforced by OXLint (`.oxlintrc.json`) and must be followed in all code under `packages/`:

## Functional programming

- **No `let`** — use `const` only. No reassignment, no mutation.
- **No loops** (`for`, `while`, `do...while`, `for...in`, `for...of`) — use `map`, `filter`, `reduce`, `flatMap`, etc. Prefer `es-toolkit` utilities.
- **No classes** — use plain objects, closures, and factory functions.
- **No `this`** — never reference `this`.
- **No `throw`** — no throw statements or throw expressions. Return errors as values.
- **No expression statements** — every expression must be used (assigned, returned, or passed). Config files (`.config.ts`) are exempt.
- **Immutable data** — no mutating objects or arrays after creation. Config files are exempt.
- **Prefer tacit (point-free)** — e.g. `arr.filter(isEven)` not `arr.filter((x) => isEven(x))`.
- **Functional parameters** — functions must declare explicit parameters (no `arguments`, no rest-only patterns).

## TypeScript strictness

- **No `any`** — use `unknown`, generics, or proper types.
- **No non-null assertions** (`!`) — use explicit null checks.
- **No optional chaining** (`?.`) — use explicit `if`/`else` or pattern matching.
- **No ternaries** — use `if`/`else` or `match` expressions.
- **ESM only** with `verbatimModuleSyntax` — use `import type` for type-only imports.

## General

- **No `eval`**, `new Function()`, or implied eval.
- **No `var`** — use `const`.
- **No param reassignment** — parameters are immutable.
- **No bitwise operators**, `++`/`--`, `void`, `with`, `continue`, or multi-assign.
- **No circular imports**, self-imports, or duplicate imports.
- **Prefer `node:` protocol** for Node.js builtins (e.g. `import fs from 'node:fs'`).
- **Use `es-toolkit`** over hand-rolling utility functions.

## Formatting (OXFmt)

- 100-char line width, 2-space indent, no semicolons, single quotes, trailing commas
- Import sorting: builtin > external > internal > parent/sibling/index
