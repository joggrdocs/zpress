# Root Section Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `root: true` section property that promotes child sections to top-level sidebar items while hiding the parent from the sidebar hierarchy.

**Architecture:** Extends the existing `standalone` pipeline. A `root` section implies standalone scope isolation but additionally promotes its children in meta generation (`buildRootMeta`, `buildMetaDirectories`) so the parent group never appears in `_meta.json`. The UI layer needs no changes — runtime scoping works via `scopes.json`.

**Tech Stack:** TypeScript, Zod, Vitest

**Spec:** `docs/superpowers/specs/2026-04-10-root-section-design.md`

---

### Task 1: Add `root` to Config Types and Schema

**Files:**
- Modify: `packages/config/src/types.ts:261` (after `standalone`)
- Modify: `packages/config/src/schema.ts:118` (after `standalone`)

- [ ] **Step 1: Add `root` property to `Section` interface**

In `packages/config/src/types.ts`, add `root` after the `standalone` property (line 261):

```ts
  readonly standalone?: boolean
  readonly root?: boolean
```

- [ ] **Step 2: Add `root` to the Zod schema**

In `packages/config/src/schema.ts`, add `root` after the `standalone` field (line 118):

```ts
      standalone: z.boolean().optional(),
      root: z.boolean().optional(),
```

- [ ] **Step 3: Run typecheck to verify config package compiles**

Run: `cd packages/config && pnpm typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/config/src/types.ts packages/config/src/schema.ts
git commit -m "feat(packages/config): add root property to Section type and schema"
```

---

### Task 2: Propagate `root` to `ResolvedEntry`

**Files:**
- Modify: `packages/core/src/sync/types.ts:144` (after `standalone`)
- Modify: `packages/core/src/sync/resolve/index.ts:246` (after `standalone` mapping)

- [ ] **Step 1: Add `root` property to `ResolvedEntry` interface**

In `packages/core/src/sync/types.ts`, add after the `standalone` JSDoc block (after line 144):

```ts
  /**
   * When true, this section gets its own sidebar namespace keyed by `link`.
   */
  readonly standalone?: boolean
  /**
   * When true, child sections are promoted to top-level sidebar items
   * and the parent title is hidden from the sidebar hierarchy.
   * Implies standalone scope isolation.
   */
  readonly root?: boolean
```

- [ ] **Step 2: Map `root` in the resolver**

In `packages/core/src/sync/resolve/index.ts`, add `root` after `standalone` at line 246:

```ts
      standalone: section.standalone,
      root: section.root,
```

- [ ] **Step 3: Run typecheck to verify core package compiles**

Run: `cd packages/core && pnpm typecheck`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/sync/types.ts packages/core/src/sync/resolve/index.ts
git commit -m "feat(packages/core): propagate root property to ResolvedEntry"
```

---

### Task 3: Add Root Section Tests for `buildRootMeta`

**Files:**
- Modify: `packages/core/src/sync/sidebar/meta.test.ts`

- [ ] **Step 1: Add a root section fixture after the existing `packagesRoot` fixture (line 78)**

```ts
const referenceRoot: ResolvedEntry = {
  title: 'Reference',
  link: '/references',
  root: true,
  items: [
    {
      title: 'API',
      link: '/references/api',
      items: [
        {
          title: 'Auth',
          link: '/references/api/auth',
          page: { outputPath: 'references/api/auth.md', frontmatter: {} },
        },
      ],
    },
    {
      title: 'CLI',
      link: '/references/cli',
      items: [
        {
          title: 'Commands',
          link: '/references/cli/commands',
          page: { outputPath: 'references/cli/commands.md', frontmatter: {} },
        },
      ],
    },
  ],
}
```

- [ ] **Step 2: Add test — root section promotes children to top-level meta items**

Inside the `describe(buildRootMeta, ...)` block, add:

```ts
  it('should promote root section children to top-level meta items', () => {
    const entries: readonly ResolvedEntry[] = [
      { title: 'Getting Started', link: '/getting-started', items: [] },
      referenceRoot,
    ]

    const result = buildRootMeta(entries)

    expect(result).toEqual([
      { type: 'dir', name: 'getting-started', label: 'Getting Started' },
      { type: 'dir', name: 'api', label: 'API' },
      { type: 'dir', name: 'cli', label: 'CLI' },
    ])
  })
