import { palette } from "./palette";

export const Colors = {
  light: {
    text: palette.sage[700],
    background: palette.cream.dark,
    tint: palette.sage[500],
    icon: palette.sage[400],
    tabIconDefault: palette.sage[400],
    tabIconSelected: palette.warm[500], // Warm brown ties into clay button
    tabBarBackground: palette.tabBar,
  },
  dark: {
    text: palette.sage[100],
    background: palette.cream.dark,
    tint: palette.sage[300],
    icon: palette.sage[300],
    tabIconDefault: palette.sage[400],
    tabIconSelected: palette.warm[400], // Warm brown ties into clay button
    tabBarBackground: palette.cream.dark,
  },
};
