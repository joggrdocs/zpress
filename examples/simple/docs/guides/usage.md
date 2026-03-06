---
title: Usage Patterns
description: Common patterns and recipes for using my-lib.
---

# Usage Patterns

## Clamping user input

Use `clamp` to enforce bounds on values from sliders, inputs, or external sources:

```ts
import { clamp } from 'my-lib'

const handleSlider = (raw: number) => {
  const volume = clamp(raw, 0, 100)
  setVolume(volume)
}
```

## Debouncing search

Debounce expensive operations like API calls triggered by user input:

```ts
import { debounce } from 'my-lib'

const search = debounce(async (query: string) => {
  const results = await fetch(`/api/search?q=${query}`)
  setResults(await results.json())
}, 300)

input.addEventListener('input', (e) => search(e.target.value))
```

## Grouping data for display

Use `groupBy` to transform flat arrays into grouped structures:

```ts
import { groupBy } from 'my-lib'

const tasks = [
  { id: 1, status: 'done', title: 'Setup repo' },
  { id: 2, status: 'in-progress', title: 'Write tests' },
  { id: 3, status: 'done', title: 'Add CI' },
  { id: 4, status: 'todo', title: 'Deploy' },
]

const byStatus = groupBy(tasks, (t) => t.status)
// Render each group as a column in a kanban board
```

## Composing utilities

These utilities compose well together:

```ts
import { clamp, debounce, groupBy } from 'my-lib'

const processItems = (items: readonly Item[]) => {
  const scored = items.map((item) => ({
    ...item,
    score: clamp(item.rawScore, 0, 100),
  }))

  return groupBy(scored, (item) =>
    item.score >= 80 ? 'high' : item.score >= 50 ? 'medium' : 'low'
  )
}
```
