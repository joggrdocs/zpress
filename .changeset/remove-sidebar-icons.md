---
'@zpress/core': minor
'@zpress/ui': minor
---

Enable clean URLs and remove sidebar icon concept

- Enable `route.cleanUrls` in Rspress config so prod builds produce clean URLs (e.g. `/guides/foo` instead of `/guides/foo.html`)
- Remove `Entry.icon`, `NavItem.icon`, `SidebarItem.icon`, and all icon-map threading through sidebar/nav generation
- Remove `validateNav`/`validateNavItem` and `missing_nav_icon` error type
- Icons on `CardConfig`, `WorkspaceItem`, `WorkspaceGroup`, and `Feature` are unchanged
