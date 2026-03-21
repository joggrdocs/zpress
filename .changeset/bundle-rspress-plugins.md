---
'@zpress/ui': patch
---

Bundle rspress-plugin-{devkit,file-tree,katex,supersub} into UI output instead of externalizing them, fixing ERR_MODULE_NOT_FOUND on Node.js 24 caused by extensionless ESM imports in plugin dist files
