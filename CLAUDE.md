# Gamebook - Claude Guidelines

## Product Vision

Gamebook is a cozy companion app for tracking and celebrating your gaming journey. It's designed for people who love games as a form of relaxation, comfort, and joy — not competition.

## Target Audience: Cozy Gamers

Our users are:
- People who play games to unwind, not to compete
- Fans of cozy, wholesome, and indie games (Stardew Valley, Animal Crossing, Spiritfarer, etc.)
- Players who value the journey over achievements
- People who appreciate warm, inviting digital spaces

**Design for comfort, not efficiency. Design for delight, not metrics.**

---

## Cozy UI Design Philosophy

Every design decision should make users feel relaxed, comfortable, and delighted. The app should feel like a warm, inviting space — not a utility.

### 1. Color Palette: Warm & Earthy Tones
- Use soft sage for accents (active states, highlights)
- Use cream for backgrounds
- Create gentle, low-contrast environments that are easy on the eyes
- These colors evoke comfort, tranquility, and warmth — like a soft blanket or a cup of tea

### 2. Shape & Form: Organic & Rounded
- Eliminate sharp edges wherever possible
- Use pill-shaped indicators, rounded buttons, gentle curves
- The center tab bar divot should feel like a hammock, not a geometric notch
- Rounded shapes feel safer, friendlier, and more organic — like pebbles or leaves

### 3. Typography: Soft & Friendly
- Use Nunito (configured in tailwind.config.js) for a rounded, friendly feel
- Prefer slightly bolder weights for clarity without sacrificing softness
- Avoid sharp, condensed fonts that feel corporate

### 4. Iconography: Simple & Clear
- Use Phosphor icons (phosphor-react-native) — they have a friendly, rounded aesthetic
- Active states use `weight="fill"` (solid, satisfying)
- Inactive states use `weight="regular"` (clean outline)
- Clarity is comforting — users should never guess what an icon does

### 5. Animation: Subtle & Playful
- Add gentle "squish and bounce" on interactive elements
- Animations should be quick and subtle — providing life without distraction
- Use React Native Animated with spring physics for organic feel
- Example pattern: scale to 0.85-0.88 on press, bounce back with `bounciness: 12`

### 6. Shadows & Depth: Soft & Diffused
- Use warm, sage-tinted shadows instead of harsh black
- Shadows should feel like soft glows, not hard edges
- Add slight transparency to elevated elements for a plush feel

---

## Technical Conventions

### Project Overview
React Native project using Expo Router v6 with TypeScript and NativeWind for styling. File-based routing with a custom theme system supporting light/dark modes.

### Development Commands
```bash
npm start          # Start Expo development server
npm run android    # Start on Android emulator
npm run ios        # Start on iOS simulator
npm run web        # Start web version
npm run lint       # Run ESLint
```

### Import Organization
```typescript
// React Native imports first
import { StyleSheet, Text, type TextProps } from 'react-native';

// Expo imports next
import { Stack } from 'expo-router';

// Local imports using @/ path alias
import { useThemeColor } from '@/hooks/use-theme-color';
```

### Naming Conventions
- **Components**: PascalCase (`ThemedText`, `TabButton`)
- **Files**: kebab-case (`themed-text.tsx`, `tab-bar.tsx`)
- **Functions/Variables**: camelCase
- **Types/Interfaces**: PascalCase

### Theme System & Color Usage

**CRITICAL**: ALL colors MUST come from tailwind.config.js - NO hardcoded colors allowed

**Palette** (from `constants/palette.ts`):
- **Cream**: `cream`, `cream-dark` — Backgrounds
- **Sage**: `sage-{50-700}` — Primary/Text/Accents
- **Warm**: `warm-{50-600}` — Cards/Secondary accents
- **UI**: `heart`, `icon`

**Dark Mode**: Use NativeWind modifiers (e.g., `bg-cream dark:bg-cream-dark`)

**Prohibited**: Never use literal hex colors (e.g., `bg-[#F5F0E8]`) or default Tailwind colors

### Component Patterns
- Functional components with TypeScript interfaces
- Use prop spreading (`...rest`, `...otherProps`)
- Extract animated/interactive elements into their own components (e.g., `TabButton`, `CenterButton`)

### Animation Patterns
```typescript
// Squish & bounce pattern for interactive elements
const scaleAnim = useRef(new Animated.Value(1)).current;

const handlePressIn = () => {
  Animated.spring(scaleAnim, {
    toValue: 0.85,
    useNativeDriver: true,
    speed: 50,
    bounciness: 4,
  }).start();
};

const handlePressOut = () => {
  Animated.spring(scaleAnim, {
    toValue: 1,
    useNativeDriver: true,
    speed: 20,
    bounciness: 12,
  }).start();
};
```

### File Structure
```
app/                 # File-based routing (screens)
├── (tabs)/         # Tab navigation group
├── _layout.tsx     # Root layout
components/         # Reusable UI components
├── ui/            # UI-specific components
constants/         # Palette, theme, app constants
hooks/             # Custom React hooks
assets/            # Static assets
```

### Icon Usage
- Use `phosphor-react-native` for all icons
- Active/selected: `weight="fill"`
- Inactive/default: `weight="regular"`
- Emphasized actions: `weight="bold"`

---

## Working with this Codebase

1. **Design with coziness in mind** — every element should feel warm and inviting
2. **Use the established palette** — sage, cream, warm tones only
3. **Add subtle animations** — make interactions feel alive
4. **Round the edges** — literally and figuratively
5. **Test in both light and dark modes**
6. **Use `@/` path aliases** for internal imports

Remember: This app is a cozy retreat. Every pixel should feel like a warm hug.
