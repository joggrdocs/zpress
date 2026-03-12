---
'@zpress/core': patch
---

Restore optional `icon` field on `Entry` for home page feature cards

The sidebar icon removal in #9 inadvertently dropped the `icon` property from
`Entry`, which broke auto-generated feature card icons on the home page. This
adds the field back as optional — sections without an icon are unaffected.
