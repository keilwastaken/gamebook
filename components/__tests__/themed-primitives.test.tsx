import React from "react";
import { StyleSheet } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";

jest.mock("@/hooks/use-theme-color", () => ({
  useThemeColor: jest.fn(),
}));

const mockUseThemeColor = useThemeColor as jest.MockedFunction<typeof useThemeColor>;

describe("themed primitives", () => {
  beforeEach(() => {
    mockUseThemeColor.mockReset().mockReturnValue("#334455");
  });

  it.each([
    { type: "default" as const, expected: { fontSize: 16, lineHeight: 24 } },
    { type: "title" as const, expected: { fontSize: 32, lineHeight: 38, fontWeight: "700" } },
    {
      type: "defaultSemiBold" as const,
      expected: { fontSize: 16, lineHeight: 24, fontWeight: "600" },
    },
    { type: "subtitle" as const, expected: { fontSize: 20, fontWeight: "700" } },
    { type: "link" as const, expected: { fontSize: 16, lineHeight: 32, textDecorationLine: "underline" } },
  ])("applies style contract for text type $type", ({ type, expected }) => {
    render(
      <ThemedText type={type} style={{ opacity: 0.6 }}>
        Type {type}
      </ThemedText>
    );

    const text = screen.getByText(`Type ${type}`);
    const style = StyleSheet.flatten(text.props.style);

    expect(style.color).toBe("#334455");
    expect(style.opacity).toBe(0.6);
    expect(style).toMatchObject(expected);
  });

  it("uses default text type when none is provided", () => {
    render(<ThemedText>Default type</ThemedText>);
    const style = StyleSheet.flatten(screen.getByText("Default type").props.style);
    expect(style).toMatchObject({ fontSize: 16, lineHeight: 24 });
  });

  it("applies themed background color in ThemedView", () => {
    render(<ThemedView testID="themed-view" style={{ padding: 12 }} />);
    const view = screen.getByTestId("themed-view");
    const style = StyleSheet.flatten(view.props.style);
    expect(style.backgroundColor).toBe("#334455");
    expect(style.padding).toBe(12);
  });
});
