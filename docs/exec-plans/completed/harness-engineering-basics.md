# Plan: Harness Engineering Basics

**Status:** completed
**Owner:** Agent (Cursor)
**Created:** 2026-02-20

## Goal

Stand up a practical harness-engineering baseline for the Gamebook Expo app:
repository-legible guidance, test harness, CI guardrails, and visual UI workflow.

## Steps

- [x] Create `docs/` knowledge base and convert `AGENTS.md` into table-of-contents map
- [x] Make `CLAUDE.md` the single source of truth; point `AGENTS.md` and `.cursorrules` to it
- [x] Add Jest + React Native Testing Library config, scripts, and starter tests
- [x] Configure Detox and write smoke E2E specs with stable testIDs
- [x] Create GitHub CI workflow for lint/type/unit and Detox smoke
- [x] Add `scripts/verify-doc-links.js` and `scripts/verify-harness.sh`
- [x] Add `capture-ui.sh` visual UI verification workflow
- [x] Replace boilerplate README with proper Gamebook README
- [x] Set up `exec-plans/` with active/completed structure, template, and tech-debt tracker

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-20 | Jest 29 instead of 30 | jest-expo 54 only supports Jest <= 29 |
| 2026-02-20 | Exclude NativeWind babel preset in test env | Prevents `_ReactNativeCSSInterop` scope errors in jest.mock factories |
| 2026-02-20 | Screenshots to `.screenshots/` dir | Keeps project root clean; single gitignore entry |
| 2026-02-20 | `CLAUDE.md` as sole source of truth | Avoids three files drifting apart; `AGENTS.md` and `.cursorrules` are pointers |
| 2026-02-20 | Detox E2E as advisory (nightly/manual) in CI | Avoids blocking PRs with slow/flaky simulator runs |
