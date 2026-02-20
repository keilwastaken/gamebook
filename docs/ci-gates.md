# CI Gates

## GitHub Actions Workflow

File: `.github/workflows/ci.yml`

### Jobs

| Job | Trigger | What it checks | Blocking? |
|-----|---------|----------------|-----------|
| `lint-and-typecheck` | Every push / PR | ESLint + `tsc --noEmit` | Yes |
| `unit-tests` | Every push / PR | Jest suite, coverage report | Yes |
| `docs-check` | Every push / PR | Doc-link validity via `scripts/verify-doc-links.js` | Yes |
| `e2e-smoke` | Nightly schedule + manual dispatch | Detox smoke specs on iOS | No (advisory) |

### Pass Criteria

- **Lint**: zero errors (warnings allowed during ramp-up).
- **Typecheck**: zero errors.
- **Unit tests**: all pass, no skipped tests in CI.
- **Boundary coverage expectation**: PRs that change core logic should include
  explicit negative/boundary tests and module-focused coverage evidence.
- **Docs check**: all markdown links in `docs/` resolve to existing files.
- **E2E smoke**: all Detox specs pass on the latest iOS simulator.

## Adding a New Gate

1. Add the check command to `scripts/verify-harness.sh`.
2. Add a corresponding job (or step) in `.github/workflows/ci.yml`.
3. Document pass criteria in this file.
