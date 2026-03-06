---
title: Theming
description: How to customize the UI component library's appearance.
---

# Theming

The UI library uses CSS custom properties for theming. Override tokens at the root level to customize all components.

## Design tokens

```css
:root {
  /* Colors */
  --acme-color-primary: #6366f1;
  --acme-color-secondary: #8b5cf6;
  --acme-color-success: #22c55e;
  --acme-color-warning: #f59e0b;
  --acme-color-error: #ef4444;

  /* Typography */
  --acme-font-sans: 'Inter', system-ui, sans-serif;
  --acme-font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --acme-space-xs: 0.25rem;
  --acme-space-sm: 0.5rem;
  --acme-space-md: 1rem;
  --acme-space-lg: 1.5rem;
  --acme-space-xl: 2rem;

  /* Radii */
  --acme-radius-sm: 0.25rem;
  --acme-radius-md: 0.5rem;
  --acme-radius-lg: 0.75rem;
}
```

## Dark mode

The library supports dark mode via the `data-theme` attribute:

```html
<html data-theme="dark"></html>
```

Dark mode tokens are defined automatically:

```css
[data-theme='dark'] {
  --acme-color-primary: #818cf8;
  --acme-color-bg: #0f172a;
  --acme-color-text: #f8fafc;
}
```

## Per-component overrides

Each component exposes a `className` prop for targeted overrides:

```tsx
<Button className="my-custom-button" variant="primary">
  Custom styled
</Button>
```
