import { palette } from "./palette";

export const Colors = {
  light: {
    text: palette.sage[700],
    background: palette.cream.dark,
    tint: palette.sage[500],
    icon: palette.sage[400],
    tabIconDefault: palette.sage[500], // Match center button
    tabIconSelected: palette.sage[700], // Darker for contrast
    tabIconShadow: palette.sage[400],
    tabBarBackground: palette.tabBar,
  },
  dark: {
    text: palette.sage[100],
    background: palette.cream.dark,
    tint: palette.sage[300],
    icon: palette.sage[300],
    tabIconDefault: palette.sage[500], // Match center button
    tabIconSelected: palette.sage[700], // Darker for contrast
    tabIconShadow: palette.sage[300],
    tabBarBackground: palette.cream.dark,
  },
};
