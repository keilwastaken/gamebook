import React from "react";
import { render, screen } from "@testing-library/react-native";

import { IconSymbol as FallbackIconSymbol } from "../icon-symbol";
import { IconSymbol as IOSIconSymbol } from "../icon-symbol.ios";

jest.mock("@expo/vector-icons/MaterialIcons", () => {
  const React = require("react");
  const { View } = require("react-native");
  function MaterialIconMock({ name, size, color, style }: Record<string, unknown>) {
    return (
      <View
        testID="material-icon"
        iconName={name}
        iconSize={size}
        iconColor={color}
        iconStyle={style}
      />
    );
  }
  return MaterialIconMock;
});

jest.mock("expo-symbols", () => {
  const React = require("react");
  const { View } = require("react-native");
  function SymbolViewMock(props: Record<string, unknown>) {
    return <View testID="symbol-view" {...props} />;
  }
  return {
    SymbolView: SymbolViewMock,
  };
});

describe("IconSymbol", () => {
  it("maps SF symbol names to Material icon names on non-iOS fallback", () => {
    render(<FallbackIconSymbol name="house.fill" color="#abc" />);
    const icon = screen.getByTestId("material-icon");
    expect(icon.props.iconName).toBe("home");
    expect(icon.props.iconSize).toBe(24);
    expect(icon.props.iconColor).toBe("#abc");
  });

  it("renders iOS symbol variant with tint, size, and weight", () => {
    render(
      <IOSIconSymbol
        name="paperplane.fill"
        color="#123456"
        size={32}
        weight="bold"
      />
    );
    const symbol = screen.getByTestId("symbol-view");
    expect(symbol.props.name).toBe("paperplane.fill");
    expect(symbol.props.tintColor).toBe("#123456");
    expect(symbol.props.weight).toBe("bold");

    const [baseStyle] = symbol.props.style;
    expect(baseStyle).toMatchObject({ width: 32, height: 32 });
  });
});
