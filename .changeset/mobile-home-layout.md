---
'@zpress/ui': patch
---

Fix mobile layout issues on home page

- Add horizontal padding to feature grid, workspace section, and card divider so cards don't touch screen edges
- Override hero image `max-width` from `50vw` to `90vw` on mobile for full-width display
- Add `padding-bottom` to hero when layout wraps at 1000px breakpoint
- Reduce hero container gap to `8px` on mobile
- Scale down hero title, subtitle, and tagline font sizes for mobile
- Add horizontal padding to hero content on mobile
- Reduce hero actions gap from `1.5rem` to `1.25rem`
- Fix hero container gap override to target correct class (`__container` instead of root)
