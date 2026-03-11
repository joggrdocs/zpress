# @zpress/core

## 0.2.0

### Minor Changes

- 77adac6: Auto-generate favicon icon from project title and support custom icon via config

  The favicon is now auto-generated from the first letter of the project title using FIGlet ASCII art on a dark rounded square, matching the existing banner and logo generation system. Users can override the icon path via the new `icon` field in `ZpressConfig`.

## 0.1.0

### Minor Changes

- 04d2e2b: Initial release

  Config loading via c12, entry resolution with glob-based auto-discovery, sync engine with incremental hashing, multi-sidebar and nav generation, frontmatter injection, workspace synthesis, and branded SVG asset generation.
