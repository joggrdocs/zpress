# Code Review Report

> Generated: 2026-03-17
> Scope: All packages (`core`, `cli`, `ui`, `theme`, `config`, `templates`, `zpress`)
> Method: 4 parallel review agents → 3 verification agents → manual triage + second-pass line verification

---

## Summary

44 findings surfaced across all packages. 4 were fixed in PR #40 (`fix/code-review-now-items`). 7 were invalidated. The remaining **33 valid findings** form the backlog below.

| Package  | Backlog items |
| -------- | ------------- |
| `core`   | 9             |
| `cli`    | 16            |
| `ui`     | 5             |
| `config` | 1             |

---

## Backlog

These are real issues — style violations, DRY problems, pattern misuses — but none are causing bugs or failures today. Prioritize as capacity allows.

---

### packages/core

#### CORE-1 — `ctx.manifest` mutated in-place

- **File:** `sync/index.ts:163`
- **Severity:** medium | **Category:** immutability
- `ctx.manifest.files[entry.outputPath] = entry` mutates the shared manifest accumulator in-place, guarded by an `oxlint-disable` comment. A TODO exists to refactor this to an immutable accumulator passed through the reduce.

#### CORE-2 — Mutable tree building in `buildDirTree`

- **File:** `sync/resolve/recursive.ts:125–159`
- **Severity:** high | **Category:** immutability
- `acc.subdirs.set(seg, ...)` (line 144) and `current.files.push(file)` (line 154) mutate data structures inside a reduce. A comment at line 125 explicitly acknowledges: _"Intentional mutation — immutable rebuild would require deep-cloning nested Maps on every insert"_. Should move to a recursive immutable builder.

#### CORE-3 + CORE-10 — `injectLandingPages` mutates in-place via `reduce<void>`

- **File:** `sync/sidebar/inject.ts:28–95`
- **Severity:** high | **Category:** immutability + pattern misuse
- Two overlapping issues in the same function:
  1. `entry.page` (lines 49, 62, 77) and `colorIndex.value` (line 46) are mutated in-place. The JSDoc states _"Void; mutates entries in-place"_.
  2. `entries.reduce<void>((_, entry) => { ... }, undefined as void)` (line 34) uses `reduce` purely for its side effects with a `void` accumulator — semantically wrong. `reduce` should transform data.
- Refactor to return a new tree, passing color state as immutable accumulated value through recursion.

#### CORE-4 — `codeBlocks.push()` in rewrite-links

- **File:** `sync/rewrite-links.ts:83–88`
- **Severity:** medium | **Category:** immutability
- `codeBlocks` is built by `.push()` (line 86) inside a `String.replace` callback — mutable accumulation. Replace with a reduce that returns accumulated code blocks alongside the transformed content.

#### CORE-5 — `Array.from({ length })` instead of `range()` in `naturalCompare`

- **File:** `sync/planning.ts:196`
- **Severity:** low | **Category:** simplification
- `Array.from({ length: len }, (_, idx) => idx)` generates an index range. `range` from es-toolkit would be cleaner — add it to the existing es-toolkit import (`groupBy` is already imported on line 5).

#### CORE-7 — Verbose index-tracking in `deriveCommonPrefix`

- **File:** `sync/resolve/index.ts:397–406`
- **Severity:** low | **Category:** simplification
- Uses a manual `acc.length !== i` divergence check as the accumulation guard inside the reduce. The early-exit on divergence can be expressed more directly with `every()` and a `findIndex`.

#### CORE-11 — `Map.set()` mutates accumulator inside `deduplicateByLink`

- **File:** `sync/resolve/index.ts:426–456`
- **Severity:** medium | **Category:** immutability
- `acc.seen.set(entry.link, acc.result.length)` (line 437) mutates the Map while the reduce otherwise returns new objects. Both the mutation and the return should be consistent. Use a deduplication strategy that doesn't require mutating the seen index (e.g. a two-pass approach or `groupBy` from es-toolkit).

#### CORE-12 — `Object.assign(acc, ...)` mutates accumulator in `buildIsolatedSidebar`

- **File:** `sync/sidebar/multi.ts:255–265`
- **Severity:** medium | **Category:** immutability
- `Object.assign(acc, { [matchingKey]: ..., [baseKey]: ... })` (line 261) mutates the accumulator object in-place inside `reduce`. Replace with spread: `{ ...acc, [matchingKey]: ..., [baseKey]: ... }`.

---

### packages/cli

#### CLI-1–6 — `.map()` called for side effects across all command files

