---
'@zpress/core': patch
'@zpress/cli': patch
---

Fix OpenAPI sidebar scoping, meta ordering, and sync error surfacing

- Add root-level OpenAPI entries (e.g. petstore) to root `_meta.json` and `scopes.json` so they get their own standalone sidebar scope
- Add workspace-level OpenAPI entries to their parent directory's `_meta.json` for proper sidebar discovery
- Fix `_meta.json` ordering: leaf files appear before collapsible directory sections
- Remove duplicate Overview highlight for root-level OpenAPI sections
- Surface sync errors to CLI callers instead of silently swallowing them
