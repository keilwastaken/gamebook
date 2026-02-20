# Tech Debt Tracker

Known debt and cleanup tasks. Add items as you encounter them during
development. Prioritize by impact and fix on a regular cadence.

## Active Debt

| Area | Description | Severity | Added |
|------|-------------|----------|-------|
| Testing | `react-test-renderer` pinned to 19.1.0 due to React version mismatch — upgrade when React bumps | Low | 2026-02-20 |
| Testing | `jest-expo` peer-dep warning on Jest 29 — monitor for jest-expo update supporting Jest 30 | Low | 2026-02-20 |
| Detox | E2E specs written but not yet runnable (needs native build with `expo prebuild`) | Medium | 2026-02-20 |

## Resolved

| Area | Description | Resolved | How |
|------|-------------|----------|-----|
