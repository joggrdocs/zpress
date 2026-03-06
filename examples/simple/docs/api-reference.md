---
title: API Reference
description: Complete reference for all exported functions.
---

# API Reference

## `clamp`

Clamp a number between a minimum and maximum value.

```ts
function clamp(value: number, min: number, max: number): number
```

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| `value`   | `number` | Input value |
| `min`     | `number` | Lower bound |
| `max`     | `number` | Upper bound |

**Returns** the clamped value.

```ts
clamp(150, 0, 100) // 100
clamp(-5, 0, 100) // 0
clamp(50, 0, 100) // 50
```

## `debounce`

Create a debounced version of a function that delays invocation until after `ms` milliseconds have elapsed since the last call.

```ts
function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void
```

| Parameter | Type     | Description           |
| --------- | -------- | --------------------- |
| `fn`      | `T`      | Function to debounce  |
| `ms`      | `number` | Delay in milliseconds |

**Returns** a debounced wrapper function.

```ts
const save = debounce(() => writeFile(), 500)
// Only fires 500ms after the last call
save()
save()
save() // only this one executes
```

## `groupBy`

Group an array of items by a key derived from each item.

```ts
function groupBy<T>(items: readonly T[], keyFn: (item: T) => string): Record<string, readonly T[]>
```

| Parameter | Type                  | Description            |
| --------- | --------------------- | ---------------------- |
| `items`   | `readonly T[]`        | Array to group         |
| `keyFn`   | `(item: T) => string` | Key extractor function |

**Returns** an object mapping keys to arrays of items.

```ts
const users = [
  { name: 'Alice', role: 'admin' },
  { name: 'Bob', role: 'user' },
  { name: 'Carol', role: 'admin' },
]

groupBy(users, (u) => u.role)
// {
//   admin: [{ name: 'Alice', role: 'admin' }, { name: 'Carol', role: 'admin' }],
//   user: [{ name: 'Bob', role: 'user' }],
// }
```
