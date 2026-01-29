import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Dimensions, Image, StyleSheet, View } from "react-native";

import { palette } from "@/constants/palette";
import { useColorScheme } from "@/hooks/use-theme-color";
import "../global.css";

const corkTexture = require("@/assets/images/cork-texture.jpg");
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");

const LightTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "transparent" },
};

const TransparentDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: "transparent" },
};

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? TransparentDarkTheme : LightTheme;

  return (
    <View style={styles.container}>
      <Image
        source={corkTexture}
        style={styles.backgroundTexture}
        resizeMode="repeat"
      />
      <ThemeProvider value={theme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.warm[300],
  },
  backgroundTexture: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    opacity: 0.35,
  },
});
