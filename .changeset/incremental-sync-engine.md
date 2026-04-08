---
'@zpress/core': minor
'@zpress/cli': minor
---

Sync engine now only processes what changed instead of running a full sync on every pass.

- **mtime-based page skip**: pages whose source mtime and frontmatter hash match the previous manifest skip the entire read/transform/hash pipeline
- **Parallel page copy**: all pages are copied concurrently via `Promise.all` instead of sequential reduce
- **Parallel `copyAll`**: public asset directory copy runs in parallel
- **Asset generation skip**: banner/logo/icon SVGs skip generation entirely when the asset config hash is unchanged; `shouldGenerate` also compares content to avoid redundant writes
- **Image copy skip**: destination images are skipped when their mtime is at least as recent as the source
- **OpenAPI spec caching**: specs are only re-parsed when their file mtime changes; a shared cache persists across dev-mode sync passes and is cleared on config reload
- **Structural change detection**: `resolvedCount` mismatch between syncs forces a full resync to handle added/removed pages correctly
- **Build system migration**: switched CLI from rslib to kidd's native build system (tsdown-based), with static command imports, proper dependency externalization, and React/Ink TUI dev screen
