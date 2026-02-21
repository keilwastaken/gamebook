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

## Boundary-First Contract (New Features)

For new logic-heavy features, tests are treated as a contract that defines
what agents are allowed to change.

- Define both allowed behavior and forbidden behavior.
- Always include happy-path tests and explicit negative tests for invalid
  shapes, invalid types, and unsupported values.
- Mock all external boundaries (storage, APIs, network, file system, time)
  and assert only expected side effects occur.
- Keep tests deterministic: no random assertions, no real network, and no
  flaky timer dependence.
- For core pure-logic modules, aim for 100% statements/branches/functions/lines.
  If 100% is not practical, document the exact uncovered branch and reason in PR.

### Boundary Checklist

1. Happy path behavior is pinned.
2. Malformed/invalid input behavior is pinned.
3. Unknown/extra input fields are pinned (accept, normalize, or reject).
4. Side effects are isolated and asserted.
5. Determinism is verified across repeated runs.
6. Coverage for touched core logic is reported in the PR.

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
pnpm test:ci -- lib/__tests__/board-layout.test.ts --watchman=false --collectCoverageFrom=lib/board-layout.ts
                      # module-focused coverage check for branch-complete logic
pnpm typecheck         # tsc --noEmit
pnpm e2e:build:ios     # Build Detox iOS test app
pnpm e2e:test:ios      # Run Detox E2E on iOS simulator
```

## Mutation Testing (Drag/Drop Guardrail)

Use mutation testing to verify drag/drop tests fail when core logic is altered.
This catches "tests pass but behavior regresses" cases.

Configured scope:

- `lib/board-layout.ts`
- `lib/game-store.ts`

Optional deep-audit scope (slower):

- `app/(tabs)/index.tsx`

Run locally:

```bash
pnpm test:dragdrop:regression          # Fast drag/drop regression suite (< 1 min)
pnpm test:mutation:dragdrop            # Fast mutation dry-run check (core scope)
pnpm test:mutation:dragdrop:ci         # Core mutation run + HTML report
pnpm test:mutation:dragdrop:full:dry   # Dry-run check (core + UI drag screen)
pnpm test:mutation:dragdrop:full       # Deep run (slower, use on release branch/nightly)
```

Speed guidance:

- Local development path should remain sub-1-minute:
  - `pnpm test:dragdrop:regression`
  - `pnpm test:mutation:dragdrop` (dry-run only)
- CI mutation gate (`pnpm test:mutation:dragdrop:ci`) is allowed to run longer
  and is budgeted for up to 10 minutes.

Default mutation thresholds in `stryker.dragdrop.conf.cjs`:

- `high`: 85
- `low`: 70
- `break`: 65

If the mutation score drops below `break`, treat it as a release blocker for
drag/drop changes until missing tests are added.

Suite ownership note:

- Test suites labeled with `[dragdrop-regression]` are release guardrails.
- Do not delete or weaken their assertions without a matching behavior change,
  updated mutation evidence, and explicit review sign-off.

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