```

- [ ] **Step 3: Add test — root section parent title does not appear in meta**

```ts
  it('should not include root section parent as a meta item', () => {
    const entries: readonly ResolvedEntry[] = [referenceRoot]

    const result = buildRootMeta(entries)

    const names = result.map((item) => ('name' in item ? item.name : null))
    expect(names).not.toContain('references')
  })
```

- [ ] **Step 4: Add test — root section with hidden children excludes them**

```ts
  it('should exclude hidden children from root section promotion', () => {
    const rootWithHidden: ResolvedEntry = {
      title: 'Reference',
      link: '/references',
      root: true,
      items: [
        { title: 'API', link: '/references/api', items: [] },
        { title: 'Internal', link: '/references/internal', hidden: true, items: [] },
      ],
    }

    const result = buildRootMeta([rootWithHidden])

    expect(result).toEqual([{ type: 'dir', name: 'api', label: 'API' }])
  })
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run src/sync/sidebar/meta.test.ts`
Expected: 3 new tests FAIL (root property not yet handled in `buildRootMeta`)

- [ ] **Step 6: Commit failing tests**

```bash
git add packages/core/src/sync/sidebar/meta.test.ts
git commit -m "test(packages/core): add failing tests for buildRootMeta root section promotion"
```

---

### Task 4: Implement `buildRootMeta` Root Promotion

**Files:**
- Modify: `packages/core/src/sync/sidebar/meta.ts:80-96`

- [ ] **Step 1: Update `buildRootMeta` to promote root section children**

Replace the `buildRootMeta` function (lines 80-96) with:

```ts
export function buildRootMeta(entries: readonly ResolvedEntry[]): readonly MetaItem[] {
  return entries
    .filter((e) => !e.hidden)
    .flatMap((entry) => {
      if (entry.root && entry.items) {
        return entry.items
          .filter((child) => !child.hidden)
          .flatMap((child) => {
            const name = resolveDirName(child)
            if (name === null) {
              return []
            }
            return [
              {
                type: 'dir' as const,
                name,
                label: child.title,
              },
            ]
          })
      }

      const name = resolveDirName(entry)
      if (name === null) {
        return []
      }
      return [
        {
          type: 'dir' as const,
          name,
          label: entry.title,
        },
      ]
    })
}
```

- [ ] **Step 2: Run the buildRootMeta tests**

Run: `cd packages/core && pnpm vitest run src/sync/sidebar/meta.test.ts`
Expected: All `buildRootMeta` tests PASS (including the 3 new root tests)

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/sync/sidebar/meta.ts
git commit -m "feat(packages/core): promote root section children in buildRootMeta"
```

---

### Task 5: Add Root Section Tests for `buildMetaDirectories`

**Files:**
- Modify: `packages/core/src/sync/sidebar/meta.test.ts`

- [ ] **Step 1: Add test — root section children are flattened without parent group**

Inside the `describe(buildMetaDirectories, ...)` block, add:

```ts
  it('should flatten root section children without emitting parent directory group', () => {
    const directories = buildMetaDirectories([referenceRoot])

    const dirPaths = directories.map((d) => d.dirPath)
    expect(dirPaths).not.toContain('references')
  })
```

- [ ] **Step 2: Add test — root section child subdirectories are emitted correctly**

