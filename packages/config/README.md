# @zpress/config

Configuration loading, validation, and schema generation for zpress.

## Overview

This package provides comprehensive configuration management for zpress, including TypeScript definitions, runtime validation with Zod, multi-format config file support, and JSON Schema generation for IDE autocomplete.

## Features

- **Multi-format config support**: `.ts`, `.js`, `.json`, `.jsonc`, `.yml`, `.yaml`
- **Type-safe config definitions** with `defineConfig` helper
- **Runtime validation** using Zod schemas
- **JSON Schema generation** for IDE autocomplete and validation
- **Result-based error handling** following functional patterns
- **Theme integration** via `@zpress/theme` package
- **c12-powered loader** for flexible config resolution

## Installation

This package is typically installed as a dependency of `@zpress/core`:

```bash
pnpm add @zpress/config
```

## Usage

### Define Config (TypeScript)

```typescript
// zpress.config.ts
import { defineConfig } from '@zpress/config'

export default defineConfig({
  title: 'My Documentation',
  description: 'Built with zpress',
  theme: {
    name: 'midnight',
    colorMode: 'dark',
  },
  sections: [
    {
      text: 'Getting Started',
      from: 'docs/getting-started',
    },
  ],
})
```

### JSON Config with Schema

```json
{
  "$schema": "https://raw.githubusercontent.com/joggrdocs/zpress/v0.1.0/packages/config/schemas/schema.json",
  "title": "My Documentation",
  "theme": {
    "name": "arcade",
    "colorMode": "dark"
  },
  "sections": [
    {
      "text": "Guide",
      "from": "docs"
    }
  ]
}
```

### YAML Config with Schema

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/joggrdocs/zpress/v0.1.0/packages/config/schemas/schema.json

title: My Documentation
theme:
  name: base
  colorMode: toggle
sections:
  - text: Documentation
    from: docs
```

### Load Config Programmatically

```typescript
import { loadConfig } from '@zpress/config'

const [error, config] = await loadConfig('/path/to/project')
if (error) {
  console.error('Config load failed:', error.message)
  process.exit(1)
}

console.log('Loaded config:', config.title)
```

### Load Config with Options

```typescript
import { loadConfig } from '@zpress/config'

const [error, config] = await loadConfig({
  cwd: '/path/to/project',
  configFile: 'custom.config.ts',
})

