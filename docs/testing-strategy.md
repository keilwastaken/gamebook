# Testing Strategy

## Layers

| Layer | Tool | Scope | Speed |
|-------|------|-------|-------|
| Unit / Component | Jest + React Native Testing Library | Individual components, hooks, constants | Fast (~seconds) |
| E2E | Detox | Full app navigation, critical user flows | Slow (~minutes) |

## Unit & Component Tests

- Located in `__tests__/` directories colocated with their source.
- Test file naming: `<source-name>.test.tsx` or `<source-name>.test.ts`.
- Focus on **behavioral boundaries**: does the component render, respond to
  press, apply the correct style tokens?
- Mock external modules (Expo, Reanimated) in `jest.setup.ts`.

## E2E Tests (Detox)

- Located in `e2e/` at the project root.
- File naming: `<flow-name>.e2e.ts`.
- Scope: smoke navigation across tabs, center-button add flow.
- Use stable `testID` props — never query by text content that may change.

## Running Locally

```bash
pnpm test              # unit + component (Jest)
pnpm test:watch        # Jest in watch mode
pnpm test:ci           # Jest with CI reporter + coverage
pnpm typecheck         # tsc --noEmit
pnpm e2e:build:ios     # Build Detox iOS test app
pnpm e2e:test:ios      # Run Detox E2E on iOS simulator
```

## Visual UI Verification

For layout-sensitive changes (shadows, rotations, spacing), use the
simulator screenshot feedback loop. Screenshots go to `.screenshots/`:

```bash
./capture-ui.sh pre_edit     # -> .screenshots/pre_edit.png
# ...make changes, wait for Fast Refresh...
./capture-ui.sh post_edit    # -> .screenshots/post_edit.png
```

Compare images to verify the visual result. The full workflow is defined
in `CLAUDE.md` (the project source of truth).

## Adding a Test

1. Create `__tests__/<name>.test.tsx` next to the source file.
2. Import `render`, `fireEvent`, `screen` from `@testing-library/react-native`.
3. Keep tests deterministic — no timers, no network, no platform variance.
4. Run `pnpm test` before opening a PR.