- **Files:**
  - `commands/build.ts:39–42`
  - `commands/check.ts` (same pattern, slightly offset lines)
  - `commands/dump.ts:30–33`
  - `commands/generate.ts:23–26`
  - `commands/serve.ts:22–25`
  - `commands/sync.ts:23–26`
- **Severity:** medium | **Category:** dry / expression statement
- All six command files call `.map()` on `configErr.errors` purely for side-effect logging (`ctx.logger.error(...)`) without using the returned array. This violates the "no expression statements" rule. Extract a shared `logErrors(errors, logger)` utility — one fix that resolves both the expression-statement violation and the DRY duplication across all six files.

#### CLI-7 — `any` types in stream override (`createInterceptor`)

- **File:** `lib/check.ts:212–214`
- **Severity:** low | **Category:** type safety
- `encodingOrCb?: any` and `maybeCb?: any` with `oxlint-disable` comments, justified by matching Node's overloaded `stream.write` signature. Replace with a proper union: `BufferEncoding | ((err?: Error | null) => void) | undefined`.

#### CLI-8 — `captureOutput` uses custom result shape instead of `Result` tuple

- **File:** `lib/check.ts:244–265`
- **Severity:** medium | **Category:** error-handling
- `captureOutput` returns `Promise<CaptureResult<T>>` (a custom `{ result, error, captured }` shape) rather than the project's `Result<T, E>` tuple. Inconsistent with the error-handling convention used everywhere else.

#### CLI-9 — `DEFAULT_PORT` missing JSDoc

- **File:** `lib/rspress.ts:9`
- **Severity:** low | **Category:** style
- `export const DEFAULT_PORT = 6174` has no JSDoc comment. All exported declarations must have full JSDoc. Add: `/** Default port used by the development and preview servers. */`

#### CLI-10 — Multiple `let` bindings for server lifecycle state

- **File:** `lib/rspress.ts:42–43, 95`
- **Severity:** medium | **Category:** pattern
- `serverInstance` is managed as an independent `let` binding with a restart pattern spread across the file. Consider encapsulating the server lifecycle (start/stop/restart) in a state object to reduce the mutation surface area.

#### CLI-11 — Watcher `let`/mutation cluster

- **File:** `lib/watcher.ts:46–56`
- **Severity:** high | **Category:** pattern
- Five `let` bindings (`config`, `syncing`, `pendingReloadConfig`, `consecutiveFailures`, `didReloadConfig`) with mutation sites throughout. Each is justified with an `oxlint-disable` comment, and the `syncing` mutex is logically correct for single-threaded Node.js. However, the mutable state surface makes the watcher difficult to reason about. Long-term: refactor to a `WatcherState` reducer pattern.

#### CLI-12 — Missing return type on `validate` callback

- **File:** `commands/draft.ts:58–62`
- **Severity:** low | **Category:** style
- The `validate` callback has no explicit return type annotation — it implicitly returns `string | undefined`. Annotate: `validate: (value: string): string | undefined => { ... }`

#### CLI-14 — Accumulating spread in reduce (`parseDeadlinks`)

- **File:** `lib/check.ts:313–340`
- **Severity:** medium | **Category:** performance
- `{ ...state, currentLinks: [...state.currentLinks, link] }` inside `reduce` spreads the accumulator on every iteration. The `oxlint-disable no-accumulating-spread` comment acknowledges this with "small bounded input" justification. For the current use case (deadlink stderr lines) it's fine, but worth replacing with a mutable accumulator inside the reduce if inputs grow.

#### CLI-15 — Inconsistent unused `.map()` approach

- **File:** `lib/check.ts:131–136`
- **Severity:** medium | **Category:** dry
- Same `.map()` side-effect pattern as CLI-1–6 but with an explicit `oxlint-disable` comment. Inconsistent: some files suppress the warning, others don't. Resolved entirely by extracting the shared `logErrors` utility from CLI-1–6.

#### CLI-16 — `+=` compound assignment on `consecutiveFailures`

- **File:** `lib/watcher.ts:91`
- **Severity:** low | **Category:** style
- `consecutiveFailures += 1` is a compound assignment on a `let`. Express as `consecutiveFailures = consecutiveFailures + 1` for consistency with the no-mutation-shorthand convention, or fold into the CLI-11 state-reducer refactor.

#### CLI-17 — Duplicated error message extraction (two IIFEs)

- **File:** `lib/rspress.ts:61–66, 87–92`
- **Severity:** low | **Category:** dry
- Two identical IIFEs (`(() => { if (error instanceof Error) return error.message; return String(error) })()`) appear in the same file. Extract to a private `extractErrorMessage(err: unknown): string` helper.

