---
'@zpress/cli': patch
---

Fix home page not updating on config changes during dev

The restart-relevance hash was missing `actions`, `features`, `apps`, `packages`, and `workspaces` — all of which feed into the generated home page hero, feature cards, and workspace cards. Changes to these fields now correctly trigger a dev server restart so the home page reflects the updated config.
