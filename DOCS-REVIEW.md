# Documentation Review Report

Review of `./docs` and package-level documentation for public readiness.

**Date**: 2026-03-18
**Reviewed by**: 5-agent parallel review team
**Total findings**: 72

---

## Summary

| Area | Critical | Major | Minor | Total |
|------|----------|-------|-------|-------|
| References (CLI, Config, Frontmatter, Icons) | 6 | 12 | 3 | 21 |
| Concepts | 4 | 7 | 5 | 16 |
| Getting Started | 2 | 3 | 4 | 9 |
| Documentation Framework | 1 | 6 | 6 | 13 |
| Package Wiring & READMEs | 2 | 5 | 6 | 13 |
| **Total** | **15** | **33** | **24** | **72** |

---

## Critical Issues (fix before public release)

### C1. Workspace type docs are substantially wrong
**File**: `docs/references/configuration.md:102-140`
**Source**: `packages/config/src/types.ts:320-330`

Multiple field-level mismatches:
- Docs say `path`, code says `prefix`
- Docs say `WorkspaceItem`, code says `Workspace`
- Docs say `WorkspaceGroup`, code says `WorkspaceCategory`
- Docs put `sort`, `titleFrom`, `titleTransform`, `recursive`, `indexFile`, `collapsible`, `frontmatter` flat on WorkspaceItem — code nests them inside `discovery?: Discovery`
- Docs say `items: Entry[]`, code says `items?: readonly Section[]`
- Docs say `from` on WorkspaceItem, code uses `discovery?.from`

### C2. Two CLI commands entirely undocumented
**File**: `docs/references/cli.md`
**Source**: `packages/cli/src/commands/check.ts`, `packages/cli/src/commands/draft.ts`

- `check` — "Validate config and check for broken links" (no flags)
- `draft` — "Scaffold a new documentation file from a template" (`--type`, `--title`, `--out`)

Both are also missing from `docs/getting-started/quick-start.md:55-67`.

### C3. Four top-level config fields undocumented
**File**: `docs/references/configuration.md:24-38`
**Source**: `packages/config/src/types.ts:438-447`

Missing from the top-level fields table:
- `theme?: ThemeConfig`
- `actions?: readonly HeroAction[]`
- `seo?: SeoConfig`
- `sidebar?: SidebarConfig`

### C4. `discovery` wrapper in Section example would fail validation
**File**: `docs/concepts/auto-discovery.md:46-62`
**Source**: `packages/config/src/types.ts:274`

Example wraps `title` inside a `discovery` key on a Section. The `Section` type has no `discovery` field — only `Workspace` does. This config example would fail strict Zod validation.

### C5. Default sort behavior wrongly documented
**File**: `docs/concepts/auto-discovery.md:70-74`
**Source**: `packages/core/src/sync/resolve/index.ts:211`, `sort.ts:27`

Doc says "When `sort` is omitted, entries appear in glob discovery order." Actual behavior: sort defaults to `'default'` strategy which pins intro files (`introduction`, `intro`, `overview`, `readme`) to top, then sorts alpha.

### C6. `'default'` sort value missing from all docs
**Files**: `docs/references/configuration.md:95`, `docs/concepts/auto-discovery.md:70-74`
**Source**: `packages/config/src/types.ts:162`, `packages/config/src/schema.ts:74`

Valid sort values include `'default' | 'alpha' | 'filename' | comparator`. All docs omit `'default'`.

### C7. Quick-start config example may use wrong property names
**File**: `docs/getting-started/quick-start.md:24-28`
**Source**: `packages/cli/src/commands/setup.ts:134-139`

Example shows `title` and `link` for sections. Setup template generates `text` and `prefix`. Need to verify which names the config schema actually accepts.

### C8. Workspace `icon` type is wrong in docs
**File**: `docs/concepts/workspaces.md:64`
**Source**: `packages/config/src/types.ts:322-323`

Docs show `icon: IconConfig` (string or `{ id, color }` object). Code has `icon?: string` + `iconColor?: string` as separate fields. Example using `icon: { id: '...', color: '...' }` would fail validation.

### C9. Overview file promotion claim is inaccurate
**File**: `docs/concepts/landing-pages.md:31`
**Source**: `packages/core/src/sync/resolve/recursive.ts:32`

Doc claims `overview.md`, `index.md`, or `readme.md` are all auto-promoted. Code only checks the configured `indexFile` name (default `"overview"`). `index.md` and `readme.md` are NOT promoted unless `indexFile` is explicitly set.

