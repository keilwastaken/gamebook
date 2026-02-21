# Architecture

Gamebook is a cozy companion app for tracking and celebrating your gaming
journey. This document describes high-level structure, dependency boundaries,
and the production drag/drop architecture contract.

## Stack

- **Framework**: React Native via Expo
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS) + React Native StyleSheet
- **Icons**: phosphor-react-native
- **Animation**: React Native Animated (spring physics)

## Codemap

Where things live and what each area does:

```
app/                  # Screens — file-based routing. Each screen is a route.
├── (tabs)/           # Bottom-tab navigation group
│   ├── _layout.tsx   # Tab navigator with custom TabBar
│   ├── index.tsx     # Home (board + drag/drop interaction)
│   ├── library.tsx   # Library
│   ├── add.tsx       # Add game (center CTA)
│   ├── favorites.tsx # Favorites
│   └── profile.tsx   # Profile
├── _layout.tsx       # Root layout (theme, background texture)
└── modal.tsx         # Modal screen
components/
├── board/            # Board viewport boundary (width clamp/insets/scroll)
├── tab-bar/          # Custom bottom tab bar (background, buttons, center CTA)
├── cards/            # Card variants (ticket, playing, polaroid, etc.)
├── ui/               # Generic UI primitives
├── themed-text.tsx
├── themed-view.tsx
├── journal-overlay.tsx
└── sticky-note.tsx
constants/
├── layout.ts         # Layout ratios (board/tab-bar coupling)
├── palette.ts        # Color tokens (cream, sage, warm, clay, text)
└── theme.ts          # Light/dark theme maps built from palette
lib/                  # App state, persistence, shared types
├── board/            # Board engine + metrics boundaries
├── games-context.tsx # React context for game list
├── board-layout.ts   # Span policy + deterministic layout helpers
├── game-store.ts     # AsyncStorage persistence + board move dispatch
└── types.ts          # Shared domain types
hooks/
└── use-theme-color.ts
assets/images/        # Static images (textures, tab-bar art)
stryker.dragdrop.conf.cjs       # Core mutation scope (board-layout + game-store)
stryker.dragdrop.full.conf.cjs  # Deep mutation scope (adds app/(tabs)/index.tsx)
```

## Dependency Rules

1. **Screens import components**, never the reverse.
2. **Components import constants and hooks**, never screens.
3. **Constants are leaf modules** — they import nothing from the app.
4. All internal imports use the `@/` path alias.

These boundaries are actively enforced by:

- ESLint `no-restricted-imports` rules (`/Users/keilaloia/gamebook/eslint.config.js`)
- `pnpm verify:boundaries` (`/Users/keilaloia/gamebook/scripts/verify-boundaries.js`)

## Board Architecture (Production Contract)

The board system is intentionally split into UI, engine, and persistence
boundaries to prevent behavior drift.

### UI Boundary

- `/Users/keilaloia/gamebook/app/(tabs)/index.tsx`
- `/Users/keilaloia/gamebook/components/board/board-viewport.tsx`

Responsibilities:

- user gesture handling
- drag overlay and drop indicator rendering
- candidate target selection and hysteresis
- conflict-cell visualization

### Engine Boundary

- `/Users/keilaloia/gamebook/lib/board/engine.ts`
- `/Users/keilaloia/gamebook/lib/board/conflict-scope.ts`
- `/Users/keilaloia/gamebook/lib/board/metrics.ts`
- `/Users/keilaloia/gamebook/lib/board-layout.ts`

Responsibilities:

- strict no-overlap commit policy
- per-cell conflict detection
- cross-page drag conflict scope normalization
- span presets and constraints
- normalized placement clamping
- board size and row metrics

### Persistence Boundary

- `/Users/keilaloia/gamebook/lib/game-store.ts`

Responsibilities:

- load/migration from AsyncStorage
- consistent move API (`moveGameToBoardTarget`)
- persistence after accepted state changes

### Current Drag/Drop Policy

- Dropping into empty cells is accepted.
- Dropping onto occupied cells is rejected.
- Other cards do not auto-move on accepted drop.
- Auto-swap and insert+reflow drop flows are not active runtime behavior.

## Cross-Cutting Concerns

- **Theming**: Colors live in `/Users/keilaloia/gamebook/constants/palette.ts`;
  semantic tokens in `/Users/keilaloia/gamebook/constants/theme.ts`.
  Hardcoded hex values outside the palette are prohibited.
- **Routing**: Expo Router drives navigation; screens map 1:1 to routes.
- **Styling**: NativeWind + Tailwind classes; `constants/theme.ts` for
  programmatic theme access.

## Subsystem Deep Dives

- [Board Drag and Drop Architecture](drag-and-drop.md): strict no-overlap drag
  contract, span intent behavior, conflict feedback model, and guardrail tests.
