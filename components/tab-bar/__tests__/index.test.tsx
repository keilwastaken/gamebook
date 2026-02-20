import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { TabBar } from "../index";

const mockUseColorScheme = jest.fn();

jest.mock("@/hooks/use-theme-color", () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

function makeProps(routeNames: string[], index = 0, defaultPrevented = false) {
  const routes = routeNames.map((name) => ({ key: `${name}-key`, name }));
  return {
    state: {
      key: "tabs-key",
      index,
      routeNames: ["index", "library", "add", "favorites", "profile"],
      routes,
      type: "tab",
      stale: false,
      history: [],
    },
    navigation: {
      navigate: jest.fn(),
      emit: jest.fn(() => ({ defaultPrevented })),
    },
    descriptors: {},
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  } as any;
}

describe("TabBar", () => {
  beforeEach(() => {
    mockUseColorScheme.mockReset().mockReturnValue("light");
  });

  it("renders the center add button and navigates to add", () => {
    const props = makeProps(["index", "library", "add", "favorites", "profile"]);
    render(<TabBar {...props} />);

    fireEvent.press(screen.getByTestId("center-button-add"));
    expect(props.navigation.navigate).toHaveBeenCalledWith("add");
  });

  it("emits tabPress and navigates when unfocused tab is pressed", () => {
    const props = makeProps(["index", "library", "add", "favorites", "profile"], 0, false);
    render(<TabBar {...props} />);

    fireEvent.press(screen.getByTestId("icon-BookOpenIcon"));
    expect(props.navigation.emit).toHaveBeenCalledWith({
      type: "tabPress",
      target: "library-key",
      canPreventDefault: true,
    });
    expect(props.navigation.navigate).toHaveBeenCalledWith("library");
  });

  it("does not navigate when tabPress is prevented", () => {
    const props = makeProps(["index", "library", "add", "favorites", "profile"], 0, true);
    render(<TabBar {...props} />);

    fireEvent.press(screen.getByTestId("icon-BookOpenIcon"));
    expect(props.navigation.emit).toHaveBeenCalled();
    expect(props.navigation.navigate).not.toHaveBeenCalledWith("library");
  });

  it("does not navigate when pressing already focused tab", () => {
    const props = makeProps(["index", "library", "add", "favorites", "profile"], 0, false);
    render(<TabBar {...props} />);

    fireEvent.press(screen.getByTestId("icon-HouseIcon"));
    expect(props.navigation.emit).toHaveBeenCalled();
    expect(props.navigation.navigate).not.toHaveBeenCalledWith("index");
  });

  it("falls back to navigate when route is missing from state", () => {
    const props = makeProps(["index", "library", "add", "profile"], 0, false);
    render(<TabBar {...props} />);

    fireEvent.press(screen.getByTestId("icon-HeartIcon"));
    expect(props.navigation.emit).not.toHaveBeenCalledWith(
      expect.objectContaining({ target: "favorites-key" })
    );
    expect(props.navigation.navigate).toHaveBeenCalledWith("favorites");
  });
});
