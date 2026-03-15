# @zpress/theme

Theme types and built-in theme definitions for zpress.

## Overview

This package provides theme-related types, built-in theme definitions, and Zod schemas for theme configuration validation. It uses TypeScript's `LiteralUnion` pattern to provide autocomplete for built-in themes while allowing custom theme names.

## Features

- **Type-safe theme definitions** with `LiteralUnion` for extensibility
- **Built-in themes**: `base`, `midnight`, `arcade`
- **Icon color types** with autocomplete support
- **Zod schemas** for runtime validation
- **Utility functions** for theme resolution and validation

## Installation

This package is typically installed as a dependency of `@zpress/config`:

```bash
pnpm add @zpress/theme
```

## Usage

### Theme Types

```typescript
import type { ThemeName, IconColor, ThemeConfig } from '@zpress/theme'

// ThemeName provides autocomplete for built-in themes
// but also accepts any string for custom themes
const myTheme: ThemeName = 'midnight' // ✓ Autocomplete works
const customTheme: ThemeName = 'my-custom-theme' // ✓ Also valid

// Same pattern for icon colors
const color: IconColor = 'purple' // ✓ Autocomplete for built-in colors
const customColor: IconColor = 'my-brand-color' // ✓ Also valid
```

### Built-in Themes

```typescript
import { THEME_NAMES, isBuiltInTheme } from '@zpress/theme'

console.log(THEME_NAMES)
// ['base', 'midnight', 'arcade']

isBuiltInTheme('midnight') // true
isBuiltInTheme('custom') // false
```

### Theme Utilities

```typescript
import { resolveDefaultColorMode } from '@zpress/theme'

// Get the default color mode for a built-in theme
resolveDefaultColorMode('base') // 'toggle'
resolveDefaultColorMode('midnight') // 'dark'
resolveDefaultColorMode('arcade') // 'dark'
```

### Zod Validation

```typescript
import { themeConfigSchema } from '@zpress/theme'

const config = {
  name: 'midnight',
  colorMode: 'dark',
  switcher: true,
}

const result = themeConfigSchema.safeParse(config)
if (result.success) {
  console.log('Valid theme config:', result.data)
}
```

## API Reference

### Types

- `ThemeName` - Built-in theme names with custom theme support
- `BuiltInThemeName` - Literal union of built-in theme names only
- `IconColor` - Built-in icon colors with custom color support
- `BuiltInIconColor` - Literal union of built-in icon colors only
- `ColorMode` - `'dark' | 'light' | 'toggle'`
- `ThemeColors` - Color override configuration
- `ThemeConfig` - Complete theme configuration object

### Constants

- `THEME_NAMES` - Array of all built-in theme names
- `COLOR_MODES` - Array of all valid color modes
- `ICON_COLORS` - Array of all built-in icon colors

### Functions

- `resolveDefaultColorMode(theme)` - Get default color mode for a built-in theme
- `isBuiltInTheme(name)` - Type guard for built-in theme names
- `isBuiltInIconColor(color)` - Type guard for built-in icon colors

### Zod Schemas

- `colorModeSchema` - Validates color mode values
- `themeColorsSchema` - Validates theme color overrides
- `themeConfigSchema` - Validates complete theme configuration

## License

MIT
