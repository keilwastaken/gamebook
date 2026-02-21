# CI Gates

## GitHub Actions Workflow

File: `.github/workflows/ci.yml`

### Jobs

| Job | Trigger | What it checks | Blocking? |
|-----|---------|----------------|-----------|
| `lint-and-typecheck` | Every push / PR | ESLint + `tsc --noEmit` | Yes |
| `lint-and-typecheck` | Every push / PR | Import boundary check (`pnpm verify:boundaries`) | Yes |
| `unit-tests` | Every push / PR | Jest suite, coverage report | Yes |
| `dragdrop-mutation` | Every push / PR | Stryker core mutation run (`board-layout` + `game-store`) | Yes |
| `docs-check` | Every push / PR | Doc-link validity via `scripts/verify-doc-links.js` | Yes |
| `e2e-smoke` | Nightly schedule + manual dispatch | Detox smoke specs on iOS | No (advisory) |

### Pass Criteria

- **Lint**: zero errors (warnings allowed during ramp-up).
- **Typecheck**: zero errors.
- **Boundary check**: no forbidden cross-layer imports.
- **Unit tests**: all pass, no skipped tests in CI.
- **Drag/drop mutation**:
  - Core mutation score must stay above Stryker `break` threshold (`65`).
  - Job timeout budget is capped at 10 minutes in CI.
  - Mutation HTML report is uploaded as `mutation-report` artifact.
- **Boundary coverage expectation**: PRs that change core logic should include
  explicit negative/boundary tests and module-focused coverage evidence.
- **Docs check**: all markdown links in `docs/` resolve to existing files.
- **E2E smoke**: all Detox specs pass on the latest iOS simulator.

## Adding a New Gate

1. Add the check command to `scripts/verify-harness.sh`.
2. Add a corresponding job (or step) in `.github/workflows/ci.yml`.
3. Document pass criteria in this file.
