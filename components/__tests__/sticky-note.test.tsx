import React from "react";
import { StyleSheet, View } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { StickyNote } from "../sticky-note";
import { randomRotation } from "@/utils/random-rotation";

jest.mock("@/utils/random-rotation", () => ({
  randomRotation: jest.fn(() => 1.25),
}));

const mockRandomRotation = randomRotation as jest.MockedFunction<typeof randomRotation>;

function hasRotateStyle(node: { props: { style?: unknown } }, deg: number): boolean {
  const style = StyleSheet.flatten(node.props.style) as
    | { transform?: Array<{ rotate?: string }> }
    | undefined;
  if (!style || !Array.isArray(style.transform)) return false;
  return style.transform.some((entry: { rotate?: string }) => entry.rotate === `${deg}deg`);
}

function hasPinStyle(node: { props: { style?: unknown } }): boolean {
  const style = StyleSheet.flatten(node.props.style) as
    | { width?: number; height?: number; borderRadius?: number }
    | undefined;
  return (
    style?.width === 12 &&
    style?.height === 12 &&
    style?.borderRadius === 6
  );
}

describe("StickyNote", () => {
  beforeEach(() => {
    mockRandomRotation.mockClear();
  });

  it("renders string children inside text and uses deterministic random rotation", () => {
    const view = render(<StickyNote seed={8}>Cozy note</StickyNote>);
    expect(screen.getByText("Cozy note")).toBeTruthy();
    expect(mockRandomRotation).toHaveBeenCalledWith(8);

    const rotated = view.UNSAFE_getAllByType(View).find((node) =>
      hasRotateStyle(node, 1.25)
    );
    expect(rotated).toBeTruthy();
  });

  it("uses explicit rotation override and skips random rotation", () => {
    const view = render(<StickyNote rotation={12}>Pinned thought</StickyNote>);
    expect(mockRandomRotation).not.toHaveBeenCalled();

    const rotated = view.UNSAFE_getAllByType(View).find((node) =>
      hasRotateStyle(node, 12)
    );
    expect(rotated).toBeTruthy();
  });

  it("renders react node children directly", () => {
    render(
      <StickyNote>
        <View testID="custom-child" />
      </StickyNote>
    );
    expect(screen.getByTestId("custom-child")).toBeTruthy();
  });

  it("hides pin when showPin is false", () => {
    const view = render(<StickyNote showPin={false}>No pin</StickyNote>);
    const hasPin = view.UNSAFE_getAllByType(View).some((node) => hasPinStyle(node));
    expect(hasPin).toBe(false);
  });
});
