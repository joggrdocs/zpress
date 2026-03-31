# Sync Engine

The sync engine is the heart of zpress. It transforms a config file into a complete documentation site structure inside `.zpress/content/`.

## Pipeline

The `sync()` function in `packages/core/src/sync/index.ts` runs this pipeline:

1. **Setup** -- Create output directories, seed default assets
2. **Asset generation** -- Generate branded SVG assets (banner, logo, icon) from config title
3. **Public asset copying** -- Copy `.zpress/public/` into content dir for Rspress resolution
4. **Load manifest** -- Load previous sync manifest for incremental diffing
5. **Workspace synthesis** -- Convert `apps`/`packages`/`workspaces` into entry sections
6. **Resolve entries** -- Walk the config tree, resolve globs, derive text, merge frontmatter
7. **Enrich cards** -- Attach workspace metadata (icon, scope, tags, badge) to matched entries
8. **Inject landing pages** -- Generate virtual MDX pages for sections with children but no page
9. **Collect pages** -- Flatten the resolved tree into a flat page list
10. **Generate home** -- Create default home page from config metadata (when no explicit index.md)
11. **Planning page discovery** -- Discover and resolve pages from `.planning/` directory
12. **OpenAPI sync** -- Dereference specs, generate one `.mdx` per operation + overview page
13. **Copy pages** -- Build source map, write all pages with injected frontmatter, rewrite links, track SHA256 hashes
14. **Clean stale files** -- Remove files present in old manifest but absent in new
15. **Generate sidebar + nav** -- Build multi-sidebar JSON and nav array
16. **Save manifest** -- Record file hashes for incremental sync on next run

Returns: `{ pagesWritten, pagesSkipped, pagesRemoved, elapsed }`

## Page Transformation

Each page passes through `copyPage()` (`sync/copy.ts`):

1. Read source file (or evaluate virtual content)
2. Rewrite relative markdown links using source-to-output path map
3. Copy referenced images to `content/public/images/`, rewrite paths to `/images/<name>-<hash>.<ext>`
4. Merge frontmatter (config defaults + source frontmatter, source wins)
5. SHA-256 content hash -- skip write if unchanged from previous manifest
6. Write final markdown/MDX to `.zpress/content/`

## Entry Resolution

The entry resolver (`sync/resolve/index.ts`) recursively walks the config tree and resolves each entry:

- **Single file** -- Source file with explicit link (e.g., `from: 'docs/getting-started.md'`)
- **Virtual page** -- Generated content with link (e.g., `content: () => '# Hello'`)
- **Glob section** -- Pattern that discovers files (e.g., `from: 'docs/guides/*.md'`)
- **Recursive glob** -- Directory-driven nesting (e.g., `from: 'docs/**/*.md', recursive: true`)
- **Explicit items** -- Hand-written child entries

Text derivation is configurable via `textFrom`:

| Value           | Source                                     |
| --------------- | ------------------------------------------ |
| `'filename'`    | Kebab-case filename → title case (default) |
| `'heading'`     | First `#` heading in the markdown file     |
| `'frontmatter'` | `title` field from YAML frontmatter        |

## Multi-Sidebar

zpress generates a multi-sidebar structure for Rspress. Root entries share the `/` namespace. Isolated sections (workspace items, explicit `isolated: true`) get their own namespace (e.g., `/apps/api/`). This allows each section to have an independent sidebar tree.

## Incremental Sync

The manifest tracks per-file metadata to skip redundant work on subsequent syncs:

| Check | What's skipped |
| --- | --- |
| Source `mtime` + frontmatter hash match | Entire read/transform/hash pipeline for that page |
| Content hash unchanged (post-transform) | File write to disk |
| Asset config hash unchanged | All SVG generation |
| Image destination `mtime` >= source | `copyFile` for that image |
| OpenAPI spec `mtime` unchanged | `SwaggerParser.dereference` (cached across dev passes) |
| Page count (`resolvedCount`) changed | Nothing -- forces full resync for one pass to handle structural changes |

Stale files (present in old manifest but absent in new) are removed after every sync.

## Build vs Dev Flow

**Build** (`zpress build`) runs a single pass:

```
loadConfig() → sync() → createRspressConfig() → rspress build() → .zpress/dist/
```

**Dev** (`zpress dev`) runs sync then enters a watch loop:

```
loadConfig() → sync() → createRspressConfig() → rspress dev() → watcher
```

After initial sync, the watcher monitors the repo and triggers incremental resyncs. See [CLI -- File Watching](./cli.md#file-watching) for trigger details.

## OpenAPI Sync

The OpenAPI sync (`sync/openapi.ts`) handles API documentation:

1. Collect OpenAPI configs from root `config.openapi` and workspace-level `.openapi` fields
2. Stat each spec file and compare mtime against previous manifest -- skip re-parsing when unchanged
3. Dereference all `$ref`s via `@apidevtools/swagger-parser` (cached across dev passes)
4. Extract operations from paths, group by tag
5. Generate one `.mdx` per operation (imports dereferenced spec JSON, renders `<OpenAPIOperation>`)
6. Generate an overview page (`<OpenAPIOverview>`)
7. Build sidebar items grouped by tag with configurable layout (`method-path` or `title`)
8. Write dereferenced spec as `openapi.json` so MDX pages can import it

## References

- [Architecture](./architecture.md)
- [Config](./config.md)
- [CLI](./cli.md)
