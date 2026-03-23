---
'@zpress/core': patch
---

Remove default asset seeding in favor of always generating banner, logo, and icon SVGs. Previously, hardcoded default SVGs without the `<!-- zpress-generated -->` marker were seeded into `.zpress/public/`, which prevented the generated assets from overwriting them. Now `generateAssets` always runs with a fallback title of "Documentation", and user-customized files (without the marker) are still preserved.