### C10. `@zpress/config` README has stale schema version
**File**: `packages/config/README.md:56,73,167-168,177,187`

Hardcodes `v0.2.0` in schema URLs. Current version is `0.3.0`. Users following the README get outdated schema validation.

### C11. `build --check` flag undocumented
**File**: `docs/references/cli.md:55-66`
**Source**: `packages/cli/src/commands/build.ts:21`

`check` boolean option (default `true`) runs link validation on build. Users can't discover `--no-check` to skip it.

### C12. `@zpress/templates` has no README
**File**: `packages/templates/README.md` — does not exist

Published to npm with `publishConfig.access: "public"` but has no README for npm consumers.

### C13. Duplicate `zpress` bin entry
**Files**: `packages/zpress/package.json:19-21`, `packages/cli/package.json:19-21`

Both declare `"bin": { "zpress": "..." }`. When `@zpress/kit` depends on `@zpress/cli`, this creates a bin conflict. Either `@zpress/cli` should drop its bin (if consumed only through kit) or the relationship should be documented.

### C14. `landing` entry field missing from docs
**File**: `docs/references/configuration.md:80-101`
**Source**: `packages/config/src/types.ts:281`

`landing?: 'auto' | 'cards' | 'overview' | false` controls landing page generation — not documented anywhere in references or concepts.

### C15. `sidebarLayout` OpenAPI field missing
**File**: `docs/references/configuration.md:227-231`
**Source**: `packages/config/src/types.ts:403`

`sidebarLayout?: 'method-path' | 'title'` with default `'method-path'` is undocumented.

---

## Major Issues

### References

**M1.** `docs/references/configuration.md:95` — `titleFrom` documented as current but marked `@deprecated` in code (`types.ts:296`). Replacement is `title: { from: '...' }`. Same for `titleTransform`.

**M2.** `docs/references/configuration.md:173` — `CardConfig.icon` shown as `IconConfig` union, actual code is `icon?: string` + `iconColor?: string` separately. `iconColor` entirely missing.

**M3.** `docs/references/configuration.md:98` — Entry `icon` shown as `IconConfig`, actual code uses separate `icon?: string` and `iconColor?: string` fields.

**M4.** `docs/references/configuration.md:216` — Feature `title` shown as `string`, code has `title: TitleConfig` (string or `{ from, transform }` object).

**M5.** `docs/references/configuration.md:192-196` — `NavItem` table missing `icon` field, but icon overview examples show icons on nav items. Either the examples or the type table is wrong.

**M6.** `docs/references/icons/overview.mdx:226` — Says "six bundled sets" but page lists nine icon sets.

**M7.** Icon technology docs use `path` in examples (e.g. `databases.mdx:57`), should be `prefix` per actual type.

### Concepts

**M8.** `docs/concepts/sections-and-pages.md` — Missing `icon`, `iconColor`, and `card` fields that exist on Section type.

**M9.** `docs/concepts/frontmatter.md:47-53` — Merge precedence prose is ambiguous. The numbered list is correct but the summary sentence "A page's own frontmatter" is unclear whether it means source file or entry-level config.

**M10.** `docs/concepts/workspaces.md` — Missing `items` and `openapi` fields on Workspace.

**M11.** `docs/concepts/themes.mdx:54` — States `switcher` defaults to `false` but schema shows `z.boolean().optional()` — defaults to `undefined`.

### Getting Started

**M12.** `docs/getting-started/quick-start.md:59` — `setup` description undersells: says "Create a starter config file" but also generates SVG assets (banner, logo, icon).

**M13.** `docs/getting-started/quick-start.md:64` — `clean` description is imprecise. Says "Remove build cache and output" — actual behavior removes `cache/`, `content/`, AND `dist/`.

**M14.** `docs/getting-started/quick-start.md:86` — Gitignore guidance is contradictory. Line 78 says `.zpress/` is "Generated (gitignore this)" but line 86 lists specific subdirs.

### Documentation Framework

**M15.** `docs/documentation-framework/templates.md:40,49` — SDK examples show `registry.add()` and `registry.extend()` assigning to unused variables. Registry is immutable — the returned registry must be used, not discarded.

**M16.** `docs/documentation-framework/templates.md:32` — `registry.get()` returns `Template | undefined` but example ignores possible `undefined`.

