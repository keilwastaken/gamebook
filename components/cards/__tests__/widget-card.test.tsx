import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { WidgetCard } from "../widget-card";
import { randomRotation } from "@/utils/random-rotation";

jest.mock("@/utils/random-rotation", () => ({
  randomRotation: jest.fn(() => -0.75),
}));

const mockRandomRotation = randomRotation as jest.MockedFunction<typeof randomRotation>;

const BASE_GAME = {
  title: "Hades",
  playtime: "6h 10m",
  mountStyle: "metal-pin" as const,
};

function hasRotateStyle(node: { props: { style?: unknown } }, deg: number): boolean {
  const style = StyleSheet.flatten(node.props.style);
  if (!style || !Array.isArray(style.transform)) return false;
  return style.transform.some((entry) => entry.rotate === `${deg}deg`);
}

describe("WidgetCard", () => {
  beforeEach(() => {
    mockRandomRotation.mockClear();
  });

  it("renders card header, title, and playtime", () => {
    render(<WidgetCard game={BASE_GAME} />);
    expect(screen.getByText("Playing...")).toBeTruthy();
    expect(screen.getByText("Hades")).toBeTruthy();
    expect(screen.getByText("6h 10m")).toBeTruthy();
  });

  it("renders em dash when playtime is missing", () => {
    render(<WidgetCard game={{ title: "Hades" }} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("uses random rotation when override is omitted", () => {
    const view = render(<WidgetCard game={BASE_GAME} seed={5} />);
    expect(mockRandomRotation).toHaveBeenCalledWith(5);
    const rotated = view.UNSAFE_getAllByType(View).find((node) =>
      hasRotateStyle(node, -0.75)
    );
    expect(rotated).toBeTruthy();
  });

  it("uses provided image uri over placeholder", () => {
    const view = render(
      <WidgetCard game={{ ...BASE_GAME, imageUri: "https://example.com/widget.png" }} />
    );
    const image = view.UNSAFE_getAllByType(Image)[0];
    expect(image.props.source).toEqual({ uri: "https://example.com/widget.png" });
  });
});