```ts
  it('should emit subdirectories for root section children', () => {
    const directories = buildMetaDirectories([referenceRoot])

    const apiDir = directories.find((d) => d.dirPath === 'references/api')
    expect(apiDir).toBeDefined()
    if (apiDir) {
      expect(apiDir.items).toContainEqual({ type: 'file', name: 'auth', label: 'Auth' })
    }

    const cliDir = directories.find((d) => d.dirPath === 'references/cli')
    expect(cliDir).toBeDefined()
    if (cliDir) {
      expect(cliDir.items).toContainEqual({ type: 'file', name: 'commands', label: 'Commands' })
    }
  })
```

- [ ] **Step 3: Add test — mixed root and non-root sections coexist**

```ts
  it('should handle mix of root and non-root sections', () => {
    const directories = buildMetaDirectories([packagesRoot, referenceRoot])

    const dirPaths = directories.map((d) => d.dirPath)
    expect(dirPaths).toContain('packages')
    expect(dirPaths).not.toContain('references')
    expect(dirPaths).toContain('references/api')
    expect(dirPaths).toContain('references/cli')
  })
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `cd packages/core && pnpm vitest run src/sync/sidebar/meta.test.ts`
Expected: 3 new `buildMetaDirectories` tests FAIL

- [ ] **Step 5: Commit failing tests**

```bash
git add packages/core/src/sync/sidebar/meta.test.ts
git commit -m "test(packages/core): add failing tests for buildMetaDirectories root section handling"
```

---

### Task 6: Implement `buildMetaDirectories` Root Expansion

**Files:**
- Modify: `packages/core/src/sync/sidebar/meta.ts:110-113`

- [ ] **Step 1: Update `buildMetaDirectories` to expand root sections into children**

Replace the `buildMetaDirectories` function (lines 110-113) with:

```ts
export function buildMetaDirectories(entries: readonly ResolvedEntry[]): readonly MetaDirectory[] {
  const expanded = entries.flatMap((entry) => {
    if (entry.root && entry.items) {
      return entry.items.filter((child) => !child.hidden)
    }
    return [entry]
  })
  const { placements } = flattenToPlacements(expanded, 0)
  return groupPlacementsByDir(placements)
}
```

- [ ] **Step 2: Run all meta tests**

Run: `cd packages/core && pnpm vitest run src/sync/sidebar/meta.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/sync/sidebar/meta.ts
git commit -m "feat(packages/core): expand root sections in buildMetaDirectories"
```

---

### Task 7: Update Scope Collection and Nav Generation

**Files:**
- Modify: `packages/core/src/sync/index.ts:391-392`
- Modify: `packages/core/src/sync/sidebar/index.ts:26-27,130`

- [ ] **Step 1: Update `collectStandaloneScopePaths` to include root sections**

In `packages/core/src/sync/index.ts`, replace line 392:

```ts
  return entries.filter((e) => e.standalone && e.link).map((e) => e.link as string)
```

with:

```ts
  return entries.filter((e) => (e.standalone || e.root) && e.link).map((e) => e.link as string)
```

- [ ] **Step 2: Update `generateNav` to treat root sections like standalone**

In `packages/core/src/sync/sidebar/index.ts`, replace lines 26-27:

```ts
  const nonStandalone = visible.filter((e) => !e.standalone).slice(0, 3)
  const standalone = visible.filter((e) => e.standalone)
```

with:

```ts
  const nonStandalone = visible.filter((e) => !e.standalone && !e.root).slice(0, 3)
  const standalone = visible.filter((e) => e.standalone || e.root)
