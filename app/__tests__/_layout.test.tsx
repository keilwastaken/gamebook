import React from "react";
import { render, screen } from "@testing-library/react-native";

const mockUseColorScheme = jest.fn();
const mockThemeProvider = jest.fn();
const mockStackScreen = jest.fn();

jest.mock("@/hooks/use-theme-color", () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

jest.mock("@react-navigation/native", () => {
  const React = require("react");
  const { View } = require("react-native");
  const DefaultTheme = { colors: { background: "#fff" } };
  const DarkTheme = { colors: { background: "#000" } };

  return {
    DefaultTheme,
    DarkTheme,
    ThemeProvider: ({ value, children }: { value: unknown; children: React.ReactNode }) => {
      mockThemeProvider(value);
      return <View testID="theme-provider">{children}</View>;
    },
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: () => <View testID="linear-gradient" />,
  };
});

jest.mock("expo-status-bar", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    StatusBar: () => <View testID="status-bar" />,
  };
});

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");

  const Stack = ({ children }: { children: React.ReactNode }) => (
    <View testID="stack">{children}</View>
  );
  Stack.Screen = ({ name }: { name: string }) => {
    mockStackScreen(name);
    return <View testID={`stack-screen-${name}`} />;
  };

  return { Stack };
});

jest.mock("../../global.css", () => ({}));

describe("RootLayout", () => {
  const {
    default: RootLayout,
    unstable_settings,
  } = require("../_layout") as typeof import("../_layout");

  beforeEach(() => {
    mockUseColorScheme.mockReset().mockReturnValue("light");
    mockThemeProvider.mockReset();
    mockStackScreen.mockReset();
  });

  it("exports expected unstable settings anchor", () => {
    expect(unstable_settings.anchor).toBe("(tabs)");
  });

  it("renders stack and status bar", () => {
    render(<RootLayout />);
    expect(screen.getByTestId("stack")).toBeTruthy();
    expect(screen.getByTestId("status-bar")).toBeTruthy();
    expect(screen.getByTestId("stack-screen-(tabs)")).toBeTruthy();
    expect(screen.getByTestId("stack-screen-modal")).toBeTruthy();
  });

  it("uses transparent dark theme when color scheme is dark", () => {
    mockUseColorScheme.mockReturnValue("dark");
    render(<RootLayout />);
    const value = mockThemeProvider.mock.calls[0][0];
    expect(value.colors.background).toBe("transparent");
  });
});
