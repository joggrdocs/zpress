---
'@zpress/config': minor
'@zpress/core': minor
---

Restore `apps` and `packages` as first-class root config fields

Re-adds `apps` and `packages` to `ZpressConfig` alongside the existing generic `workspaces` field. The home page renders groups in fixed order: Apps, Packages, then custom workspace categories. Each group gets its own heading, auto-generated description, and scope prefix on cards.

Also adds `collectAllWorkspaceItems()` utility to merge all three sources consistently across the sync engine, validation, landing page injection, and OpenAPI collection.