#### CLI-18 — `.filter(!== null)` instead of `compact`

- **File:** `commands/clean.ts:30`
- **Severity:** low | **Category:** simplification
- `.filter((label) => label !== null)` — replace with `compact(labels)` from es-toolkit.

---

### packages/ui

#### UI-3 — `.forEach()` for DOM mutations in `applyColorOverrides` / `clearColorOverrides`

- **File:** `theme/components/theme-provider.tsx:178–184, 192–196`
- **Severity:** medium | **Category:** pattern
- Both functions use `.forEach()` with an `oxlint-disable unicorn/no-array-for-each` comment. `.forEach()` is still loop-like semantics. Replace with `.map()` (discarding the return) to make the functional intent explicit.

#### UI-4 — IIFE + `if` instead of `match()` in `Layout`

- **File:** `theme/components/nav/layout.tsx:23–33`
- **Severity:** medium | **Category:** pattern
- `navSlot` is built with an IIFE containing an imperative `if`, while lines 38–43 in the same function use `match()` consistently. Replace with: `match(vscode).with(true, () => <><BranchTag /><VscodeTag /></>).otherwise(() => <BranchTag />)`

#### UI-6 — `if/else` instead of `match()` in `getIsomorphicEffect`

- **File:** `theme/components/theme-provider.tsx:247–252`
- **Severity:** low | **Category:** style
- Imperative `if (globalThis.window !== undefined)` for a conditional return, while the codebase uses `match()` consistently. Replace with: `return match(globalThis.window).with(P.nonNullable, () => useLayoutEffect).otherwise(() => useEffect)`

#### UI-7 — Early return `if` guard instead of `match()` in `SchemaViewer`

- **File:** `theme/components/openapi/schema-viewer.tsx:49–59`
- **Severity:** low | **Category:** style
- Depth exceeded guard uses imperative `if (depthExceeded) { return ... }`. Make the depth check part of the component's main `match` tree for consistency.

#### UI-8 — Explicit `void` return type on `toggle`

- **File:** `theme/components/openapi/schema-viewer.tsx:197`
- **Severity:** low | **Category:** style
- `function toggle(): void` — `void` as an explicit return type annotation is disallowed. Remove the annotation (TypeScript infers it) and rename to `handleToggle()` to signal event-handler intent.

---

### packages/config

#### CONFIG-1 — Redundant `as ZpressConfig` Zod assertion

- **File:** `validator.ts:20`
- **Severity:** high | **Category:** style
- `return [null, result.data as ZpressConfig]` — when `result.success` is `true`, Zod's `safeParse` already types `result.data` as the schema's inferred type, which is `ZpressConfig`. The cast is redundant and may mask future schema drift. Remove the `as ZpressConfig`.

---

## Invalid Findings

These were flagged by reviewers but are not real issues.

| ID     | Finding                               | Reason                                                                           |
| ------ | ------------------------------------- | -------------------------------------------------------------------------------- |
| CORE-8 | `resolveTagline` should use `match()` | Trivial optional string trim — `if/else` is appropriate and clearer              |
| UI-2   | `var` in injected JS                  | Lives inside a string literal for browser payload, not TypeScript source         |
| UI-5   | `??` should be `match()`              | Nullish coalescing is not a ternary; not forbidden by the rules                  |
| UI-10  | Complex nested `reduce()`             | Valid functional pattern; complexity is inherent to the problem, not a violation |
| UI-11  | `setTimeout` in cleanup closure       | Accepted React cleanup pattern; not forbidden                                    |
| TMPL-1 | `??` in registry.ts                   | Same as UI-5 — `??` is not a ternary                                             |
| CLI-13 | `match[1]` without null guard         | Null guard exists at line 78 (`if (!match) return null`) — false positive        |

---

## Fixed (PR #40)

| Finding          | File                                                       | Fix                                                                                   |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| NOW-1 / CORE-6   | `core/src/sync/manifest.ts`                                | Sequential async reduce → `Promise.all` + `attemptAsync`                              |
| NOW-2 / TMPL-2   | `templates/src/built-in.ts`                                | Removed `createTemplateLoader` factory + closure mutation; plain module-level `const` |
| NOW-3 / UI-1     | `ui/src/theme/components/openapi/copy-markdown-button.tsx` | `void` → `return .catch(() => undefined)`                                             |
| NOW-4 / CONFIG-2 | `config/src/types.ts`                                      | Added `readonly` to all 4 `OpenAPIConfig` properties                                  |
