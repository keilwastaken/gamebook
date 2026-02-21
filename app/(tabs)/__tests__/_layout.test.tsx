import React from "react";
import { render } from "@testing-library/react-native";

import TabLayout from "../_layout";

const mockTabsRender = jest.fn();
const mockTabsScreen = jest.fn();
const mockGamesProvider = jest.fn(({ children }: { children: React.ReactNode }) => (
  <>{children}</>
));
const mockTabBar = jest.fn((_props?: unknown) => null);

jest.mock("expo-router", () => {
  const React = require("react");

  function Tabs({ children, ...props }: { children: React.ReactNode }) {
    mockTabsRender(props);
    return <>{children}</>;
  }
  function TabsScreen({ name }: { name: string }) {
    mockTabsScreen(name);
    return null;
  }
  TabsScreen.displayName = "TabsScreenMock";
  Tabs.Screen = TabsScreen;

  return { Tabs };
});

jest.mock("@/lib/games-context", () => ({
  GamesProvider: function GamesProviderMock({ children }: { children: React.ReactNode }) {
    return mockGamesProvider({ children });
  },
}));

jest.mock("@/components/tab-bar", () => ({
  TabBar: function TabBarMock(props: unknown) {
    return mockTabBar(props);
  },
}));

describe("TabLayout", () => {
  beforeEach(() => {
    mockTabsRender.mockClear();
    mockTabsScreen.mockClear();
    mockGamesProvider.mockClear();
    mockTabBar.mockClear();
  });

  it("renders tabs inside GamesProvider and registers all tab routes", () => {
    render(<TabLayout />);

    expect(mockGamesProvider).toHaveBeenCalledTimes(1);
    expect(mockTabsScreen.mock.calls.map((call) => call[0])).toEqual([
      "index",
      "library",
      "add",
      "favorites",
      "profile",
    ]);
  });

  it("wires the custom TabBar renderer", () => {
    render(<TabLayout />);
    const tabsProps = mockTabsRender.mock.calls[0][0];
    const tabBarElement = tabsProps.tabBar({ state: { index: 0 }, navigation: {} });
    render(tabBarElement);
    expect(mockTabBar).toHaveBeenCalled();
  });
});