**M17.** `docs/documentation-framework/templates.md` — Missing API methods: `merge()`, `has()`, `list()`, `types()`, `getBuiltInTemplates()`, and `TEMPLATE_TYPES` constant.

**M18.** `docs/documentation-framework/types.md:102-108` — Explanation type spec lists "Overview" as required section, but actual template starts with Architecture then Key Concepts.

### Packages

**M19.** `@zpress/config` and `@zpress/theme` READMEs missing banner/badges header present in all other packages.

**M20.** `@zpress/config` and `@zpress/theme` license sections inconsistent — just say `MIT` without link or Joggr attribution.

**M21.** Root README and `@zpress/kit` README package tables incomplete — missing `@zpress/config`, `@zpress/theme`, `@zpress/templates`.

**M22.** `@zpress/core` README lists `generateAssets`, `generateBannerSvg`, etc. in API table but these are NOT re-exported through `@zpress/kit`.

---

## Minor Issues

### References

**m1.** Tech icon docs have missing blank lines before `##` headings.

**m2.** `docs/references/frontmatter.md:19` link to `/concepts/frontmatter` — verify path resolves.

**m3.** WorkspaceCategory docs use `name: string` but code uses `title: TitleConfig`.

### Concepts

**m4.** `docs/concepts/themes.mdx` uses `.mdx` extension with no JSX content — inconsistent with other `.md` concept docs.

**m5.** `docs/concepts/themes.mdx` missing `## References` section present in all other concept docs.

**m6.** `docs/concepts/dynamic-content.md:84` — Inconsistent reference link text style.

**m7.** `docs/concepts/workspaces.md:64` — Link `/references/icons` uses plural; other docs use `/reference/` singular. Likely broken.

**m8.** `docs/concepts/landing-pages.md` and `docs/concepts/workspaces.md` — Redundant workspace cards content.

### Getting Started

**m9.** `docs/getting-started/quick-start.md:65` — `generate` description less specific than CLI help text.

**m10.** `docs/getting-started/quick-start.md` — No mention of `--clean`, `--quiet`, or `--check`/`--no-check` flags.

**m11.** `docs/getting-started/quick-start.md:91` — Link `/reference/configuration` may use wrong path prefix.

### Documentation Framework

**m12.** All docs/documentation-framework/ files use absolute internal links (`/documentation-framework/types`) — standard says prefer relative links.

**m13.** `docs/documentation-framework/templates.md:68` — Undersells template variables — only mentions `{{title}}` but arbitrary custom vars are supported.

**m14.** `docs/documentation-framework/templates.md:74-94` — Template bodies shown as heading-only skeletons, actual `.liquid` files include comments and placeholder content. Should note this.

**m15.** `docs/documentation-framework/templates.md:8` — References `@zpress/templates` import but public users install `@zpress/kit`.

**m16.** `docs/documentation-framework/templates.md:256` — Link `[CLI Commands](/reference/cli)` — verify path.

**m17.** `docs/documentation-framework/recommended.md` — No mention of Runbook type vs Troubleshooting type.

### Packages

**m18.** Root README uses relative `assets/banner.svg` path — won't render on npm.

**m19.** Node.js engine requirement `>=24.0.0` is aggressive (excludes LTS 22) — not mentioned in any user-facing docs.

**m20.** `@zpress/kit` `config` sub-export doesn't include `loadConfig` — only `defineConfig` + types.

---

## Link Audit

| Link | Location | Status |
|------|----------|--------|
| `/reference/configuration` | quick-start.md:91 | Likely broken — dir is `references/` |
| `/references/icons` | workspaces.md:64 | Likely broken — inconsistent plural |
| `/reference/cli` | templates.md:256 | Likely broken — dir is `references/` |
| `/concepts/frontmatter` | frontmatter.md:19 | OK — file exists |
| `/concepts/sections-and-pages` | multiple files | OK — file exists |
| `/concepts/auto-discovery` | multiple files | OK — file exists |
| `/getting-started/quick-start` | introduction.mdx:32 | OK — file exists |

---

## Recommended Fix Priority

### Phase 1 — Blockers (C1–C15)
Fix before any public launch. These cause broken configs, missing features, or misleading guidance.

### Phase 2 — Major (M1–M22)
Fix before GA. Deprecated fields documented as current, missing fields, inconsistent README formatting.

### Phase 3 — Minor (m1–m20)
Polish pass. Style consistency, link format standardization, redundant content dedup.
