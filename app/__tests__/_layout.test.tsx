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

  function ThemeProviderMock({
    value,
    children,
  }: {
    value: unknown;
    children: React.ReactNode;
  }) {
    mockThemeProvider(value);
    return <View testID="theme-provider">{children}</View>;
  }

  return {
    DefaultTheme,
    DarkTheme,
    ThemeProvider: ThemeProviderMock,
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  function LinearGradientMock() {
    return <View testID="linear-gradient" />;
  }
  return {
    LinearGradient: LinearGradientMock,
  };
});

jest.mock("expo-status-bar", () => {
  const React = require("react");
  const { View } = require("react-native");
  function StatusBarMock() {
    return <View testID="status-bar" />;
  }
  return {
    StatusBar: StatusBarMock,
  };
});

jest.mock("expo-router", () => {
  const React = require("react");
  const { View } = require("react-native");

  function Stack({ children }: { children: React.ReactNode }) {
    return <View testID="stack">{children}</View>;
  }
  function StackScreen({ name }: { name: string }) {
    mockStackScreen(name);
    return <View testID={`stack-screen-${name}`} />;
  }
  StackScreen.displayName = "StackScreenMock";
  Stack.Screen = StackScreen;

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
