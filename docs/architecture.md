# Architecture

Gamebook is a cozy companion app for tracking and celebrating your gaming
journey. This document describes the high-level structure and where to find
things.

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
│   ├── index.tsx     # Home
│   ├── library.tsx   # Library
│   ├── add.tsx       # Add game (center CTA)
│   ├── favorites.tsx # Favorites
│   └── profile.tsx   # Profile
├── _layout.tsx       # Root layout (theme, background texture)
└── modal.tsx         # Modal screen
components/
├── tab-bar/          # Custom bottom tab bar (background, buttons, center CTA)
├── cards/            # Card variants (ticket, playing, polaroid, etc.)
├── ui/               # Generic UI primitives
├── themed-text.tsx
├── themed-view.tsx
├── journal-overlay.tsx
└── sticky-note.tsx
constants/
├── palette.ts        # Color tokens (cream, sage, warm, clay, text)
└── theme.ts          # Light/dark theme maps built from palette
lib/                  # App state, persistence, shared types
├── games-context.tsx # React context for game list
├── game-store.ts     # AsyncStorage persistence
└── types.ts          # Shared domain types
hooks/
└── use-theme-color.ts
assets/images/        # Static images (textures, tab-bar art)
```

## Dependency Rules

1. **Screens import components**, never the reverse.
2. **Components import constants and hooks**, never screens.
3. **Constants are leaf modules** — they import nothing from the app.
4. All internal imports use the `@/` path alias.

## Cross-cutting Concerns

- **Theming**: Colors live in `constants/palette.ts`; semantic tokens in
  `constants/theme.ts`. Hardcoded hex values outside the palette are
  prohibited. Dark mode uses NativeWind `dark:` modifiers.
- **Routing**: Expo Router drives navigation; screens map 1:1 to routes.
- **Styling**: NativeWind + Tailwind classes; `constants/theme.ts` for
  programmatic theme access.

## Subsystem Deep Dives

- [Board Drag and Drop Architecture](drag-and-drop.md): placement algorithm,
  pinned reflow behavior, target snapping, span presets, and migration strategy.
