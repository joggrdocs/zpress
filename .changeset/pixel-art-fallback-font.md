---
'@zpress/core': minor
---

Add pixel-art retro font as fallback for long titles in generated SVG assets

Titles within the 12-character limit continue to use the original ANSI Shadow FIGlet font. Titles exceeding the limit now render in a compact pixel-art style instead of plain monospace text. Adds `renderPixelText` alongside `renderFigletText` with a separate glyph set.
