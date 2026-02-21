# Testing Strategy

This repository uses boundary-first testing. For drag/drop specifically, tests
are treated as a production contract, not optional confidence checks.

## Layers

| Layer | Tool | Scope | Speed |
|-------|------|-------|-------|
| Unit / Component | Jest + React Native Testing Library | Individual components, hooks, constants | Fast (~seconds) |
| E2E | Detox | Full app navigation, critical user flows | Slow (~minutes) |

## Unit & Component Tests

- Located in `__tests__/` directories colocated with their source.
- Test file naming: `<source-name>.test.tsx` or `<source-name>.test.ts`.
- Focus on behavioral boundaries: rendering, interaction, state transitions,
  and side-effect isolation.
- Mock external modules (Expo, Reanimated, AsyncStorage) in deterministic ways.

## Boundary-First Contract (New Features)

For logic-heavy features, tests define what can and cannot change.

- Define allowed behavior and forbidden behavior.
- Include happy-path and explicit negative tests.
- Mock all external boundaries (storage, network, file system, time) and assert
  only intended side effects.
- Keep tests deterministic: no randomness, no real network, minimal timer risk.
- For core pure-logic modules, target full branch coverage where feasible.

### Boundary Checklist

1. Happy path behavior is pinned.
2. Malformed/invalid input behavior is pinned.
3. Unknown/extra input fields are pinned (accept, normalize, or reject).
4. Side effects are isolated and asserted.
5. Determinism is verified across repeated runs.
6. Coverage for touched core logic is reported in the PR.

## Drag/Drop Contract Tests (Production-Critical)

These suites protect the board interaction model currently in production.

### Tier 1: Release Guardrail Suites

- `/Users/keilaloia/gamebook/app/(tabs)/__tests__/index.test.tsx`
  - validates drag gesture wiring (`PanResponder`)
  - validates dynamic hover span behavior
  - validates haptic tick behavior on target transitions
  - validates conflict-cell highlighting behavior
  - validates drop payload dispatched to store layer

- `/Users/keilaloia/gamebook/components/board/__tests__/board-viewport.test.tsx`
  - validates viewport scroll metric callbacks
  - validates imperative `scrollTo` handle used by drag auto-scroll

- `/Users/keilaloia/gamebook/lib/__tests__/game-store.test.ts`
  - validates accepted move persistence
  - validates overlap rejection as no-op
  - validates static-neighbor contract on empty drops
  - validates migration/normalization behavior around board data

- `/Users/keilaloia/gamebook/lib/__tests__/board-layout.test.ts`
  - validates span presets and constraints
  - validates deterministic baseline and pinned layout helpers
  - validates hover-intent primitives (`getAxisIntentSpan`, `getHoverZone`)

These are included in:

```bash
pnpm test:dragdrop:regression
```

### Tier 2: Engine Precision Suite

- `/Users/keilaloia/gamebook/lib/board/__tests__/engine.test.ts`
  - validates exact conflict-cell detection
  - validates strict no-overlap commit policy in isolation
- `/Users/keilaloia/gamebook/lib/board/__tests__/conflict-scope.test.ts`
  - validates cross-page drag conflict-scope normalization behavior

This suite is highly recommended when touching board engine logic even though it
is not currently part of `test:dragdrop:regression`.

## Mutation Testing (Drag/Drop Guardrail)

Mutation checks ensure tests fail when core logic is intentionally perturbed.

Core mutation scope (`/Users/keilaloia/gamebook/stryker.dragdrop.conf.cjs`):

- `/Users/keilaloia/gamebook/lib/board-layout.ts`
- `/Users/keilaloia/gamebook/lib/game-store.ts`

Deep mutation scope (`/Users/keilaloia/gamebook/stryker.dragdrop.full.conf.cjs`):

- includes `/Users/keilaloia/gamebook/app/(tabs)/index.tsx`

Run locally:

```bash
pnpm test:dragdrop:regression
pnpm test:mutation:dragdrop
pnpm test:mutation:dragdrop:ci
pnpm test:mutation:dragdrop:full:dry
pnpm test:mutation:dragdrop:full
```

Thresholds:

- `high`: 85
- `low`: 70
- `break`: 65

If mutation score drops below `break`, treat as a release blocker for
behavioral drag/drop changes.

## E2E Tests (Detox)

- Located in `/Users/keilaloia/gamebook/e2e`.
- File naming: `<flow-name>.e2e.ts`.
- Scope: smoke navigation and critical top-level user flows.
- Use stable `testID` props; avoid fragile text-only selectors.

## Running Locally

```bash
pnpm test              # unit + component (Jest)
pnpm test:watch        # Jest in watch mode
pnpm test:ci           # Jest with CI reporter + coverage
pnpm typecheck         # tsc --noEmit
pnpm e2e:build:ios     # Build Detox iOS test app
pnpm e2e:test:ios      # Run Detox E2E on iOS simulator
```

Drag/drop-focused pre-merge run:

```bash
pnpm test --watchman=false --runTestsByPath \
  'app/(tabs)/__tests__/index.test.tsx' \
  'lib/__tests__/board-layout.test.ts' \
  'lib/__tests__/game-store.test.ts' \
  'lib/board/__tests__/engine.test.ts'
```

## Visual UI Verification

For layout-sensitive changes (shadows, rotations, spacing), use the simulator
screenshot workflow. Screenshots go to `.screenshots/`:

```bash
./capture-ui.sh pre_edit
# ...make changes, wait for Fast Refresh...
./capture-ui.sh post_edit
```

## Adding or Updating Tests

1. Add tests next to source in `__tests__/`.
2. Name files `<name>.test.ts` or `<name>.test.tsx`.
3. Keep assertions deterministic.
4. If drag/drop behavior changes, update docs and tests in the same PR.
5. Run affected suites and mutation checks before merge.
