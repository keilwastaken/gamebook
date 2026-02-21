# Gamebook

A cozy companion app for tracking and celebrating your gaming journey.
Built with React Native, Expo, and warm vibes.

## Getting Started

```bash
pnpm install
pnpm start
```

Open in [Expo Go](https://expo.dev/go), an
[iOS simulator](https://docs.expo.dev/workflow/ios-simulator/), or an
[Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/).

## Scripts

| Command | What it does |
|---------|-------------|
| `pnpm start` | Start Expo dev server |
| `pnpm ios` | Start on iOS simulator |
| `pnpm android` | Start on Android emulator |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run unit & component tests (Jest) |
| `pnpm test:watch` | Jest in watch mode |
| `pnpm test:ci` | Jest with CI reporter + coverage |
| `pnpm e2e:build:ios` | Build Detox iOS test app |
| `pnpm e2e:test:ios` | Run Detox E2E on iOS simulator |
| `pnpm verify-harness` | Run all checks (lint, type, test, boundaries, doc-links) |
| `pnpm verify:boundaries` | Enforce import-layer boundaries |
| `./capture-ui.sh <name>` | Screenshot simulator to `.screenshots/<name>.png` |

## Project Structure

```
CLAUDE.md              # Source of truth for all agents and contributors
AGENTS.md              # Points to CLAUDE.md
.cursorrules           # Points to CLAUDE.md
docs/                  # Versioned knowledge base
  architecture.md      # App structure, layers, dependency rules
  drag-and-drop.md     # Board grid, drag/drop, span, and reflow internals
  testing-strategy.md  # Test harness: unit, component, E2E, visual
  ci-gates.md          # CI jobs and pass criteria
  exec-plans/          # Execution plans for larger work items
app/                   # File-based routing (screens)
  (tabs)/              # Bottom-tab navigation group
components/            # Reusable UI components
  tab-bar/             # Custom bottom tab bar
  ui/                  # Generic UI primitives
constants/             # Palette, theme, app constants
hooks/                 # Custom React hooks
assets/                # Static images and textures
e2e/                   # Detox E2E test specs
scripts/               # Verification and utility scripts
```

## Documentation

All project guidelines live in [CLAUDE.md](CLAUDE.md) — that's the single
source of truth for rules, design principles, and workflows.

Deep-dive docs live in [docs/](docs/README.md):

- [Architecture](docs/architecture.md) — stack, directory layout, dependency rules
- [Board Drag and Drop](docs/drag-and-drop.md) — layout, snapping, span presets, migration
- [Testing Strategy](docs/testing-strategy.md) — Jest, Detox, visual verification
- [CI Gates](docs/ci-gates.md) — GitHub Actions jobs and pass criteria
- [Execution Plans](docs/exec-plans/) — plans for in-flight and completed work

## Tech Stack

- **React Native** 0.81 via **Expo** SDK 54
- **Expo Router** v6 (file-based routing)
- **NativeWind** (Tailwind CSS for RN)
- **Phosphor Icons** for friendly, rounded iconography
- **Jest** + **React Native Testing Library** for unit/component tests
- **Detox** for E2E tests

## License

See [LICENSE](LICENSE).
