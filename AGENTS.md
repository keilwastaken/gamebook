# Agent Guidelines for gamebook

## Project Overview
This is a React Native project using Expo Router v6 with TypeScript and NativeWind for styling. The app uses file-based routing with a custom theme system supporting light/dark modes.

## Development Commands

### Core Commands
```bash
npm start          # Start Expo development server
npm run android    # Start on Android emulator
npm run ios        # Start on iOS simulator
npm run web        # Start web version
npm run lint       # Run ESLint
npm run reset-project # Reset to blank template
```

### Testing
⚠️ **No testing framework currently configured** - You'll need to set up Jest/Vitest if writing tests.

## Code Style Guidelines

### Import Organization
```typescript
// React Native imports first
import { StyleSheet, Text, type TextProps } from 'react-native';

// Expo imports next
import { Stack } from 'expo-router';

// Local imports using @/ path alias
import { useThemeColor } from '@/hooks/use-theme-color';
```

### Component Patterns
- Use functional components with TypeScript interfaces for props
- Follow the existing `ThemedText` pattern for themed components
- Use prop spreading (`...rest`, `...otherProps`) consistently
- Style arrays: `[defaultStyle, conditionalStyle, style]`

### Naming Conventions
- **Components**: PascalCase (`ThemedText`, `HelloWave`)
- **Files**: kebab-case (`themed-text.tsx`, `use-theme-color.ts`)
- **Functions/Variables**: camelCase
- **Types/Interfaces**: PascalCase with descriptive names

### Theme System & Color Usage
🚨 **CRITICAL RULE**: ALL colors MUST come from tailwind.config.js - NO hardcoded colors allowed
- Use semantic color names: `bg-background`, `text-text`, `border-border`, `accent-accent`
- Dark mode variants: `bg-background-dark`, `text-text-dark`, `border-border-dark`
- UI colors: `success`, `warning`, `error` (all have dark variants)
- Components accept `lightColor`/`darkColor` props for custom theming
- Use `useThemeColor` hook for consistent color handling
- Never use literal hex colors or default Tailwind colors directly

### TypeScript Rules
- Strict mode enabled
- Use `type` imports for React Native types: `import { type TextProps } from 'react-native'`
- Always type component props with interfaces
- Use utility types when appropriate: `TextProps & { customProp?: string }`

### Styling Patterns
- **Primary**: Use NativeWind (Tailwind) classes for utility-first styling
- Secondary: Use StyleSheet.create for complex component-specific styles
- Combine NativeWind with theme-aware color props when needed
- Custom theme colors: sage greens, warm browns, cream backgrounds

### NativeWind Usage
- All NativeWind classes are available: `className="flex-1 items-center justify-center p-4"`
- Use responsive prefixes: `ios:px-4 android:px-2`
- Dark mode support: `className="dark:bg-gray-900 dark:text-white"`
- Combine with StyleSheet for maximum flexibility

### File Structure
```
app/                 # File-based routing (screens)
├── (tabs)/         # Tab navigation group
├── _layout.tsx     # Root layout
└── modal.tsx       # Modal screens
components/         # Reusable UI components
├── themed-text.tsx
├── themed-view.tsx
└── ui/            # UI-specific components
constants/         # App constants and theme
hooks/            # Custom React hooks
assets/           # Static assets
```

### Error Handling
- Use proper TypeScript typing to prevent runtime errors
- Implement proper null checks for theme values
- Handle platform differences with Platform.select() when needed
- Use React Native's error boundaries where appropriate

### Navigation
- File-based routing with Expo Router
- Use typed navigation when possible
- Modal screens: set `presentation: 'modal'` in options
- Tab layouts: use `(tabs)` group directory

### Performance Guidelines
- Use React.memo for expensive components
- Leverage React Native's built-in optimizations
- Avoid inline functions in render props
- Use worklets for Reanimated animations

### Linting
- ESLint uses `eslint-config-expo/flat` configuration
- Runs with `npm run lint`
- Ignores `dist/` directory
- Auto-fix enabled in VSCode settings

## Working with this Codebase

1. **Before making changes**: Run `npm run lint` to check current state
2. **Themed components**: Always support both light and dark modes
3. **Path aliases**: Use `@/` for internal imports (e.g., `@/hooks/use-theme-color`)
4. **Type safety**: Maintain strict TypeScript compliance
5. **Component testing**: Manually test on multiple platforms if adding tests isn't possible

## Common Patterns to Follow

### Themed Component Structure
```typescript
export type ThemedComponentProps = ComponentProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedComponent({
  style,
  lightColor,
  darkColor,
  ...rest
}: ThemedComponentProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  // Component implementation
}
```

### Hook Structure
```typescript
export function useCustomHook(param: Type) {
  // Hook implementation
  return { /* return values */ };
}
```

Remember: This project follows modern React Native/Expo best practices with a focus on type safety and theme consistency.