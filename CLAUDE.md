# Gamebook - Guidelines

> This file is the source of truth for all agents (Cursor, Claude, Codex, etc.)
> and human contributors. `AGENTS.md` and `.cursorrules` point here.
> Detailed topic docs live in `docs/`.

## Product Vision

Gamebook is a cozy companion app for tracking and celebrating your gaming
journey. Designed for comfort and delight, not competition.

**Design for comfort, not efficiency. Design for delight, not metrics.**

## Quick Reference

| Topic | Location |
|-------|----------|
| Architecture & directory layout | [docs/architecture.md](docs/architecture.md) |
| Testing strategy (unit, component, E2E) | [docs/testing-strategy.md](docs/testing-strategy.md) |
| CI gates & pass criteria | [docs/ci-gates.md](docs/ci-gates.md) |
| Execution plans | [docs/exec-plans/](docs/exec-plans/) |

## Core Rules (Always Apply)

1. **Colors from palette only** — all colors come from `constants/palette.ts`
   via Tailwind classes or `constants/theme.ts`. No hardcoded hex values.
2. **Dark mode** — use NativeWind `dark:` modifiers (e.g. `bg-cream dark:bg-cream-dark`).
3. **Imports** — use `@/` path alias; order: React Native, Expo, local.
4. **Naming** — files: kebab-case, components: PascalCase, functions/vars: camelCase.
5. **Icons** — `phosphor-react-native`; active: `weight="fill"`, inactive: `weight="regular"`.
6. **Animations** — spring-based squish & bounce; see pattern in `components/tab-bar/tab-button.tsx`.
7. **Tests required** — every component or core-logic change should have or
   update a colocated test, including negative boundary coverage for invalid
   input and side-effect isolation where relevant.
8. **Run harness before PR** — `pnpm test && pnpm typecheck && pnpm lint`.
9. **Completion requires doc sync** — before marking any task/plan complete,
   update all associated docs (`docs/`, exec plans, architecture/testing notes)
   so behavior and implementation status are accurate.

## Cozy UI Design Principles

- Warm & earthy tones (sage, cream, warm, clay).
- Organic & rounded shapes — no sharp edges.
- Soft typography (Nunito, slightly bold).
- Subtle spring animations on interactive elements.
- Warm, diffused shadows (sage-tinted, not black).

## Visual UI Verification Workflow

When building, modifying, or fixing a React Native UI component, use the
`capture-ui.sh` script to verify your work visually. Screenshots are saved
to `.screenshots/` (gitignored).

1. **Observe Before:** Run `./capture-ui.sh pre_edit` to capture the baseline.
   Analyze `.screenshots/pre_edit.png` to understand the current state.
2. **Execute:** Write or modify the React Native code to fulfill the requirement.
3. **Wait for Fast Refresh:** Wait 3 seconds for Metro to hot-reload.
4. **Observe After:** Run `./capture-ui.sh post_edit` to capture the new state.
5. **Verify:** Analyze `.screenshots/post_edit.png`. Did the layout change as
   expected? Are shadows, rotations, and margins correct? If not, adjust code
   and repeat steps 3-5.

## Working with this Codebase

1. Read `docs/architecture.md` for structure and dependency rules.
2. Read `docs/testing-strategy.md` before writing tests.
3. Check `docs/exec-plans/` for in-flight work to avoid conflicts.
4. Use `capture-ui.sh` to visually verify UI changes.
5. Test in both light and dark modes.
6. Every pixel should feel like a warm hug.