if (error) {
  // Handle error based on type
  if (error.type === 'not_found') {
    console.error('No config file found')
  } else if (error.type === 'validation_failed') {
    console.error('Config validation errors:')
    error.errors?.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`)
    })
  }
  process.exit(1)
}
```

### Validate Config

```typescript
import { validateConfig } from '@zpress/config'

const config = {
  title: 'My Docs',
  sections: [{ text: 'Guide', from: 'docs' }],
}

const [error, validatedConfig] = validateConfig(config)
if (error) {
  console.error('Validation failed:', error.message)
  process.exit(1)
}

// validatedConfig is fully typed and validated
console.log(validatedConfig.title)
```

## Multi-Format Support

The config loader uses [c12](https://github.com/unjs/c12) to support multiple file formats:

- `zpress.config.ts` - TypeScript (recommended)
- `zpress.config.js` - JavaScript ESM
- `zpress.config.mjs` - JavaScript ESM
- `zpress.config.json` - JSON
- `zpress.config.jsonc` - JSON with comments
- `zpress.config.yml` - YAML
- `zpress.config.yaml` - YAML

Files are resolved in the order above. The first matching file is loaded.

## JSON Schema

The package generates a JSON Schema file that provides IDE autocomplete and validation for `.json` and `.yaml` config files.

### Using the Schema

#### JSON

Add `$schema` property to your `zpress.config.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/joggrdocs/zpress/v0.1.0/packages/config/schemas/schema.json"
}
```

#### YAML

Add a modeline comment to your `zpress.config.yaml`:

```yaml
# yaml-language-server: $schema=https://raw.githubusercontent.com/joggrdocs/zpress/v0.1.0/packages/config/schemas/schema.json
```

### Versioned Schemas

You can reference a specific version using GitHub tags:

```json
{
  "$schema": "https://raw.githubusercontent.com/joggrdocs/zpress/v1.0.0/packages/config/schemas/schema.json"
}
```

## API Reference

### Types

#### Core Config Types

- `ZpressConfig` - Complete zpress configuration object
- `ThemeConfig` - Theme configuration (name, colorMode, switcher, colors)
- `ThemeName` - Built-in theme names with custom theme support
- `IconColor` - Built-in icon colors with custom color support
- `ColorMode` - `'dark' | 'light' | 'toggle'`
- `ThemeColors` - Color override configuration

#### Content Types

- `Entry` - Sidebar entry (can be nested)
- `NavItem` - Navigation bar item (can be nested)
- `WorkspaceItem` - Workspace/app/package definition
- `WorkspaceGroup` - Grouped workspace items
- `Feature` - Feature card for landing pages
- `CardConfig` - Card display configuration
- `Frontmatter` - Page frontmatter options

#### System Types

- `Paths` - Directory paths configuration
- `OpenAPIConfig` - OpenAPI spec integration config
- `ResolvedPage` - Resolved page metadata
- `ResolvedSection` - Resolved section with pages

#### Error Types

- `ConfigError` - Error object with `_tag`, `type`, and `message`
- `ConfigErrorType` - Union of error types: `'not_found' | 'parse_error' | 'validation_failed' | 'empty_sections'`
- `ConfigResult<T>` - Result tuple: `readonly [ConfigError, null] | readonly [null, T]`

### Functions

#### `defineConfig(config)`

Type helper for config files. Provides type checking and autocomplete.

```typescript
function defineConfig(config: ZpressConfig): ZpressConfig
```

**Parameters:**

- `config` - Zpress configuration object

**Returns:** The same config object (typed)

**Example:**

```typescript
export default defineConfig({
  title: 'My Docs',
  sections: [{ text: 'Guide', from: 'docs' }],
})
```

#### `loadConfig(dirOrOptions?)`

Load and validate zpress config from a directory.

```typescript
function loadConfig(dirOrOptions?: string | LoadConfigOptions): Promise<ConfigResult<ZpressConfig>>
```

**Parameters:**

- `dirOrOptions` - Directory path (string) or options object:
  - `cwd?: string` - Working directory to search for config
  - `configFile?: string` - Specific config file name

**Returns:** Result tuple with error or validated config

**Example:**

```typescript
const [error, config] = await loadConfig('/path/to/project')
if (error) {
  console.error(error.message)
  process.exit(1)
}
```

#### `validateConfig(config)`

Validate a config object against the Zod schema.

```typescript
function validateConfig(config: unknown): ConfigResult<ZpressConfig>
```

**Parameters:**

- `config` - Config object to validate

**Returns:** Result tuple with validation error or validated config

**Example:**

```typescript
const [error, validatedConfig] = validateConfig(rawConfig)
```

#### `configError(type, message)`

Create a ConfigError object.

```typescript
function configError(type: ConfigErrorType, message: string): ConfigError
```

#### `configErrorFromZod(zodError)`

Convert Zod validation error to ConfigError.

```typescript
function configErrorFromZod(zodError: z.ZodError): ConfigError
```

### Constants

Re-exported from `@zpress/theme`:

- `THEME_NAMES` - Array of built-in theme names: `['base', 'midnight', 'arcade', 'arcade-fx']`
- `COLOR_MODES` - Array of valid color modes: `['dark', 'light', 'toggle']`
- `ICON_COLORS` - Array of built-in icon colors: `['purple', 'blue', 'green', 'amber', 'cyan', 'red', 'pink', 'slate']`

### Type Guards

Re-exported from `@zpress/theme`:

- `isBuiltInTheme(name: string): name is BuiltInThemeName` - Check if theme is built-in
- `isBuiltInIconColor(color: string): color is BuiltInIconColor` - Check if icon color is built-in

### Utilities

Re-exported from `@zpress/theme`:

- `resolveDefaultColorMode(theme: BuiltInThemeName): ColorMode` - Get default color mode for a built-in theme

### Schemas

Zod schemas for validation:

- `zpressConfigSchema` - Main config schema
- `pathsSchema` - Paths configuration schema

## Error Handling

This package follows functional error handling patterns using Result tuples instead of throwing exceptions.

### Result Type

```typescript
type Result<T, E> = readonly [E, null] | readonly [null, T]
type ConfigResult<T> = Result<T, ConfigError>
```

### Error Structure

```typescript
interface ConfigError {
  readonly _tag: 'ConfigError'
  readonly type: ConfigErrorType
  readonly message: string
  readonly errors?: ReadonlyArray<{
    readonly path: ReadonlyArray<string | number>
    readonly message: string
  }>
}

type ConfigErrorType =
  | 'not_found'
  | 'parse_error'
  | 'validation_failed'
  | 'empty_sections'
  | 'missing_field'
  | 'invalid_entry'
  | 'invalid_section'
  | 'invalid_field'
  | 'invalid_icon'
  | 'invalid_theme'
  | 'duplicate_prefix'
  | 'unknown'
```

### Handling Errors

```typescript
const [error, config] = await loadConfig()

if (error) {
  // Handle different error types
  switch (error.type) {
    case 'not_found':
      console.error('Config file not found')
      break
    case 'parse_error':
      console.error('Failed to parse config:', error.message)
      break
    case 'validation_failed':
      console.error('Validation failed:')
      error.errors?.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`)
      })
      break
    case 'empty_sections':
      console.error('Config must have at least one section')
      break
  }
  process.exit(1)
}

// Config is validated and fully typed
console.log(config.title)
```

## License

MIT
