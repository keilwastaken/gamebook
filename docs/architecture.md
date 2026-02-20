# Architecture

## Stack

- **Framework**: React Native 0.81 via Expo SDK 54
- **Routing**: Expo Router v6 (file-based)
- **Styling**: NativeWind (Tailwind CSS) + React Native StyleSheet
- **Icons**: phosphor-react-native
- **Animation**: React Native Animated (spring physics)

## Directory Layout

```
app/                  # File-based routing (screens)
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
├── ui/               # Generic UI primitives
├── themed-text.tsx
└── themed-view.tsx
constants/
├── palette.ts        # Color tokens (cream, sage, warm, clay, text)
└── theme.ts          # Light/dark theme maps built from palette
hooks/
└── use-theme-color.ts
assets/images/        # Static images (textures, tab-bar art)
```

## Dependency Rules

1. **Screens import components**, never the reverse.
2. **Components import constants and hooks**, never screens.
3. **Constants are leaf modules** — they import nothing from the app.
4. All internal imports use the `@/` path alias.

## Theme & Color

Colors are defined once in `constants/palette.ts` and mapped to semantic
tokens in `constants/theme.ts`. Hardcoded hex values outside the palette
are prohibited. Dark-mode uses NativeWind `dark:` modifiers.
