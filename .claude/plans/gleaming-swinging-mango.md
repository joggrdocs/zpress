# Make home page hero actions configurable

## Context

The hero actions on the home page are hardcoded to a single "Get Started" button linking to the first section. Users should be able to configure the button text, link targets, add multiple buttons, and choose between `brand` (filled) and `alt` (outline) styles — matching Rspress's native hero action support.

## Files to modify

| File | Change |
|---|---|
| `packages/core/src/types.ts` | Add `HeroAction` interface + `heroActions` field on `ZpressConfig` |
| `packages/core/src/sync/errors.ts` | Add `'invalid_hero_action'` to `ConfigError['type']` union |
| `packages/core/src/define-config.ts` | Add `validateHeroActions` + wire into `validateConfig` |
| `packages/core/src/sync/home.ts` | Use `config.heroActions` when provided, fall back to current default |

## Steps

### 1. Add `HeroAction` type and config field (`types.ts`)

Add after the `Feature` interface (~line 577):

```ts
export interface HeroAction {
  /** Button label. */
  readonly text: string
  /** Link target (URL path or external URL). */
  readonly link: string
  /** Button style — 'brand' (filled, default) or 'alt' (outline). */
  readonly theme?: 'brand' | 'alt'
}
```

Add to `ZpressConfig` after `features` (~line 627):

```ts
/**
 * Hero action buttons on the home page.
 *
 * When provided, these replace the default "Get Started" button.
 * Each action renders as a button in the hero section.
 * The first action should typically use `theme: 'brand'`.
 */
heroActions?: readonly HeroAction[]
```

### 2. Add error type (`errors.ts`)

Add `'invalid_hero_action'` to the `ConfigError['type']` union (line 46).

### 3. Add validation (`define-config.ts`)

Add import for `HeroAction` type. Add two functions following the `validateFeatures`/`validateFeature` pattern:

- `validateHeroActions(actions: ZpressConfig['heroActions']): ConfigResult<true>` — early return if `undefined`, reduce through array
- `validateHeroAction(action: HeroAction): ConfigError | null` — check `text` required, `link` required, `theme` is `'brand' | 'alt'` if provided

Wire `validateHeroActions` into `validateConfig` after the `validateFeatures` call (~line 82).

### 4. Update home page generation (`home.ts`)

Change the `actions` block in `generateDefaultHomePage` (~lines 140-146) from hardcoded to pattern-matched:

```ts
actions: match(config.heroActions)
  .with(P.nonNullable, (a) =>
    a.map((action) => ({
      theme: action.theme ?? 'brand',
      text: action.text,
      link: action.link,
    }))
  )
  .otherwise(() => [
    {
      theme: 'brand' as const,
      text: 'Get Started',
      link: firstLink,
    },
  ]),
```

## Verification

1. `pnpm typecheck` — no type errors
2. `pnpm lint` — no lint errors
3. `pnpm format` — formatting passes
4. Check that examples still build (they don't set `heroActions`, so the default "Get Started" button should still render)