```

- [ ] **Step 3: Update `resolveChildren` to produce dropdowns for root sections**

In `packages/core/src/sync/sidebar/index.ts`, replace line 130:

```ts
  if (entry.standalone && entry.items && entry.items.length > 0) {
```

with:

```ts
  if ((entry.standalone || entry.root) && entry.items && entry.items.length > 0) {
```

- [ ] **Step 4: Run typecheck on core package**

Run: `cd packages/core && pnpm typecheck`
Expected: No errors

- [ ] **Step 5: Run all existing tests**

Run: `cd packages/core && pnpm vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/sync/index.ts packages/core/src/sync/sidebar/index.ts
git commit -m "feat(packages/core): treat root sections as standalone in scopes and nav"
```

---

### Task 8: Add Nav Generation Tests

**Files:**
- Create: `packages/core/src/sync/sidebar/nav.test.ts`

- [ ] **Step 1: Create nav test file with root section tests**

Create `packages/core/src/sync/sidebar/nav.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import type { ZpressConfig } from '../../types.ts'
import type { ResolvedEntry } from '../types.ts'
import { generateNav } from './index.ts'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const autoConfig = { nav: 'auto' } as ZpressConfig

// ---------------------------------------------------------------------------
// generateNav — root sections
// ---------------------------------------------------------------------------

describe(generateNav, () => {
  it('should exclude root sections from non-standalone nav items', () => {
    const entries: readonly ResolvedEntry[] = [
      { title: 'Guide', link: '/guide', items: [{ title: 'Intro', link: '/guide/intro' }] },
      {
        title: 'Reference',
        link: '/references',
        root: true,
        items: [
          { title: 'API', link: '/references/api', items: [] },
          { title: 'CLI', link: '/references/cli', items: [] },
        ],
      },
    ]

    const nav = generateNav(autoConfig, entries)
    const texts = nav.map((item) => item.text)

    expect(texts).toContain('Guide')
    expect(texts).toContain('Reference')
  })

  it('should produce dropdown children for root sections', () => {
    const entries: readonly ResolvedEntry[] = [
      {
        title: 'Reference',
        link: '/references',
        root: true,
        items: [
          { title: 'API', link: '/references/api', items: [] },
          { title: 'CLI', link: '/references/cli', items: [] },
        ],
      },
    ]

    const nav = generateNav(autoConfig, entries)
    const refItem = nav.find((item) => item.text === 'Reference')

    expect(refItem).toBeDefined()
    if (refItem && 'items' in refItem) {
      const childTexts = (refItem.items as readonly { readonly text: string }[]).map((c) => c.text)
      expect(childTexts).toEqual(['API', 'CLI'])
    }
  })

  it('should not count root sections toward the 3 non-standalone limit', () => {
    const entries: readonly ResolvedEntry[] = [
      { title: 'A', link: '/a', items: [{ title: 'A1', link: '/a/1' }] },
      { title: 'B', link: '/b', items: [{ title: 'B1', link: '/b/1' }] },
      { title: 'C', link: '/c', items: [{ title: 'C1', link: '/c/1' }] },
      { title: 'D', link: '/d', items: [{ title: 'D1', link: '/d/1' }] },
      {
        title: 'Ref',
        link: '/ref',
        root: true,
        items: [{ title: 'API', link: '/ref/api', items: [] }],
      },
    ]

    const nav = generateNav(autoConfig, entries)
    const texts = nav.map((item) => item.text)

    // First 3 non-standalone + root section
    expect(texts).toEqual(['A', 'B', 'C', 'Ref'])
    expect(texts).not.toContain('D')
  })
})
```

- [ ] **Step 2: Run nav tests**

Run: `cd packages/core && pnpm vitest run src/sync/sidebar/nav.test.ts`
Expected: All 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/sync/sidebar/nav.test.ts
git commit -m "test(packages/core): add nav generation tests for root sections"
```

---

### Task 9: Full Verification

- [ ] **Step 1: Run full typecheck**

Run: `pnpm typecheck`
Expected: All packages pass

- [ ] **Step 2: Run full test suite**

Run: `cd packages/core && pnpm vitest run`
Expected: All tests pass

- [ ] **Step 3: Run lint and format**

Run: `pnpm check`
Expected: No errors

- [ ] **Step 4: Fix any lint/format issues**

Run: `pnpm lint:fix && pnpm format:fix`

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore(packages/core): fix lint and formatting for root section feature"
```
